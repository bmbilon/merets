import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Card, ProgressBar, Surface, Chip } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import {
  WeeklyMonthlyProgress,
  BonusQualification,
  generateStickerSlots,
  getStickerEmoji,
  computeWeeklyMonthly,
  checkBonusQualification,
  getCurrentWeekTasks,
  getCurrentMonthTasks,
  MOCK_TASKS_FOR_STICKERS
} from '../lib/systems/sticker-system'

interface StickerTrackerProps {
  userId: string
  userColor: string
  compact?: boolean
}

interface StickerMeterProps {
  label: string
  current: number
  target: number
  minutesIntoNext: number
  stickerMinutes: number
  color: string
  showProgressBar?: boolean
}

interface BonusStatusProps {
  bonusQualification: BonusQualification
  userColor: string
}

// Individual sticker slot component
const StickerSlot: React.FC<{ 
  filled: boolean; 
  color: string; 
  size?: number 
}> = ({ filled, color, size = 32 }) => (
  <View style={[
    styles.stickerSlot,
    { 
      width: size, 
      height: size,
      backgroundColor: filled ? `${color}20` : '#F0F0F0',
      borderColor: filled ? color : '#E0E0E0'
    }
  ]}>
    <Text style={[
      styles.stickerEmoji,
      { fontSize: size * 0.6 }
    ]}>
      {filled ? '⭐' : '⭕'}
    </Text>
  </View>
)

// Sticker meter with progress bar
const StickerMeter: React.FC<StickerMeterProps> = ({
  label,
  current,
  target,
  minutesIntoNext,
  stickerMinutes,
  color,
  showProgressBar = true
}) => {
  const stickerSlots = generateStickerSlots(current, target)
  const progressPct = minutesIntoNext / stickerMinutes

  return (
    <View style={styles.stickerMeter}>
      <View style={styles.meterHeader}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={[styles.meterCount, { color }]}>
          {current}/{target} {getStickerEmoji(current)}
        </Text>
      </View>

      {/* Sticker slots */}
      <View style={styles.stickerRow}>
        {stickerSlots.map((slot, index) => (
          <StickerSlot
            key={index}
            filled={slot === 'filled'}
            color={color}
            size={target <= 5 ? 36 : 28} // Smaller slots for monthly view
          />
        ))}
      </View>

      {/* Progress to next Meret */}
      {showProgressBar && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Progress to next Meret: {minutesIntoNext}/{stickerMinutes} min
          </Text>
          <ProgressBar
            progress={progressPct}
            color={color}
            style={styles.progressBar}
          />
          <Text style={styles.progressPercent}>
            {Math.round(progressPct * 100)}%
          </Text>
        </View>
      )}
    </View>
  )
}

// Bonus qualification status
const BonusStatus: React.FC<BonusStatusProps> = ({ bonusQualification, userColor }) => {
  const { qualifiesForBonus, requirements, bonusMultiplier } = bonusQualification

  return (
    <Surface style={[
      styles.bonusCard,
      { 
        backgroundColor: qualifiesForBonus ? `${userColor}10` : '#FFF3E0',
        borderColor: qualifiesForBonus ? userColor : '#FF9800'
      }
    ]}>
      <View style={styles.bonusHeader}>
        <Text style={[
          styles.bonusTitle,
          { color: qualifiesForBonus ? userColor : '#FF9800' }
        ]}>
          {qualifiesForBonus ? '🎉 Bonus Qualified!' : '⏳ Bonus Progress'}
        </Text>
        {qualifiesForBonus && (
          <Chip 
            style={{ backgroundColor: `${userColor}20` }}
            textStyle={{ color: userColor, fontWeight: 'bold' }}
          >
            {bonusMultiplier}x multiplier
          </Chip>
        )}
      </View>

      {/* Requirements breakdown */}
      <View style={styles.requirementsList}>
        <View style={styles.requirementRow}>
          <Text style={[
            styles.requirementIcon,
            { color: requirements.stickerTarget.met ? '#4CAF50' : '#F44336' }
          ]}>
            {requirements.stickerTarget.met ? '✅' : '❌'}
          </Text>
          <Text style={styles.requirementText}>
            Weekly Merets: {requirements.stickerTarget.current}/{requirements.stickerTarget.required}
          </Text>
        </View>

        <View style={styles.requirementRow}>
          <Text style={[
            styles.requirementIcon,
            { color: requirements.repTarget.met ? '#4CAF50' : '#F44336' }
          ]}>
            {requirements.repTarget.met ? '✅' : '❌'}
          </Text>
          <Text style={styles.requirementText}>
            MentsRep: {requirements.repTarget.current.toFixed(1)}/{requirements.repTarget.required}
          </Text>
        </View>

        <View style={styles.requirementRow}>
          <Text style={[
            styles.requirementIcon,
            { color: requirements.missedCommitments.met ? '#4CAF50' : '#F44336' }
          ]}>
            {requirements.missedCommitments.met ? '✅' : '❌'}
          </Text>
          <Text style={styles.requirementText}>
            Missed ments: {requirements.missedCommitments.current}/{requirements.missedCommitments.required} max
          </Text>
        </View>
      </View>

      {qualifiesForBonus && (
        <Text style={styles.bonusMessage}>
          🌟 Your earnings this week get a {bonusMultiplier}x multiplier!
        </Text>
      )}
    </Surface>
  )
}

// Main sticker tracker component
export const StickerTracker: React.FC<StickerTrackerProps> = ({
  userId,
  userColor,
  compact = false
}) => {
  // Mock data - in real app, this would fetch from database
  const userTasks = MOCK_TASKS_FOR_STICKERS.filter(task => 
    userId === 'aveya' ? ['1', '2', '3', '4', '5'].includes(task.id) :
    ['6', '7', '8', '9'].includes(task.id)
  )

  const weekTasks = getCurrentWeekTasks(userTasks)
  const monthTasks = getCurrentMonthTasks(userTasks)

  const weeklyMonthly = computeWeeklyMonthly({
    weekTasks,
    monthTasks
  })

  const bonusQualification = checkBonusQualification({
    weeklyStickersEarned: weeklyMonthly.weekly.stickersEarned,
    currentRep: userId === 'aveya' ? 4.6 : 3.2, // Mock rep scores
    missedCommitments: userId === 'aveya' ? 0 : 1
  })

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactSection}>
          <Text style={styles.compactLabel}>This Week</Text>
          <View style={styles.compactStickerRow}>
            {generateStickerSlots(
              weeklyMonthly.weekly.stickersEarned, 
              weeklyMonthly.weekly.targetStickers
            ).slice(0, 3).map((slot, index) => ( // Show first 3 only
              <StickerSlot
                key={index}
                filled={slot === 'filled'}
                color={userColor}
                size={24}
              />
            ))}
            {weeklyMonthly.weekly.targetStickers > 3 && (
              <Text style={styles.compactMore}>+{weeklyMonthly.weekly.targetStickers - 3}</Text>
            )}
          </View>
        </View>

        <Text style={styles.compactProgress}>
          {weeklyMonthly.weekly.minutesIntoNext}/{weeklyMonthly.weekly.stickerMinutes} min to next
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Card style={[styles.trackerCard, { borderTopColor: userColor }]}>
        <LinearGradient
          colors={[`${userColor}08`, '#FFFFFF']}
          style={styles.cardGradient}
        >
          <Card.Content style={styles.cardContent}>
            {/* Header */}
            <Text style={[styles.cardTitle, { color: userColor }]}>
              🎯 Meret Progress
            </Text>

            {/* Weekly tracker */}
            <StickerMeter
              label="This Week"
              current={weeklyMonthly.weekly.stickersEarned}
              target={weeklyMonthly.weekly.targetStickers}
              minutesIntoNext={weeklyMonthly.weekly.minutesIntoNext}
              stickerMinutes={weeklyMonthly.weekly.stickerMinutes}
              color={userColor}
              showProgressBar={true}
            />

            {/* Monthly tracker */}
            <StickerMeter
              label="This Month"
              current={weeklyMonthly.monthly.stickersEarned}
              target={weeklyMonthly.monthly.targetStickers}
              minutesIntoNext={weeklyMonthly.monthly.minutesIntoNext}
              stickerMinutes={weeklyMonthly.monthly.stickerMinutes}
              color={userColor}
              showProgressBar={false} // Less prominent for monthly
            />

            {/* Summary stats */}
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {weeklyMonthly.weekly.totalCreditedMinutes}
                </Text>
                <Text style={styles.statLabel}>Credited Minutes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {weekTasks.filter(t => t.status === 'HONORED').length}
                </Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {weekTasks.filter(t => t.qualityStars === 5).length}
                </Text>
                <Text style={styles.statLabel}>Perfect Quality</Text>
              </View>
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>

      {/* Bonus qualification status */}
      <BonusStatus
        bonusQualification={bonusQualification}
        userColor={userColor}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  trackerCard: {
    borderTopWidth: 4,
    elevation: 3,
    marginBottom: 12,
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Sticker meter styles
  stickerMeter: {
    marginBottom: 24,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  meterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  meterCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  stickerSlot: {
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  stickerEmoji: {
    fontSize: 20,
  },
  
  // Progress section
  progressSection: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  progressBar: {
    width: '100%',
    height: 8,
    marginBottom: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  
  // Summary stats
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Bonus status styles
  bonusCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    elevation: 2,
  },
  bonusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requirementsList: {
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  requirementText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bonusMessage: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Compact styles
  compactContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  compactSection: {
    marginBottom: 8,
  },
  compactLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  compactStickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactMore: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  compactProgress: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
})