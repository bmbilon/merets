-- Seed Winter Household Tasks for Calgary Family
-- Run this in Supabase SQL Editor

-- Clear existing tasks (optional - remove if you want to keep existing data)
-- DELETE FROM task_templates;

-- Insert 30 winter-appropriate household tasks
INSERT INTO task_templates (
  title,
  description,
  category,
  base_pay_cents,
  effort_minutes,
  difficulty_level,
  requires_parent_approval,
  created_by
) VALUES
  -- OUTDOOR WINTER TASKS (High Priority)
  ('Shovel front walkway', 'Clear snow from front entrance and walkway to sidewalk', 'Outdoor', 800, 20, 'medium', false, 'system'),
  ('Shovel driveway', 'Clear entire driveway of snow and ice', 'Outdoor', 1500, 45, 'hard', false, 'system'),
  ('Salt walkways and steps', 'Apply ice melt to prevent slipping hazards', 'Outdoor', 300, 10, 'easy', false, 'system'),
  ('Clear snow from car', 'Brush off snow and scrape ice from family car', 'Outdoor', 500, 15, 'easy', false, 'system'),
  ('Shovel back patio', 'Clear snow from back door and patio area', 'Outdoor', 600, 20, 'medium', false, 'system'),
  ('Bring in firewood', 'Stack firewood inside from outdoor pile', 'Outdoor', 400, 15, 'easy', false, 'system'),
  
  -- INDOOR CLEANING
  ('Vacuum living room', 'Vacuum all floors and under furniture', 'Cleaning', 500, 20, 'easy', false, 'system'),
  ('Vacuum bedrooms', 'Vacuum all bedroom floors thoroughly', 'Cleaning', 600, 25, 'easy', false, 'system'),
  ('Clean bathroom sink', 'Scrub sink, faucet, and counter', 'Cleaning', 400, 15, 'easy', false, 'system'),
  ('Clean bathroom mirror', 'Clean mirror and wipe down surfaces', 'Cleaning', 200, 8, 'easy', false, 'system'),
  ('Scrub toilet', 'Clean toilet bowl, seat, and base', 'Cleaning', 500, 15, 'easy', false, 'system'),
  ('Mop kitchen floor', 'Sweep and mop entire kitchen floor', 'Cleaning', 600, 20, 'medium', false, 'system'),
  ('Wipe down kitchen counters', 'Clean and disinfect all kitchen surfaces', 'Cleaning', 300, 10, 'easy', false, 'system'),
  ('Clean microwave', 'Clean inside and outside of microwave', 'Cleaning', 400, 15, 'easy', false, 'system'),
  ('Dust living room', 'Dust all surfaces, shelves, and decorations', 'Cleaning', 400, 15, 'easy', false, 'system'),
  ('Clean windows (inside)', 'Clean interior windows in main rooms', 'Cleaning', 800, 30, 'medium', false, 'system'),
  
  -- ORGANIZATION & DECLUTTERING
  ('Organize coat closet', 'Sort winter gear and hang up coats properly', 'Organization', 500, 20, 'easy', false, 'system'),
  ('Organize boot tray', 'Clean and organize winter boots and shoes', 'Organization', 300, 10, 'easy', false, 'system'),
  ('Sort recycling', 'Separate and organize recycling bins', 'Organization', 300, 10, 'easy', false, 'system'),
  ('Organize pantry', 'Arrange food items and check expiry dates', 'Organization', 700, 25, 'medium', false, 'system'),
  ('Tidy playroom/game room', 'Put away toys and organize game area', 'Organization', 600, 20, 'easy', false, 'system'),
  
  -- KITCHEN & MEAL HELP
  ('Load dishwasher', 'Load dirty dishes and start dishwasher', 'Kitchen', 300, 10, 'easy', false, 'system'),
  ('Unload dishwasher', 'Put away clean dishes in proper places', 'Kitchen', 300, 10, 'easy', false, 'system'),
  ('Wipe dining table', 'Clean table after meals', 'Kitchen', 200, 8, 'easy', false, 'system'),
  ('Take out kitchen trash', 'Empty trash and replace bag', 'Kitchen', 200, 8, 'easy', false, 'system'),
  ('Prep vegetables for dinner', 'Wash and cut vegetables as instructed', 'Kitchen', 600, 20, 'medium', true, 'system'),
  
  -- LAUNDRY & BEDROOMS
  ('Fold laundry', 'Fold clean clothes from dryer', 'Laundry', 500, 20, 'easy', false, 'system'),
  ('Put away clean laundry', 'Sort and put away folded clothes', 'Laundry', 400, 15, 'easy', false, 'system'),
  ('Change bed sheets', 'Remove old sheets and put on fresh ones', 'Bedroom', 600, 20, 'medium', false, 'system'),
  ('Tidy bedroom', 'Make bed, put away clothes, organize desk', 'Bedroom', 500, 20, 'easy', false, 'system');

-- Update task priorities for winter urgency
UPDATE task_templates 
SET priority = 'high'
WHERE title IN ('Shovel front walkway', 'Shovel driveway', 'Salt walkways and steps', 'Clear snow from car');

-- Add some tasks as recurring (daily/weekly)
UPDATE task_templates
SET 
  is_recurring = true,
  recurrence_pattern = 'daily'
WHERE title IN ('Take out kitchen trash', 'Load dishwasher', 'Unload dishwasher', 'Wipe dining table');

UPDATE task_templates
SET 
  is_recurring = true,
  recurrence_pattern = 'weekly'
WHERE title IN ('Vacuum living room', 'Vacuum bedrooms', 'Mop kitchen floor', 'Change bed sheets');

-- Mark winter outdoor tasks as seasonal
UPDATE task_templates
SET category = 'Winter Outdoor'
WHERE title LIKE '%snow%' OR title LIKE '%Shovel%' OR title LIKE '%Salt%' OR title LIKE '%firewood%';

-- Verify the insert
SELECT 
  title,
  category,
  base_pay_cents / 100.0 as pay_dollars,
  effort_minutes,
  difficulty_level,
  is_recurring,
  recurrence_pattern
FROM task_templates
ORDER BY category, title;
