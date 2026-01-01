-- Multi-Issuer Marketplace Test Data
-- Purpose: Create realistic test scenarios for multi-issuer functionality
-- Date: January 1, 2026

-- WARNING: This will create test users and relationships
-- Only run in development/testing environments

-- ============================================================================
-- STEP 1: Create Test User Profiles
-- ============================================================================

-- Parent (Primary issuer for demo)
INSERT INTO user_profiles (id, name, role, age, level, total_xp, total_earnings_cents, is_earner, is_provider)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Sarah Johnson', 'parent', 42, 1, 0, 0, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  age = EXCLUDED.age;

-- Kid (Earner)
INSERT INTO user_profiles (id, name, role, age, level, total_xp, total_earnings_cents, is_earner, is_provider)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Tommy Johnson', 'kid', 12, 3, 450, 2500, true, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  age = EXCLUDED.age;

-- External Issuer: Teacher
INSERT INTO user_profiles (id, name, role, age, level, total_xp, total_earnings_cents, is_earner, is_provider)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Ms. Emily Rodriguez', 'parent', 35, 1, 0, 0, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- External Issuer: Neighbor
INSERT INTO user_profiles (id, name, role, age, level, total_xp, total_earnings_cents, is_earner, is_provider)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'Mr. Bob Wilson', 'parent', 58, 1, 0, 0, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- External Issuer: Coach
INSERT INTO user_profiles (id, name, role, age, level, total_xp, total_earnings_cents, is_earner, is_provider)
VALUES 
  ('55555555-5555-5555-5555-555555555555', 'Coach Mike Davis', 'parent', 45, 1, 0, 0, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- ============================================================================
-- STEP 2: Create Family Relationships
-- ============================================================================

-- Parent-Child relationship (no approval needed for parent tasks)
INSERT INTO family_relationships (issuer_id, earner_id, relationship_type, permission_level, notes)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'parent', 'full', 'Primary parent')
ON CONFLICT DO NOTHING;

-- Teacher relationship (requires approval)
INSERT INTO family_relationships (issuer_id, earner_id, relationship_type, permission_level, notes)
VALUES 
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'teacher', 'approve_only', 'Math teacher at Lincoln Middle School')
ON CONFLICT DO NOTHING;

-- Neighbor relationship (requires approval)
INSERT INTO family_relationships (issuer_id, earner_id, relationship_type, permission_level, notes)
VALUES 
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'other', 'approve_only', 'Neighbor from across the street')
ON CONFLICT DO NOTHING;

-- Coach relationship (requires approval)
INSERT INTO family_relationships (issuer_id, earner_id, relationship_type, permission_level, notes)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'coach', 'approve_only', 'Soccer coach')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 3: Create Task Templates from Different Issuers
-- ============================================================================

-- ============================================================================
-- PARENT TASKS (No approval required)
-- ============================================================================

INSERT INTO task_templates (
  id, title, description, skill_category, effort_minutes, 
  base_pay_cents, difficulty_level, issuer_id, is_available_for_kids, base_merets
) VALUES 
  (
    'task-parent-001',
    'Clean Your Room',
    'Vacuum floor, dust surfaces, organize desk, make bed, put away clothes',
    'Household',
    30,
    500,
    1,
    '11111111-1111-1111-1111-111111111111',
    true,
    10
  ),
  (
    'task-parent-002',
    'Wash the Car',
    'Soap, rinse, dry exterior. Vacuum interior. Clean windows.',
    'Outdoor',
    45,
    1000,
    2,
    '11111111-1111-1111-1111-111111111111',
    true,
    15
  ),
  (
    'task-parent-003',
    'Prepare Dinner',
    'Follow recipe, cook meal, set table, clean up kitchen',
    'Cooking',
    60,
    1500,
    3,
    '11111111-1111-1111-1111-111111111111',
    true,
    20
  ),
  (
    'task-parent-004',
    'Organize Garage',
    'Sort items, create labeled sections, sweep floor',
    'Organization',
    90,
    2000,
    3,
    '11111111-1111-1111-1111-111111111111',
    true,
    25
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  skill_category = EXCLUDED.skill_category,
  effort_minutes = EXCLUDED.effort_minutes,
  base_pay_cents = EXCLUDED.base_pay_cents,
  issuer_id = EXCLUDED.issuer_id;

-- ============================================================================
-- TEACHER TASKS (Requires parental approval)
-- ============================================================================

INSERT INTO task_templates (
  id, title, description, skill_category, effort_minutes, 
  base_pay_cents, difficulty_level, issuer_id, is_available_for_kids, base_merets
) VALUES 
  (
    'task-teacher-001',
    'Grade Spelling Tests',
    'Use answer key to grade 25 spelling tests, mark errors clearly',
    'Academic',
    60,
    1500,
    2,
    '33333333-3333-3333-3333-333333333333',
    true,
    20
  ),
  (
    'task-teacher-002',
    'Organize Classroom Library',
    'Sort books by genre, create labels, arrange on shelves alphabetically',
    'Organization',
    90,
    2000,
    3,
    '33333333-3333-3333-3333-333333333333',
    true,
    25
  ),
  (
    'task-teacher-003',
    'Create Math Flashcards',
    'Design and write 50 multiplication flashcards for class',
    'Creative',
    45,
    1200,
    2,
    '33333333-3333-3333-3333-333333333333',
    true,
    15
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  skill_category = EXCLUDED.skill_category,
  effort_minutes = EXCLUDED.effort_minutes,
  base_pay_cents = EXCLUDED.base_pay_cents,
  issuer_id = EXCLUDED.issuer_id;

-- ============================================================================
-- NEIGHBOR TASKS (Requires parental approval)
-- ============================================================================

INSERT INTO task_templates (
  id, title, description, skill_category, effort_minutes, 
  base_pay_cents, difficulty_level, issuer_id, is_available_for_kids, base_merets
) VALUES 
  (
    'task-neighbor-001',
    'Mow Front and Back Lawn',
    'Mow both lawns, edge walkways, blow off clippings',
    'Outdoor',
    60,
    2500,
    3,
    '44444444-4444-4444-4444-444444444444',
    true,
    30
  ),
  (
    'task-neighbor-002',
    'Walk Dog (Daily)',
    'Walk Buddy around the block, bring water, clean up after',
    'Pet Care',
    20,
    500,
    1,
    '44444444-4444-4444-4444-444444444444',
    true,
    8
  ),
  (
    'task-neighbor-003',
    'Rake Leaves',
    'Rake leaves in front and back yard, bag them up',
    'Outdoor',
    45,
    1500,
    2,
    '44444444-4444-4444-4444-444444444444',
    true,
    18
  ),
  (
    'task-neighbor-004',
    'Water Plants',
    'Water all indoor and outdoor plants, check soil moisture',
    'Outdoor',
    15,
    300,
    1,
    '44444444-4444-4444-4444-444444444444',
    true,
    5
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  skill_category = EXCLUDED.skill_category,
  effort_minutes = EXCLUDED.effort_minutes,
  base_pay_cents = EXCLUDED.base_pay_cents,
  issuer_id = EXCLUDED.issuer_id;

-- ============================================================================
-- COACH TASKS (Requires parental approval)
-- ============================================================================

INSERT INTO task_templates (
  id, title, description, skill_category, effort_minutes, 
  base_pay_cents, difficulty_level, issuer_id, is_available_for_kids, base_merets
) VALUES 
  (
    'task-coach-001',
    'Set Up Soccer Field',
    'Place cones, set up goals, mark boundaries',
    'Sports',
    30,
    800,
    2,
    '55555555-5555-5555-5555-555555555555',
    true,
    12
  ),
  (
    'task-coach-002',
    'Organize Equipment Room',
    'Sort balls, cones, jerseys. Clean and inventory all equipment.',
    'Organization',
    60,
    1500,
    2,
    '55555555-5555-5555-5555-555555555555',
    true,
    20
  ),
  (
    'task-coach-003',
    'Record Practice Drills',
    'Film practice drills for team review, edit video clips',
    'Technology',
    90,
    2500,
    3,
    '55555555-5555-5555-5555-555555555555',
    true,
    30
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  skill_category = EXCLUDED.skill_category,
  effort_minutes = EXCLUDED.effort_minutes,
  base_pay_cents = EXCLUDED.base_pay_cents,
  issuer_id = EXCLUDED.issuer_id;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check user profiles
SELECT 
  id, 
  name, 
  role, 
  CASE 
    WHEN is_provider THEN 'Can Issue Tasks'
    WHEN is_earner THEN 'Can Earn'
    ELSE 'Unknown'
  END as user_type
FROM user_profiles 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY role DESC, name;

-- Check family relationships
SELECT 
  fr.id,
  issuer.name as issuer_name,
  earner.name as earner_name,
  fr.relationship_type,
  fr.permission_level,
  fr.notes
FROM family_relationships fr
JOIN user_profiles issuer ON fr.issuer_id = issuer.id
JOIN user_profiles earner ON fr.earner_id = earner.id
WHERE fr.earner_id = '22222222-2222-2222-2222-222222222222'
ORDER BY 
  CASE fr.relationship_type
    WHEN 'parent' THEN 1
    WHEN 'teacher' THEN 2
    WHEN 'coach' THEN 3
    ELSE 4
  END;

-- Check task templates by issuer
SELECT 
  t.id,
  t.title,
  t.skill_category,
  t.effort_minutes,
  t.base_pay_cents,
  issuer.name as issuer_name,
  CASE 
    WHEN issuer.id = '11111111-1111-1111-1111-111111111111' THEN 'Parent (No Approval)'
    ELSE 'External (Requires Approval)'
  END as approval_status
FROM task_templates t
JOIN user_profiles issuer ON t.issuer_id = issuer.id
WHERE t.issuer_id IN (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY issuer.name, t.title;

-- Check what tasks Tommy should see (based on relationships)
SELECT 
  t.id,
  t.title,
  t.base_pay_cents / 100.0 as pay_dollars,
  t.effort_minutes,
  issuer.name as issuer_name,
  fr.relationship_type,
  CASE 
    WHEN fr.relationship_type IN ('parent', 'guardian') THEN 'No Approval Needed'
    ELSE 'Requires Parent Approval'
  END as approval_requirement
FROM task_templates t
JOIN user_profiles issuer ON t.issuer_id = issuer.id
JOIN family_relationships fr ON t.issuer_id = fr.issuer_id
WHERE fr.earner_id = '22222222-2222-2222-2222-222222222222'
  AND t.is_available_for_kids = true
ORDER BY 
  CASE 
    WHEN fr.relationship_type IN ('parent', 'guardian') THEN 1
    ELSE 2
  END,
  issuer.name,
  t.title;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Display summary
DO $$
DECLARE
  user_count INTEGER;
  relationship_count INTEGER;
  task_count INTEGER;
  parent_task_count INTEGER;
  external_task_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM user_profiles 
  WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  );
  
  SELECT COUNT(*) INTO relationship_count FROM family_relationships
  WHERE earner_id = '22222222-2222-2222-2222-222222222222';
  
  SELECT COUNT(*) INTO task_count FROM task_templates
  WHERE issuer_id IN (
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  );
  
  SELECT COUNT(*) INTO parent_task_count FROM task_templates
  WHERE issuer_id = '11111111-1111-1111-1111-111111111111';
  
  SELECT COUNT(*) INTO external_task_count FROM task_templates
  WHERE issuer_id IN (
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Multi-Issuer Test Data Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users Created: %', user_count;
  RAISE NOTICE 'Relationships Created: %', relationship_count;
  RAISE NOTICE 'Total Tasks: %', task_count;
  RAISE NOTICE '  - Parent Tasks (no approval): %', parent_task_count;
  RAISE NOTICE '  - External Tasks (requires approval): %', external_task_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Users:';
  RAISE NOTICE '  - Sarah Johnson (Parent/Primary Issuer)';
  RAISE NOTICE '  - Tommy Johnson (Kid/Earner)';
  RAISE NOTICE '  - Ms. Emily Rodriguez (Teacher)';
  RAISE NOTICE '  - Mr. Bob Wilson (Neighbor)';
  RAISE NOTICE '  - Coach Mike Davis (Coach)';
  RAISE NOTICE '========================================';
END $$;
