-- Create achievements system for gamification

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  category TEXT NOT NULL CHECK (category IN ('earnings', 'tasks', 'streak', 'quality', 'special')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('count', 'streak', 'amount', 'rating')),
  requirement_value INTEGER NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocked badges)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);

-- Insert default achievements
INSERT INTO achievements (name, title, description, icon, category, requirement_type, requirement_value, reward_xp, rarity) VALUES
  ('first_commitment', 'Getting Started', 'Commit to your first task', '🎯', 'tasks', 'count', 1, 10, 'common'),
  ('task_master_10', 'Task Master', 'Complete 10 tasks', '⭐', 'tasks', 'count', 10, 50, 'common'),
  ('task_legend_50', 'Task Legend', 'Complete 50 tasks', '🏆', 'tasks', 'count', 50, 200, 'rare'),
  ('task_hero_100', 'Task Hero', 'Complete 100 tasks', '👑', 'tasks', 'count', 100, 500, 'epic'),
  
  ('money_maker', 'Money Maker', 'Earn your first $10', '💰', 'earnings', 'amount', 1000, 25, 'common'),
  ('big_earner', 'Big Earner', 'Earn $50 total', '💵', 'earnings', 'amount', 5000, 100, 'rare'),
  ('entrepreneur', 'Entrepreneur', 'Earn $100 total', '🤑', 'earnings', 'amount', 10000, 250, 'epic'),
  
  ('streak_starter', 'On a Roll', 'Complete tasks 3 days in a row', '🔥', 'streak', 'streak', 3, 30, 'common'),
  ('streak_warrior', 'Unstoppable', 'Complete tasks 7 days in a row', '⚡', 'streak', 'streak', 7, 75, 'rare'),
  ('streak_legend', 'Legendary Streak', 'Complete tasks 30 days in a row', '🌟', 'streak', 'streak', 30, 300, 'legendary'),
  
  ('quality_pro', 'Quality Pro', 'Get 5 five-star ratings', '⭐⭐⭐⭐⭐', 'quality', 'rating', 5, 50, 'rare'),
  ('perfectionist', 'Perfectionist', 'Get 20 five-star ratings', '💎', 'quality', 'rating', 20, 200, 'epic'),
  
  ('early_bird', 'Early Bird', 'Complete a task before 8 AM', '🌅', 'special', 'count', 1, 25, 'rare'),
  ('night_owl', 'Night Owl', 'Complete a task after 10 PM', '🦉', 'special', 'count', 1, 25, 'rare'),
  ('speed_demon', 'Speed Demon', 'Complete a task in under 5 minutes', '⚡', 'special', 'count', 1, 30, 'rare')
ON CONFLICT (name) DO NOTHING;
