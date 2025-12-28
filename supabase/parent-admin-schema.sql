-- Parent Admin Portal Schema Extensions
-- Run this SQL after the main schema to add parent task management features

-- Task priority and custom pricing table
CREATE TABLE task_priorities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_template_id UUID NOT NULL REFERENCES task_templates(id),
    priority_level INTEGER NOT NULL DEFAULT 50 CHECK (priority_level BETWEEN 0 AND 100),
    priority_type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority_type IN ('urgent', 'high', 'normal', 'low')),
    custom_pay_cents INTEGER,  -- Override base pay if set
    custom_effort_minutes INTEGER,  -- Override effort time if set
    deadline TIMESTAMP WITH TIME ZONE,  -- Optional deadline for urgent tasks
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    notes TEXT,  -- Parent notes about why this task is prioritized
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_template_id)  -- Each task can only have one priority record
);

-- Family-specific task customizations
CREATE TABLE family_task_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_template_id UUID NOT NULL REFERENCES task_templates(id),
    is_enabled BOOLEAN DEFAULT TRUE,  -- Parents can disable tasks from showing
    frequency_priority INTEGER DEFAULT 50 CHECK (frequency_priority BETWEEN 0 AND 100),  -- How often to suggest
    seasonal_boost BOOLEAN DEFAULT FALSE,  -- Boost priority during certain seasons
    assigned_to UUID REFERENCES user_profiles(id),  -- Optional: assign specific tasks to specific kids
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_template_id)
);

-- Parent task categories for better organization
CREATE TABLE parent_task_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7) DEFAULT '#FF9800',  -- For UI theming
    icon VARCHAR(50) DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link tasks to parent-defined categories
CREATE TABLE task_category_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_template_id UUID NOT NULL REFERENCES task_templates(id),
    category_id UUID NOT NULL REFERENCES parent_task_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_template_id, category_id)
);

-- Parent task completion goals and tracking
CREATE TABLE task_completion_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_template_id UUID NOT NULL REFERENCES task_templates(id),
    target_completions_per_week INTEGER DEFAULT 1,
    current_week_completions INTEGER DEFAULT 0,
    bonus_pay_cents INTEGER,  -- Extra pay if weekly goal is met
    streak_bonus_cents INTEGER,  -- Bonus for consecutive weeks meeting goal
    week_start_date DATE DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_task_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_goals ENABLE ROW LEVEL SECURITY;

-- Policies for parent admin access
CREATE POLICY "Allow parents full access to task_priorities" ON task_priorities FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
    OR 
    created_by = auth.uid()
);

CREATE POLICY "Allow parents full access to family_task_settings" ON family_task_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
);

CREATE POLICY "Allow parents full access to parent_task_categories" ON parent_task_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
    OR 
    created_by = auth.uid()
);

CREATE POLICY "Allow all to read task_category_assignments" ON task_category_assignments FOR SELECT USING (true);
CREATE POLICY "Allow parents to modify task_category_assignments" ON task_category_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
);

CREATE POLICY "Allow parents full access to task_completion_goals" ON task_completion_goals FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
    OR 
    created_by = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX idx_task_priorities_priority_level ON task_priorities(priority_level DESC);
CREATE INDEX idx_task_priorities_priority_type ON task_priorities(priority_type);
CREATE INDEX idx_task_priorities_deadline ON task_priorities(deadline);
CREATE INDEX idx_family_task_settings_enabled ON family_task_settings(is_enabled);
CREATE INDEX idx_family_task_settings_frequency ON family_task_settings(frequency_priority DESC);
CREATE INDEX idx_task_completion_goals_active ON task_completion_goals(is_active);

-- Function to update task priority timestamps
CREATE OR REPLACE FUNCTION update_priority_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_priorities_timestamp
    BEFORE UPDATE ON task_priorities
    FOR EACH ROW
    EXECUTE FUNCTION update_priority_timestamp();

-- Function to get prioritized tasks for kids
CREATE OR REPLACE FUNCTION get_prioritized_tasks_for_display(
    p_skill_category TEXT DEFAULT NULL,
    p_is_micro_task BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    task_id UUID,
    title VARCHAR(200),
    description TEXT,
    skill_category VARCHAR(50),
    effort_minutes INTEGER,
    base_pay_cents INTEGER,
    difficulty_level INTEGER,
    is_micro_task BOOLEAN,
    priority_level INTEGER,
    priority_type VARCHAR(20),
    custom_pay_cents INTEGER,
    custom_effort_minutes INTEGER,
    deadline TIMESTAMP WITH TIME ZONE,
    is_urgent BOOLEAN,
    effective_pay_cents INTEGER,
    effective_effort_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as task_id,
        t.title,
        t.description,
        t.skill_category,
        t.effort_minutes,
        t.base_pay_cents,
        t.difficulty_level,
        t.is_micro_task,
        COALESCE(p.priority_level, 50) as priority_level,
        COALESCE(p.priority_type, 'normal') as priority_type,
        p.custom_pay_cents,
        p.custom_effort_minutes,
        p.deadline,
        (p.priority_type = 'urgent' OR (p.deadline IS NOT NULL AND p.deadline <= NOW() + INTERVAL '24 hours')) as is_urgent,
        COALESCE(p.custom_pay_cents, t.base_pay_cents) as effective_pay_cents,
        COALESCE(p.custom_effort_minutes, t.effort_minutes) as effective_effort_minutes
    FROM task_templates t
    LEFT JOIN task_priorities p ON t.id = p.task_template_id AND p.is_active = TRUE
    LEFT JOIN family_task_settings f ON t.id = f.task_template_id
    WHERE 
        (f.is_enabled IS NULL OR f.is_enabled = TRUE)  -- Not disabled by parents
        AND (p_skill_category IS NULL OR t.skill_category = p_skill_category)
        AND (p_is_micro_task IS NULL OR t.is_micro_task = p_is_micro_task)
    ORDER BY 
        -- Urgent tasks first
        (CASE WHEN p.priority_type = 'urgent' THEN 0 ELSE 1 END),
        -- Then by deadline proximity
        (CASE WHEN p.deadline IS NOT NULL THEN p.deadline ELSE '2099-01-01'::timestamp END),
        -- Then by priority level (higher number = higher priority)
        COALESCE(p.priority_level, 50) DESC,
        -- Then by frequency priority
        COALESCE(f.frequency_priority, 50) DESC,
        -- Finally by base task order
        t.skill_category, t.difficulty_level, t.title
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;