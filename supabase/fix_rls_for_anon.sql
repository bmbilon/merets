-- Fix RLS policies to allow anonymous (anon) role access to all tables
-- This is needed for the Expo app to fetch data without authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations on pay_rates" ON pay_rates;
DROP POLICY IF EXISTS "Allow all operations on task_templates" ON task_templates;
DROP POLICY IF EXISTS "Allow all operations on commitments" ON commitments;
DROP POLICY IF EXISTS "Allow all operations on chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow all operations on task_priorities" ON task_priorities;
DROP POLICY IF EXISTS "Allow all operations on task_assignments" ON task_assignments;

-- Create new permissive policies that explicitly include anon role
CREATE POLICY "Allow all operations on user_profiles" 
  ON user_profiles 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on pay_rates" 
  ON pay_rates 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on task_templates" 
  ON task_templates 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on commitments" 
  ON commitments 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_messages" 
  ON chat_messages 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on task_priorities" 
  ON task_priorities 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on task_assignments" 
  ON task_assignments 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Also check if commitment_submissions table exists and add policy
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commitment_submissions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on commitment_submissions" ON commitment_submissions';
    EXECUTE 'CREATE POLICY "Allow all operations on commitment_submissions" ON commitment_submissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Verify policies were created
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
