-- Setup Bijou (Auntie Jenna's Chihuahua) as External Issuer
-- This will test the external task approval workflow

-- 1. Create Bijou user profile
INSERT INTO user_profiles (
  id,
  name,
  role,
  total_xp,
  total_earnings_cents,
  created_at
) VALUES (
  gen_random_uuid(),
  'Bijou',
  'parent', -- Using 'parent' role since 'issuer' doesn't exist yet
  0,
  0,
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Get Bijou's ID and Aveya's ID for next steps
DO $$
DECLARE
  bijou_id UUID;
  aveya_id UUID;
BEGIN
  -- Get Bijou's ID
  SELECT id INTO bijou_id FROM user_profiles WHERE name = 'Bijou';
  
  -- Get Aveya's ID
  SELECT id INTO aveya_id FROM user_profiles WHERE name = 'Aveya';
  
  -- 2. Create relationship: Aveya can see tasks from Bijou
  INSERT INTO family_relationships (
    id,
    issuer_id,
    earner_id,
    relationship_type,
    created_at
  ) VALUES (
    gen_random_uuid(),
    bijou_id,
    aveya_id,
    'neighbor', -- Bijou is a "neighbor" (well, Auntie's dog!)
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  -- 3. Create a fun task from Bijou
  INSERT INTO task_templates (
    id,
    issuer_id,
    title,
    description,
    skill_category,
    base_pay_cents,
    effort_minutes,
    difficulty_level,
    is_micro_task,
    requires_proof_photo,
    created_at
  ) VALUES (
    gen_random_uuid(),
    bijou_id,
    'Play fetch with Bijou',
    'Throw the ball for Bijou in the backyard for 15 minutes. Make sure she gets plenty of exercise!',
    'Pet Care',
    800, -- $8.00
    15,
    1, -- easy
    false,
    true, -- requires photo proof
    NOW()
  );
  
  -- 4. Create another task from Bijou
  INSERT INTO task_templates (
    id,
    issuer_id,
    title,
    description,
    skill_category,
    base_pay_cents,
    effort_minutes,
    difficulty_level,
    is_micro_task,
    requires_proof_photo,
    created_at
  ) VALUES (
    gen_random_uuid(),
    bijou_id,
    'Refill Bijou''s water bowl',
    'Make sure Bijou has fresh, clean water. Wash the bowl first!',
    'Pet Care',
    300, -- $3.00
    5,
    1, -- easy
    true, -- micro task
    false,
    NOW()
  );
  
  RAISE NOTICE 'Bijou setup complete! Created user, relationship with Aveya, and 2 tasks.';
END $$;

-- Verify setup
SELECT 
  'User Profile' as type,
  name,
  role,
  id
FROM user_profiles 
WHERE name = 'Bijou'

UNION ALL

SELECT 
  'Relationship' as type,
  'Aveya → Bijou' as name,
  relationship_type as role,
  id
FROM family_relationships
WHERE issuer_id = (SELECT id FROM user_profiles WHERE name = 'Bijou')
  AND earner_id = (SELECT id FROM user_profiles WHERE name = 'Aveya')

UNION ALL

SELECT 
  'Task' as type,
  title as name,
  skill_category as role,
  id
FROM task_templates
WHERE issuer_id = (SELECT id FROM user_profiles WHERE name = 'Bijou');
