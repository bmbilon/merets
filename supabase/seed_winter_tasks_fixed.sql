-- Seed Winter Household Tasks for Calgary Family
-- Corrected to match actual task_templates schema

-- Insert 30 winter-appropriate household tasks
INSERT INTO task_templates (
  title,
  description,
  skill_category,
  base_pay_cents,
  effort_minutes,
  difficulty_level,
  is_micro_task
) VALUES
  -- OUTDOOR WINTER TASKS (High Priority)
  ('Shovel front walkway', 'Clear snow from front entrance and walkway to sidewalk', 'Outdoor', 800, 20, 2, false),
  ('Shovel driveway', 'Clear entire driveway of snow and ice', 'Outdoor', 1500, 45, 3, false),
  ('Salt walkways and steps', 'Apply ice melt to prevent slipping hazards', 'Outdoor', 300, 10, 1, true),
  ('Clear snow from car', 'Brush off snow and scrape ice from family car', 'Outdoor', 500, 15, 1, false),
  ('Shovel back patio', 'Clear snow from back door and patio area', 'Outdoor', 600, 20, 2, false),
  ('Bring in firewood', 'Stack firewood inside from outdoor pile', 'Outdoor', 400, 15, 1, false),
  
  -- INDOOR CLEANING
  ('Vacuum living room', 'Vacuum all floors and under furniture', 'Cleaning', 500, 20, 1, false),
  ('Vacuum bedrooms', 'Vacuum all bedroom floors thoroughly', 'Cleaning', 600, 25, 1, false),
  ('Clean bathroom sink', 'Scrub sink, faucet, and counter', 'Cleaning', 400, 15, 1, false),
  ('Clean bathroom mirror', 'Clean mirror and wipe down surfaces', 'Cleaning', 200, 8, 1, true),
  ('Scrub toilet', 'Clean toilet bowl, seat, and base', 'Cleaning', 500, 15, 1, false),
  ('Mop kitchen floor', 'Sweep and mop entire kitchen floor', 'Cleaning', 600, 20, 2, false),
  ('Wipe down kitchen counters', 'Clean and disinfect all kitchen surfaces', 'Cleaning', 300, 10, 1, true),
  ('Clean microwave', 'Clean inside and outside of microwave', 'Cleaning', 400, 15, 1, false),
  ('Dust living room', 'Dust all surfaces, shelves, and decorations', 'Cleaning', 400, 15, 1, false),
  ('Clean windows (inside)', 'Clean interior windows in main rooms', 'Cleaning', 800, 30, 2, false),
  
  -- ORGANIZATION & DECLUTTERING
  ('Organize coat closet', 'Sort winter gear and hang up coats properly', 'Organization', 500, 20, 1, false),
  ('Organize boot tray', 'Clean and organize winter boots and shoes', 'Organization', 300, 10, 1, true),
  ('Sort recycling', 'Separate and organize recycling bins', 'Organization', 300, 10, 1, true),
  ('Organize pantry', 'Arrange food items and check expiry dates', 'Organization', 700, 25, 2, false),
  ('Tidy playroom', 'Put away toys and organize game area', 'Organization', 600, 20, 1, false),
  
  -- KITCHEN & MEAL HELP
  ('Load dishwasher', 'Load dirty dishes and start dishwasher', 'Kitchen', 300, 10, 1, true),
  ('Unload dishwasher', 'Put away clean dishes in proper places', 'Kitchen', 300, 10, 1, true),
  ('Wipe dining table', 'Clean table after meals', 'Kitchen', 200, 8, 1, true),
  ('Take out kitchen trash', 'Empty trash and replace bag', 'Kitchen', 200, 8, 1, true),
  ('Prep vegetables for dinner', 'Wash and cut vegetables as instructed', 'Kitchen', 600, 20, 2, false),
  ('Set the table', 'Set plates, utensils, and glasses for dinner', 'Kitchen', 200, 8, 1, true),
  
  -- LAUNDRY & BEDROOMS
  ('Fold laundry', 'Fold clean clothes from dryer', 'Laundry', 500, 20, 1, false),
  ('Put away clean laundry', 'Sort and put away folded clothes', 'Laundry', 400, 15, 1, false),
  ('Change bed sheets', 'Remove old sheets and put on fresh ones', 'Bedroom', 600, 20, 2, false),
  ('Tidy bedroom', 'Make bed, put away clothes, organize desk', 'Bedroom', 500, 20, 1, false);

-- Verify the insert
SELECT 
  title,
  skill_category,
  base_pay_cents / 100.0 as pay_dollars,
  effort_minutes,
  difficulty_level,
  is_micro_task
FROM task_templates
ORDER BY skill_category, title;
