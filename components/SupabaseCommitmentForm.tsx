import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { SupabaseService } from '../lib/supabase-service'
import { TaskTemplate, UserProfile } from '../lib/supabase'

interface Props {
  userProfile: UserProfile
  onCommitmentCreated?: () => void
  onClose?: () => void
}

export const SupabaseCommitmentForm: React.FC<Props> = ({ 
  userProfile, 
  onCommitmentCreated, 
  onClose 
}) => {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [skillCategories, setSkillCategories] = useState<string[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskTemplate[]>([])
  
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [effortMinutes, setEffortMinutes] = useState('30')
  const [difficultyLevel, setDifficultyLevel] = useState(1)
  const [calculatedPay, setCalculatedPay] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  // Update filtered tasks when skill changes
  useEffect(() => {
    if (selectedSkill) {
      const filtered = taskTemplates.filter(task => task.skill_category === selectedSkill)
      setFilteredTasks(filtered)
    } else {
      setFilteredTasks([])
    }
  }, [selectedSkill, taskTemplates])

  // Calculate pay when parameters change
  useEffect(() => {
    if (selectedSkill && effortMinutes) {
      calculatePay()
    }
  }, [selectedSkill, effortMinutes, difficultyLevel])

  const loadData = async () => {
    try {
      const [templates, skills] = await Promise.all([
        SupabaseService.getTaskTemplates(),
        SupabaseService.getSkillCategories()
      ])
      setTaskTemplates(templates)
      setSkillCategories(skills)
    } catch (error) {
      console.error('Error loading data:', error)
      Alert.alert('Error', 'Failed to load task data')
    }
  }

  const calculatePay = async () => {
    if (!selectedSkill || !effortMinutes) return
    
    try {
      const minutes = parseInt(effortMinutes)
      const pay = await SupabaseService.calculateTaskPay(selectedSkill, minutes, difficultyLevel)
      setCalculatedPay(pay)
    } catch (error) {
      console.error('Error calculating pay:', error)
    }
  }

  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template)
    setCustomTitle(template.title)
    setCustomDescription(template.description || '')
    setEffortMinutes(template.effort_minutes.toString())
    setDifficultyLevel(template.difficulty_level)
    setSelectedSkill(template.skill_category)
  }

  const handleSubmit = async () => {
    if (!selectedSkill || !customTitle || !effortMinutes) {
      Alert.alert('Missing Info', 'Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await SupabaseService.createCommitment({
        user_id: userProfile.id,
        task_template_id: selectedTemplate?.id,
        custom_title: customTitle,
        custom_description: customDescription,
        skill_category: selectedSkill,
        effort_minutes: parseInt(effortMinutes),
        pay_cents: calculatedPay,
        status: 'pending'
      })

      Alert.alert('Success', 'Commitment created! Parents will be notified.')
      onCommitmentCreated?.()
      onClose?.()
    } catch (error) {
      console.error('Error creating commitment:', error)
      Alert.alert('Error', 'Failed to create commitment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        💪 Create New Commitment
      </Text>

      {/* Skill Category Selector */}
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
        Select Skill Category:
      </Text>
      <View style={{ 
        borderWidth: 1, 
        borderColor: '#ddd', 
        borderRadius: 8, 
        marginBottom: 20 
      }}>
        <Picker
          selectedValue={selectedSkill}
          onValueChange={(value) => setSelectedSkill(value)}
          style={{ height: 50 }}
        >
          <Picker.Item label="Choose a skill..." value="" />
          {skillCategories.map(skill => (
            <Picker.Item key={skill} label={skill} value={skill} />
          ))}
        </Picker>
      </View>

      {/* Task Templates */}
      {filteredTasks.length > 0 && (
        <>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
            Suggested Tasks:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          >
            {filteredTasks.map(template => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleTemplateSelect(template)}
                style={{
                  backgroundColor: selectedTemplate?.id === template.id ? '#FF69B4' : '#f0f0f0',
                  padding: 15,
                  borderRadius: 10,
                  marginRight: 10,
                  minWidth: 200,
                  maxWidth: 220
                }}
              >
                <Text style={{ 
                  fontWeight: 'bold', 
                  fontSize: 14,
                  color: selectedTemplate?.id === template.id ? 'white' : 'black',
                  marginBottom: 5
                }}>
                  {template.title}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: selectedTemplate?.id === template.id ? 'white' : '#666',
                  marginBottom: 8
                }}>
                  {template.description}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ 
                    fontSize: 11, 
                    color: selectedTemplate?.id === template.id ? 'white' : '#888'
                  }}>
                    ⏱️ {template.effort_minutes}min
                  </Text>
                  <Text style={{ 
                    fontSize: 11, 
                    color: selectedTemplate?.id === template.id ? 'white' : '#888'
                  }}>
                    💰 ${(template.base_pay_cents / 100).toFixed(2)}
                  </Text>
                  <Text style={{ 
                    fontSize: 11, 
                    color: selectedTemplate?.id === template.id ? 'white' : '#888'
                  }}>
                    {template.is_micro_task ? '⚡ Quick' : '🏆 Standard'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Custom Task Form */}
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
        Task Details:
      </Text>
      
      <TextInput
        style={{ 
          borderWidth: 1, 
          borderColor: '#ddd', 
          borderRadius: 8, 
          padding: 12, 
          fontSize: 16,
          marginBottom: 15 
        }}
        placeholder="Task title..."
        value={customTitle}
        onChangeText={setCustomTitle}
      />

      <TextInput
        style={{ 
          borderWidth: 1, 
          borderColor: '#ddd', 
          borderRadius: 8, 
          padding: 12, 
          fontSize: 16,
          height: 80,
          textAlignVertical: 'top',
          marginBottom: 15
        }}
        placeholder="Task description (optional)..."
        value={customDescription}
        onChangeText={setCustomDescription}
        multiline
      />

      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 5 }}>
            Effort (minutes):
          </Text>
          <TextInput
            style={{ 
              borderWidth: 1, 
              borderColor: '#ddd', 
              borderRadius: 8, 
              padding: 12, 
              fontSize: 16 
            }}
            placeholder="30"
            value={effortMinutes}
            onChangeText={setEffortMinutes}
            keyboardType="numeric"
          />
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 5 }}>
            Difficulty:
          </Text>
          <View style={{ 
            borderWidth: 1, 
            borderColor: '#ddd', 
            borderRadius: 8 
          }}>
            <Picker
              selectedValue={difficultyLevel}
              onValueChange={(value) => setDifficultyLevel(value)}
              style={{ height: 50 }}
            >
              <Picker.Item label="Level 1 - Helper" value={1} />
              <Picker.Item label="Level 2 - Contributor" value={2} />
              <Picker.Item label="Level 3 - Builder" value={3} />
              <Picker.Item label="Level 4 - Master" value={4} />
            </Picker>
          </View>
        </View>
      </View>

      {/* Calculated Pay Display */}
      {calculatedPay > 0 && (
        <View style={{
          backgroundColor: '#E8F5E8',
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2E7D32' }}>
            Calculated Pay: ${(calculatedPay / 100).toFixed(2)}
          </Text>
          <Text style={{ fontSize: 14, color: '#2E7D32', marginTop: 5 }}>
            {parseInt(effortMinutes) <= 5 ? 
              '⚡ Micro-task flat rate' : 
              `💪 ${selectedSkill} rate: $${((calculatedPay / parseInt(effortMinutes)) / 100).toFixed(2)}/min`
            }
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading || !selectedSkill || !customTitle || !effortMinutes}
        style={{
          backgroundColor: loading || !selectedSkill || !customTitle || !effortMinutes ? '#ccc' : '#FF69B4',
          padding: 18,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 30
        }}
      >
        <Text style={{ 
          color: 'white', 
          fontSize: 18, 
          fontWeight: 'bold' 
        }}>
          {loading ? 'Creating...' : 'Create Commitment 🚀'}
        </Text>
      </TouchableOpacity>

      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: '#f0f0f0',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          <Text style={{ fontSize: 16, color: '#666' }}>Cancel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}