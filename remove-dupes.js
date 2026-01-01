const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function removeDupes() {
  console.log('Finding duplicates...\n')
  
  // Get all tasks
  const { data: allTasks, error } = await supabase
    .from('task_templates')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('ERROR:', error)
    return
  }
  
  console.log(`Total tasks: ${allTasks.length}`)
  
  // Group by title
  const tasksByTitle = {}
  allTasks.forEach(task => {
    if (!tasksByTitle[task.title]) {
      tasksByTitle[task.title] = []
    }
    tasksByTitle[task.title].push(task)
  })
  
  // Find duplicates
  const idsToDelete = []
  Object.entries(tasksByTitle).forEach(([title, tasks]) => {
    if (tasks.length > 1) {
      console.log(`Found ${tasks.length} copies of "${title}"`)
      // Keep first (oldest), delete rest
      for (let i = 1; i < tasks.length; i++) {
        idsToDelete.push(tasks[i].id)
      }
    }
  })
  
  console.log(`\nDeleting ${idsToDelete.length} duplicate tasks...\n`)
  
  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('task_templates')
      .delete()
      .in('id', idsToDelete)
    
    if (deleteError) {
      console.error('ERROR deleting:', deleteError)
      return
    }
    
    console.log('✅ Duplicates removed!')
  } else {
    console.log('No duplicates found.')
  }
  
  // Final count
  const { data: finalTasks } = await supabase
    .from('task_templates')
    .select('*')
  
  console.log(`\nFinal count: ${finalTasks?.length || 0} unique tasks`)
}

removeDupes()
