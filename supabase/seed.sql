-- Seed data for Kidmitment database
-- Run this SQL after creating the schema

-- Insert family user profiles
INSERT INTO user_profiles (name, role, age, level, total_xp, total_earnings_cents) VALUES
('Aveya', 'kid', 15, 1, 0, 0),
('Onyx', 'kid', 11, 1, 0, 0),
('Lauren', 'parent', NULL, 1, 0, 0),
('Brett', 'parent', NULL, 1, 0, 0);

-- Insert pay rates for different skill categories and difficulty levels
INSERT INTO pay_rates (skill_category, difficulty_level, base_rate_per_minute_cents, micro_task_flat_rate_cents) VALUES
-- Cleaning
('Cleaning', 1, 100, 200),  -- $1/min, $2 micro-task
('Cleaning', 2, 125, 250),  -- $1.25/min, $2.50 micro-task
('Cleaning', 3, 150, 300),  -- $1.50/min, $3 micro-task
('Cleaning', 4, 200, 400),  -- $2/min, $4 micro-task

-- Dishes
('Dishes', 1, 110, 250),
('Dishes', 2, 135, 300),
('Dishes', 3, 160, 350),
('Dishes', 4, 210, 450),

-- Laundry
('Laundry', 1, 90, 200),
('Laundry', 2, 115, 250),
('Laundry', 3, 140, 300),
('Laundry', 4, 180, 400),

-- Cooking
('Cooking', 1, 120, 300),
('Cooking', 2, 150, 400),
('Cooking', 3, 180, 500),
('Cooking', 4, 240, 600),

-- Yard Work
('Yard', 1, 130, 300),
('Yard', 2, 160, 400),
('Yard', 3, 190, 500),
('Yard', 4, 250, 650),

-- Tools/Maintenance
('Tools', 1, 140, 350),
('Tools', 2, 170, 450),
('Tools', 3, 200, 550),
('Tools', 4, 260, 700);

-- Insert micro-task templates (2-5 minute tasks)
INSERT INTO task_templates (title, description, skill_category, effort_minutes, base_pay_cents, difficulty_level, is_micro_task) VALUES
-- Cleaning micro-tasks
('Take out trash', 'Empty kitchen trash and take to outdoor bin', 'Cleaning', 3, 300, 1, true),
('Empty bathroom trash', 'Empty all bathroom waste baskets', 'Cleaning', 4, 300, 1, true),
('Stock bathroom supplies', 'Refill toilet paper and hand towels in bathrooms', 'Cleaning', 5, 400, 2, true),
('Wipe kitchen counters', 'Clean and sanitize all kitchen counter surfaces', 'Cleaning', 4, 350, 2, true),
('Quick vacuum living room', 'Vacuum main living area only', 'Cleaning', 5, 400, 2, true),

-- Dishes micro-tasks
('Load dishwasher', 'Load dirty dishes into dishwasher and start cycle', 'Dishes', 4, 300, 1, true),
('Unload dishwasher', 'Put clean dishes away in proper locations', 'Dishes', 5, 350, 2, true),
('Hand wash pots', 'Wash large pots and pans that don''t fit in dishwasher', 'Dishes', 5, 400, 2, true),

-- Laundry micro-tasks
('Move clothes to dryer', 'Transfer wet clothes from washer to dryer', 'Laundry', 3, 250, 1, true),
('Fold and put away clothes', 'Fold clean clothes and put in proper drawers', 'Laundry', 5, 350, 2, true),

-- Yard micro-tasks
('Water plants', 'Water indoor and outdoor plants', 'Yard', 4, 350, 1, true),
('Feed pets', 'Fill pet food and water bowls', 'Yard', 2, 200, 1, true);

-- Insert standard task templates (15+ minute tasks)
INSERT INTO task_templates (title, description, skill_category, effort_minutes, base_pay_cents, difficulty_level, is_micro_task) VALUES
-- Cleaning standard tasks
('Deep clean bathroom', 'Scrub toilet, shower, sink, mirrors, and mop floor', 'Cleaning', 30, 900, 3, false),
('Vacuum entire house', 'Vacuum all carpeted areas and rugs throughout house', 'Cleaning', 25, 750, 2, false),
('Dust living areas', 'Dust all furniture, electronics, and surfaces in main areas', 'Cleaning', 20, 600, 2, false),
('Clean windows', 'Clean interior and exterior windows with proper solution', 'Cleaning', 45, 1350, 3, false),
('Organize closet', 'Sort, organize, and clean bedroom or hall closet', 'Cleaning', 60, 1800, 4, false),

-- Dishes standard tasks
('Deep clean kitchen', 'Clean stove, oven, microwave, counters, and sink thoroughly', 'Dishes', 40, 1200, 3, false),
('Organize pantry', 'Sort and organize pantry items, check expiration dates', 'Dishes', 30, 900, 2, false),

-- Laundry standard tasks
('Do full laundry cycle', 'Wash, dry, fold, and put away one full load of laundry', 'Laundry', 120, 2400, 2, false),
('Iron clothes', 'Iron and hang up wrinkled clothing items', 'Laundry', 30, 900, 3, false),

-- Cooking tasks
('Prepare simple meal', 'Cook a basic meal like pasta or sandwiches', 'Cooking', 30, 1200, 2, false),
('Bake cookies/treats', 'Follow recipe to bake homemade treats for family', 'Cooking', 60, 2400, 3, false),
('Meal prep for week', 'Prepare ingredients or meals for upcoming week', 'Cooking', 90, 3600, 4, false),

-- Yard work tasks
('Mow lawn', 'Cut grass in front and back yard areas', 'Yard', 45, 1800, 3, false),
('Weed garden beds', 'Remove weeds from flower beds and garden areas', 'Yard', 30, 1200, 2, false),
('Rake leaves', 'Rake and bag fallen leaves in yard', 'Yard', 60, 2400, 3, false),
('Wash car', 'Full exterior car wash and interior vacuum', 'Yard', 45, 1800, 3, false),

-- Tools/maintenance tasks
('Basic car maintenance', 'Check oil, tire pressure, and fluids', 'Tools', 20, 1000, 2, false),
('Organize garage', 'Clean and organize garage storage areas', 'Tools', 90, 3600, 3, false),
('Small repairs', 'Fix minor household items like loose screws or hinges', 'Tools', 30, 1500, 3, false),
('Paint touch-ups', 'Touch up paint on walls or trim around house', 'Tools', 60, 2400, 4, false);