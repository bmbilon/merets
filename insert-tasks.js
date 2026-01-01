const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const tasks = [
  { title: 'Take out trash', description: 'Empty kitchen trash and replace bag', skill_category: 'Cleaning', effort_minutes: 2, base_pay_cents: 100, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Daily task' },
  { title: 'Feed pets', description: 'Fill food and water bowls', skill_category: 'Pet Care', effort_minutes: 3, base_pay_cents: 200, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Morning and evening' },
  { title: 'Water plants', description: 'Water all indoor plants', skill_category: 'General', effort_minutes: 4, base_pay_cents: 250, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Check soil first' },
  { title: 'Load dishwasher', description: 'Load dishes and start cycle', skill_category: 'Dishes', effort_minutes: 6, base_pay_cents: 400, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Scrape plates first' },
  { title: 'Unload dishwasher', description: 'Put away all clean dishes', skill_category: 'Dishes', effort_minutes: 5, base_pay_cents: 350, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Check if clean' },
  { title: 'Fold laundry', description: 'Fold one load of clean laundry', skill_category: 'Laundry', effort_minutes: 10, base_pay_cents: 600, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Fold neatly' },
  { title: 'Vacuum one room', description: 'Vacuum living room or bedroom', skill_category: 'Cleaning', effort_minutes: 10, base_pay_cents: 600, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Move small items' },
  { title: 'Sweep kitchen floor', description: 'Sweep entire kitchen', skill_category: 'Cleaning', effort_minutes: 8, base_pay_cents: 500, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Get under table' },
  { title: 'Clean bathroom sink', description: 'Scrub sink and faucet', skill_category: 'Cleaning', effort_minutes: 7, base_pay_cents: 450, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Use bathroom cleaner' },
  { title: 'Make beds', description: 'Make all beds in house', skill_category: 'General', effort_minutes: 12, base_pay_cents: 700, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Straighten sheets' },
  { title: 'Clean mirrors', description: 'Clean all mirrors in house', skill_category: 'Cleaning', effort_minutes: 8, base_pay_cents: 500, difficulty_level: 1, is_micro_task: true, is_available_for_kids: true, parent_notes: 'Glass cleaner' },
  { title: 'Mop kitchen floor', description: 'Sweep and mop kitchen', skill_category: 'Cleaning', effort_minutes: 15, base_pay_cents: 900, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Let it dry' },
  { title: 'Dust all rooms', description: 'Dust furniture in all rooms', skill_category: 'Cleaning', effort_minutes: 20, base_pay_cents: 1200, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Use microfiber cloth' },
  { title: 'Wash dishes by hand', description: 'Wash and dry all dishes', skill_category: 'Dishes', effort_minutes: 15, base_pay_cents: 900, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Hot soapy water' },
  { title: 'Organize bedroom', description: 'Clean and organize entire bedroom', skill_category: 'Organization', effort_minutes: 25, base_pay_cents: 1500, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Put everything away' },
  { title: 'Wash car', description: 'Wash exterior of family car', skill_category: 'Yard', effort_minutes: 30, base_pay_cents: 1800, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Soap and rinse well' },
  { title: 'Vacuum whole house', description: 'Vacuum all rooms and stairs', skill_category: 'Cleaning', effort_minutes: 30, base_pay_cents: 1800, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'All floors' },
  { title: 'Rake leaves', description: 'Rake yard and bag leaves', skill_category: 'Yard', effort_minutes: 40, base_pay_cents: 2400, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Fill bags' },
  { title: 'Weed garden beds', description: 'Pull weeds from all garden areas', skill_category: 'Yard', effort_minutes: 45, base_pay_cents: 2700, difficulty_level: 2, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Get the roots' },
  { title: 'Mow lawn', description: 'Mow front and back yard', skill_category: 'Yard', effort_minutes: 50, base_pay_cents: 3000, difficulty_level: 3, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Edge too if time' },
  { title: 'Deep clean kitchen', description: 'Clean all surfaces, appliances, floor', skill_category: 'Cleaning', effort_minutes: 60, base_pay_cents: 2500, difficulty_level: 3, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Everything' },
  { title: 'Organize closet', description: 'Sort and organize entire closet', skill_category: 'Organization', effort_minutes: 60, base_pay_cents: 2500, difficulty_level: 3, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Donate old items' },
  { title: 'Do laundry start to finish', description: 'Wash, dry, fold, and put away', skill_category: 'Laundry', effort_minutes: 90, base_pay_cents: 3000, difficulty_level: 3, is_micro_task: false, is_available_for_kids: true, parent_notes: 'Complete task' }
]

async function insertTasks() {
  console.log(`Inserting ${tasks.length} tasks...\n`)
  
  const { data, error } = await supabase
    .from('task_templates')
    .insert(tasks)
    .select()
  
  if (error) {
    console.error('ERROR:', error)
    return
  }
  
  console.log(`✅ Successfully inserted ${data.length} tasks!\n`)
  
  // Verify
  const { data: allTasks } = await supabase
    .from('task_templates')
    .select('*')
  
  console.log(`Total tasks in database: ${allTasks?.length || 0}`)
}

insertTasks()
