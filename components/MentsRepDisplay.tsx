import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { 
  Text, 
  Card, 
  ProgressBar, 
  Chip, 
  Divider, 
  IconButton,
  Surface,
  Portal,
  Modal
} from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import {
  DetailedReputation,
  ReputationLevel,
  formatMentsRep,
  getStarDisplay,
  getReputationColor,
  getReputationEmoji,
  calculateComprehensiveReputation,
  MOCK_MENT_RECORDS
} from '../lib/systems/ments-rep'

interface MentsRepDisplayProps {
  userId: string;
  userColor: string;
  compact?: boolean; // If true, shows minimal version
  showParentView?: boolean; // If true, shows detailed parent analytics
}

interface MentsRepDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  reputation: DetailedReputation;
  userColor: string;
  userId: string;
}

// Detailed modal for reputation breakdown
const MentsRepDetailModal: React.FC<MentsRepDetailModalProps> = ({
  visible,
  onDismiss,
  reputation,
  userColor,
  userId
}) => {
  const renderSubscoreBar = (label: string, score: number, color: string) => (
    <View style={styles.subscoreContainer}>
      <View style={styles.subscoreHeader}>
        <Text style={styles.subscoreLabel}>{label}</Text>
        <Text style={[styles.subscoreValue, { color }]}>
          {formatMentsRep(score)}
        </Text>
      </View>
      <ProgressBar
        progress={score / 5}
        color={color}
        style={styles.subscoreBar}
      />
    </View>
  )

  const renderQualityDistribution = () => {
    const { perfect, pass, miss } = reputation.stats.qualityDistribution
    const total = perfect + pass + miss
    if (total === 0) return null

    return (
      <View style={styles.qualitySection}>
        <Text style={styles.sectionTitle}>Quality Breakdown</Text>
        <View style={styles.qualityGrid}>
          <View style={styles.qualityItem}>
            <Text style={styles.qualityNumber}>{perfect}</Text>
            <Text style={[styles.qualityLabel, { color: '#4CAF50' }]}>Perfect</Text>
          </View>
          <View style={styles.qualityItem}>
            <Text style={styles.qualityNumber}>{pass}</Text>
            <Text style={[styles.qualityLabel, { color: '#FF9800' }]}>Pass</Text>
          </View>
          <View style={styles.qualityItem}>
            <Text style={styles.qualityNumber}>{miss}</Text>
            <Text style={[styles.qualityLabel, { color: '#F44336' }]}>Miss</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Card style={styles.modalCard}>
          <LinearGradient
            colors={[`${userColor}15`, `${userColor}05`, '#FFFFFF']}
            style={styles.modalGradient}
          >
            <Card.Content style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: userColor }]}>
                    {getReputationEmoji(reputation.repLevel)} MentsRep™ Details
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {reputation.repLevel} Level
                  </Text>
                </View>
                <IconButton 
                  icon="close" 
                  onPress={onDismiss}
                  style={styles.closeButton}
                />
              </View>

              <Divider style={styles.modalDivider} />

              {/* Main Score */}
              <View style={styles.mainScoreContainer}>
                <Text style={[styles.mainScore, { color: userColor }]}>
                  {formatMentsRep(reputation.mentsRep)} / 5.0
                </Text>
                <Text style={styles.starDisplay}>
                  {getStarDisplay(reputation.mentsRep)}
                </Text>
              </View>

              {/* Subscores */}
              <View style={styles.subscoresSection}>
                <Text style={styles.sectionTitle}>Component Scores</Text>
                {renderSubscoreBar('Reliability', reputation.reliability, '#4CAF50')}
                {renderSubscoreBar('Quality', reputation.quality, '#2196F3')}
                {renderSubscoreBar('Experience', reputation.experience, '#FF9800')}
              </View>

              {/* Quality Distribution */}
              {renderQualityDistribution()}

              {/* Stats */}
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{reputation.stats.totalCompleted}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{reputation.stats.totalMissed}</Text>
                    <Text style={styles.statLabel}>Missed</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{reputation.stats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[
                      styles.statNumber, 
                      { color: reputation.stats.recentTrend === 'UP' ? '#4CAF50' : 
                               reputation.stats.recentTrend === 'DOWN' ? '#F44336' : '#666' }
                    ]}>
                      {reputation.stats.recentTrend === 'UP' ? '↗' : 
                       reputation.stats.recentTrend === 'DOWN' ? '↘' : '→'}
                    </Text>
                    <Text style={styles.statLabel}>Trend</Text>
                  </View>
                </View>
              </View>

              {/* Next Milestone */}
              {reputation.nextMilestone && (
                <View style={styles.milestoneSection}>
                  <Text style={styles.sectionTitle}>Next Goal</Text>
                  <Surface style={[styles.milestoneCard, { backgroundColor: `${userColor}10` }]}>
                    <Text style={styles.milestoneTarget}>
                      ⭐ {reputation.nextMilestone.target.toFixed(1)} Rep
                    </Text>
                    <Text style={styles.milestoneDescription}>
                      {reputation.nextMilestone.description}
                    </Text>
                    <Text style={styles.milestoneProgress}>
                      ~{reputation.nextMilestone.mentsToGo} more perfect ments to go
                    </Text>
                  </Surface>
                </View>
              )}

              {/* Benefits & Restrictions */}
              {reputation.benefits.length > 0 && (
                <View style={styles.benefitsSection}>
                  <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>
                    ✅ Current Benefits
                  </Text>
                  {reputation.benefits.map((benefit, index) => (
                    <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
                  ))}
                </View>
              )}

              {reputation.restrictions.length > 0 && (
                <View style={styles.restrictionsSection}>
                  <Text style={[styles.sectionTitle, { color: '#F44336' }]}>
                    🚫 Current Restrictions
                  </Text>
                  {reputation.restrictions.map((restriction, index) => (
                    <Text key={index} style={styles.restrictionItem}>• {restriction}</Text>
                  ))}
                </View>
              )}
            </Card.Content>
          </LinearGradient>
        </Card>
      </Modal>
    </Portal>
  )
}

// Main MentsRep display component
export const MentsRepDisplay: React.FC<MentsRepDisplayProps> = ({
  userId,
  userColor,
  compact = false,
  showParentView = false
}) => {
  const [showDetails, setShowDetails] = useState(false)

  // Mock: In real app, this would fetch from database
  const userMents = MOCK_MENT_RECORDS.filter(m => m.userId === userId)
  const reputation = calculateComprehensiveReputation(userMents)

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setShowDetails(true)
  }

  const repColor = getReputationColor(reputation.repLevel)

  if (compact) {
    return (
      <TouchableOpacity onPress={handlePress}>
        <Surface style={[styles.compactContainer, { backgroundColor: `${repColor}20` }]}>
          <View style={styles.compactContent}>
<Text style={styles.compactLabel}>Rep</Text>
            <Text style={[styles.compactScore, { color: repColor }]}>
              {formatMentsRep(reputation.mentsRep)}
            </Text>
          </View>
          <Text style={styles.compactEmoji}>
            {getReputationEmoji(reputation.repLevel)}
          </Text>
        </Surface>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.touchable}>
        <Card style={[styles.card, { borderTopColor: repColor }]}>
          <LinearGradient
            colors={[`${repColor}15`, `${repColor}08`, '#FFFFFF']}
            style={styles.cardGradient}
          >
            <Card.Content style={styles.cardContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
<Text style={styles.mentsRepLabel}>
                    Rep {getReputationEmoji(reputation.repLevel)}
                  </Text>
                  <Text style={[styles.levelText, { color: repColor }]}>
                    {reputation.repLevel} Level
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <Text style={[styles.mainScore, { color: repColor }]}>
                    {formatMentsRep(reputation.mentsRep)}
                  </Text>
                  <Text style={styles.starDisplay}>
                    {getStarDisplay(reputation.mentsRep)}
                  </Text>
                </View>
              </View>

              {!showParentView && (
<Text style={styles.tooltip}>
                  Based on completed work and quality
                </Text>
              )}

              {/* Progress bars for subscores */}
              <View style={styles.subscoresContainer}>
                <View style={styles.subscoreRow}>
                  <Text style={styles.subscoreLabel}>Reliability</Text>
                  <ProgressBar
                    progress={reputation.reliability / 5}
                    color="#4CAF50"
                    style={styles.subscoreBarSmall}
                  />
                </View>
                <View style={styles.subscoreRow}>
                  <Text style={styles.subscoreLabel}>Quality</Text>
                  <ProgressBar
                    progress={reputation.quality / 5}
                    color="#2196F3"
                    style={styles.subscoreBarSmall}
                  />
                </View>
                <View style={styles.subscoreRow}>
                  <Text style={styles.subscoreLabel}>Experience</Text>
                  <ProgressBar
                    progress={reputation.experience / 5}
                    color="#FF9800"
                    style={styles.subscoreBarSmall}
                  />
                </View>
              </View>

              {/* Parent view extras */}
              {showParentView && (
                <View style={styles.parentExtras}>
                  <Divider style={styles.parentDivider} />
                  <View style={styles.parentStats}>
                    <Text style={styles.parentStatText}>
                      Completion: {Math.round((reputation.stats.totalCompleted / Math.max(1, reputation.stats.totalAccepted)) * 100)}%
                    </Text>
                    <Text style={styles.parentStatText}>
                      Missed: {reputation.stats.totalMissed}
                    </Text>
                    <Text style={styles.parentStatText}>
                      Trend: {reputation.stats.recentTrend}
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </LinearGradient>
        </Card>
      </TouchableOpacity>

      {/* Detail Modal */}
      <MentsRepDetailModal
        visible={showDetails}
        onDismiss={() => setShowDetails(false)}
        reputation={reputation}
        userColor={userColor}
        userId={userId}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  touchable: {
    borderRadius: 12,
  },
  card: {
    borderTopWidth: 4,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  mentsRepLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  starDisplay: {
    fontSize: 16,
    color: '#FFD700',
  },
  tooltip: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  subscoresContainer: {
    gap: 8,
  },
  subscoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscoreLabel: {
    fontSize: 12,
    color: '#666',
    width: 70,
  },
  subscoreBarSmall: {
    flex: 1,
    height: 6,
  },
  parentExtras: {
    marginTop: 12,
  },
  parentDivider: {
    marginBottom: 8,
  },
  parentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  parentStatText: {
    fontSize: 12,
    color: '#666',
  },
  
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    elevation: 2,
  },
  compactContent: {
    flex: 1,
  },
  compactLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  compactScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactEmoji: {
    fontSize: 20,
    marginLeft: 8,
  },
  
  // Modal styles
  modalContainer: {
    margin: 20,
    maxHeight: '90%',
  },
  modalCard: {
    elevation: 8,
  },
  modalGradient: {
    borderRadius: 12,
  },
  modalContent: {
    padding: 24,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    margin: 0,
  },
  modalDivider: {
    marginBottom: 20,
  },
  mainScoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subscoresSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subscoreContainer: {
    marginBottom: 12,
  },
  subscoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subscoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subscoreBar: {
    height: 8,
  },
  qualitySection: {
    marginBottom: 20,
  },
  qualityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qualityItem: {
    alignItems: 'center',
  },
  qualityNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  qualityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  milestoneSection: {
    marginBottom: 20,
  },
  milestoneCard: {
    padding: 16,
    borderRadius: 12,
  },
  milestoneTarget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  milestoneProgress: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitItem: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  restrictionsSection: {
    marginBottom: 16,
  },
  restrictionItem: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 4,
  },
})