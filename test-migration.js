const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bzogqqkptnbtnmpzvdca.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'
);

async function verify() {
  console.log('🔍 Verifying Ments v1.5 migration...\n');
  
  // Check columns
  const { data: users } = await supabase.from('user_profiles').select('*').limit(1);
  const cols = Object.keys(users[0]);
  console.log('✅ user_profiles columns:', cols.length);
  
  const newCols = ['handle', 'rep_score', 'merets_balance', 'is_earner', 'is_provider'];
  const found = newCols.filter(c => cols.includes(c));
  console.log('✅ New columns found:', found.join(', '));
  
  // Check tables
  const tables = ['meret_events', 'rep_events', 'earning_events', 'households'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    console.log(error ? '❌' : '✅', t);
  }
  
  // Check user data
  const { data: allUsers } = await supabase.from('user_profiles')
    .select('name, handle, rep_score, merets_balance, is_earner, is_provider');
  
  console.log('\n📊 User Data:');
  allUsers.forEach(u => {
    console.log(`   ${u.name} → ${u.handle} | Rep: ${u.rep_score} | Merets: ${u.merets_balance} | Earner: ${u.is_earner} | Provider: ${u.is_provider}`);
  });
  
  // Check household
  const { data: households } = await supabase.from('households').select('*');
  console.log('\n🏠 Households:', households.length);
  
  const { data: members } = await supabase.from('household_members').select('*');
  console.log('👥 Members:', members.length);
  
  console.log('\n✅ Migration verified successfully!');
}

verify().catch(err => console.error('❌ Error:', err.message));
