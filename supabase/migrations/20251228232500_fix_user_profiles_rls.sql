-- Fix user_profiles RLS policy to allow INSERT
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

CREATE POLICY "Allow all operations on user_profiles" ON user_profiles 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);
