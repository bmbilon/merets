import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native'
import { Card, Chip, ProgressBar, IconButton, Portal, Modal } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { SupabaseService } from '../lib/supabase-service'
import { ParentAdminService } from '../lib/supabase-parent-service'
import { TaskTemplate, UserProfile, Commitment } from '../lib/supabase'
import { SimpleRewardAnimation } from '../lib/systems/instant-rewards'
import { mapUserId, getUserByName } from '../lib/user-id-mapping'

interface Props {
  userProfile: UserProfile
  onTaskCompleted?: () => void
  onTaskCommitted?: () => void
}

interface ExtendedTaskTemplate extends TaskTemplate {
  priority_type?: string
  is_urgent?: boolean
  effective_pay_cents?: number
  effective_effort_minutes?: number
  is_available?: boolean
  hours_until_available?: number
}

interface CommitmentState {
  totalCommitments: number
  totalTimeCommitted: number // in minutes
  maxCommitments: number
  maxTimeAllowed: number
  canCommitMore: boolean
  committedTaskIds: Set<string> // Track which specific tasks are committed to
  globalCommittedTaskIds: Set<string> // Track tasks committed by ANY user
}

const { width: screenWidth } = Dimensions.get('window')
const tileWidth = (screenWidth - 60) / 2 // 2 tiles per row with padding

export const GameifiedTaskTiles: React.FC<Props> = ({ 
  userProfile, 
  onTaskCompleted,
  onTaskCommitted 
}) => {
  const [availableTasks, setAvailableTasks] = useState<ExtendedTaskTemplate[]>([])
  const [commitmentState, setCommitmentState] = useState<CommitmentState>({
    totalCommitments: 0,
    totalTimeCommitted: 0,
    maxCommitments: 3,
    maxTimeAllowed: 90,
    canCommitMore: true,
    committedTaskIds: new Set(),
    globalCommittedTaskIds: new Set()
  })
  const [loading, setLoading] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [showCommitmentModal, setShowCommitmentModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ExtendedTaskTemplate | null>(null)
  const [lastReward, setLastReward] = useState<{
    money: number
    xp: number
    merets: number
  } | null>(null)

  useEffect(() => {
    loadAvailableTasks()
    loadCommitmentState()
  }, [userProfile.id])

  const loadAvailableTasks = async () => {
    try {
      // Get prioritized tasks (mix of micro and standard tasks)
      const prioritizedTasks = await ParentAdminService.getPrioritizedTasks(undefined, undefined, 20)
      
      // Convert to extended format and add availability information
      const tasks = prioritizedTasks.map(pt => {
        const availability = checkTaskAvailability({
          id: pt.task_id,
          title: pt.title,
          description: pt.description || '',
          skill_category: pt.skill_category,
          effort_minutes: pt.effective_effort_minutes || pt.base_effort_minutes,
          base_pay_cents: pt.effective_pay_cents || pt.base_pay_cents,
          difficulty_level: pt.difficulty_level,
          is_micro_task: pt.is_micro_task,
          next_available_at: pt.next_available_at,
          created_at: ''
        })
        
        return {
          id: pt.task_id,
          title: pt.title,
          description: pt.description || '',
          skill_category: pt.skill_category,
          effort_minutes: pt.effective_effort_minutes || pt.base_effort_minutes,
          base_pay_cents: pt.effective_pay_cents || pt.base_pay_cents,
          difficulty_level: pt.difficulty_level,
          is_micro_task: pt.is_micro_task,
          next_available_at: pt.next_available_at,
          created_at: '',
          priority_type: pt.priority_type,
          is_urgent: pt.is_urgent,
          effective_pay_cents: pt.effective_pay_cents || pt.base_pay_cents,
          effective_effort_minutes: pt.effective_effort_minutes || pt.base_effort_minutes,
          is_available: availability.is_available,
          hours_until_available: availability.hours_until_available
        } as ExtendedTaskTemplate
      })

      // Shuffle tasks for freshness, but keep urgent ones at top
      const urgentTasks = tasks.filter(t => t.is_urgent)
      const normalTasks = tasks.filter(t => !t.is_urgent)
      const shuffledNormal = normalTasks.sort(() => Math.random() - 0.5)
      
      setAvailableTasks([...urgentTasks, ...shuffledNormal])
    } catch (error) {
      console.error('Error loading tasks:', error)
      Alert.alert('Error', 'Failed to load available tasks')
    }
  }

  const loadCommitmentState = async () => {
    try {
      // Resolve user ID if needed
      const resolvedUserId = await mapUserId(userProfile.id)
      
      // Get current pending and approved commitments for THIS user (both are "active" commitments)
      const pendingCommitments = await SupabaseService.getUserCommitments(resolvedUserId, 'pending_approval')
      const approvedCommitments = await SupabaseService.getUserCommitments(resolvedUserId, 'accepted')
      
      const userActiveCommitments = [...pendingCommitments, ...approvedCommitments]
      const totalTime = userActiveCommitments.reduce((sum, c) => sum + c.effort_minutes, 0)
      
      // Track which specific task template IDs THIS user is committed to
      const committedTaskIds = new Set(
        userActiveCommitments
          .filter(c => c.task_template_id) // Only include commitments with task_template_id
          .map(c => c.task_template_id!)
      )
      
      // Get ALL active commitments from ALL users to check task availability globally
      const allGlobalCommitments = await SupabaseService.getAllActiveCommitments()
      console.log('🌍 ALL GLOBAL COMMITMENTS:', allGlobalCommitments.map(c => ({ 
        id: c.id, 
        user_id: c.user_id, 
        task_template_id: c.task_template_id, 
        title: c.custom_title, 
        status: c.status 
      })))
      
      const globalCommittedTaskIds = new Set(
        allGlobalCommitments
          .filter(c => c.task_template_id) // Only include commitments with task_template_id
          .map(c => c.task_template_id!)
      )
      
      console.log(`User Commitment State: ${userActiveCommitments.length} active commitments, ${totalTime} minutes total`)
      console.log('User committed task IDs:', Array.from(committedTaskIds))
      console.log('🔍 Globally committed task IDs:', Array.from(globalCommittedTaskIds))
      console.log('🔍 Current user ID:', resolvedUserId)
      
      setCommitmentState({
        totalCommitments: userActiveCommitments.length,
        totalTimeCommitted: totalTime,
        maxCommitments: 3,
        maxTimeAllowed: 90,
        canCommitMore: userActiveCommitments.length < 3 && totalTime < 90,
        committedTaskIds,
        globalCommittedTaskIds
      })
    } catch (error) {
      console.error('Error loading commitment state:', error)
    }
  }

  const getTaskTypeColor = (task: ExtendedTaskTemplate): string => {
    // Color based on skill category
    const skillColors = {
      'Cleaning': '#4CAF50',    // Green
      'Dishes': '#2196F3',      // Blue  
      'Laundry': '#9C27B0',     // Purple
      'Cooking': '#FF9800',     // Orange
      'Yard': '#8BC34A',        // Light Green
      'Tools': '#795548',       // Brown
      'General': '#607D8B'      // Blue Grey
    }
    return skillColors[task.skill_category as keyof typeof skillColors] || '#607D8B'
  }

  const getUrgencyStyle = (task: ExtendedTaskTemplate) => {
    if (task.is_urgent) {
      return {
        borderWidth: 3,
        borderColor: '#F44336',
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8
      }
    }
    return {
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }
  }

  const checkTaskAvailability = (task: TaskTemplate): { is_available: boolean, hours_until_available?: number } => {
    if (!task.next_available_at) {
      return { is_available: true }
    }
    
    const now = new Date()
    const availableTime = new Date(task.next_available_at)
    
    if (availableTime <= now) {
      return { is_available: true }
    }
    
    const hoursUntilAvailable = Math.ceil((availableTime.getTime() - now.getTime()) / (1000 * 60 * 60))
    return { is_available: false, hours_until_available: hoursUntilAvailable }
  }

  const handleInstantComplete = async (task: ExtendedTaskTemplate) => {
    if (!task.is_micro_task) return
    
    setLoading(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

    try {
      // Resolve user ID if needed
      const resolvedUserId = await mapUserId(userProfile.id)
      
      // Create and immediately complete commitment
      await SupabaseService.createCommitment({
        user_id: resolvedUserId,
        task_template_id: task.id,
        custom_title: task.title,
        custom_description: task.description || '',
        skill_category: task.skill_category,
        effort_minutes: task.effort_minutes,
        pay_cents: task.base_pay_cents,
        status: 'completed'
      })

      // Update XP and earnings
      const xp = Math.round(15 * (task.difficulty_level * 0.5 + 0.5))
      await SupabaseService.updateUserXP(resolvedUserId, xp, task.base_pay_cents)

      // Show instant reward
      setLastReward({
        money: task.base_pay_cents,
        xp,
        merets: Math.random() > 0.2 ? 1 : 0
      })
      setShowReward(true)

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onTaskCompleted?.()
      
      // Refresh tasks and commitment state
      loadAvailableTasks()
      loadCommitmentState()

    } catch (error) {
      console.error('Error completing task:', error)
      Alert.alert('Error', 'Failed to complete task')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommitToTask = (task: ExtendedTaskTemplate) => {
    if (!commitmentState.canCommitMore) {
      Alert.alert(
        "Commitment Limit Reached", 
        "You have too many active commitments or time committed. Complete some tasks first!"
      )
      return
    }

    if (commitmentState.totalTimeCommitted + task.effort_minutes > commitmentState.maxTimeAllowed) {
      Alert.alert(
        "Time Limit Exceeded", 
        `Adding this task would exceed your 90-minute limit. You have ${90 - commitmentState.totalTimeCommitted} minutes remaining.`
      )
      return
    }

    setSelectedTask(task)
    setShowCommitmentModal(true)
  }

  const confirmCommitment = async () => {
    if (!selectedTask) return

    try {
      setLoading(true)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // Resolve user ID if needed
      const resolvedUserId = await mapUserId(userProfile.id)
      
      await SupabaseService.createCommitment({
        user_id: resolvedUserId,
        task_template_id: selectedTask.id,
        custom_title: selectedTask.title,
        custom_description: selectedTask.description || '',
        skill_category: selectedTask.skill_category,
        effort_minutes: selectedTask.effort_minutes,
        pay_cents: selectedTask.base_pay_cents,
        status: 'pending_approval'
      })

      setShowCommitmentModal(false)
      setSelectedTask(null)
      onTaskCommitted?.()
      
      // Refresh state
      loadCommitmentState()
      
      Alert.alert(
        "Commitment Made! 🎯", 
        `Your commitment to "${selectedTask.title}" has been sent to your parents for approval.`
      )

    } catch (error) {
      console.error('Error creating commitment:', error)
      Alert.alert('Error', 'Failed to create commitment')
    } finally {
      setLoading(false)
    }
  }

  const renderTaskTile = (task: ExtendedTaskTemplate) => {
    const taskColor = getTaskTypeColor(task)
    const urgencyStyle = getUrgencyStyle(task)
    const isCommittedByUser = commitmentState.committedTaskIds.has(task.id)
    const isCommittedByAnyone = commitmentState.globalCommittedTaskIds.has(task.id)
    const isUnavailable = isCommittedByAnyone || !task.is_available
    
    // Debug logging for first few tasks
    if (Math.random() < 0.1) { // Only log ~10% of tasks to avoid spam
      console.log(`📝 Task "${task.title}" (ID: ${task.id}):`)
      console.log(`  - isCommittedByUser: ${isCommittedByUser}`)
      console.log(`  - isCommittedByAnyone: ${isCommittedByAnyone}`)
      console.log(`  - isUnavailable: ${isUnavailable}`)
      console.log(`  - globalCommittedTaskIds size: ${commitmentState.globalCommittedTaskIds.size}`)
    }
    
    return (
      <TouchableOpacity
        key={task.id}
        onPress={() => {
          if (!task.is_available && !isCommittedByAnyone) {
            Alert.alert(
              "Task Not Available Yet", 
              `This task will be available again in ${task.hours_until_available} hour${task.hours_until_available !== 1 ? 's' : ''}.`
            )
            return
          }
          
          if (isCommittedByAnyone) {
            if (isCommittedByUser) {
              Alert.alert(
                "Already Committed", 
                "You have already committed to this task. Check your commitments in the dashboard."
              )
            } else {
              // Fetch availability info for enhanced alert
              (async () => {
                try {
                  const availInfo = await SupabaseService.getTaskAvailabilityInfo(task.id)
                  
                  let message = "Someone else has already committed to this task."
                  
                  // Add frequency info if available
                  if (availInfo.averagePostingFrequencyDays !== null) {
                    if (availInfo.averagePostingFrequencyDays < 1) {
                      message += ` This task is typically posted multiple times per day.`
                    } else if (availInfo.averagePostingFrequencyDays === 1) {
                      message += ` This task is usually posted about once per day.`
                    } else if (availInfo.averagePostingFrequencyDays < 7) {
                      message += ` This task is usually posted every ${Math.round(availInfo.averagePostingFrequencyDays)} days.`
                    } else {
                      message += ` This task is posted every ${Math.round(availInfo.averagePostingFrequencyDays)} days.`
                    }
                  } else if (availInfo.totalCompletions === 1) {
                    message += ` This task has been completed once before.`
                  } else if (availInfo.totalCompletions === 0) {
                    message += ` This is a new task!`
                  }
                  
                  // Add next available time if scheduled
                  if (availInfo.nextAvailableAt) {
                    const nextDate = new Date(availInfo.nextAvailableAt)
                    const now = new Date()
                    const hoursUntil = Math.round((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60))
                    
                    if (hoursUntil < 1) {
                      message += ` It will be available again soon.`
                    } else if (hoursUntil < 24) {
                      message += ` It will be available again in about ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}.`
                    } else {
                      const daysUntil = Math.round(hoursUntil / 24)
                      message += ` It will be available again in about ${daysUntil} day${daysUntil > 1 ? 's' : ''}.`
                    }
                  } else {
                    message += ` It will be available again once completed.`
                  }
                  
                  Alert.alert("Task Unavailable", message)
                } catch (error) {
                  console.error('Error fetching availability info:', error)
                  Alert.alert(
                    "Task Unavailable", 
                    "Someone else has already committed to this task. It will be available again once they complete it."
                  )
                }
              })()
            }
            return
          }
          handleCommitToTask(task)
        }}
        disabled={loading}
        style={[
          {
            width: tileWidth,
            backgroundColor: isUnavailable ? '#F5F5F5' : 'white',
            borderRadius: 20,
            padding: 16,
            margin: 8,
            opacity: loading ? 0.7 : (isUnavailable ? 0.6 : 1),
          },
          isUnavailable ? {
            borderWidth: 2,
            borderColor: '#BDBDBD',
            borderStyle: 'dashed' as any
          } : urgencyStyle
        ]}
      >
        {/* Urgent Badge */}
        {task.is_urgent && (
          <View style={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: '#F44336',
            borderRadius: 12,
            padding: 4,
            zIndex: 10
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>🚨</Text>
          </View>
        )}

        {/* Task Type Header */}
        <View style={{
          backgroundColor: `${taskColor}15`,
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignSelf: 'flex-start',
          marginBottom: 8,
          borderLeftWidth: 4,
          borderLeftColor: taskColor
        }}>
          <Text style={{ 
            color: taskColor, 
            fontSize: 12, 
            fontWeight: 'bold' 
          }}>
            {task.skill_category}
          </Text>
        </View>

        {/* Money Display - Prominent */}
        <View style={{
          backgroundColor: isUnavailable ? '#F0F0F0' : '#E8F5E8',
          borderRadius: 16,
          padding: 8,
          marginBottom: 12,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: isUnavailable ? '#BDBDBD' : '#4CAF50'
        }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: isUnavailable ? '#757575' : '#2E7D32' 
          }}>
            ${(task.base_pay_cents / 100).toFixed(2)}
          </Text>
        </View>

        {/* Task Title */}
        <Text style={{ 
          fontSize: 14, 
          fontWeight: 'bold', 
          color: '#333',
          marginBottom: 6,
          lineHeight: 18,
          minHeight: 36 // Consistent height
        }}>
          {task.title}
        </Text>

        {/* Time & Type */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <Chip 
            icon="clock-outline" 
            style={{ backgroundColor: `${taskColor}20` }}
            textStyle={{ fontSize: 10, color: taskColor }}
          >
            {task.effort_minutes}min
          </Chip>
          
          {task.is_micro_task && (
            <Chip 
              icon="flash" 
              style={{ backgroundColor: '#FFE082' }}
              textStyle={{ fontSize: 10, color: '#F57F17' }}
            >
              QUICK
            </Chip>
          )}
          
          {!task.is_available && !isCommittedByAnyone && (
            <Chip 
              icon="clock-outline" 
              style={{ backgroundColor: '#FFE0B2' }}
              textStyle={{ fontSize: 10, color: '#EF6C00' }}
            >
              {task.hours_until_available}H LEFT
            </Chip>
          )}
          
          {isCommittedByAnyone && (
            <Chip 
              icon={isCommittedByUser ? "check-circle" : "account-clock"} 
              style={{ backgroundColor: '#E0E0E0' }}
              textStyle={{ fontSize: 10, color: '#757575' }}
            >
              {isCommittedByUser ? 'YOUR TASK' : 'TAKEN'}
            </Chip>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={{
            backgroundColor: isUnavailable 
              ? '#9E9E9E' 
              : taskColor,
            borderRadius: 16,
            paddingVertical: 8,
            alignItems: 'center'
          }}
          onPress={() => {
            if (!task.is_available && !isCommittedByAnyone) {
              Alert.alert(
                "Task Not Available Yet", 
                `This task will be available again in ${task.hours_until_available} hour${task.hours_until_available !== 1 ? 's' : ''}.`
              )
              return
            }
            
            if (isCommittedByAnyone) {
              if (isCommittedByUser) {
                Alert.alert(
                  "Already Committed", 
                  "You have already committed to this task. Check your commitments in the dashboard."
                )
              } else {
                Alert.alert(
                  "Task Unavailable", 
                  "Someone else has already committed to this task. It will be available again once they complete it."
                )
              }
              return
            }
            handleCommitToTask(task)
          }}
          disabled={loading}
        >
          <Text style={{ 
            color: 'white', 
            fontSize: 12, 
            fontWeight: 'bold' 
          }}>
            {!task.is_available && !isCommittedByAnyone
              ? `⏰ ${task.hours_until_available}H LEFT`
              : isCommittedByAnyone
                ? (isCommittedByUser ? '📋 Your Task' : '🚫 Taken') 
                : '🎯 Commit to This'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Meret Earning Info */}
      <View style={{
        margin: 16,
        marginBottom: 8,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3'
      }}>
        <Text style={{ 
          fontSize: 14, 
          color: '#1565C0',
          lineHeight: 20,
          textAlign: 'center'
        }}>
          💡 Complete 60min of Commitments within the agreed upon timeframes to earn a Meret
        </Text>
      </View>

      {/* Commitment Status Header */}
      <Card style={{ margin: 16, marginTop: 8, backgroundColor: 'white', elevation: 4 }}>
        <Card.Content style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
            🎮 Quick Grab Tasks
          </Text>
          
          {/* Commitment Limits Display */}
          <View style={{ 
            backgroundColor: commitmentState.canCommitMore ? '#E8F5E8' : '#FFEBEE',
            borderRadius: 12,
            padding: 12
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>
                Active Commitments: {commitmentState.totalCommitments}/{commitmentState.maxCommitments}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>
                Time: {commitmentState.totalTimeCommitted}/{commitmentState.maxTimeAllowed}min
              </Text>
            </View>
            
            <ProgressBar 
              progress={commitmentState.totalCommitments / commitmentState.maxCommitments} 
              color={commitmentState.canCommitMore ? '#4CAF50' : '#F44336'}
              style={{ height: 6, borderRadius: 3, marginBottom: 4 }}
            />
            <ProgressBar 
              progress={commitmentState.totalTimeCommitted / commitmentState.maxTimeAllowed} 
              color={commitmentState.canCommitMore ? '#2196F3' : '#F44336'}
              style={{ height: 6, borderRadius: 3 }}
            />
            
            {!commitmentState.canCommitMore && (
              <Text style={{ 
                fontSize: 12, 
                color: '#F44336', 
                textAlign: 'center',
                marginTop: 6,
                fontWeight: '600'
              }}>
                ⚠️ Commitment limit reached! Complete some tasks first.
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Task Grid */}
      <ScrollView 
        contentContainerStyle={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          paddingBottom: 20
        }}
        showsVerticalScrollIndicator={true}
      >
        {availableTasks.slice(0, 6).map(renderTaskTile)}
      </ScrollView>

      {/* Commitment Confirmation Modal */}
      <Portal>
        <Modal
          visible={showCommitmentModal}
          onDismiss={() => setShowCommitmentModal(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            margin: 20,
            borderRadius: 20,
            padding: 20
          }}
        >
          {selectedTask && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                🎯 Commit to Task?
              </Text>
              
              <View style={{ 
                backgroundColor: '#F5F5F5', 
                borderRadius: 12, 
                padding: 16,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                  {selectedTask.title}
                </Text>
                <Text style={{ fontSize: 16, color: '#666', marginBottom: 12 }}>
                  {selectedTask.description}
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 20 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#888' }}>Time</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                      {selectedTask.effort_minutes}min
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#888' }}>Reward</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2E7D32' }}>
                      ${(selectedTask.base_pay_cents / 100).toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#888' }}>Skill</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {selectedTask.skill_category}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Warning Message */}
              <View style={{
                backgroundColor: '#FFF3CD',
                borderRadius: 8,
                padding: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#FF9800'
              }}>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#B8860B', 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 4
                }}>
                  ⚠️ NO GOING BACK ONCE YOU COMMIT!
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#8B7500',
                  textAlign: 'center'
                }}>
                  Only commit if you're ready to complete this task within the time limit
                </Text>
              </View>

              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                This will be sent to your parents for approval. You'll get paid when you complete it!
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#E0E0E0',
                    borderRadius: 16,
                    paddingVertical: 12,
                    alignItems: 'center'
                  }}
                  onPress={() => setShowCommitmentModal(false)}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#666' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#4CAF50',
                    borderRadius: 16,
                    paddingVertical: 12,
                    alignItems: 'center'
                  }}
                  onPress={confirmCommitment}
                  disabled={loading}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                    {loading ? 'Committing...' : 'Yes, Commit!'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Reward Animation */}
      {showReward && lastReward && (
        <SimpleRewardAnimation
          money={lastReward.money}
          xp={lastReward.xp}
          merets={lastReward.merets}
          onComplete={() => setShowReward(false)}
        />
      )}
    </View>
  )
}