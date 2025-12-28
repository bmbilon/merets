import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { 
  Text, 
  Card, 
  Button, 
  IconButton, 
  ProgressBar, 
  Chip, 
  Divider,
  Surface
} from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { 
  SkillId, 
  SkillLevel, 
  SKILLS, 
  SKILL_CERTIFICATIONS,
  SkillProgress 
} from '../../lib/systems/skills-system'

// Mock user skill progress data - in real app this would come from database
const MOCK_USER_SKILLS: Record<SkillId, SkillProgress> = {
  LAUNDRY: { level: 3, xp: 420, completions: 18, perfects: 5, lastLeveledAt: Date.now() },
  DISHES: { level: 2, xp: 180, completions: 12, perfects: 4 },
  CLEANING: { level: 1, xp: 80, completions: 6, perfects: 2 },
  COOKING: { level: 1, xp: 45, completions: 3, perfects: 1 },
  YARD: { level: 2, xp: 220, completions: 14, perfects: 3 },
  TOOLS: { level: 1, xp: 15, completions: 1, perfects: 0 }
}

export default function SkillCertificationScreen() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>()
  const [userSkills, setUserSkills] = useState(MOCK_USER_SKILLS)
  
  if (!skillId || !(skillId as SkillId in SKILLS)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall">Skill not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    )
  }

  const skill = SKILLS[skillId as SkillId]
  const userProgress = userSkills[skillId as SkillId]
  const currentLevel = userProgress.level
  const currentCert = SKILL_CERTIFICATIONS[skillId as SkillId][currentLevel]
  const nextLevel = Math.min(4, currentLevel + 1) as SkillLevel
  const nextCert = currentLevel < 4 ? SKILL_CERTIFICATIONS[skillId as SkillId][nextLevel] : null

  const progressToNext = currentLevel < 4 ? 
    Math.min(1, userProgress.perfects / currentCert.perfectsRequired) : 1

  const handlePracticeTask = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // Navigate to task creation or marketplace filtered by this skill
    router.push('/(tabs)/aveya-dashboard')
  }

  const getSkillIcon = (skillId: SkillId) => {
    const icons: Record<SkillId, string> = {
      LAUNDRY: '👕',
      DISHES: '🍽️',
      CLEANING: '🧽',
      COOKING: '🍳',
      YARD: '🌱',
      TOOLS: '🔧'
    }
    return icons[skillId] || '⚡'
  }

  const renderProgressBar = () => {
    const segments = currentCert.perfectsRequired
    const completed = userProgress.perfects
    const segmentWidth = 100 / segments

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          {Array.from({ length: segments }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                {
                  width: `${segmentWidth}%`,
                  backgroundColor: i < completed ? skill.color : '#E0E0E0'
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          {completed} / {segments} perfect completions
        </Text>
      </View>
    )
  }

  const renderRequirement = (requirement: string, index: number) => {
    const isCompleted = userProgress.perfects >= currentCert.perfectsRequired / 3 * (index + 1)
    
    return (
      <View key={index} style={styles.requirementRow}>
        <Text style={[
          styles.requirementIcon,
          { color: isCompleted ? '#4CAF50' : '#E0E0E0' }
        ]}>
          {isCompleted ? '✓' : '○'}
        </Text>
        <Text style={[
          styles.requirementText,
          { 
            color: isCompleted ? '#333' : '#999',
            textDecorationLine: isCompleted ? 'line-through' : 'none'
          }
        ]}>
          {requirement}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[`${skill.color}15`, `${skill.color}05`, '#FFFFFF']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <IconButton 
              icon="arrow-left" 
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <View style={styles.headerContent}>
              <Text style={[styles.skillName, { color: skill.color }]}>
                {getSkillIcon(skillId as SkillId)} {skill.name}
              </Text>
              <Text style={styles.skillDescription}>
                {skill.description}
              </Text>
            </View>
          </View>

          {/* Current Level Card */}
          <Card style={[styles.levelCard, { borderTopColor: skill.color }]}>
            <LinearGradient
              colors={[`${skill.color}08`, '#FFFFFF']}
              style={styles.cardGradient}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.levelHeader}>
                  <View>
                    <Text style={styles.levelTitle}>
                      Level {currentLevel}
                    </Text>
                    <Text style={[styles.certTitle, { color: skill.color }]}>
                      {currentCert.title}
                    </Text>
                  </View>
                  <Surface style={[styles.rateBadge, { backgroundColor: `${skill.color}20` }]}>
                    <Text style={[styles.rateText, { color: skill.color }]}>
                      ${currentCert.hourlyRate}/hr
                    </Text>
                  </Surface>
                </View>

                <Divider style={styles.divider} />

                {/* Requirements */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Requirements:</Text>
                  {currentCert.requirements.map(renderRequirement)}
                </View>

                {/* Progress */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Progress:</Text>
                  {renderProgressBar()}
                </View>

                {/* Practice Button */}
                <Button
                  mode="contained"
                  onPress={handlePracticeTask}
                  style={[styles.practiceButton, { backgroundColor: skill.color }]}
                  icon={() => <Text style={styles.buttonIcon}>🎯</Text>}
                >
                  Practice Tasks
                </Button>
              </Card.Content>
            </LinearGradient>
          </Card>

          {/* Next Level Preview */}
          {nextCert && (
            <Card style={styles.nextLevelCard}>
              <Card.Content>
                <View style={styles.lockedHeader}>
                  <Text style={styles.lockedIcon}>🔒</Text>
                  <View>
                    <Text style={styles.lockedLevel}>
                      Level {nextLevel}
                    </Text>
                    <Text style={styles.lockedTitle}>
                      {nextCert.title}
                    </Text>
                  </View>
                  <Surface style={styles.lockedRateBadge}>
                    <Text style={styles.lockedRateText}>
                      ${nextCert.hourlyRate}/hr
                    </Text>
                  </Surface>
                </View>

                <Divider style={[styles.divider, { backgroundColor: '#E0E0E0' }]} />

                <Text style={styles.unlockText}>
                  Complete {currentCert.perfectsRequired - userProgress.perfects} more perfect tasks to unlock
                </Text>

                <View style={styles.nextRequirements}>
                  {nextCert.requirements.map((req, index) => (
                    <View key={index} style={styles.lockedRequirementRow}>
                      <Text style={styles.lockedRequirementIcon}>○</Text>
                      <Text style={styles.lockedRequirementText}>{req}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Max Level Achievement */}
          {currentLevel === 4 && (
            <Card style={[styles.achievementCard, { borderColor: '#FFD700' }]}>
              <Card.Content style={styles.achievementContent}>
                <Text style={styles.achievementIcon}>🏆</Text>
                <Text style={styles.achievementTitle}>Master Achieved!</Text>
                <Text style={styles.achievementText}>
                  You've reached the highest level in {skill.name}. 
                  Keep practicing to maintain your mastery!
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Stats Summary */}
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text style={styles.statsTitle}>Your {skill.name} Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userProgress.completions}</Text>
                  <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userProgress.perfects}</Text>
                  <Text style={styles.statLabel}>Perfect Ratings</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {Math.round((userProgress.perfects / Math.max(1, userProgress.completions)) * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Perfect Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userProgress.xp}</Text>
                  <Text style={styles.statLabel}>Total XP</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  skillName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  skillDescription: {
    fontSize: 16,
    color: '#666',
  },
  levelCard: {
    marginBottom: 16,
    borderTopWidth: 4,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  certTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rateBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
  },
  rateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
  },
  requirementText: {
    fontSize: 16,
    flex: 1,
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    width: '100%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressSegment: {
    height: '100%',
    marginRight: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  practiceButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  buttonIcon: {
    fontSize: 16,
  },
  nextLevelCard: {
    marginBottom: 16,
    opacity: 0.8,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  lockedLevel: {
    fontSize: 16,
    color: '#999',
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  lockedRateBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  lockedRateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  unlockText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  nextRequirements: {
    marginTop: 8,
  },
  lockedRequirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  lockedRequirementIcon: {
    fontSize: 16,
    color: '#CCC',
    marginRight: 12,
    width: 20,
  },
  lockedRequirementText: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  achievementCard: {
    marginBottom: 16,
    borderWidth: 2,
  },
  achievementContent: {
    alignItems: 'center',
    padding: 20,
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
})