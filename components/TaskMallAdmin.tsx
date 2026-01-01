import React, { useState, useEffect } from 'react'
import { View, ScrollView, Alert, SafeAreaView } from 'react-native'
import Slider from '@react-native-community/slider'
import { 
  Card, 
  Button, 
  Text, 
  TextInput, 
  IconButton, 
  Chip, 
  Switch, 
  SegmentedButtons,
  Divider,
  Portal,
  Modal,
  Menu
} from 'react-native-paper'
import { SupabaseService } from '../lib/supabase-service'
import { ParentAdminService } from '../lib/supabase-parent-service'
import { supabase } from '../lib/supabase'

interface TaskTemplate {
  id: string
  title: string
  description: string
  skill_category: string
  effort_minutes: number
  base_pay_cents: number
  difficulty_level: number
  is_micro_task: boolean
  due_date?: string
  is_available_for_kids: boolean
  max_assignments?: number
  current_assignments: number
  parent_notes?: string
  urgency_multiplier: number
  created_at: string
  // Priority fields
  priority_type?: string
  is_urgent?: boolean
  custom_pay_cents?: number
  custom_effort_minutes?: number
  priority_notes?: string
}

interface Props {
  onClose: () => void
  parentProfile?: any
}

export const TaskMallAdmin: React.FC<Props> = ({ onClose, parentProfile }) => {
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null)
  const [editHourlyRate, setEditHourlyRate] = useState(1200) // Track hourly rate for editing
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'title' | 'pay' | 'time' | 'urgency'>('title')
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    skill_category: 'Cleaning',
    effort_minutes: 15,
    base_pay_cents: 300,
    hourly_rate_cents: 1200, // $12/hr default
    difficulty_level: 1,
    is_micro_task: false,
    due_date: '',
    is_available_for_kids: true,
    max_assignments: null as number | null,
    parent_notes: '',
    urgency_multiplier: 1.0,
    priority_type: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    is_urgent: false,
    priority_notes: ''
  })
  
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [customCategories, setCustomCategories] = useState<string[]>([])

  // Categories for dropdown
  const baseCategories = [
    'Cleaning', 'Dishes', 'Laundry', 'Yard', 'Cooking', 
    'Tools', 'General', 'Organization', 'Pet Care'
  ]
  const skillCategories = [...baseCategories, ...customCategories]

  const priorityTypes = [
    { value: 'low', label: '🔵 Low', color: '#2196F3' },
    { value: 'normal', label: '🟡 Normal', color: '#FF9800' },
    { value: 'high', label: '🟠 High', color: '#FF5722' },
    { value: 'urgent', label: '🔴 Urgent', color: '#F44336' }
  ]

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      // Get all task templates with priorities
      const templates = await SupabaseService.getTaskTemplates()
      
      // Enhance with priority information
      const enhancedTasks = await Promise.all(
        templates.map(async (task) => {
          try {
            const priorities = await ParentAdminService.getTaskPriorities()
            const priority = priorities.find(p => p.task_template_id === task.id)
            
            return {
              ...task,
              priority_type: priority?.priority_type || 'normal',
              is_urgent: priority?.is_urgent || false,
              custom_pay_cents: priority?.custom_pay_cents,
              custom_effort_minutes: priority?.custom_effort_minutes,
              priority_notes: priority?.notes,
              // Default values for new fields
              due_date: task.due_date || undefined,
              is_available_for_kids: task.is_available_for_kids ?? true,
              max_assignments: task.max_assignments || undefined,
              current_assignments: task.current_assignments || 0,
              parent_notes: task.parent_notes || '',
              urgency_multiplier: task.urgency_multiplier || 1.0
            } as TaskTemplate
          } catch (error) {
            console.log('Error loading priority for task', task.id, error)
            return {
              ...task,
              priority_type: 'normal',
              is_urgent: false,
              is_available_for_kids: task.is_available_for_kids ?? true,
              max_assignments: task.max_assignments || undefined,
              current_assignments: task.current_assignments || 0,
              parent_notes: task.parent_notes || '',
              urgency_multiplier: task.urgency_multiplier || 1.0
            } as TaskTemplate
          }
        })
      )
      
      setTasks(enhancedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      Alert.alert('Error', 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = async (task: TaskTemplate) => {
    try {
      // Update the task template in database
      // Note: You'll need to add this method to SupabaseService
      await updateTaskTemplate(task)
      
      // Update priority if it exists
      if (task.priority_type && task.priority_type !== 'normal') {
        await ParentAdminService.setTaskPriority(
          task.id,
          parentProfile?.id || 'parent',
          {
            priority_type: task.priority_type as any,
            custom_pay_cents: task.custom_pay_cents,
            custom_effort_minutes: task.custom_effort_minutes,
            notes: task.priority_notes,
            is_urgent: task.is_urgent
          }
        )
      }
      
      await loadTasks()
      setShowEditModal(false)
      setEditingTask(null)
      Alert.alert('Success', 'Task updated successfully!')
    } catch (error) {
      console.error('Error saving task:', error)
      Alert.alert('Error', 'Failed to save task')
    }
  }

  const handleCreateTask = async () => {
    try {
      // Create new task template
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        skill_category: newTask.skill_category,
        effort_minutes: newTask.effort_minutes,
        base_pay_cents: newTask.base_pay_cents,
        difficulty_level: newTask.difficulty_level,
        is_micro_task: newTask.is_micro_task,
        due_date: newTask.due_date || null,
        is_available_for_kids: newTask.is_available_for_kids,
        max_assignments: newTask.max_assignments,
        parent_notes: newTask.parent_notes,
        urgency_multiplier: newTask.urgency_multiplier
      }
      
      const createdTask = await createTaskTemplate(taskData)
      
      // Set priority if not normal
      if (newTask.priority_type !== 'normal') {
        await ParentAdminService.setTaskPriority(
          createdTask.id,
          parentProfile?.id || 'parent',
          {
            priority_type: newTask.priority_type as any,
            is_urgent: newTask.is_urgent,
            notes: newTask.priority_notes
          }
        )
      }
      
      await loadTasks()
      setShowCreateModal(false)
      resetNewTaskForm()
      Alert.alert('Success', 'New task created!')
    } catch (error) {
      console.error('Error creating task:', error)
      Alert.alert('Error', 'Failed to create task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaskTemplate(taskId)
              await loadTasks()
              Alert.alert('Success', 'Task deleted')
            } catch (error) {
              console.error('Error deleting task:', error)
              Alert.alert('Error', 'Failed to delete task')
            }
          }
        }
      ]
    )
  }

  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      skill_category: 'Cleaning',
      effort_minutes: 15,
      base_pay_cents: 300,
      hourly_rate_cents: 1200,
      difficulty_level: 1,
      is_micro_task: false,
      due_date: '',
      is_available_for_kids: true,
      max_assignments: null,
      parent_notes: '',
      urgency_multiplier: 1.0,
      priority_type: 'normal',
      is_urgent: false,
      priority_notes: ''
    })
    setShowNewCategoryInput(false)
    setNewCategoryName('')
  }

  // Helper functions for database operations
  const updateTaskTemplate = async (task: TaskTemplate) => {
    const { data, error } = await supabase
      .from('task_templates')
      .update({
        title: task.title,
        description: task.description,
        skill_category: task.skill_category,
        effort_minutes: task.effort_minutes,
        base_pay_cents: task.base_pay_cents,
        difficulty_level: task.difficulty_level,
        is_micro_task: task.is_micro_task,
        due_date: task.due_date || null,
        is_available_for_kids: task.is_available_for_kids,
        max_assignments: task.max_assignments,
        parent_notes: task.parent_notes,
        urgency_multiplier: task.urgency_multiplier
      })
      .eq('id', task.id)
    
    if (error) throw error
    return data
  }

  const createTaskTemplate = async (taskData: any) => {
    const { data, error } = await supabase
      .from('task_templates')
      .insert(taskData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  const deleteTaskTemplate = async (taskId: string) => {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', taskId)
    
    if (error) throw error
  }

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !filterCategory || task.skill_category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'pay':
          return (b.custom_pay_cents || b.base_pay_cents) - (a.custom_pay_cents || a.base_pay_cents)
        case 'time':
          return (a.custom_effort_minutes || a.effort_minutes) - (b.custom_effort_minutes || b.effort_minutes)
        case 'urgency':
          const urgencyOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          return urgencyOrder[b.priority_type as keyof typeof urgencyOrder] - urgencyOrder[a.priority_type as keyof typeof urgencyOrder]
        default:
          return a.title.localeCompare(b.title)
      }
    })

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const getPriorityColor = (priority: string) => {
    const colors = { low: '#2196F3', normal: '#FF9800', high: '#FF5722', urgent: '#F44336' }
    return colors[priority as keyof typeof colors] || '#FF9800'
  }

  const TaskCard = ({ task }: { task: TaskTemplate }) => (
    <Card style={{ marginVertical: 8 }}>
      <Card.Content>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {task.title}
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666', marginTop: 4 }}>
              {task.description}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => {
                setEditingTask(task)
                // Calculate initial hourly rate for editing
                const hourlyRate = Math.round((task.base_pay_cents / task.effort_minutes) * 60)
                setEditHourlyRate(hourlyRate)
                setShowEditModal(true)
              }}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#F44336"
              onPress={() => handleDeleteTask(task.id)}
            />
          </View>
        </View>

        {/* Tags and Info */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <Chip 
            icon="tag"
            style={{ backgroundColor: `${getPriorityColor(task.priority_type || 'normal')}20` }}
            textStyle={{ color: getPriorityColor(task.priority_type || 'normal') }}
          >
            {task.priority_type || 'normal'}
          </Chip>
          
          <Chip icon="hammer-wrench">
            {task.skill_category}
          </Chip>
          
          <Chip icon="clock-outline">
            {task.custom_effort_minutes || task.effort_minutes} min
          </Chip>
          
          <Chip 
            icon="currency-usd"
            style={{ backgroundColor: '#E8F5E8' }}
            textStyle={{ color: '#2E7D32', fontWeight: 'bold' }}
          >
            {formatMoney(task.custom_pay_cents || task.base_pay_cents)}
          </Chip>
          
          {task.is_micro_task && (
            <Chip 
              icon="flash"
              style={{ backgroundColor: '#FFE082' }}
              textStyle={{ color: '#F57F17' }}
            >
              Quick Task
            </Chip>
          )}
          
          {task.is_urgent && (
            <Chip 
              icon="alert"
              style={{ backgroundColor: '#FFCDD2' }}
              textStyle={{ color: '#D32F2F' }}
            >
              Urgent
            </Chip>
          )}
        </View>

        {/* Status and Availability */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text variant="bodySmall" style={{ color: task.is_available_for_kids ? '#4CAF50' : '#F44336' }}>
              {task.is_available_for_kids ? '✅ Available' : '❌ Hidden'}
            </Text>
            {task.max_assignments && (
              <Text variant="bodySmall" style={{ color: '#666' }}>
                📋 {task.current_assignments}/{task.max_assignments} claimed
              </Text>
            )}
            {task.due_date && (
              <Text variant="bodySmall" style={{ color: '#666' }}>
                📅 Due: {new Date(task.due_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {task.parent_notes && (
          <Text variant="bodySmall" style={{ color: '#666', marginTop: 8, fontStyle: 'italic' }}>
            📝 {task.parent_notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        elevation: 2
      }}>
        <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
          📋 Available Ments Admin
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#4CAF50' }}
          >
            New Task
          </Button>
          <IconButton icon="close" onPress={onClose} />
        </View>
      </View>

      {/* Search and Filters */}
      <View style={{ padding: 16, backgroundColor: 'white' }}>
        <TextInput
          label="Search tasks"
          value={searchTerm}
          onChangeText={setSearchTerm}
          left={<TextInput.Icon icon="magnify" />}
          style={{ marginBottom: 12 }}
        />
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <SegmentedButtons
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
              buttons={[
                { value: 'title', label: 'Name' },
                { value: 'pay', label: 'Pay' },
                { value: 'time', label: 'Time' },
                { value: 'urgency', label: 'Priority' }
              ]}
              style={{ marginRight: 16 }}
            />
          </View>
        </View>
      </View>

      <Divider />

      {/* Task List */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading tasks...</Text>
        ) : (
          <>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              {filteredTasks.length} tasks found
            </Text>
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            margin: 20,
            padding: 20,
            borderRadius: 12,
            maxHeight: '80%'
          }}
        >
          {editingTask && (
            <ScrollView>
              <Text variant="headlineMedium" style={{ marginBottom: 20, fontWeight: 'bold', fontSize: 24 }}>
                Edit Task
              </Text>
              
              {/* Edit form fields would go here */}
              <TextInput
                label="Task Title"
                value={editingTask.title}
                onChangeText={(text) => setEditingTask({...editingTask, title: text})}
                style={{ marginBottom: 16, fontSize: 18 }}
                theme={{ fonts: { bodyLarge: { fontSize: 18 } } }}
              />
              
              <TextInput
                label="Description"
                value={editingTask.description}
                onChangeText={(text) => setEditingTask({...editingTask, description: text})}
                multiline
                numberOfLines={3}
                style={{ marginBottom: 16, fontSize: 16 }}
                theme={{ fonts: { bodyLarge: { fontSize: 16 } } }}
              />

              {/* Hourly Rate */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: 20 }}>
                    Hourly Rate
                  </Text>
                  <TextInput
                    value={(editHourlyRate / 100).toFixed(2)}
                    onChangeText={(text) => {
                      const dollars = parseFloat(text) || 0;
                      const cents = Math.round(dollars * 100);
                      const newHourlyRate = Math.max(100, Math.min(10000, cents));
                      setEditHourlyRate(newHourlyRate);
                      setEditingTask({
                        ...editingTask,
                        base_pay_cents: Math.round((newHourlyRate / 60) * editingTask.effort_minutes)
                      });
                    }}
                    keyboardType="decimal-pad"
                    style={{ width: 120, height: 48, textAlign: 'center', fontSize: 18 }}
                    left={<TextInput.Affix text="$" />}
                    right={<TextInput.Affix text="/hr" />}
                  />
                </View>
                <Slider
                  value={editHourlyRate}
                  onValueChange={(value) => {
                    const newHourlyRate = Math.round(value / 100) * 100;
                    setEditHourlyRate(newHourlyRate);
                    setEditingTask({
                      ...editingTask,
                      base_pay_cents: Math.round((newHourlyRate / 60) * editingTask.effort_minutes)
                    });
                  }}
                  minimumValue={100}
                  maximumValue={10000}
                  step={100}
                  minimumTrackTintColor="#9C27B0"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#9C27B0"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium" style={{ color: '#666', fontSize: 14 }}>$1/hr</Text>
                  <Text variant="bodyMedium" style={{ color: '#666', fontSize: 14 }}>$100/hr</Text>
                </View>
              </View>

              {/* Time Slider */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: 20 }}>
                    Time
                  </Text>
                  <TextInput
                    value={String(editingTask.effort_minutes)}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 0;
                      const newMinutes = Math.max(2, Math.min(120, val));
                      setEditingTask({
                        ...editingTask,
                        effort_minutes: newMinutes,
                        base_pay_cents: Math.round((editHourlyRate / 60) * newMinutes)
                      });
                    }}
                    keyboardType="numeric"
                    style={{ width: 100, height: 48, textAlign: 'center', fontSize: 18 }}
                    right={<TextInput.Affix text="min" />}
                  />
                </View>
                <Slider
                  value={editingTask.effort_minutes}
                  onValueChange={(value) => {
                    const newMinutes = Math.round(value);
                    setEditingTask({
                      ...editingTask,
                      effort_minutes: newMinutes,
                      base_pay_cents: Math.round((editHourlyRate / 60) * newMinutes)
                    });
                  }}
                  minimumValue={2}
                  maximumValue={120}
                  step={1}
                  minimumTrackTintColor="#4CAF50"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#4CAF50"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium" style={{ color: '#666', fontSize: 14 }}>2 min</Text>
                  <Text variant="bodyMedium" style={{ color: '#666', fontSize: 14 }}>120 min</Text>
                </View>
              </View>

              {/* Pay (Auto-calculated, with override) */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                      Total Pay
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#666', fontStyle: 'italic' }}>
                      (auto-calculated)
                    </Text>
                  </View>
                  <TextInput
                    value={(editingTask.base_pay_cents / 100).toFixed(2)}
                    onChangeText={(text) => {
                      const dollars = parseFloat(text) || 0;
                      const cents = Math.round(dollars * 100);
                      const newPay = Math.max(25, Math.min(5000, cents));
                      const newHourlyRate = Math.round((newPay / editingTask.effort_minutes) * 60);
                      setEditHourlyRate(newHourlyRate);
                      setEditingTask({...editingTask, base_pay_cents: newPay});
                    }}
                    keyboardType="decimal-pad"
                    style={{ width: 120, height: 48, textAlign: 'center', fontSize: 18 }}
                    left={<TextInput.Affix text="$" />}
                  />
                </View>
                <Slider
                  value={editingTask.base_pay_cents}
                  onValueChange={(value) => {
                    const newPay = Math.round(value / 25) * 25;
                    const newHourlyRate = Math.round((newPay / editingTask.effort_minutes) * 60);
                    setEditHourlyRate(newHourlyRate);
                    setEditingTask({...editingTask, base_pay_cents: newPay});
                  }}
                  minimumValue={25}
                  maximumValue={5000}
                  step={25}
                  minimumTrackTintColor="#2E7D32"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#2E7D32"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" style={{ color: '#666' }}>$0.25</Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>$50.00</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => handleSaveTask(editingTask)}
                >
                  Save Changes
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>

      {/* Create Modal */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            margin: 20,
            padding: 20,
            borderRadius: 12,
            maxHeight: '80%'
          }}
        >
          <ScrollView>
            <Text variant="titleLarge" style={{ marginBottom: 16 }}>
              Create New Task
            </Text>
            
            {/* Create form fields */}
            <TextInput
              label="Task Title"
              value={newTask.title}
              onChangeText={(text) => setNewTask({...newTask, title: text})}
              style={{ marginBottom: 12 }}
            />
            
            <TextInput
              label="Description"
              value={newTask.description}
              onChangeText={(text) => setNewTask({...newTask, description: text})}
              multiline
              numberOfLines={3}
              style={{ marginBottom: 12 }}
            />

            {/* Category Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text variant="bodyMedium" style={{ marginBottom: 8, fontWeight: 'bold' }}>
                Category
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {skillCategories.map(category => (
                  <Chip
                    key={category}
                    selected={newTask.skill_category === category}
                    onPress={() => setNewTask({...newTask, skill_category: category})}
                    style={{ 
                      backgroundColor: newTask.skill_category === category ? '#4CAF50' : '#E0E0E0' 
                    }}
                    textStyle={{ 
                      color: newTask.skill_category === category ? 'white' : '#666' 
                    }}
                  >
                    {category}
                  </Chip>
                ))}
                <Chip
                  mode="flat"
                  icon="plus"
                  onPress={() => {
                    console.log('New Category pressed');
                    setShowNewCategoryInput(!showNewCategoryInput);
                  }}
                  style={{ backgroundColor: '#2196F3' }}
                  textStyle={{ color: 'white' }}
                  compact={false}
                >
                  New Category
                </Chip>
              </View>
              
              {showNewCategoryInput && (
                <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    label="New category name"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    style={{ flex: 1 }}
                  />
                  <Button
                    mode="contained"
                    onPress={() => {
                      if (newCategoryName.trim()) {
                        setCustomCategories([...customCategories, newCategoryName.trim()])
                        setNewTask({...newTask, skill_category: newCategoryName.trim()})
                        setNewCategoryName('')
                        setShowNewCategoryInput(false)
                      }
                    }}
                    style={{ alignSelf: 'center' }}
                  >
                    Add
                  </Button>
                </View>
              )}
            </View>

            {/* Hourly Rate */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                  Hourly Rate
                </Text>
                <TextInput
                  value={(newTask.hourly_rate_cents / 100).toFixed(2)}
                  onChangeText={(text) => {
                    const dollars = parseFloat(text) || 0;
                    const cents = Math.round(dollars * 100);
                    const newHourlyRate = Math.max(100, Math.min(10000, cents));
                    setNewTask({
                      ...newTask,
                      hourly_rate_cents: newHourlyRate,
                      base_pay_cents: Math.round((newHourlyRate / 60) * newTask.effort_minutes)
                    });
                  }}
                  keyboardType="decimal-pad"
                  style={{ width: 100, height: 40, textAlign: 'center' }}
                  left={<TextInput.Affix text="$" />}
                  right={<TextInput.Affix text="/hr" />}
                />
              </View>
              <Slider
                value={newTask.hourly_rate_cents}
                onValueChange={(value) => {
                  const newHourlyRate = Math.round(value / 100) * 100;
                  setNewTask({
                    ...newTask,
                    hourly_rate_cents: newHourlyRate,
                    base_pay_cents: Math.round((newHourlyRate / 60) * newTask.effort_minutes)
                  });
                }}
                minimumValue={100}
                maximumValue={10000}
                step={100}
                minimumTrackTintColor="#9C27B0"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#9C27B0"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodySmall" style={{ color: '#666' }}>$1/hr</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>$100/hr</Text>
              </View>
            </View>

            {/* Time Slider */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                  Time
                </Text>
                <TextInput
                  value={String(newTask.effort_minutes)}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    const newMinutes = Math.max(2, Math.min(120, val));
                    setNewTask({
                      ...newTask,
                      effort_minutes: newMinutes,
                      base_pay_cents: Math.round((newTask.hourly_rate_cents / 60) * newMinutes)
                    });
                  }}
                  keyboardType="numeric"
                  style={{ width: 80, height: 40, textAlign: 'center' }}
                  right={<TextInput.Affix text="min" />}
                />
              </View>
              <Slider
                value={newTask.effort_minutes}
                onValueChange={(value) => {
                  const newMinutes = Math.round(value);
                  setNewTask({
                    ...newTask,
                    effort_minutes: newMinutes,
                    base_pay_cents: Math.round((newTask.hourly_rate_cents / 60) * newMinutes)
                  });
                }}
                minimumValue={2}
                maximumValue={120}
                step={1}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#4CAF50"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodySmall" style={{ color: '#666' }}>2 min</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>120 min</Text>
              </View>
            </View>

            {/* Pay (Auto-calculated, with override) */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                    Total Pay
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666', fontStyle: 'italic' }}>
                    (auto-calculated)
                  </Text>
                </View>
                <TextInput
                  value={(newTask.base_pay_cents / 100).toFixed(2)}
                  onChangeText={(text) => {
                    const dollars = parseFloat(text) || 0;
                    const cents = Math.round(dollars * 100);
                    const newPay = Math.max(25, Math.min(5000, cents));
                    // Calculate new hourly rate from manual pay entry
                    const newHourlyRate = Math.round((newPay / newTask.effort_minutes) * 60);
                    setNewTask({
                      ...newTask,
                      base_pay_cents: newPay,
                      hourly_rate_cents: newHourlyRate
                    });
                  }}
                  keyboardType="decimal-pad"
                  style={{ width: 100, height: 40, textAlign: 'center' }}
                  left={<TextInput.Affix text="$" />}
                />
              </View>
              <Slider
                value={newTask.base_pay_cents}
                onValueChange={(value) => {
                  const newPay = Math.round(value / 25) * 25;
                  const newHourlyRate = Math.round((newPay / newTask.effort_minutes) * 60);
                  setNewTask({
                    ...newTask,
                    base_pay_cents: newPay,
                    hourly_rate_cents: newHourlyRate
                  });
                }}
                minimumValue={25}
                maximumValue={5000}
                step={25}
                minimumTrackTintColor="#2E7D32"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#2E7D32"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodySmall" style={{ color: '#666' }}>$0.25</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>$50.00</Text>
              </View>
            </View>

            {/* Quick Task Toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="bodyMedium">Quick Task (2-5 min)</Text>
              <Switch
                value={newTask.is_micro_task}
                onValueChange={(value) => setNewTask({...newTask, is_micro_task: value})}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setShowCreateModal(false)
                  resetNewTaskForm()
                }}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCreateTask}
                disabled={!newTask.title.trim()}
              >
                Create Task
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  )
}