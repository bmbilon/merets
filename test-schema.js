const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSchema() {
  console.log('=== SCHEMA & FLOW VERIFICATION ===\n')
  
  // 1. Check user_profiles
  console.log('1. USER PROFILES')
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, name, role, age')
    .order('role', { ascending: false })
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError)
  } else {
    console.log(`✅ Found ${users.length} users:`)
    users.forEach(u => console.log(`   - ${u.name} (${u.role}${u.age ? ', age ' + u.age : ''}) [${u.id}]`))
  }
  
  // 2. Check issuers table
  console.log('\n2. ISSUERS TABLE')
  const { data: issuers, error: issuersError } = await supabase
    .from('issuers')
    .select('id, name, issuer_type, user_profile_id, is_active, can_create_tasks, can_approve_commitments')
  
  if (issuersError) {
    console.error('❌ Error fetching issuers:', issuersError)
  } else {
    console.log(`✅ Found ${issuers.length} issuers:`)
    issuers.forEach(i => {
      console.log(`   - ${i.name} (${i.issuer_type}) - Active: ${i.is_active}`)
      console.log(`     Permissions: Create=${i.can_create_tasks}, Approve=${i.can_approve_commitments}`)
      console.log(`     User Profile ID: ${i.user_profile_id}`)
    })
  }
  
  // 3. Check task_templates
  console.log('\n3. TASK TEMPLATES')
  const { data: tasks, error: tasksError } = await supabase
    .from('task_templates')
    .select('id, title, effort_minutes, base_pay_cents, is_available_for_kids, issuer_id')
    .order('effort_minutes')
    .limit(5)
  
  if (tasksError) {
    console.error('❌ Error fetching tasks:', tasksError)
  } else {
    console.log(`✅ Found ${tasks.length} tasks (showing first 5):`)
    tasks.forEach(t => {
      console.log(`   - ${t.title} (${t.effort_minutes}min, $${(t.base_pay_cents/100).toFixed(2)})`)
      console.log(`     Available: ${t.is_available_for_kids}, Issuer: ${t.issuer_id || 'none'}`)
    })
  }
  
  // 4. Check commitments
  console.log('\n4. COMMITMENTS')
  const { data: commitments, error: commitmentsError } = await supabase
    .from('commitments')
    .select('id, user_id, task_template_id, status, pay_cents, issuer_id')
    .limit(10)
  
  if (commitmentsError) {
    console.error('❌ Error fetching commitments:', commitmentsError)
  } else {
    console.log(`✅ Found ${commitments.length} commitments (showing first 10):`)
    commitments.forEach(c => {
      console.log(`   - Status: ${c.status}, Pay: $${(c.pay_cents/100).toFixed(2)}`)
      console.log(`     Earner: ${c.user_id}, Issuer: ${c.issuer_id || 'none'}`)
    })
  }
  
  // 5. Check family_relationships
  console.log('\n5. FAMILY RELATIONSHIPS')
  const { data: relationships, error: relationshipsError } = await supabase
    .from('family_relationships')
    .select('issuer_id, earner_id, relationship_type, permission_level')
  
  if (relationshipsError) {
    console.error('❌ Error fetching relationships:', relationshipsError)
  } else {
    console.log(`✅ Found ${relationships.length} relationships:`)
    relationships.forEach(r => {
      console.log(`   - Issuer: ${r.issuer_id} → Earner: ${r.earner_id}`)
      console.log(`     Type: ${r.relationship_type}, Permission: ${r.permission_level}`)
    })
  }
  
  // 6. Test views
  console.log('\n6. TESTING VIEWS')
  
  // Test issuer tasks view
  const { data: issuerTasksView, error: issuerTasksError } = await supabase
    .from('v_issuer_tasks_with_commitments')
    .select('task_id, title, issuer_name, pending_approval_count, accepted_count, completed_count')
    .limit(3)
  
  if (issuerTasksError) {
    console.error('❌ Error with v_issuer_tasks_with_commitments:', issuerTasksError)
  } else {
    console.log(`✅ v_issuer_tasks_with_commitments: ${issuerTasksView.length} rows`)
    issuerTasksView.forEach(t => {
      console.log(`   - ${t.title} by ${t.issuer_name}`)
      console.log(`     Pending: ${t.pending_approval_count}, Accepted: ${t.accepted_count}, Completed: ${t.completed_count}`)
    })
  }
  
  // Test commitments with relationships view
  const { data: commitmentsView, error: commitmentsViewError } = await supabase
    .from('v_commitments_with_relationships')
    .select('commitment_id, earner_name, status, parents_guardians')
    .limit(3)
  
  if (commitmentsViewError) {
    console.error('❌ Error with v_commitments_with_relationships:', commitmentsViewError)
  } else {
    console.log(`\n✅ v_commitments_with_relationships: ${commitmentsView.length} rows`)
    commitmentsView.forEach(c => {
      console.log(`   - ${c.earner_name} - Status: ${c.status}`)
      console.log(`     Parents: ${c.parents_guardians ? JSON.stringify(c.parents_guardians).substring(0, 80) : 'none'}`)
    })
  }
  
  // 7. Test functions
  console.log('\n7. TESTING FUNCTIONS')
  
  // Get Brett's user_profile_id
  const brett = users?.find(u => u.name === 'Brett')
  if (brett) {
    console.log(`Testing with Brett's ID: ${brett.id}`)
    
    // Test get_issuer_tasks_dashboard
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_issuer_tasks_dashboard', { p_issuer_user_profile_id: brett.id })
    
    if (dashboardError) {
      console.error('❌ Error with get_issuer_tasks_dashboard:', dashboardError)
    } else {
      console.log(`✅ get_issuer_tasks_dashboard: ${dashboardData.length} tasks`)
      dashboardData.slice(0, 3).forEach(t => {
        console.log(`   - ${t.title}: ${t.total_assignments} total assignments`)
      })
    }
    
    // Test get_issuer_all_commitments
    const { data: allCommitments, error: allCommitmentsError } = await supabase
      .rpc('get_issuer_all_commitments', { p_issuer_user_profile_id: brett.id })
    
    if (allCommitmentsError) {
      console.error('❌ Error with get_issuer_all_commitments:', allCommitmentsError)
    } else {
      console.log(`\n✅ get_issuer_all_commitments: ${allCommitments.length} commitments`)
      allCommitments.slice(0, 3).forEach(c => {
        console.log(`   - ${c.task_title} by ${c.earner_name} (${c.status})`)
      })
    }
  }
  
  console.log('\n=== VERIFICATION COMPLETE ===')
}

testSchema()
