import React, { useState } from 'react';
import { View, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Surface, Text, Button, TextInput, Chip, IconButton, Switch, ProgressBar } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ReceiptCard from './ReceiptCard';

interface CreateMentModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPublish: (mentData: any) => void;
}

export default function CreateMentModal({ visible, onDismiss, onPublish }: CreateMentModalProps) {
  const [step, setStep] = useState(1);
  const [showReceipt, setShowReceipt] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [credits, setCredits] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [dueDate, setDueDate] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [repeatable, setRepeatable] = useState(false);
  const [maxAssignments, setMaxAssignments] = useState('1');

  const totalSteps = 4;
  const progress = step / totalSteps;

  const categories = ['Chores', 'Yard Work', 'Pet Care', 'Organization', 'Errands', 'Other'];
  const difficulties = [
    { value: 'easy', label: 'Easy', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FF9800' },
    { value: 'hard', label: 'Hard', color: '#F44336' }
  ];

  const canProceed = () => {
    switch (step) {
      case 1:
        return title.trim() && description.trim() && category;
      case 2:
        return credits && parseFloat(credits) > 0;
      case 3:
        return timeEstimate && dueDate;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handlePublish = () => {
    const mentData = {
      title,
      description,
      category,
      timeEstimate,
      credits: parseFloat(credits),
      difficulty,
      dueDate,
      approvalRequired,
      repeatable,
      maxAssignments: repeatable ? parseInt(maxAssignments) : 1
    };
    
    onPublish(mentData);
    setShowReceipt(true);
    
    // Reset form
    setTimeout(() => {
      setStep(1);
      setTitle('');
      setDescription('');
      setCategory('');
      setTimeEstimate('');
      setCredits('');
      setDifficulty('easy');
      setDueDate('');
      setApprovalRequired(true);
      setRepeatable(false);
      setMaxAssignments('1');
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              What needs to be done?
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 24 }}>
              Describe the task clearly so earners know what's expected.
            </Text>

            <TextInput
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              placeholder="e.g., Clean the garage"
              style={{ marginBottom: 16 }}
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Describe what needs to be done, any special requirements, etc."
              style={{ marginBottom: 16 }}
            />

            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
              Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  style={{ 
                    backgroundColor: category === cat ? '#6200ee' : '#f5f5f5'
                  }}
                  textStyle={{ color: category === cat ? '#fff' : '#666' }}
                >
                  {cat}
                </Chip>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              How much will you pay?
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 24 }}>
              Set fair compensation based on effort and time required.
            </Text>

            <TextInput
              label="Credits (= Dollars)"
              value={credits}
              onChangeText={setCredits}
              mode="outlined"
              keyboardType="decimal-pad"
              left={<TextInput.Icon icon={() => <Text style={{ fontSize: 18 }}>$</Text>} />}
              style={{ marginBottom: 24 }}
            />

            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
              Difficulty Level
            </Text>
            <Text variant="bodySmall" style={{ color: '#666', marginBottom: 12 }}>
              This helps earners understand the complexity
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff.value}
                  onPress={() => setDifficulty(diff.value as any)}
                  style={{ flex: 1 }}
                >
                  <Surface style={{
                    borderRadius: 12,
                    padding: 16,
                    backgroundColor: difficulty === diff.value ? `${diff.color}20` : '#f5f5f5',
                    borderWidth: difficulty === diff.value ? 2 : 0,
                    borderColor: diff.color,
                    alignItems: 'center'
                  }}>
                    <Text 
                      variant="bodyLarge" 
                      style={{ 
                        fontWeight: 'bold',
                        color: difficulty === diff.value ? diff.color : '#666'
                      }}
                    >
                      {diff.label}
                    </Text>
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>

            {credits && parseFloat(credits) > 0 && (
              <Surface style={{
                marginTop: 24,
                borderRadius: 12,
                padding: 16,
                backgroundColor: '#E8F5E9'
              }}>
                <Text variant="bodyMedium" style={{ color: '#2E7D32' }}>
                  💡 Typical rates: Easy ($5-10), Medium ($10-20), Hard ($20+)
                </Text>
              </Surface>
            )}
          </View>
        );

      case 3:
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              When is it due?
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 24 }}>
              Set realistic deadlines and time estimates.
            </Text>

            <TextInput
              label="Time Estimate"
              value={timeEstimate}
              onChangeText={setTimeEstimate}
              mode="outlined"
              placeholder="e.g., 30 min, 1 hour, 2 hours"
              style={{ marginBottom: 16 }}
            />

            <TextInput
              label="Due Date"
              value={dueDate}
              onChangeText={setDueDate}
              mode="outlined"
              placeholder="e.g., Today, Tomorrow, This Weekend"
              style={{ marginBottom: 16 }}
            />

            <Surface style={{
              borderRadius: 12,
              padding: 16,
              backgroundColor: '#FFF3E0'
            }}>
              <Text variant="bodyMedium" style={{ color: '#E65100' }}>
                ⏰ Be realistic with deadlines. Rushed work leads to poor quality.
              </Text>
            </Surface>
          </View>
        );

      case 4:
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Final Settings
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 24 }}>
              Configure approval and repeatability options.
            </Text>

            <Surface style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              backgroundColor: '#f5f5f5'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    Require Approval
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    For minors, parent/guardian must approve before they can start
                  </Text>
                </View>
                <Switch
                  value={approvalRequired}
                  onValueChange={setApprovalRequired}
                />
              </View>
            </Surface>

            <Surface style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              backgroundColor: '#f5f5f5'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    Repeatable Task
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    Allow multiple earners to claim this task
                  </Text>
                </View>
                <Switch
                  value={repeatable}
                  onValueChange={setRepeatable}
                />
              </View>
            </Surface>

            {repeatable && (
              <TextInput
                label="Max Assignments"
                value={maxAssignments}
                onChangeText={setMaxAssignments}
                mode="outlined"
                keyboardType="number-pad"
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Summary */}
            <Surface style={{
              borderRadius: 12,
              padding: 16,
              backgroundColor: '#E3F2FD',
              borderWidth: 1,
              borderColor: '#2196F3'
            }}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12, color: '#1976D2' }}>
                📋 Ment Summary
              </Text>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" style={{ color: '#1565C0' }}>Task:</Text>
                  <Text variant="bodySmall" style={{ color: '#1565C0', fontWeight: 'bold' }}>{title}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" style={{ color: '#1565C0' }}>Pay:</Text>
                  <Text variant="bodySmall" style={{ color: '#1565C0', fontWeight: 'bold' }}>${credits}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" style={{ color: '#1565C0' }}>Time:</Text>
                  <Text variant="bodySmall" style={{ color: '#1565C0', fontWeight: 'bold' }}>{timeEstimate}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" style={{ color: '#1565C0' }}>Due:</Text>
                  <Text variant="bodySmall" style={{ color: '#1565C0', fontWeight: 'bold' }}>{dueDate}</Text>
                </View>
              </View>
            </Surface>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showReceipt}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onDismiss}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 20,
              paddingTop: 60,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0'
            }}>
              <IconButton
                icon={() => <IconSymbol size={24} name="xmark" color="#333" />}
                onPress={onDismiss}
              />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  Create Ment
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  Step {step} of {totalSteps}
                </Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* Progress Bar */}
            <ProgressBar progress={progress} color="#6200ee" style={{ height: 4 }} />

            {/* Content */}
            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {renderStep()}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={{ 
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
              backgroundColor: '#fff',
              flexDirection: 'row',
              gap: 12
            }}>
              {step > 1 && (
                <Button
                  mode="outlined"
                  onPress={() => setStep(step - 1)}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 8 }}
                >
                  Back
                </Button>
              )}
              <Button
                mode="contained"
                onPress={() => {
                  if (step < totalSteps) {
                    setStep(step + 1);
                  } else {
                    handlePublish();
                  }
                }}
                disabled={!canProceed()}
                style={{ flex: 1, borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                {step < totalSteps ? 'Next' : 'Publish Ment'}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Receipt */}
      <ReceiptCard
        visible={showReceipt}
        onDismiss={() => {
          setShowReceipt(false);
          onDismiss();
        }}
        title="Ment Published!"
        subtitle={title}
        icon="checkmark.circle.fill"
        iconColor="#4CAF50"
        items={[
          { label: 'Payment', value: `$${credits}`, highlight: true, icon: 'dollarsign.circle' },
          { label: 'Category', value: category, icon: 'tag.fill' },
          { label: 'Due', value: dueDate, icon: 'calendar' },
          { label: 'Slots', value: repeatable ? maxAssignments : '1', icon: 'person.2.fill' }
        ]}
        nextSteps={[
          'Your ment is now visible in the marketplace',
          approvalRequired ? 'You\'ll be notified when someone requests approval' : 'Earners can commit immediately',
          'You\'ll review the work after submission'
        ]}
      />
    </>
  );
}

// Need to import TouchableOpacity
import { TouchableOpacity } from 'react-native';
