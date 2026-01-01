-- Fix commitments RLS policy to allow INSERT/UPDATE/DELETE operations
DROP POLICY IF EXISTS "Allow all operations on commitments" ON commitments;

CREATE POLICY "Allow all operations on commitments" ON commitments 
  FOR ALL 
  TO anon, authenticated
  USING (true) 
  WITH CHECK (true);
