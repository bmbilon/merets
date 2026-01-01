-- Restore household tasks/ments to task_templates table

-- First check if we have any tasks
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM task_templates) = 0 THEN
    -- Insert household tasks
    INSERT INTO task_templates (title, description, skill_category, effort_minutes, base_pay_cents, difficulty_level, is_micro_task, is_available_for_kids, parent_notes)
    VALUES
    -- Kitchen/Cleaning Tasks
    ('Take out kitchen trash', 'Empty and replace trash bag', 'Cleaning', 3, 60, 1, true, true, 'Quick daily task'),
    ('Empty bathroom trash cans', 'All bathroom wastebaskets', 'Cleaning', 5, 100, 1, true, true, 'Check all bathrooms'),
    ('Wipe down kitchen counters', 'Clean and sanitize all surfaces', 'Cleaning', 5, 100, 1, true, true, 'Use cleaning spray'),
    ('Stock bathroom supplies', 'TP, hand towels, soap refills', 'General', 4, 80, 1, true, true, 'Check all bathrooms'),
    ('Tidy living room', 'Put things back where they belong', 'Cleaning', 5, 100, 1, true, true, 'Quick pickup'),
    
    -- Dishes Tasks
    ('Load dishwasher', 'Fill and start if full', 'Dishes', 4, 80, 1, true, true, 'Scrape plates first'),
    ('Unload dishwasher', 'Put all dishes away properly', 'Dishes', 5, 100, 1, true, true, 'Check if clean first'),
    ('Hand wash pots and pans', 'Clean large cookware', 'Dishes', 10, 200, 2, false, true, 'Use hot soapy water'),
    
    -- General Household
    ('Collect laundry', 'Gather dirty clothes to hamper', 'Laundry', 2, 40, 1, true, true, 'Check all rooms'),
    ('Water houseplants', 'Check and water as needed', 'General', 3, 60, 1, true, true, 'Don''t overwater'),
    ('Feed pets', 'Fill food and water bowls', 'Pet Care', 2, 40, 1, true, true, 'Check water too'),
    ('Spot-clean mirrors', 'Bathroom and bedroom mirrors', 'Cleaning', 3, 60, 1, true, true, 'Use glass cleaner'),
    
    -- Longer Tasks
    ('Organize bedroom', 'Clean, organize, and make bed', 'Organization', 30, 600, 2, false, true, 'Everything in its place'),
    ('Study for upcoming test', 'Focus session with no distractions', 'General', 45, 900, 2, false, true, 'Quiet workspace needed'),
    ('Complete homework early', 'Finish all assignments before dinner', 'General', 60, 1200, 3, false, true, 'Show work when done'),
    ('Help with dinner prep', 'Assist with meal preparation', 'Cooking', 25, 500, 2, false, true, 'Follow instructions'),
    ('Practice instrument', 'Focused practice session', 'General', 30, 600, 2, false, true, 'Use practice log'),
    ('Vacuum common areas', 'Living room, hallway, dining room', 'Cleaning', 15, 300, 2, false, true, 'Move furniture'),
    
    -- Outdoor/Seasonal
    ('Clear snow from walkways', 'Keep walkways safe', 'Yard', 20, 400, 2, false, true, 'Salt after shoveling'),
    ('Sweep front porch', 'Remove debris and dirt', 'Yard', 10, 200, 1, false, true, 'Check mailbox area too');
    
    RAISE NOTICE 'Restored 20 household tasks';
  ELSE
    RAISE NOTICE 'Tasks already exist (count: %)', (SELECT COUNT(*) FROM task_templates);
  END IF;
END $$;

-- Show what we have
SELECT COUNT(*) as total_tasks FROM task_templates;
SELECT title, skill_category, effort_minutes, base_pay_cents FROM task_templates ORDER BY created_at DESC LIMIT 10;
