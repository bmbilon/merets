#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetCommitments() {
  console.log('🔄 Resetting all active commitments...\n');
  
  // Delete all pending and approved commitments
  const { data: deleted, error: deleteError } = await supabase
    .from('commitments')
    .delete()
    .in('status', ['pending', 'approved'])
    .select();
  
  if (deleteError) {
    console.error('❌ Error deleting commitments:', deleteError);
    process.exit(1);
  }
  
  console.log(`✅ Deleted ${deleted?.length || 0} commitments\n`);
  
  // Verify the deletion
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, name')
    .eq('role', 'kid');
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    process.exit(1);
  }
  
  console.log('📊 Current commitment status:');
  for (const user of users || []) {
    const { count } = await supabase
      .from('commitments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved']);
    
    console.log(`   ${user.name}: ${count || 0} active commitments`);
  }
  
  console.log('\n✨ Reset complete!');
}

resetCommitments().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
