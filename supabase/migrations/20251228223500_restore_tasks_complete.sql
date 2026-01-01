-- Restore household and yard tasks (2min to 90min, $1 to $30)
INSERT INTO task_templates (title, description, skill_category, effort_minutes, base_pay_cents, difficulty_level, is_micro_task, is_available_for_kids, parent_notes)
VALUES
-- Quick tasks (2-5 min, $1-3)
('Take out trash', 'Empty kitchen trash and replace bag', 'Cleaning', 2, 100, 1, true, true, 'Daily task'),
('Feed pets', 'Fill food and water bowls', 'Pet Care', 3, 200, 1, true, true, 'Morning and evening'),
('Water plants', 'Water all indoor plants', 'General', 4, 250, 1, true, true, 'Check soil first'),
('Wipe kitchen counter', 'Clean and sanitize counters', 'Cleaning', 5, 300, 1, true, true, 'Use spray cleaner'),
('Empty bathroom trash', 'All bathroom wastebaskets', 'Cleaning', 3, 200, 1, true, true, 'Check all bathrooms'),

-- Short tasks (5-15 min, $3-8)
('Load dishwasher', 'Load dishes and start cycle', 'Dishes', 6, 400, 1, true, true, 'Scrape plates first'),
('Unload dishwasher', 'Put away all clean dishes', 'Dishes', 5, 350, 1, true, true, 'Check if clean'),
('Sweep kitchen floor', 'Sweep entire kitchen', 'Cleaning', 8, 500, 1, true, true, 'Get under table'),
('Clean bathroom sink', 'Scrub sink and faucet', 'Cleaning', 7, 450, 1, true, true, 'Use bathroom cleaner'),
('Fold laundry', 'Fold one load of clean laundry', 'Laundry', 10, 600, 2, false, true, 'Fold neatly'),
('Make beds', 'Make all beds in house', 'General', 12, 700, 1, true, true, 'Straighten sheets'),
('Vacuum one room', 'Vacuum living room or bedroom', 'Cleaning', 10, 600, 2, false, true, 'Move small items'),
('Clean mirrors', 'Clean all mirrors in house', 'Cleaning', 8, 500, 1, true, true, 'Glass cleaner'),
('Organize shoes', 'Organize shoe area/closet', 'Organization', 10, 600, 2, false, true, 'Pair them up'),

-- Medium tasks (15-30 min, $8-15)
('Mop kitchen floor', 'Sweep and mop kitchen', 'Cleaning', 15, 900, 2, false, true, 'Let it dry'),
('Clean toilet', 'Scrub toilet inside and out', 'Cleaning', 10, 600, 1, true, true, 'Use toilet cleaner'),
('Dust all rooms', 'Dust furniture in all rooms', 'Cleaning', 20, 1200, 2, false, true, 'Use microfiber cloth'),
('Wash dishes by hand', 'Wash and dry all dishes', 'Dishes', 15, 900, 2, false, true, 'Hot soapy water'),
('Clean refrigerator', 'Wipe shelves and throw out old food', 'Cleaning', 20, 1200, 2, false, true, 'Check dates'),
('Organize bedroom', 'Clean and organize entire bedroom', 'Organization', 25, 1500, 2, false, true, 'Put everything away'),
('Wash car', 'Wash exterior of family car', 'Yard', 30, 1800, 2, false, true, 'Soap and rinse well'),

-- Longer tasks (30-60 min, $15-25)
('Deep clean bathroom', 'Scrub toilet, sink, tub, floor', 'Cleaning', 35, 2100, 3, false, true, 'Complete clean'),
('Vacuum whole house', 'Vacuum all rooms and stairs', 'Cleaning', 30, 1800, 2, false, true, 'All floors'),
('Do laundry start to finish', 'Wash, dry, fold, and put away', 'Laundry', 90, 3000, 3, false, true, 'Complete task'),
('Rake leaves', 'Rake yard and bag leaves', 'Yard', 40, 2400, 2, false, true, 'Fill bags'),
('Weed garden beds', 'Pull weeds from all garden areas', 'Yard', 45, 2700, 2, false, true, 'Get the roots'),
('Mow lawn', 'Mow front and back yard', 'Yard', 50, 3000, 3, false, true, 'Edge too if time'),
('Clean garage', 'Sweep and organize garage', 'Organization', 45, 2700, 3, false, true, 'Make walkways clear'),
('Wash windows', 'Clean inside and outside windows', 'Cleaning', 35, 2100, 2, false, true, 'Both sides'),

-- Big tasks (60-90 min, $25-30)
('Deep clean kitchen', 'Clean all surfaces, appliances, floor', 'Cleaning', 60, 2500, 3, false, true, 'Everything'),
('Organize closet', 'Sort and organize entire closet', 'Organization', 60, 2500, 3, false, true, 'Donate old items'),
('Shovel snow', 'Clear driveway and walkways', 'Yard', 45, 2700, 2, false, true, 'Salt after'),
('Wash and vacuum car interior', 'Complete interior detail', 'General', 40, 2400, 2, false, true, 'Get all crumbs');
