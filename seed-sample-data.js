const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedSampleData() {
  console.log('Seeding sample completed commitments...\n')
  
  // Get user profiles
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .in('name', ['Aveya', 'Onyx'])
  
  if (!users || users.length !== 2) {
    console.error('Could not find Aveya and Onyx profiles')
    return
  }
  
  const aveya = users.find(u => u.name === 'Aveya')
  const onyx = users.find(u => u.name === 'Onyx')
  
  console.log(`Found Aveya: ${aveya.id}`)
  console.log(`Found Onyx: ${onyx.id}\n`)
  
  // Get some tasks for reference
  const { data: tasks } = await supabase
    .from('task_templates')
    .select('*')
    .limit(20)
  
  // Calculate average hourly rate from tasks
  const avgHourlyRate = tasks.reduce((sum, t) => {
    const hourlyRate = (t.base_pay_cents / t.effort_minutes) * 60
    return sum + hourlyRate
  }, 0) / tasks.length
  
  console.log(`Average hourly rate: $${(avgHourlyRate / 100).toFixed(2)}/hr\n`)
  
  // Create sample completed commitments
  const now = new Date()
  const commitments = []
  
  // Helper to create a commitment
  const createCommitment = (userId, daysAgo, task) => {
    const createdDate = new Date(now)
    createdDate.setDate(createdDate.getDate() - daysAgo)
    createdDate.setHours(Math.floor(Math.random() * 12) + 8) // 8am-8pm
    
    const completedDate = new Date(createdDate)
    completedDate.setMinutes(completedDate.getMinutes() + task.effort_minutes)
    
    return {
      user_id: userId,
      task_template_id: task.id,
      custom_title: task.title,
      custom_description: task.description,
      skill_category: task.skill_category,
      effort_minutes: task.effort_minutes,
      pay_cents: task.base_pay_cents,
      status: 'completed',
      created_at: createdDate.toISOString(),
      completed_at: completedDate.toISOString()
    }
  }
  
  // For each kid, create 12 monthly completions (including 3 this week)
  const weeklyTasks = tasks.slice(0, 6) // Mix of quick tasks for weekly
  const monthlyTasks = tasks.slice(0, 15) // Broader mix for monthly
  
  // Aveya's completions
  // 3 this week (last 7 days)
  for (let i = 0; i < 3; i++) {
    const daysAgo = Math.floor(Math.random() * 7)
    const task = weeklyTasks[i % weeklyTasks.length]
    commitments.push(createCommitment(aveya.id, daysAgo, task))
  }
  
  // 9 more this month (8-30 days ago)
  for (let i = 0; i < 9; i++) {
    const daysAgo = Math.floor(Math.random() * 23) + 8
    const task = monthlyTasks[i % monthlyTasks.length]
    commitments.push(createCommitment(aveya.id, daysAgo, task))
  }
  
  // Onyx's completions
  // 3 this week
  for (let i = 0; i < 3; i++) {
    const daysAgo = Math.floor(Math.random() * 7)
    const task = weeklyTasks[(i + 3) % weeklyTasks.length]
    commitments.push(createCommitment(onyx.id, daysAgo, task))
  }
  
  // 9 more this month
  for (let i = 0; i < 9; i++) {
    const daysAgo = Math.floor(Math.random() * 23) + 8
    const task = monthlyTasks[(i + 3) % monthlyTasks.length]
    commitments.push(createCommitment(onyx.id, daysAgo, task))
  }
  
  console.log(`Creating ${commitments.length} sample commitments...`)
  
  // Insert commitments
  const { data: inserted, error } = await supabase
    .from('commitments')
    .insert(commitments)
    .select()
  
  if (error) {
    console.error('Error inserting commitments:', error)
    return
  }
  
  console.log(`✅ Created ${inserted.length} commitments\n`)
  
  // Calculate total earnings for each user
  const aveyaEarnings = commitments
    .filter(c => c.user_id === aveya.id)
    .reduce((sum, c) => sum + c.pay_cents, 0)
  
  const onyxEarnings = commitments
    .filter(c => c.user_id === onyx.id)
    .reduce((sum, c) => sum + c.pay_cents, 0)
  
  console.log(`Aveya earnings: $${(aveyaEarnings / 100).toFixed(2)}`)
  console.log(`Onyx earnings: $${(onyxEarnings / 100).toFixed(2)}\n`)
  
  // Update user profiles with earnings
  await supabase
    .from('user_profiles')
    .update({ total_earnings_cents: aveyaEarnings })
    .eq('id', aveya.id)
  
  await supabase
    .from('user_profiles')
    .update({ total_earnings_cents: onyxEarnings })
    .eq('id', onyx.id)
  
  console.log('✅ Updated user profiles with earnings')
  
  // Summary
  console.log('\n=== SUMMARY ===')
  console.log(`Aveya: 3 weekly, 12 monthly merets, $${(aveyaEarnings / 100).toFixed(2)} total`)
  console.log(`Onyx: 3 weekly, 12 monthly merets, $${(onyxEarnings / 100).toFixed(2)} total`)
}

seedSampleData()
