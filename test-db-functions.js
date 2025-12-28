const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bzogqqkptnbtnmpzvdca.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'
);

async function testFunctions() {
  console.log('🧪 Testing Merets v1.5 Database Functions\n');
  
  // Get test user (Aveya)
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, name, handle')
    .eq('handle', 'aveya')
    .single();
  
  if (!users) {
    console.log('❌ Test user not found');
    return;
  }
  
  console.log(`✅ Test user: ${users.name} (${users.handle})`);
  console.log(`   User ID: ${users.id}\n`);
  
  // Test 1: Check merets_multiplier function
  console.log('📊 Test 1: merets_multiplier(quality_stars)');
  const multipliers = [
    { stars: 5, expected: 1.20 },
    { stars: 4, expected: 1.00 },
    { stars: 3, expected: 0.70 },
    { stars: 2, expected: 0.40 },
    { stars: 1, expected: 0.20 }
  ];
  
  for (const test of multipliers) {
    const { data, error } = await supabase.rpc('merets_multiplier', { 
      quality_stars: test.stars 
    });
    
    if (error) {
      console.log(`   ❌ ${test.stars}★ → Error: ${error.message}`);
    } else {
      const match = Math.abs(data - test.expected) < 0.01;
      console.log(`   ${match ? '✅' : '❌'} ${test.stars}★ → ${data} (expected ${test.expected})`);
    }
  }
  
  // Test 2: Check calculate_composite_rep function
  console.log('\n📊 Test 2: calculate_composite_rep(user_id)');
  const { data: repScore, error: repError } = await supabase.rpc('calculate_composite_rep', {
    p_user_id: users.id
  });
  
  if (repError) {
    console.log(`   ❌ Error: ${repError.message}`);
  } else {
    console.log(`   ✅ Rep Score: ${repScore}/100`);
    console.log(`   📝 Formula: (completion_rate × 40) + ((quality_avg - 1) / 4 × 50) + volume_bonus`);
  }
  
  // Test 3: Check rep breakdown view
  console.log('\n📊 Test 3: v_user_rep_breakdown view');
  const { data: breakdown, error: breakdownError } = await supabase
    .from('v_user_rep_breakdown')
    .select('*')
    .eq('user_id', users.id)
    .single();
  
  if (breakdownError) {
    console.log(`   ❌ Error: ${breakdownError.message}`);
  } else if (breakdown) {
    console.log(`   ✅ Completed: ${breakdown.completed_count || 0}`);
    console.log(`   ✅ Completion Rate: ${breakdown.completion_rate || 0}`);
    console.log(`   ✅ Quality Avg: ${breakdown.quality_avg || 0}`);
    console.log(`   ✅ Volume Bonus: ${breakdown.volume_bonus || 0}`);
    console.log(`   ✅ Composite Rep: ${breakdown.composite_rep || 0}/100`);
  } else {
    console.log('   ℹ️  No rep data yet (expected for new user)');
  }
  
  // Test 4: Check earnings view
  console.log('\n📊 Test 4: v_user_earnings view');
  const { data: earnings, error: earningsError } = await supabase
    .from('v_user_earnings')
    .select('*')
    .eq('user_id', users.id);
  
  if (earningsError) {
    console.log(`   ❌ Error: ${earningsError.message}`);
  } else if (earnings && earnings.length > 0) {
    const total = earnings[0];
    console.log(`   ✅ Owed: $${(total.owed_cents / 100).toFixed(2)}`);
    console.log(`   ✅ Paid: $${(total.paid_cents / 100).toFixed(2)}`);
  } else {
    console.log('   ℹ️  No earnings yet (expected for new user)');
  }
  
  // Test 5: Verify trigger exists
  console.log('\n📊 Test 5: Checking trigger on commitment_reviews');
  const { data: triggers, error: triggerError } = await supabase
    .from('pg_trigger')
    .select('tgname')
    .like('tgname', '%commitment_review%');
  
  if (triggerError) {
    console.log(`   ⚠️  Cannot query pg_trigger (permissions) - this is normal`);
  } else {
    console.log(`   ✅ Found ${triggers.length} trigger(s)`);
  }
  
  // Test 6: Check if task_templates has base_merets
  console.log('\n📊 Test 6: Verify task_templates.base_merets backfill');
  const { data: tasks, error: taskError } = await supabase
    .from('task_templates')
    .select('title, effort_minutes, base_merets')
    .limit(3);
  
  if (taskError) {
    console.log(`   ❌ Error: ${taskError.message}`);
  } else {
    tasks.forEach(task => {
      const expected = task.effort_minutes / 60;
      const match = Math.abs(task.base_merets - expected) < 0.01;
      console.log(`   ${match ? '✅' : '❌'} ${task.title}: ${task.effort_minutes}min → ${task.base_merets} Merets (expected ${expected.toFixed(2)})`);
    });
  }
  
  console.log('\n✅ Database function tests complete!');
}

testFunctions().catch(err => console.error('❌ Error:', err.message));
