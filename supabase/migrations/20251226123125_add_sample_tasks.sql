-- Sample tasks for the Kidmitment marketplace
-- Populate database with realistic household tasks

-- Insert realistic household tasks
INSERT INTO task_templates (
  title, 
  description, 
  skill_category, 
  effort_minutes, 
  base_pay_cents, 
  difficulty_level, 
  is_micro_task,
  due_date,
  is_available_for_kids,
  max_assignments
) VALUES

-- KITCHEN TASKS (Dishes category)
('Unload dishwasher', 'Empty clean dishes from dishwasher and put them away in cabinets and drawers', 'Dishes', 10, 300, 1, true, CURRENT_DATE + INTERVAL '2 days', true, 1),
('Load dishwasher', 'Load dirty dishes into dishwasher, add detergent, and start the cycle', 'Dishes', 8, 250, 1, true, CURRENT_DATE + INTERVAL '1 day', true, 1),
('Put away clean dishes', 'Put away dishes from dish rack or counter into proper cabinets', 'Dishes', 5, 200, 1, true, CURRENT_DATE + INTERVAL '1 day', true, 2),
('Wipe down kitchen counters', 'Clean and sanitize all kitchen counter surfaces and stovetop', 'Cleaning', 7, 250, 1, true, CURRENT_DATE + INTERVAL '1 day', true, 1),

-- WINTER/OUTDOOR TASKS (Yard category)
('Shovel front walk', 'Clear snow from front walkway and steps, salt if icy', 'Yard', 15, 400, 2, false, CURRENT_DATE + INTERVAL '1 day', true, 1),
('Shovel back walk', 'Clear snow from back walkway and patio area', 'Yard', 15, 400, 2, false, CURRENT_DATE + INTERVAL '1 day', true, 1),
('Sweep front porch', 'Sweep leaves, snow, and debris from front porch and steps', 'Yard', 8, 250, 1, true, CURRENT_DATE + INTERVAL '3 days', true, 1),
('Bring in packages', 'Check for and bring in any delivered packages from front door', 'Yard', 2, 150, 1, true, CURRENT_DATE, true, null),

-- LAUNDRY TASKS
('Empty dryer and fold clothes', 'Remove clothes from dryer, fold neatly, and sort by family member', 'Laundry', 20, 600, 2, false, CURRENT_DATE + INTERVAL '2 days', true, 1),
('Collect and sort laundry', 'Gather dirty clothes from hampers and sort by colors/whites', 'Laundry', 12, 350, 1, false, CURRENT_DATE + INTERVAL '3 days', true, 1),
('Put away folded laundry', 'Take folded clothes and put them away in correct bedrooms and drawers', 'Laundry', 15, 450, 2, false, CURRENT_DATE + INTERVAL '2 days', true, 2),

-- CLEANING TASKS
('Vacuum living room', 'Vacuum carpet and rugs in main living area, move light furniture', 'Cleaning', 15, 450, 2, false, CURRENT_DATE + INTERVAL '2 days', true, 1),
('Clean bathroom mirror', 'Clean and shine bathroom mirror with glass cleaner', 'Cleaning', 3, 150, 1, true, CURRENT_DATE + INTERVAL '1 day', true, 2),
('Clean bathroom sink', 'Scrub bathroom sink, faucet, and counter area', 'Cleaning', 8, 250, 1, true, CURRENT_DATE + INTERVAL '1 day', true, 1),
('Dust TV stand and surfaces', 'Dust TV stand, coffee table, and other living room surfaces', 'Cleaning', 10, 300, 1, true, CURRENT_DATE + INTERVAL '4 days', true, 1),
('Empty all trash cans', 'Empty wastebaskets from bedrooms and bathrooms, replace liners', 'Cleaning', 10, 300, 1, true, CURRENT_DATE + INTERVAL '1 day', true, 1),

-- ORGANIZATION TASKS
('Organize bedroom', 'Tidy bedroom: make bed, put clothes away, clear surfaces', 'Cleaning', 20, 600, 2, false, CURRENT_DATE + INTERVAL '3 days', true, null),
('Tidy up living room', 'Put items back where they belong, fluff cushions, organize remotes', 'Cleaning', 12, 350, 1, false, CURRENT_DATE + INTERVAL '2 days', true, 1),
('Organize shoes by front door', 'Arrange family shoes neatly in entryway or shoe rack', 'Cleaning', 5, 200, 1, true, CURRENT_DATE + INTERVAL '2 days', true, 1),
('Organize school backpack', 'Clean out backpack, organize school supplies, check for homework', 'Cleaning', 15, 450, 2, false, CURRENT_DATE + INTERVAL '1 day', true, null),

-- PET/PLANT CARE
('Feed pets', 'Fill food and water bowls for cats/dogs, check if they need more', 'Yard', 3, 150, 1, true, CURRENT_DATE, true, null),
('Water houseplants', 'Check soil and water indoor plants that need it', 'Yard', 5, 200, 1, true, CURRENT_DATE + INTERVAL '2 days', true, 1),
('Clean cat litter box', 'Scoop litter box and add fresh litter if needed', 'Cleaning', 5, 250, 1, true, CURRENT_DATE + INTERVAL '1 day', true, 1),

-- QUICK MICRO-TASKS
('Take out kitchen trash', 'Empty kitchen trash, replace bag, take to outdoor bin', 'Cleaning', 4, 200, 1, true, CURRENT_DATE, true, 1),
('Make bed', 'Make bed with sheets, pillows, and blankets neat and tidy', 'Cleaning', 3, 150, 1, true, CURRENT_DATE + INTERVAL '1 day', true, null),
('Stock bathroom supplies', 'Check and refill toilet paper, hand towels, soap dispensers', 'Cleaning', 5, 200, 1, true, CURRENT_DATE + INTERVAL '3 days', true, 1),

-- WEEKEND TASKS
('Clean out car', 'Remove trash, organize items, vacuum seats and floor mats', 'Cleaning', 25, 750, 3, false, CURRENT_DATE + INTERVAL '3 days', true, 1),
('Help with grocery unload', 'Carry grocery bags from car and help put items away', 'General', 15, 400, 1, false, CURRENT_DATE + INTERVAL '2 days', true, 1),
('Organize game closet', 'Sort board games, puzzles, and toys back into proper places', 'Cleaning', 30, 900, 2, false, CURRENT_DATE + INTERVAL '5 days', true, 1);

-- Add priority settings for some urgent tasks
INSERT INTO task_priorities (
  task_template_id,
  priority_type,
  is_urgent,
  parent_notes,
  custom_pay_cents,
  custom_effort_minutes
)
SELECT 
  id,
  'urgent',
  true,
  'This needs to be done today before dinner!',
  base_pay_cents * 1.5, -- 50% bonus for urgent
  effort_minutes
FROM task_templates 
WHERE title IN ('Shovel front walk', 'Shovel back walk', 'Take out kitchen trash', 'Unload dishwasher');

-- Add high priority for some tasks
INSERT INTO task_priorities (
  task_template_id,
  priority_type,
  is_urgent,
  parent_notes,
  custom_pay_cents
)
SELECT 
  id,
  'high',
  false,
  'This is important - please do this when you can today.',
  base_pay_cents * 1.2 -- 20% bonus for high priority
FROM task_templates 
WHERE title IN ('Empty dryer and fold clothes', 'Vacuum living room', 'Clean cat litter box');

-- Add some normal priority tasks with parent notes
INSERT INTO task_priorities (
  task_template_id,
  priority_type,
  is_urgent,
  parent_notes
)
SELECT 
  id,
  'normal',
  false,
  'Do this whenever you have time this week. Thanks!'
FROM task_templates 
WHERE title IN ('Organize bedroom', 'Dust TV stand and surfaces', 'Water houseplants');

-- Update some tasks to be winter-seasonal (shorter due dates)
UPDATE task_templates 
SET 
  due_date = CURRENT_DATE,
  urgency_multiplier = 1.3
WHERE title LIKE '%shovel%' OR title LIKE '%snow%';

-- Update recurring daily tasks
UPDATE task_templates 
SET 
  due_date = CURRENT_DATE,
  max_assignments = null -- Allow multiple kids to do these
WHERE title IN ('Feed pets', 'Take out kitchen trash', 'Make bed');

-- Set some tasks as limited availability (first come, first served)
UPDATE task_templates 
SET max_assignments = 1
WHERE title IN ('Unload dishwasher', 'Load dishwasher', 'Vacuum living room', 'Empty dryer and fold clothes');

-- Add some basic user profiles and pay rates for testing
INSERT INTO user_profiles (name, role, age, level, total_earnings_cents) VALUES 
('Aveya', 'kid', 12, 3, 2580),
('Onyx', 'kid', 10, 2, 1840),
('Parent', 'parent', null, 1, 0);

-- Add basic pay rate structure
INSERT INTO pay_rates (skill_category, difficulty_level, base_rate_per_minute_cents, micro_task_flat_rate_cents) VALUES
('Dishes', 1, 30, 200),
('Dishes', 2, 35, 250),
('Cleaning', 1, 25, 150),
('Cleaning', 2, 30, 200),
('Cleaning', 3, 40, 300),
('Laundry', 1, 25, 180),
('Laundry', 2, 35, 250),
('Yard', 1, 20, 150),
('Yard', 2, 35, 300),
('General', 1, 25, 180);