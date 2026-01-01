const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTasks() {
  console.log('Querying task_templates...\n')
  
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .order('effort_minutes')
  
  if (error) {
    console.error('ERROR:', error)
    return
  }
  
  console.log(`Found ${data?.length || 0} tasks:\n`)
  
  if (data && data.length > 0) {
    data.forEach((task, i) => {
      console.log(`${i+1}. ${task.title}`)
      console.log(`   Time: ${task.effort_minutes}min | Pay: $${(task.base_pay_cents/100).toFixed(2)} | Available: ${task.is_available_for_kids}`)
      console.log(`   Category: ${task.skill_category} | Micro: ${task.is_micro_task}`)
      console.log('')
    })
  } else {
    console.log('NO TASKS FOUND - task_templates table is EMPTY!')
  }
}

checkTasks()
