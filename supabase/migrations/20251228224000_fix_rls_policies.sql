-- Drop restrictive task_assignments policies and replace with permissive ones
DROP POLICY IF EXISTS "Users can view their own task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can insert their own task assignments" ON task_assignments;

-- Recreate permissive policy for task_assignments
CREATE POLICY "Allow all operations on task_assignments" ON task_assignments FOR ALL USING (true);

-- Also ensure anon role has INSERT permissions on task_templates
-- The existing policy should work but let's verify it exists
DROP POLICY IF EXISTS "Allow all operations on task_templates" ON task_templates;
CREATE POLICY "Allow all operations on task_templates" ON task_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
