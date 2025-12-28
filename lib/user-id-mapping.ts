import { supabase } from './supabase'

// Map hardcoded IDs to database UUIDs
let userIdMap: Record<string, string> = {}
let mapLoaded = false

export const loadUserIdMapping = async (): Promise<void> => {
  if (mapLoaded) return
  
  try {
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('role', 'kid')
    
    if (users) {
      // Create mapping from name-based IDs to actual UUIDs
      users.forEach(user => {
        if (user.name === 'Aveya') {
          userIdMap['kid1'] = user.id
        } else if (user.name === 'Onyx') {
          userIdMap['kid2'] = user.id
        }
      })
    }
    mapLoaded = true
  } catch (error) {
    console.error('Error loading user ID mapping:', error)
    // Use fallback mapping for development
    userIdMap = {
      'kid1': 'aveya-temp-uuid',
      'kid2': 'onyx-temp-uuid'
    }
    mapLoaded = true
  }
}

export const mapUserId = async (hardcodedId: string): Promise<string> => {
  await loadUserIdMapping()
  return userIdMap[hardcodedId] || hardcodedId
}

export const getUserByName = async (name: string): Promise<string | null> => {
  try {
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('name', name)
      .eq('role', 'kid')
      .single()
    
    return user?.id || null
  } catch (error) {
    console.error(`Error finding user by name ${name}:`, error)
    return null
  }
}

export const getAveyaId = async (): Promise<string> => {
  const id = await getUserByName('Aveya')
  return id || 'temp-aveya-id'
}

export const getOnyxId = async (): Promise<string> => {
  const id = await getUserByName('Onyx')
  return id || 'temp-onyx-id'
}