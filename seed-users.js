const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedUsers() {
  console.log('Seeding user profiles...\n')
  
  // 1. Create user profiles
  const users = [
    { name: 'Brett', role: 'parent', age: null, level: 1, total_xp: 0, total_earnings_cents: 0 },
    { name: 'Lauren', role: 'parent', age: null, level: 1, total_xp: 0, total_earnings_cents: 0 },
    { name: 'Aveya', role: 'kid', age: 12, level: 1, total_xp: 0, total_earnings_cents: 0 },
    { name: 'Onyx', role: 'kid', age: 9, level: 1, total_xp: 0, total_earnings_cents: 0 }
  ]
  
  // Check if users already exist
  const { data: existingUsers } = await supabase
    .from('user_profiles')
    .select('*')
  
  let insertedUsers = []
  
  for (const user of users) {
    const existing = existingUsers?.find(u => u.name === user.name)
    if (existing) {
      insertedUsers.push(existing)
    } else {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(user)
        .select()
        .single()
      
      if (error) {
        console.error(`Error creating ${user.name}:`, error)
        continue
      }
      insertedUsers.push(data)
    }
  }
  
  if (insertedUsers.length === 0) {
    console.error('❌ No users created')
    return
  }
  
  
  console.log('✅ Created users:')
  insertedUsers.forEach(u => console.log(`   - ${u.name} (${u.role}) [${u.id}]`))
  
  const brett = insertedUsers.find(u => u.name === 'Brett')
  const lauren = insertedUsers.find(u => u.name === 'Lauren')
  const aveya = insertedUsers.find(u => u.name === 'Aveya')
  const onyx = insertedUsers.find(u => u.name === 'Onyx')
  
  // 2. Update or create issuers
  console.log('\n2. Creating issuers...')
  
  // Delete orphaned issuer first
  await supabase.from('issuers').delete().is('user_profile_id', null)
  
  const issuersData = [
    {
      user_profile_id: brett.id,
      name: 'Brett',
      issuer_type: 'parent',
      is_active: true,
      can_create_tasks: true,
      can_approve_commitments: true,
      can_rate_quality: true
    },
    {
      user_profile_id: lauren.id,
      name: 'Lauren',
      issuer_type: 'parent',
      is_active: true,
      can_create_tasks: true,
      can_approve_commitments: true,
      can_rate_quality: true
    }
  ]
  
  const { data: issuers, error: issuersError } = await supabase
    .from('issuers')
    .upsert(issuersData, { onConflict: 'user_profile_id' })
    .select()
  
  if (issuersError) {
    console.error('❌ Error creating issuers:', issuersError)
  } else {
    console.log('✅ Created issuers:')
    issuers.forEach(i => console.log(`   - ${i.name} (${i.issuer_type})`))
  }
  
  // 3. Create family relationships
  console.log('\n3. Creating family relationships...')
  
  const relationships = [
    {
      issuer_id: brett.id,
      earner_id: aveya.id,
      relationship_type: 'parent',
      permission_level: 'full'
    },
    {
      issuer_id: brett.id,
      earner_id: onyx.id,
      relationship_type: 'parent',
      permission_level: 'full'
    },
    {
      issuer_id: lauren.id,
      earner_id: aveya.id,
      relationship_type: 'parent',
      permission_level: 'full'
    },
    {
      issuer_id: lauren.id,
      earner_id: onyx.id,
      relationship_type: 'parent',
      permission_level: 'full'
    }
  ]
  
  const { data: rels, error: relsError } = await supabase
    .from('family_relationships')
    .upsert(relationships, { onConflict: 'issuer_id,earner_id' })
    .select()
  
  if (relsError) {
    console.error('❌ Error creating relationships:', relsError)
  } else {
    console.log(`✅ Created ${rels.length} family relationships`)
  }
  
  // 4. Assign issuer_id to existing tasks (assign to Brett)
  console.log('\n4. Assigning tasks to Brett...')
  
  const { data: updated, error: updateError } = await supabase
    .from('task_templates')
    .update({ issuer_id: brett.id })
    .is('issuer_id', null)
    .select()
  
  if (updateError) {
    console.error('❌ Error updating tasks:', updateError)
  } else {
    console.log(`✅ Assigned ${updated.length} tasks to Brett`)
  }
  
  console.log('\n✅ SEEDING COMPLETE!')
}

seedUsers()
