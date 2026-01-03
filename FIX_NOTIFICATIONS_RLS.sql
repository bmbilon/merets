-- Enable RLS on notifications table (if not already enabled)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (true); -- Allow all users to see notifications for now, can be restricted later

-- Policy: Users can update their own notifications (mark as read, etc)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (true);

-- Policy: Allow inserts from functions (bypass RLS for system operations)
CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true); -- Allow all inserts (from functions)

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO service_role;
