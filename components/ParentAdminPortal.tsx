import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert, TextInput, TouchableOpacity, Switch } from 'react-native'
import { Card, Button, Chip, ProgressBar, IconButton } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'
import { ParentAdminService, TaskPriority, PrioritizedTask } from '../lib/supabase-parent-service'
import { SupabaseService, TaskTemplate, UserProfile } from '../lib/supabase-service'

interface Props {
  parentProfile: UserProfile
  onClose?: () => void
}

export const ParentAdminPortal: React.FC<Props> = ({ parentProfile, onClose }) => {
  const [activeTab, setActiveTab] = useState<'priorities' | 'pricing' | 'analytics'>('priorities')
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [priorities, setPriorities] = useState<TaskPriority[]>([])
  const [prioritizedTasks, setPrioritizedTasks] = useState<PrioritizedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null)
  const [editingPriority, setEditingPriority] = useState<Partial<TaskPriority>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksData, prioritiesData, prioritizedData] = await Promise.all([
        SupabaseService.getTaskTemplates(),
        ParentAdminService.getTaskPriorities(parentProfile.id),
        ParentAdminService.getPrioritizedTasks()
      ])
      
      setTasks(tasksData)
      setPriorities(prioritiesData)
      setPrioritizedTasks(prioritizedData)
    } catch (error) {
      console.error('Error loading admin data:', error)
      Alert.alert('Error', 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPriority = async (taskId: string, priority: Partial<TaskPriority>) => {
    try {
      await ParentAdminService.setTaskPriority(taskId, parentProfile.id, priority)
      await loadData() // Refresh data
      setSelectedTask(null)
      setEditingPriority({})
      Alert.alert('Success', 'Task priority updated!')
    } catch (error) {
      console.error('Error setting priority:', error)
      Alert.alert('Error', 'Failed to update priority')
    }
  }

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'urgent': return '#F44336'
      case 'high': return '#FF9800'
      case 'normal': return '#4CAF50'
      case 'low': return '#9E9E9E'
      default: return '#4CAF50'
    }
  }

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨'
      case 'high': return '⚡'
      case 'normal': return '📋'
      case 'low': return '📝'
      default: return '📋'
    }
  }

  const renderPriorityTab = () => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
        🎯 Task Prioritization
      </Text>

      {/* Current Prioritized Tasks */}
      <Card style={{ marginBottom: 20, elevation: 3 }}>
        <Card.Content>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Current Priority Tasks ({prioritizedTasks.filter(t => t.is_urgent || t.priority_type !== 'normal').length})
          </Text>
          
          {prioritizedTasks
            .filter(t => t.is_urgent || t.priority_type !== 'normal')
            .slice(0, 5)
            .map(task => (
              <View key={task.task_id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                marginBottom: 8,
                backgroundColor: task.is_urgent ? '#FFEBEE' : '#F5F5F5',
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: getPriorityColor(task.priority_type)
              }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>
                  {getPriorityIcon(task.priority_type)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{task.title}</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {task.skill_category} • ${(task.effective_pay_cents / 100).toFixed(2)} • {task.effective_effort_minutes}min
                  </Text>
                  {task.deadline && (
                    <Text style={{ color: '#F44336', fontSize: 11, fontWeight: '600' }}>
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Chip
                  mode="outlined"
                  style={{ backgroundColor: getPriorityColor(task.priority_type) + '20' }}
                  textStyle={{ color: getPriorityColor(task.priority_type), fontSize: 10 }}
                >
                  {task.priority_type.toUpperCase()}
                </Chip>
              </View>
            ))}
        </Card.Content>
      </Card>

      {/* Task Selection and Priority Setting */}
      <Card style={{ marginBottom: 20, elevation: 3 }}>
        <Card.Content>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Set Task Priority
          </Text>

          {/* Task Selector */}
          <View style={{ 
            borderWidth: 1, 
            borderColor: '#ddd', 
            borderRadius: 8, 
            marginBottom: 16 
          }}>
            <Picker
              selectedValue={selectedTask?.id || ''}
              onValueChange={(taskId) => {
                const task = tasks.find(t => t.id === taskId)
                setSelectedTask(task || null)
                // Pre-fill with existing priority if available
                const existingPriority = priorities.find(p => p.task_template_id === taskId)
                if (existingPriority) {
                  setEditingPriority(existingPriority)
                } else {
                  setEditingPriority({ priority_level: 50, priority_type: 'normal' })
                }
              }}
              style={{ height: 50 }}
            >
              <Picker.Item label="Choose a task to prioritize..." value="" />
              {tasks
                .sort((a, b) => a.skill_category.localeCompare(b.skill_category))
                .map(task => (
                  <Picker.Item 
                    key={task.id} 
                    label={`${task.title} (${task.skill_category})`} 
                    value={task.id} 
                  />
                ))}
            </Picker>
          </View>

          {selectedTask && (
            <View style={{ gap: 16 }}>
              {/* Task Info */}
              <View style={{ 
                backgroundColor: '#F5F5F5', 
                padding: 12, 
                borderRadius: 8 
              }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{selectedTask.title}</Text>
                <Text style={{ color: '#666' }}>{selectedTask.description}</Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                  Base: ${(selectedTask.base_pay_cents / 100).toFixed(2)} • {selectedTask.effort_minutes} min • {selectedTask.skill_category}
                </Text>
              </View>

              {/* Priority Type */}
              <View>
                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Priority Level:</Text>
                <View style={{ 
                  borderWidth: 1, 
                  borderColor: '#ddd', 
                  borderRadius: 8 
                }}>
                  <Picker
                    selectedValue={editingPriority.priority_type || 'normal'}
                    onValueChange={(value) => setEditingPriority(prev => ({ ...prev, priority_type: value }))}
                    style={{ height: 50 }}
                  >
                    <Picker.Item label="🚨 Urgent - Show first, red indicators" value="urgent" />
                    <Picker.Item label="⚡ High - Priority in suggestions" value="high" />
                    <Picker.Item label="📋 Normal - Regular priority" value="normal" />
                    <Picker.Item label="📝 Low - Show less often" value="low" />
                  </Picker>
                </View>
              </View>

              {/* Custom Pay Override */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>Custom Pay ($):</Text>
                  <TextInput
                    style={{ 
                      borderWidth: 1, 
                      borderColor: '#ddd', 
                      borderRadius: 8, 
                      padding: 12,
                      fontSize: 16
                    }}
                    placeholder={`Default: $${(selectedTask.base_pay_cents / 100).toFixed(2)}`}
                    value={editingPriority.custom_pay_cents ? (editingPriority.custom_pay_cents / 100).toString() : ''}
                    onChangeText={(text) => {
                      const cents = parseFloat(text) * 100
                      setEditingPriority(prev => ({ ...prev, custom_pay_cents: cents || undefined }))
                    }}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>Custom Time (min):</Text>
                  <TextInput
                    style={{ 
                      borderWidth: 1, 
                      borderColor: '#ddd', 
                      borderRadius: 8, 
                      padding: 12,
                      fontSize: 16
                    }}
                    placeholder={`Default: ${selectedTask.effort_minutes}`}
                    value={editingPriority.custom_effort_minutes?.toString() || ''}
                    onChangeText={(text) => {
                      const minutes = parseInt(text)
                      setEditingPriority(prev => ({ ...prev, custom_effort_minutes: minutes || undefined }))
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Notes */}
              <View>
                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Parent Notes:</Text>
                <TextInput
                  style={{ 
                    borderWidth: 1, 
                    borderColor: '#ddd', 
                    borderRadius: 8, 
                    padding: 12,
                    fontSize: 16,
                    height: 80,
                    textAlignVertical: 'top'
                  }}
                  placeholder="Why is this task prioritized? Any special instructions?"
                  value={editingPriority.notes || ''}
                  onChangeText={(text) => setEditingPriority(prev => ({ ...prev, notes: text }))}
                  multiline
                />
              </View>

              {/* Save Button */}
              <Button
                mode="contained"
                onPress={() => handleSetPriority(selectedTask.id, editingPriority)}
                style={{ 
                  backgroundColor: getPriorityColor(editingPriority.priority_type || 'normal'),
                  borderRadius: 12 
                }}
              >
                {priorities.find(p => p.task_template_id === selectedTask.id) ? 'Update Priority' : 'Set Priority'}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  )

  const renderAnalyticsTab = () => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
        📊 Task Analytics
      </Text>

      <Card style={{ marginBottom: 16, elevation: 3 }}>
        <Card.Content>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Priority Overview
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F44336' }}>
                {prioritizedTasks.filter(t => t.priority_type === 'urgent').length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Urgent</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF9800' }}>
                {prioritizedTasks.filter(t => t.priority_type === 'high').length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>High Priority</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
                {priorities.length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Total Managed</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 16, elevation: 3 }}>
        <Card.Content>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Task Distribution by Category
          </Text>
          
          {['Cleaning', 'Dishes', 'Laundry', 'Cooking', 'Yard', 'Tools'].map(category => {
            const categoryTasks = prioritizedTasks.filter(t => t.skill_category === category)
            const urgentInCategory = categoryTasks.filter(t => t.is_urgent).length
            const total = categoryTasks.length
            
            return (
              <View key={category} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontWeight: '600' }}>{category}</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {urgentInCategory > 0 && `${urgentInCategory} urgent • `}{total} total
                  </Text>
                </View>
                <ProgressBar
                  progress={total > 0 ? urgentInCategory / total : 0}
                  color={urgentInCategory > 0 ? '#F44336' : '#E0E0E0'}
                  style={{ height: 6, borderRadius: 3 }}
                />
              </View>
            )
          })}
        </Card.Content>
      </Card>
    </View>
  )

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>Loading parent admin portal...</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: 16,
        paddingTop: 50,
        backgroundColor: 'white',
        elevation: 2
      }}>
        {onClose && (
          <IconButton icon="arrow-left" onPress={onClose} />
        )}
        <Text style={{ fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          Parent Admin Portal
        </Text>
        <IconButton icon="refresh" onPress={loadData} />
      </View>

      {/* Tab Navigation */}
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: 'white', 
        elevation: 1,
        paddingHorizontal: 16 
      }}>
        {(['priorities', 'analytics'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: '#FF69B4'
            }}
          >
            <Text style={{
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              color: activeTab === tab ? '#FF69B4' : '#666',
              fontSize: 14
            }}>
              {tab === 'priorities' ? '🎯 Priorities' : '📊 Analytics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'priorities' && renderPriorityTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>
    </View>
  )
}