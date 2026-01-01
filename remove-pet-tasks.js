const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function removePetTasks() {
  console.log('Finding pet-related tasks...\n')
  
  // Get all tasks
  const { data: allTasks, error } = await supabase
    .from('task_templates')
    .select('*')
  
  if (error) {
    console.error('ERROR:', error)
    return
  }
  
  // Find pet-related tasks (by category or title/description containing 'pet')
  const petTasks = allTasks.filter(task => 
    task.skill_category === 'Pet Care' || 
    task.title.toLowerCase().includes('pet') ||
    task.description.toLowerCase().includes('pet')
  )
  
  console.log(`Found ${petTasks.length} pet-related tasks:`)
  petTasks.forEach(task => {
    console.log(`  - ${task.title} (${task.skill_category})`)
  })
  
  if (petTasks.length > 0) {
    console.log('\nDeleting pet tasks...\n')
    
    const { error: deleteError } = await supabase
      .from('task_templates')
      .delete()
      .in('id', petTasks.map(t => t.id))
    
    if (deleteError) {
      console.error('ERROR deleting:', deleteError)
      return
    }
    
    console.log('✅ Pet tasks removed!')
  } else {
    console.log('\nNo pet tasks found.')
  }
  
  // Final count
  const { data: finalTasks } = await supabase
    .from('task_templates')
    .select('*')
  
  console.log(`\nFinal count: ${finalTasks?.length || 0} tasks`)
}

removePetTasks()
