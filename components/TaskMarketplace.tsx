import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native'
import { Card, Button, Chip, IconButton, TextInput, Divider } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { SupabaseService } from '../lib/supabase-service'
import { UserProfile } from '../lib/supabase'
import { mapUserId } from '../lib/user-id-mapping'
import { MentContract } from './MentContract'

interface MarketplaceTask {
  id: string
  title: string
  description: string
  skill_category: string
  effort_minutes: number
  base_pay_cents: number
  effective_pay_cents: number
  effective_effort_minutes: number
  difficulty_level: number
  is_micro_task: boolean
  due_date?: string
  days_until_due?: number
  priority_type?: string
  is_urgent: boolean
  urgency_score: number
  parent_notes?: string
  availability_status: string
  max_assignments?: number
  current_assignments: number
}

interface Props {
  userProfile: UserProfile
  color: string
  onTaskClaimed?: () => void
}

type SortOption = 'effective_pay_cents' | 'effective_effort_minutes' | 'days_until_due' | 'urgency_score'
type SortOrder = 'ASC' | 'DESC'

export const TaskMarketplace: React.FC<Props> = ({ userProfile, color, onTaskClaimed }) => {
  const [tasks, setTasks] = useState<MarketplaceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedTask, setExpandedTask] = useState<MarketplaceTask | null>(null)
  const [contractTask, setContractTask] = useState<MarketplaceTask | null>(null)
  const [kidNotes, setKidNotes] = useState('')

  // Filter states
  const [minPay, setMinPay] = useState('')
  const [maxPay, setMaxPay] = useState('')
  const [minTime, setMinTime] = useState('')
  const [maxTime, setMaxTime] = useState('')
  const [skillFilter, setSkillFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('days_until_due')
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC')

  useEffect(() => {
    loadTasks()
  }, [sortBy, sortOrder, minPay, maxPay, minTime, maxTime, skillFilter])

  const loadTasks = async () => {
    try {
      setLoading(true)
      
      // Resolve user ID if needed
      const resolvedUserId = await mapUserId(userProfile.id)
      
      // Convert filter values
      const minPayCents = minPay ? parseInt(minPay) * 100 : 0
      const maxPayCents = maxPay ? parseInt(maxPay) * 100 : null
      const minEffortMin = minTime ? parseInt(minTime) : 0
      const maxEffortMin = maxTime ? parseInt(maxTime) : null

      // Call marketplace function (we'll need to add this to SupabaseService)
      const tasksData = await getMarketplaceTasks({
        user_id: resolvedUserId,
        min_pay_cents: minPayCents,
        max_pay_cents: maxPayCents,
        min_effort_minutes: minEffortMin,
        max_effort_minutes: maxEffortMin,
        skill_category: skillFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 50
      })

      setTasks(tasksData)
    } catch (error) {
      console.error('Error loading marketplace tasks:', error)
      Alert.alert('Error', 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const getMarketplaceTasks = async (params: any): Promise<MarketplaceTask[]> => {
    return await SupabaseService.getMarketplaceTasks(params)
  }

  const handleTaskClaim = (task: MarketplaceTask) => {
    setContractTask(task)
    setExpandedTask(null)
  }

  const claimTask = async () => {
    if (!contractTask) return
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      
      // Resolve user ID if needed
      const resolvedUserId = await mapUserId(userProfile.id)
      
      // Call claim function
      const commitmentId = await claimMarketplaceTask(resolvedUserId, contractTask.id, kidNotes)
      
      setContractTask(null)
      setKidNotes('')
      
      Alert.alert(
        'Ment Accepted! 🎯',
        `You've accepted "${contractTask.title}" for ${formatMoney(contractTask.effective_pay_cents)}!`,
        [{ text: 'Let\'s go!', onPress: () => onTaskClaimed?.() }]
      )
      
      loadTasks() // Refresh list
    } catch (error) {
      console.error('Error claiming task:', error)
      Alert.alert('Error', 'Failed to accept ment. It may no longer be available.')
    }
  }

  const claimMarketplaceTask = async (userId: string, taskId: string, notes?: string): Promise<string> => {
    return await SupabaseService.claimMarketplaceTask(userId, taskId, notes)
  }

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`
  
  const formatTimeRemaining = (days?: number) => {
    if (!days && days !== 0) return null
    if (days === 0) return 'Due today'
    if (days === 1) return '1 day left'
    if (days < 7) return `${days} days left`
    if (days < 14) return `${Math.ceil(days / 7)} week left`
    return `${Math.ceil(days / 7)} weeks left`
  }

  const getSkillColor = (skill: string) => {
    const colors: Record<string, string> = {
      'Cleaning': '#4CAF50',
      'Dishes': '#2196F3', 
      'Laundry': '#9C27B0',
      'Cooking': '#FF9800',
      'Yard': '#8BC34A',
      'Tools': '#795548'
    }
    return colors[skill] || '#607D8B'
  }

  const getUrgencyStyle = (task: MarketplaceTask) => {
    if (task.is_urgent) {
      return {
        borderLeftWidth: 4,
        borderLeftColor: '#F44336',
        backgroundColor: '#FFEBEE'
      }
    }
    return {}
  }

  const renderSortButton = (option: SortOption, label: string, icon: string) => (
    <TouchableOpacity
      onPress={() => {
        if (sortBy === option) {
          setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')
        } else {
          setSortBy(option)
          setSortOrder(option === 'days_until_due' ? 'ASC' : 'DESC')
        }
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: sortBy === option ? `${color}20` : '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: sortBy === option ? 2 : 0,
        borderColor: sortBy === option ? color : 'transparent'
      }}
    >
      <Text style={{ 
        color: sortBy === option ? color : '#666',
        fontWeight: sortBy === option ? 'bold' : 'normal',
        fontSize: 12,
        marginRight: 4
      }}>
        {label}
      </Text>
      <Text style={{ color: sortBy === option ? color : '#666' }}>
        {sortBy === option ? (sortOrder === 'DESC' ? '↓' : '↑') : '⇅'}
      </Text>
    </TouchableOpacity>
  )

  const renderTaskCard = (task: MarketplaceTask) => (
    <TouchableOpacity
      key={task.id}
      onPress={() => {
        setExpandedTask(expandedTask?.id === task.id ? null : task)
      }}
      style={[
        {
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 16,
          marginVertical: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        },
        getUrgencyStyle(task)
      ]}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 4
          }}>
            {task.title}
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
            lineHeight: 18
          }}>
            {task.description}
          </Text>
        </View>

        <View style={{
          backgroundColor: '#E8F5E8',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginLeft: 12,
          borderWidth: 2,
          borderColor: '#4CAF50'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#2E7D32'
          }}>
            {formatMoney(task.effective_pay_cents)}
          </Text>
        </View>
      </View>

      {/* Tags */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8
      }}>
        <Chip
          style={{ backgroundColor: `${getSkillColor(task.skill_category)}20` }}
          textStyle={{ color: getSkillColor(task.skill_category), fontSize: 12 }}
        >
          {task.skill_category}
        </Chip>

        <Chip
          icon="clock-outline"
          style={{ backgroundColor: '#E3F2FD' }}
          textStyle={{ color: '#1976D2', fontSize: 12 }}
        >
          {task.effective_effort_minutes}min
        </Chip>

        {task.is_micro_task && (
          <Chip
            icon="flash"
            style={{ backgroundColor: '#FFE082' }}
            textStyle={{ color: '#F57F17', fontSize: 12 }}
          >
            Quick
          </Chip>
        )}

        {task.is_urgent && (
          <Chip
            style={{ backgroundColor: '#FFCDD2' }}
            textStyle={{ color: '#D32F2F', fontSize: 12 }}
          >
            🚨 Urgent
          </Chip>
        )}
      </View>

      {/* Bottom row */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {task.days_until_due !== null && task.days_until_due !== undefined ? (
          <Text style={{
            fontSize: 12,
            color: task.days_until_due <= 1 ? '#F44336' : '#FF9800',
            fontWeight: 'bold'
          }}>
            ⏰ {formatTimeRemaining(task.days_until_due)}
          </Text>
        ) : (
          <Text style={{ fontSize: 12, color: '#999' }}>No deadline</Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {task.max_assignments && (
            <Text style={{ fontSize: 12, color: '#666' }}>
              {task.current_assignments}/{task.max_assignments} claimed
            </Text>
          )}
          <Button mode="contained" onPress={() => handleTaskClaim(task)}>
            Review ...ment
          </Button>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333'
        }}>
          🛒 Available Commitments
        </Text>
        <IconButton
          icon={showFilters ? 'filter-off' : 'filter'}
          onPress={() => setShowFilters(!showFilters)}
          iconColor={color}
          style={{ backgroundColor: `${color}20` }}
        />
      </View>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
      >
        {renderSortButton('effective_pay_cents', 'Price', 'currency-usd')}
        {renderSortButton('effective_effort_minutes', 'Time', 'clock')}
        {renderSortButton('days_until_due', 'Due Date', 'calendar')}
        {renderSortButton('urgency_score', 'Priority', 'flag')}
      </ScrollView>

      {/* Ment Contract Modal */}
      <MentContract
        visible={!!contractTask}
        task={contractTask}
        userProfile={userProfile}
        userColor={color}
        onDecline={() => setContractTask(null)}
        onAccept={claimTask}
      />

      {/* Filters */}
      {showFilters && (
        <Card style={{ margin: 16, backgroundColor: 'white' }}>
          <Card.Content>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
              Filters
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Min $</Text>
                <TextInput
                  value={minPay}
                  onChangeText={setMinPay}
                  placeholder="0"
                  keyboardType="numeric"
                  dense
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Max $</Text>
                <TextInput
                  value={maxPay}
                  onChangeText={setMaxPay}
                  placeholder="Any"
                  keyboardType="numeric"
                  dense
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Min Time</Text>
                <TextInput
                  value={minTime}
                  onChangeText={setMinTime}
                  placeholder="0"
                  keyboardType="numeric"
                  dense
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Max Time</Text>
                <TextInput
                  value={maxTime}
                  onChangeText={setMaxTime}
                  placeholder="Any"
                  keyboardType="numeric"
                  dense
                />
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['All', 'Cleaning', 'Dishes', 'Laundry', 'Cooking', 'Yard', 'Tools'].map(skill => (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => setSkillFilter(skill === 'All' ? null : skill)}
                    style={{
                      backgroundColor: skillFilter === skill || (skill === 'All' && !skillFilter) 
                        ? `${color}20` : '#F5F5F5',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderWidth: skillFilter === skill || (skill === 'All' && !skillFilter) ? 2 : 0,
                      borderColor: color
                    }}
                  >
                    <Text style={{
                      color: skillFilter === skill || (skill === 'All' && !skillFilter) ? color : '#666',
                      fontWeight: skillFilter === skill || (skill === 'All' && !skillFilter) ? 'bold' : 'normal'
                    }}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {/* Task List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 16, color: '#666' }}>Loading tasks...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
              🔍 No tasks match your filters
            </Text>
            <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 }}>
              Try adjusting your filters or check back later!
            </Text>
          </View>
        ) : (
          tasks.map(renderTaskCard)
        )}
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal
        visible={!!expandedTask}
        onDismiss={() => setExpandedTask(null)}
        contentContainerStyle={{
          backgroundColor: 'white',
          margin: 20,
          borderRadius: 20,
          padding: 20,
          maxHeight: '80%'
        }}
      >
        {expandedTask && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 8 }}>
              {expandedTask.title}
            </Text>

            <Text style={{ fontSize: 16, color: '#666', marginBottom: 20, lineHeight: 24 }}>
              {expandedTask.description}
            </Text>

            {expandedTask.parent_notes && (
              <View style={{
                backgroundColor: '#FFF8E1',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                  📝 Parent Notes:
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  {expandedTask.parent_notes}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#999' }}>Reward</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2E7D32' }}>
                  {formatMoney(expandedTask.effective_pay_cents)}
                </Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#999' }}>Time</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: color }}>
                  {expandedTask.effective_effort_minutes}min
                </Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#999' }}>Due</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF9800' }}>
                  {formatTimeRemaining(expandedTask.days_until_due) || 'No deadline'}
                </Text>
              </View>
            </View>

            <TextInput
              label="Add a note (optional)"
              value={kidNotes}
              onChangeText={setKidNotes}
              multiline
              numberOfLines={3}
              style={{ marginBottom: 16 }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                mode="outlined"
                onPress={() => setExpandedTask(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => claimTask(expandedTask)}
                style={{ flex: 1, backgroundColor: color }}
              >
                Claim Task! 🎯
              </Button>
            </View>
          </ScrollView>
        )}
      </Modal>
    </View>
  )
}