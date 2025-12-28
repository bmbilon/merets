import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Modal, Portal, Card, Text, Button, Divider, Chip } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'

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

interface UserProfile {
  id: string
  name: string
  level: number
  total_xp: number
  total_earnings_cents: number
}

interface MentContractProps {
  visible: boolean
  task: MarketplaceTask | null
  userProfile: UserProfile
  onDecline: () => void
  onAccept: () => void
  userColor: string
  kidNotes?: string
  onNotesChange?: (notes: string) => void
}

export const MentContract: React.FC<MentContractProps> = ({
  visible,
  task,
  userProfile,
  onDecline,
  onAccept,
  userColor,
  kidNotes = '',
  onNotesChange
}) => {
  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`
  
  const formatDueDate = (days?: number) => {
    if (!days && days !== 0) return 'No deadline'
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    if (days < 7) return `Due in ${days} days`
    if (days < 14) return `Due in ${Math.ceil(days / 7)} week`
    return `Due in ${Math.ceil(days / 7)} weeks`
  }

  const getSkillIcon = (skill: string) => {
    const icons: Record<string, string> = {
      'Cleaning': '🧽',
      'Dishes': '🍽️', 
      'Laundry': '👕',
      'Cooking': '🍳',
      'Yard': '🌱',
      'Tools': '🔧',
      'General': '⭐',
      'Organization': '📦',
      'Pet Care': '🐕'
    }
    return icons[skill] || '⚡'
  }

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Helper', 'Skilled', 'Expert', 'Master']
    return labels[level] || 'Unknown'
  }

  const getQualityStandards = (isUrgent: boolean, priorityType?: string) => {
    if (isUrgent || priorityType === 'urgent') {
      return 'Perfect required'
    }
    return 'Pass / Perfect'
  }

  const getPriorityColor = (priorityType?: string, isUrgent?: boolean) => {
    if (isUrgent) return '#F44336'
    switch (priorityType) {
      case 'high': return '#FF5722'
      case 'urgent': return '#F44336'
      case 'low': return '#2196F3'
      default: return '#FF9800'
    }
  }

  const handleAccept = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onAccept()
  }

  const handleDecline = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onDecline()
  }

  if (!task) return null

  const screenHeight = Dimensions.get('window').height

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDecline}
        contentContainerStyle={[styles.modalContainer, { maxHeight: screenHeight * 0.9 }]}
      >
        <Card style={[styles.contractCard, { borderTopColor: userColor, borderTopWidth: 6 }]}>
          <LinearGradient
            colors={[`${userColor}15`, `${userColor}05`, '#FFFFFF']}
            style={styles.gradientBackground}
          >
            <Card.Content style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: userColor }]}>
                  📋 Ment Contract
                </Text>
                <Text style={styles.subtitle}>
                  You are committing to:
                </Text>
              </View>

              <Divider style={[styles.divider, { backgroundColor: `${userColor}30` }]} />

              {/* Contract Details */}
              <View style={styles.detailsContainer}>
                {/* Task Info */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>• Task:</Text>
                  <Text style={styles.value}>{task.title}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>• Skill:</Text>
                  <View style={styles.skillContainer}>
                    <Text style={styles.skillIcon}>{getSkillIcon(task.skill_category)}</Text>
                    <Text style={styles.value}>{task.skill_category}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>• Level Required:</Text>
                  <View style={styles.levelContainer}>
                    <Chip 
                      compact
                      style={[styles.levelChip, { backgroundColor: `${userColor}20` }]}
                      textStyle={{ color: userColor, fontSize: 12, fontWeight: 'bold' }}
                    >
                      {task.difficulty_level}+ {getDifficultyLabel(task.difficulty_level)}
                    </Chip>
                    {userProfile.level < task.difficulty_level && (
                      <Text style={styles.warningText}>⚠️ You need level {task.difficulty_level}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>• Time:</Text>
                  <Text style={[styles.value, styles.timeValue]}>{task.effective_effort_minutes} min</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>• Pay:</Text>
                  <Text style={[styles.value, styles.payValue, { color: '#4CAF50' }]}>
                    {formatMoney(task.effective_pay_cents)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>• Due:</Text>
                  <Text style={[
                    styles.value,
                    task.days_until_due === 0 ? styles.urgentText : {},
                    task.days_until_due === 1 ? styles.soonText : {}
                  ]}>
                    {formatDueDate(task.days_until_due)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>• Quality Standard:</Text>
                  <Text style={[
                    styles.value, 
                    { color: getPriorityColor(task.priority_type, task.is_urgent) }
                  ]}>
                    {getQualityStandards(task.is_urgent, task.priority_type)}
                  </Text>
                </View>
              </View>

              {/* Priority Badge */}
              {(task.is_urgent || task.priority_type !== 'normal') && (
                <View style={styles.priorityBadge}>
                  <Chip
                    icon={() => <Text style={styles.priorityIcon}>🚨</Text>}
                    style={[
                      styles.priorityChip,
                      { backgroundColor: `${getPriorityColor(task.priority_type, task.is_urgent)}20` }
                    ]}
                    textStyle={{ 
                      color: getPriorityColor(task.priority_type, task.is_urgent), 
                      fontWeight: 'bold' 
                    }}
                  >
                    {task.is_urgent ? 'URGENT TASK' : `${task.priority_type?.toUpperCase()} PRIORITY`}
                  </Chip>
                </View>
              )}

              {/* Parent Notes */}
              {task.parent_notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>📝 Parent Notes:</Text>
                  <Text style={styles.notesText}>{task.parent_notes}</Text>
                </View>
              )}

              {/* Description */}
              {task.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Details:</Text>
                  <Text style={styles.descriptionText}>{task.description}</Text>
                </View>
              )}

              <Divider style={[styles.divider, { backgroundColor: `${userColor}30` }]} />

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={handleDecline}
                  style={[styles.button, styles.declineButton]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.declineButtonText}
                >
                  Decline
                </Button>

                <Button
                  mode="contained"
                  onPress={handleAccept}
                  style={[styles.button, styles.acceptButton, { backgroundColor: userColor }]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.acceptButtonText}
                  disabled={userProfile.level < task.difficulty_level}
                >
                  Accept Ment 📋
                </Button>
              </View>

              {/* Level Warning */}
              {userProfile.level < task.difficulty_level && (
                <Text style={styles.levelWarning}>
                  ⚠️ Complete more tasks to reach level {task.difficulty_level}
                </Text>
              )}
            </Card.Content>
          </LinearGradient>
        </Card>
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  contractCard: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBackground: {
    borderRadius: 16,
  },
  content: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  divider: {
    height: 2,
    marginVertical: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 120,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  skillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skillIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelChip: {
    marginRight: 8,
  },
  timeValue: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  payValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  urgentText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  soonText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
  priorityBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityChip: {
    paddingHorizontal: 4,
  },
  priorityIcon: {
    fontSize: 12,
  },
  notesSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  declineButton: {
    borderColor: '#666',
    borderWidth: 2,
  },
  acceptButton: {
    elevation: 2,
  },
  declineButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelWarning: {
    textAlign: 'center',
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
    marginTop: 8,
  },
})