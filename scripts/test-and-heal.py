#!/usr/bin/env python3
"""
Automated Test-and-Heal System for Merets Parent Approval Flow
Tests the approval flow, detects errors, applies fixes, and retries until successful.
"""

import os
import sys
import json
import requests
import time
from typing import Dict, Any, Optional

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    sys.exit(1)

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

class TestAndHeal:
    def __init__(self):
        self.fixes_applied = []
        self.test_submission_id = None
        self.test_reviewer_id = None
        
    def log(self, emoji: str, message: str):
        print(f"{emoji} {message}")
        
    def execute_sql(self, sql: str) -> bool:
        """Execute SQL directly via Supabase REST API"""
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                headers=HEADERS,
                json={"query": sql}
            )
            if response.status_code == 200:
                return True
            else:
                # Try alternative method - use psql if available
                self.log("⚠️", f"REST API failed, trying direct SQL...")
                return False
        except Exception as e:
            self.log("❌", f"SQL execution failed: {e}")
            return False
    
    def get_pending_submission(self) -> Optional[Dict[str, Any]]:
        """Get a pending submission to test with"""
        try:
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/commitment_submissions",
                headers=HEADERS,
                params={
                    'submission_status': 'eq.pending_approval',
                    'select': '*,commitment:commitments(*)',
                    'limit': 1
                }
            )
            if response.status_code == 200 and response.json():
                return response.json()[0]
            return None
        except Exception as e:
            self.log("❌", f"Failed to get pending submission: {e}")
            return None
    
    def get_reviewer(self) -> Optional[str]:
        """Get Lauren's user ID as reviewer"""
        try:
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/user_profiles",
                headers=HEADERS,
                params={'name': 'eq.Lauren', 'select': 'id'}
            )
            if response.status_code == 200 and response.json():
                return response.json()[0]['id']
            return None
        except Exception as e:
            self.log("❌", f"Failed to get reviewer: {e}")
            return None
    
    def test_approval(self, submission_id: str, reviewer_id: str) -> tuple[bool, Optional[str]]:
        """Test the approval flow and return (success, error_message)"""
        try:
            self.log("🧪", f"Testing approval for submission {submission_id[:8]}...")
            
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/rpc/approve_submission",
                headers=HEADERS,
                json={
                    'p_submission_id': submission_id,
                    'p_quality_rating': 4,
                    'p_reviewer_id': reviewer_id,
                    'p_reviewer_notes': 'Automated test approval',
                    'p_bonus_tip_cents': 0
                }
            )
            
            if response.status_code == 200:
                self.log("✅", "Approval successful!")
                return (True, None)
            else:
                error_data = response.json()
                error_msg = error_data.get('message', str(error_data))
                self.log("❌", f"Approval failed: {error_msg}")
                return (False, error_msg)
                
        except Exception as e:
            self.log("❌", f"Test failed with exception: {e}")
            return (False, str(e))
    
    def apply_fix_for_error(self, error_msg: str) -> bool:
        """Analyze error and apply appropriate fix"""
        self.log("🔧", "Analyzing error and applying fix...")
        
        # Fix 1: DECIMAL overflow error
        if "numeric field overflow" in error_msg or "precision 3, scale 2" in error_msg:
            self.log("🔍", "Detected: DECIMAL overflow in average_quality_rating")
            sql = """
            -- Fix DECIMAL precision
            ALTER TABLE user_profiles
            ALTER COLUMN average_quality_rating TYPE DECIMAL(5,2);
            
            ALTER TABLE user_profiles
            ALTER COLUMN consistency_score TYPE DECIMAL(5,2);
            """
            if self.execute_sql_via_file(sql, "fix_decimal_precision.sql"):
                self.fixes_applied.append("Changed average_quality_rating to DECIMAL(5,2)")
                return True
        
        # Fix 2: Column doesn't exist
        if "does not exist" in error_msg and "average_quality_rating" in error_msg:
            self.log("🔍", "Detected: Missing Rep tracking columns")
            sql = """
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS rep_title TEXT DEFAULT 'Entry Earner',
            ADD COLUMN IF NOT EXISTS rep_tier TEXT DEFAULT '1E',
            ADD COLUMN IF NOT EXISTS total_commitments INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS completed_commitments INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS failed_commitments INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS average_quality_rating DECIMAL(5,2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS consistency_score DECIMAL(5,2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS last_rep_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            """
            if self.execute_sql_via_file(sql, "add_rep_columns.sql"):
                self.fixes_applied.append("Added Rep tracking columns")
                return True
        
        # Fix 3: Wrong column name in trigger
        if "submission_status" in error_msg or "NEW.status" in error_msg:
            self.log("🔍", "Detected: Wrong column name in trigger function")
            # This requires updating the trigger function
            sql_file = "/home/ubuntu/merets/supabase/FIX_REP_TRACKING_OVERFLOW.sql"
            if os.path.exists(sql_file):
                with open(sql_file, 'r') as f:
                    sql = f.read()
                if self.execute_sql_via_file(sql, "fix_trigger_function.sql"):
                    self.fixes_applied.append("Updated trigger function")
                    return True
        
        self.log("⚠️", "No automatic fix available for this error")
        return False
    
    def execute_sql_via_file(self, sql: str, filename: str) -> bool:
        """Execute SQL by writing to file and using psql"""
        try:
            # Write SQL to temp file
            temp_file = f"/tmp/{filename}"
            with open(temp_file, 'w') as f:
                f.write(sql)
            
            # Get database connection string from Supabase
            # Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
            project_ref = SUPABASE_URL.split('//')[1].split('.')[0]
            
            self.log("📝", f"Applying fix via SQL file: {filename}")
            self.log("⚠️", "Note: Direct database connection requires password. Using REST API fallback...")
            
            # For now, just show the SQL that needs to be run
            self.log("📋", "SQL to apply:")
            print("=" * 60)
            print(sql)
            print("=" * 60)
            
            return False  # Return False to indicate manual intervention needed
            
        except Exception as e:
            self.log("❌", f"Failed to execute SQL: {e}")
            return False
    
    def run(self, max_attempts: int = 3):
        """Run the test-and-heal cycle"""
        self.log("🚀", "Starting automated test-and-heal system...")
        self.log("🔗", f"Supabase URL: {SUPABASE_URL}")
        
        # Get test data
        self.log("📊", "Fetching test data...")
        submission = self.get_pending_submission()
        if not submission:
            self.log("⚠️", "No pending submissions found. Create one first!")
            return False
        
        self.test_submission_id = submission['id']
        self.log("✓", f"Found submission: {self.test_submission_id[:8]}...")
        
        reviewer_id = self.get_reviewer()
        if not reviewer_id:
            self.log("❌", "Could not find reviewer (Lauren)")
            return False
        
        self.test_reviewer_id = reviewer_id
        self.log("✓", f"Found reviewer: {reviewer_id[:8]}...")
        
        # Test and heal loop
        for attempt in range(1, max_attempts + 1):
            self.log("🔄", f"Attempt {attempt}/{max_attempts}")
            
            success, error = self.test_approval(self.test_submission_id, self.test_reviewer_id)
            
            if success:
                self.log("🎉", "Approval flow working!")
                if self.fixes_applied:
                    self.log("📝", "Fixes applied during this session:")
                    for fix in self.fixes_applied:
                        print(f"  - {fix}")
                return True
            
            if attempt < max_attempts:
                self.log("🔧", f"Attempting to fix error...")
                if self.apply_fix_for_error(error):
                    self.log("✅", "Fix applied, retrying...")
                    time.sleep(2)
                else:
                    self.log("❌", "Could not auto-fix this error")
                    self.log("📋", "Manual intervention required")
                    return False
        
        self.log("❌", f"Failed after {max_attempts} attempts")
        return False

if __name__ == '__main__':
    tester = TestAndHeal()
    success = tester.run()
    sys.exit(0 if success else 1)
