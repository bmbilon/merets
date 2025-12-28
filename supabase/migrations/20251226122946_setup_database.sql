-- Complete Kidmitment Database Setup
-- This script sets up the entire database structure including marketplace features

-- 1. BASE SCHEMA
-- User profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('kid', 'parent')),
    age INTEGER,
    level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    total_earnings_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills and pay rates table
CREATE TABLE pay_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_category VARCHAR(50) NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 4),
    base_rate_per_minute_cents INTEGER NOT NULL,
    micro_task_flat_rate_cents INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(skill_category, difficulty_level)
);

-- Task templates for dropdown suggestions
CREATE TABLE task_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    skill_category VARCHAR(50) NOT NULL,
    effort_minutes INTEGER NOT NULL,
    base_pay_cents INTEGER NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 4),
    is_micro_task BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commitments/tasks that users create
CREATE TABLE commitments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    task_template_id UUID REFERENCES task_templates(id),
    custom_title VARCHAR(200),
    custom_description TEXT,
    skill_category VARCHAR(50) NOT NULL,
    effort_minutes INTEGER NOT NULL,
    pay_cents INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    quality_rating VARCHAR(10) CHECK (quality_rating IN ('miss', 'pass', 'perfect')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family chat messages
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES user_profiles(id),
    message_type VARCHAR(30) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'commitment_request', 'commitment_approved', 'commitment_rejected')),
    content TEXT NOT NULL,
    commitment_id UUID REFERENCES commitments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PARENT ADMIN / PRIORITY SYSTEM
-- Task priorities set by parents
CREATE TABLE task_priorities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
    priority_type TEXT NOT NULL CHECK (priority_type IN ('low', 'normal', 'high', 'urgent')),
    is_urgent BOOLEAN DEFAULT false,
    parent_notes TEXT,
    custom_pay_cents INTEGER, -- Override base pay if set
    custom_effort_minutes INTEGER, -- Override base effort if set
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Only one priority per task template
    UNIQUE(task_template_id)
);

-- 3. MARKETPLACE ENHANCEMENTS
-- Add marketplace fields to task_templates
ALTER TABLE task_templates 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS is_available_for_kids BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_assignments INTEGER DEFAULT NULL, -- Limit how many kids can take this task
ADD COLUMN IF NOT EXISTS current_assignments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_notes TEXT,
ADD COLUMN IF NOT EXISTS urgency_multiplier DECIMAL(3,2) DEFAULT 1.0; -- Multiplies base pay for urgent tasks

-- Add marketplace fields to commitments
ALTER TABLE commitments 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS actual_pay_cents INTEGER, -- Track actual pay if different from template
ADD COLUMN IF NOT EXISTS time_started TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS time_completed TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_feedback TEXT,
ADD COLUMN IF NOT EXISTS kid_notes TEXT; -- Kids can add notes when committing

-- Create task assignments table for better tracking
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id UUID REFERENCES task_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES commitments(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'in_progress', 'completed', 'expired')),
  expires_at TIMESTAMPTZ, -- When assignment expires if not claimed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_template_id, user_id, assigned_at) -- Prevent duplicate assignments
);

-- 4. VIEWS AND FUNCTIONS
-- Create task availability view for kids
CREATE OR REPLACE VIEW available_tasks_for_kids AS
SELECT 
  tt.id as task_template_id,
  tt.*,
  tp.priority_type,
  tp.is_urgent,
  tp.custom_pay_cents,
  tp.custom_effort_minutes,
  tp.parent_notes as priority_notes,
  -- Calculate effective values
  COALESCE(tp.custom_pay_cents, tt.base_pay_cents) * COALESCE(tt.urgency_multiplier, 1.0) as effective_pay_cents,
  COALESCE(tp.custom_effort_minutes, tt.effort_minutes) as effective_effort_minutes,
  
  -- Calculate urgency score for sorting
  CASE 
    WHEN tp.priority_type = 'urgent' THEN 100
    WHEN tp.priority_type = 'high' THEN 75
    WHEN tp.priority_type = 'normal' THEN 50
    WHEN tp.priority_type = 'low' THEN 25
    ELSE 50
  END as urgency_score,
  
  -- Days until due
  CASE 
    WHEN tt.due_date IS NOT NULL THEN tt.due_date - CURRENT_DATE
    ELSE NULL
  END as days_until_due,
  
  -- Availability status
  CASE 
    WHEN tt.max_assignments IS NOT NULL AND tt.current_assignments >= tt.max_assignments THEN 'full'
    WHEN tt.due_date IS NOT NULL AND tt.due_date < CURRENT_DATE THEN 'expired'
    WHEN tt.is_available_for_kids = false THEN 'hidden'
    ELSE 'available'
  END as availability_status

FROM task_templates tt
LEFT JOIN task_priorities tp ON tt.id = tp.task_template_id
WHERE tt.is_available_for_kids = true
  AND (tt.max_assignments IS NULL OR tt.current_assignments < tt.max_assignments)
  AND (tt.due_date IS NULL OR tt.due_date >= CURRENT_DATE);

-- Function to get filtered and sorted tasks for marketplace
CREATE OR REPLACE FUNCTION get_marketplace_tasks(
  p_user_id UUID DEFAULT NULL,
  p_min_pay_cents INTEGER DEFAULT 0,
  p_max_pay_cents INTEGER DEFAULT NULL,
  p_min_effort_minutes INTEGER DEFAULT 0,
  p_max_effort_minutes INTEGER DEFAULT NULL,
  p_skill_category TEXT DEFAULT NULL,
  p_is_micro_task BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'urgency_score',
  p_sort_order TEXT DEFAULT 'DESC',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  skill_category TEXT,
  effort_minutes INTEGER,
  base_pay_cents INTEGER,
  effective_pay_cents NUMERIC,
  effective_effort_minutes INTEGER,
  difficulty_level INTEGER,
  is_micro_task BOOLEAN,
  due_date DATE,
  days_until_due INTEGER,
  priority_type TEXT,
  is_urgent BOOLEAN,
  urgency_score INTEGER,
  parent_notes TEXT,
  availability_status TEXT,
  max_assignments INTEGER,
  current_assignments INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.task_template_id as id,
    t.title,
    t.description,
    t.skill_category,
    t.effort_minutes,
    t.base_pay_cents,
    t.effective_pay_cents,
    t.effective_effort_minutes,
    t.difficulty_level,
    t.is_micro_task,
    t.due_date,
    t.days_until_due,
    t.priority_type,
    t.is_urgent,
    t.urgency_score,
    t.priority_notes as parent_notes,
    t.availability_status,
    t.max_assignments,
    t.current_assignments
  FROM available_tasks_for_kids t
  WHERE 
    (p_min_pay_cents IS NULL OR t.effective_pay_cents >= p_min_pay_cents)
    AND (p_max_pay_cents IS NULL OR t.effective_pay_cents <= p_max_pay_cents)
    AND (p_min_effort_minutes IS NULL OR t.effective_effort_minutes >= p_min_effort_minutes)
    AND (p_max_effort_minutes IS NULL OR t.effective_effort_minutes <= p_max_effort_minutes)
    AND (p_skill_category IS NULL OR t.skill_category = p_skill_category)
    AND (p_is_micro_task IS NULL OR t.is_micro_task = p_is_micro_task)
  ORDER BY 
    CASE WHEN p_sort_by = 'effective_pay_cents' AND p_sort_order = 'DESC' THEN t.effective_pay_cents END DESC,
    CASE WHEN p_sort_by = 'effective_pay_cents' AND p_sort_order = 'ASC' THEN t.effective_pay_cents END ASC,
    CASE WHEN p_sort_by = 'effective_effort_minutes' AND p_sort_order = 'DESC' THEN t.effective_effort_minutes END DESC,
    CASE WHEN p_sort_by = 'effective_effort_minutes' AND p_sort_order = 'ASC' THEN t.effective_effort_minutes END ASC,
    CASE WHEN p_sort_by = 'days_until_due' AND p_sort_order = 'ASC' THEN t.days_until_due END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'days_until_due' AND p_sort_order = 'DESC' THEN t.days_until_due END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'urgency_score' AND p_sort_order = 'DESC' THEN t.urgency_score END DESC,
    CASE WHEN p_sort_by = 'urgency_score' AND p_sort_order = 'ASC' THEN t.urgency_score END ASC,
    t.urgency_score DESC, t.effective_pay_cents DESC -- Default fallback
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get prioritized tasks for display (used by GameifiedTaskTiles)
CREATE OR REPLACE FUNCTION get_prioritized_tasks_for_display(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  skill_category TEXT,
  effort_minutes INTEGER,
  base_pay_cents INTEGER,
  effective_pay_cents NUMERIC,
  effective_effort_minutes INTEGER,
  difficulty_level INTEGER,
  is_micro_task BOOLEAN,
  due_date DATE,
  days_until_due INTEGER,
  priority_type TEXT,
  is_urgent BOOLEAN,
  urgency_score INTEGER,
  parent_notes TEXT,
  availability_status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.task_template_id as id,
    t.title,
    t.description,
    t.skill_category,
    t.effort_minutes,
    t.base_pay_cents,
    t.effective_pay_cents,
    t.effective_effort_minutes,
    t.difficulty_level,
    t.is_micro_task,
    t.due_date,
    t.days_until_due,
    t.priority_type,
    t.is_urgent,
    t.urgency_score,
    t.priority_notes as parent_notes,
    t.availability_status
  FROM available_tasks_for_kids t
  WHERE t.availability_status = 'available'
  ORDER BY 
    t.urgency_score DESC, 
    t.effective_pay_cents DESC,
    t.days_until_due ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Function to claim a task (create commitment)
CREATE OR REPLACE FUNCTION claim_marketplace_task(
  p_user_id UUID,
  p_task_template_id UUID,
  p_kid_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_commitment_id UUID;
  v_task_record RECORD;
BEGIN
  -- Get task details
  SELECT * INTO v_task_record 
  FROM available_tasks_for_kids 
  WHERE task_template_id = p_task_template_id
    AND availability_status = 'available';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not available for claiming';
  END IF;
  
  -- Create commitment
  INSERT INTO commitments (
    user_id,
    task_template_id,
    custom_title,
    custom_description,
    skill_category,
    effort_minutes,
    pay_cents,
    status,
    due_date,
    kid_notes
  ) VALUES (
    p_user_id,
    p_task_template_id,
    v_task_record.title,
    v_task_record.description,
    v_task_record.skill_category,
    v_task_record.effective_effort_minutes::INTEGER,
    v_task_record.effective_pay_cents::INTEGER,
    'pending',
    v_task_record.due_date,
    p_kid_notes
  )
  RETURNING id INTO v_commitment_id;
  
  -- Update assignment count if max_assignments is set
  IF v_task_record.max_assignments IS NOT NULL THEN
    UPDATE task_templates 
    SET current_assignments = current_assignments + 1
    WHERE id = p_task_template_id;
  END IF;
  
  -- Create task assignment record
  INSERT INTO task_assignments (
    task_template_id,
    user_id,
    commitment_id,
    status
  ) VALUES (
    p_task_template_id,
    p_user_id,
    v_commitment_id,
    'claimed'
  );
  
  RETURN v_commitment_id;
END;
$$;

-- 5. ENABLE ROW LEVEL SECURITY AND POLICIES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on pay_rates" ON pay_rates FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_templates" ON task_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on commitments" ON commitments FOR ALL USING (true);
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_priorities" ON task_priorities FOR ALL USING (true);
CREATE POLICY "Users can view their own task assignments" ON task_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own task assignments" ON task_assignments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 6. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_commitments_user_id ON commitments(user_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_task_templates_skill_category ON task_templates(skill_category);
CREATE INDEX idx_task_templates_is_micro_task ON task_templates(is_micro_task);
CREATE INDEX IF NOT EXISTS idx_task_templates_due_date ON task_templates(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_available ON task_templates(is_available_for_kids) WHERE is_available_for_kids = true;
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_status ON task_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_commitments_due_date ON commitments(due_date) WHERE due_date IS NOT NULL;

-- 7. GRANT PERMISSIONS
GRANT SELECT ON available_tasks_for_kids TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION get_prioritized_tasks_for_display TO authenticated;
GRANT EXECUTE ON FUNCTION claim_marketplace_task TO authenticated;