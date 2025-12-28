#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applying claim_marketplace_task fix migration...\n');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251226_fix_claim_marketplace_task.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      console.log('\n⚠️  You may need to apply this migration manually in the Supabase SQL Editor.');
      console.log('Migration file location:', migrationPath);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('\n📋 Changes made:');
    console.log('   - Updated claim_marketplace_task() function with SECURITY DEFINER');
    console.log('   - Function can now bypass RLS policies for task_assignments');
    console.log('   - Users can now accept/claim ments without RLS violations\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.log('\n📝 Please apply this migration manually:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/bzogqqkptnbtnmpzvdca/sql');
    console.log('   2. Copy the contents of:', migrationPath);
    console.log('   3. Paste and run the SQL in the SQL Editor\n');
    process.exit(1);
  }
}

applyMigration();
