-- Kidmitment Database Schema
-- Run this SQL in your Supabase SQL Editor

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

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on pay_rates" ON pay_rates FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_templates" ON task_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on commitments" ON commitments FOR ALL USING (true);
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_commitments_user_id ON commitments(user_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_task_templates_skill_category ON task_templates(skill_category);
CREATE INDEX idx_task_templates_is_micro_task ON task_templates(is_micro_task);