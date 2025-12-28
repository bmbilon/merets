import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import * as Haptics from 'expo-haptics'
import { SupabaseService } from '../lib/supabase-service'
import { ParentAdminService } from '../lib/supabase-parent-service'
import { TaskTemplate, UserProfile } from '../lib/supabase'
import { RewardAnimation } from '../lib/systems/instant-rewards'

interface Props {
  userProfile: UserProfile
  onTaskCompleted?: () => void
}

export const SupabaseQuickTasks: React.FC<Props> = ({ userProfile, onTaskCompleted }) => {
  const [microTasks, setMicroTasks] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [lastReward, setLastReward] = useState<{
    money: number
    xp: number
    stickers: number
  } | null>(null)

  useEffect(() => {
    loadMicroTasks()
  }, [])

  const loadMicroTasks = async () => {
    try {
      // Get prioritized tasks, filtered for micro-tasks
      const prioritizedTasks = await ParentAdminService.getPrioritizedTasks(undefined, true, 12)
      
      // Convert PrioritizedTask to TaskTemplate format for compatibility
      const tasks = prioritizedTasks.map(pt => ({
        id: pt.task_id,
        title: pt.title,
        description: pt.description || '',
        skill_category: pt.skill_category,
        effort_minutes: pt.effective_effort_minutes,
        base_pay_cents: pt.effective_pay_cents,
        difficulty_level: pt.difficulty_level,
        is_micro_task: pt.is_micro_task,
        created_at: '',
        // Add priority info for visual indicators
        priority_type: pt.priority_type,
        is_urgent: pt.is_urgent
      } as TaskTemplate & { priority_type: string; is_urgent: boolean }))
      
      setMicroTasks(tasks)
    } catch (error) {
      console.error('Error loading micro-tasks:', error)
      Alert.alert('Error', 'Failed to load quick tasks')
    }
  }

  const handleQuickComplete = async (task: TaskTemplate) => {
    if (loading) return

    setLoading(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      // Create and immediately complete the commitment
      const commitment = await SupabaseService.createCommitment({
        user_id: userProfile.id,
        task_template_id: task.id,
        custom_title: task.title,
        custom_description: task.description || '',
        skill_category: task.skill_category,
        effort_minutes: task.effort_minutes,
        pay_cents: task.base_pay_cents,
        status: 'completed'
      })

      // Update user XP and earnings
      const baseXP = 15 // Base XP for micro-tasks
      const xpMultiplier = task.difficulty_level * 0.5 + 0.5 // 1x to 2.5x based on difficulty
      const earnedXP = Math.round(baseXP * xpMultiplier)

      await SupabaseService.updateUserXP(userProfile.id, earnedXP, task.base_pay_cents)

      // Show reward animation
      setLastReward({
        money: task.base_pay_cents,
        xp: earnedXP,
        stickers: Math.random() > 0.2 ? 1 : 0 // 80% chance of sticker
      })
      setShowReward(true)

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      onTaskCompleted?.()

    } catch (error) {
      console.error('Error completing task:', error)
      Alert.alert('Error', 'Failed to complete task')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return '#4CAF50' // Green - Easy
      case 2: return '#FF9800' // Orange - Medium
      case 3: return '#FF5722' // Red - Hard
      case 4: return '#9C27B0' // Purple - Expert
      default: return '#4CAF50'
    }
  }

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Helper'
      case 2: return 'Contributor'
      case 3: return 'Builder'
      case 4: return 'Master'
      default: return 'Helper'
    }
  }

  if (microTasks.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading quick tasks...</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20 }}>
        ⚡ Quick Tasks (Instant Complete!)
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      >
        {microTasks.map(task => (
          <TouchableOpacity
            key={task.id}
            onPress={() => handleQuickComplete(task)}
            disabled={loading}
            style={{
              backgroundColor: (task as any).is_urgent ? '#FFEBEE' : 'white',
              borderRadius: 15,
              padding: 15,
              marginHorizontal: 5,
              minWidth: 180,
              maxWidth: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              opacity: loading ? 0.7 : 1,
              borderLeftWidth: (task as any).priority_type === 'urgent' ? 4 : 0,
              borderLeftColor: '#F44336'
            }}
          >
            {/* Priority Indicator */}
            {(task as any).is_urgent && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6
              }}>
                <Text style={{ fontSize: 12, color: '#F44336', fontWeight: 'bold' }}>
                  🚨 URGENT
                </Text>
              </View>
            )}
            
            {/* Task Title & Description */}
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold', 
              marginBottom: 8,
              color: (task as any).is_urgent ? '#D32F2F' : '#333'
            }}>
              {task.title}
            </Text>
            
            <Text style={{ 
              fontSize: 13, 
              color: '#666',
              marginBottom: 12,
              lineHeight: 18
            }}>
              {task.description}
            </Text>

            {/* Task Stats */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#888' }}>Time</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
                  {task.effort_minutes}min
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#888' }}>Pay</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2E7D32' }}>
                  ${(task.base_pay_cents / 100).toFixed(2)}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#888' }}>Skill</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#333' }}>
                  {task.skill_category}
                </Text>
              </View>
            </View>

            {/* Difficulty Badge */}
            <View style={{
              backgroundColor: getDifficultyColor(task.difficulty_level),
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              alignSelf: 'flex-start',
              marginBottom: 12
            }}>
              <Text style={{ 
                color: 'white', 
                fontSize: 11, 
                fontWeight: 'bold' 
              }}>
                {getDifficultyLabel(task.difficulty_level)}
              </Text>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              onPress={() => handleQuickComplete(task)}
              disabled={loading}
              style={{
                backgroundColor: '#FF69B4',
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 20,
                alignItems: 'center'
              }}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: 14, 
                fontWeight: 'bold' 
              }}>
                {loading ? 'Completing...' : '✅ Complete Now!'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reward Animation */}
      {showReward && lastReward && (
        <RewardAnimation
          money={lastReward.money}
          xp={lastReward.xp}
          stickers={lastReward.stickers}
          onComplete={() => setShowReward(false)}
        />
      )}

      {microTasks.length === 0 && (
        <View style={{ 
          padding: 30, 
          alignItems: 'center',
          backgroundColor: '#f9f9f9',
          margin: 20,
          borderRadius: 15
        }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            🎯 No quick tasks available right now
          </Text>
          <Text style={{ fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }}>
            Check back later for more instant completion tasks!
          </Text>
        </View>
      )}
    </View>
  )
}