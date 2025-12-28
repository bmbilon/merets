import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { Card, Button, TextInput, Chip, Portal, Modal } from 'react-native-paper'
import { ParentAdminService } from '../lib/supabase-parent-service'
import { SupabaseService } from '../lib/supabase-service'
import { TaskTemplate } from '../lib/supabase'

interface TaskAvailabilityManagerProps {
  parentId: string
}

interface TaskWithAvailability extends TaskTemplate {
  hours_until_available?: number
  is_available: boolean
}

export const TaskAvailabilityManager: React.FC<TaskAvailabilityManagerProps> = ({ parentId }) => {
  const [tasks, setTasks] = useState<TaskWithAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null)
  const [hoursDelay, setHoursDelay] = useState('24')

  useEffect(() => {
    loadTasksWithAvailability()
  }, [])

  const loadTasksWithAvailability = async () => {
    try {
      setLoading(true)
      const allTasks = await SupabaseService.getTaskTemplates()
      
      const tasksWithAvailability = allTasks.map(task => {
        const now = new Date()
        let is_available = true
        let hours_until_available: number | undefined
        
        if (task.next_available_at) {
          const availableTime = new Date(task.next_available_at)
          if (availableTime > now) {
            is_available = false
            hours_until_available = Math.ceil((availableTime.getTime() - now.getTime()) / (1000 * 60 * 60))
          }
        }
        
        return {
          ...task,
          is_available,
          hours_until_available
        }
      })
      
      setTasks(tasksWithAvailability)
    } catch (error) {
      console.error('Error loading tasks:', error)
      Alert.alert('Error', 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleTask = (task: TaskTemplate) => {
    setSelectedTask(task)
    setShowScheduleModal(true)
  }

  const confirmSchedule = async () => {
    if (!selectedTask) return
    
    const hours = parseInt(hoursDelay)
    if (isNaN(hours) || hours < 0) {
      Alert.alert('Error', 'Please enter a valid number of hours')
      return
    }

    try {
      setLoading(true)
      await ParentAdminService.scheduleTaskAfterCompletion(selectedTask.id, hours, parentId)
      
      setShowScheduleModal(false)
      setSelectedTask(null)
      setHoursDelay('24')
      
      Alert.alert(
        'Task Scheduled',
        `"${selectedTask.title}" will be unavailable for ${hours} hours after completion.`
      )
      
      loadTasksWithAvailability()
    } catch (error) {
      console.error('Error scheduling task:', error)
      Alert.alert('Error', 'Failed to schedule task')
    } finally {
      setLoading(false)
    }
  }

  const handleClearRestriction = async (task: TaskTemplate) => {
    try {
      setLoading(true)
      await ParentAdminService.clearTaskAvailabilityRestriction(task.id, parentId)
      
      Alert.alert('Restriction Cleared', `"${task.title}" is now immediately available after completion.`)
      loadTasksWithAvailability()
    } catch (error) {
      console.error('Error clearing restriction:', error)
      Alert.alert('Error', 'Failed to clear restriction')
    } finally {
      setLoading(false)
    }
  }

  const renderTaskCard = (task: TaskWithAvailability) => (
    <Card key={task.id} style={{ margin: 8, elevation: 2 }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1 }}>
            {task.title}
          </Text>
          <Chip 
            icon={task.is_available ? "check-circle" : "clock-outline"}
            style={{ backgroundColor: task.is_available ? '#E8F5E8' : '#FFE0B2' }}
            textStyle={{ color: task.is_available ? '#2E7D32' : '#EF6C00' }}
          >
            {task.is_available ? 'Available' : `${task.hours_until_available}H LEFT`}
          </Chip>
        </View>
        
        <Text style={{ color: '#666', marginBottom: 8 }}>
          {task.skill_category} • {task.effort_minutes} min • ${(task.base_pay_cents / 100).toFixed(2)}
        </Text>
        
        {task.next_available_at && (
          <Text style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
            Next available: {new Date(task.next_available_at).toLocaleString()}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button 
            mode="outlined" 
            onPress={() => handleScheduleTask(task)}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Schedule
          </Button>
          {task.next_available_at && (
            <Button 
              mode="text" 
              onPress={() => handleClearRestriction(task)}
              disabled={loading}
            >
              Clear
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={{ flex: 1 }}>
      <Card style={{ margin: 16, elevation: 4 }}>
        <Card.Content>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
            🕐 Task Availability Scheduling
          </Text>
          <Text style={{ color: '#666', marginBottom: 16 }}>
            Control when tasks become available again after completion. Create competitive timing and prevent task hogging.
          </Text>
          <Button 
            mode="contained" 
            onPress={loadTasksWithAvailability}
            loading={loading}
            icon="refresh"
          >
            Refresh Tasks
          </Button>
        </Card.Content>
      </Card>

      <ScrollView style={{ flex: 1 }}>
        {tasks.map(renderTaskCard)}
      </ScrollView>

      {/* Schedule Modal */}
      <Portal>
        <Modal
          visible={showScheduleModal}
          onDismiss={() => setShowScheduleModal(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            margin: 20,
            borderRadius: 20,
            padding: 20
          }}
        >
          {selectedTask && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
                Schedule Task Availability
              </Text>
              
              <View style={{ 
                backgroundColor: '#F5F5F5', 
                borderRadius: 12, 
                padding: 16,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                  {selectedTask.title}
                </Text>
                <Text style={{ color: '#666' }}>
                  {selectedTask.skill_category} • ${(selectedTask.base_pay_cents / 100).toFixed(2)}
                </Text>
              </View>
              
              <View>
                <Text style={{ marginBottom: 8, fontWeight: '600' }}>
                  Hours until available again:
                </Text>
                <TextInput
                  value={hoursDelay}
                  onChangeText={setHoursDelay}
                  keyboardType="numeric"
                  placeholder="24"
                  style={{ marginBottom: 8 }}
                />
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Task will be unavailable for this many hours after completion
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowScheduleModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={confirmSchedule}
                  loading={loading}
                  style={{ flex: 1 }}
                >
                  Schedule
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  )
}