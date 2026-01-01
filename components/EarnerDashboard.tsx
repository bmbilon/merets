import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Surface, Text, ProgressBar, Chip, Avatar, Divider, Button } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import SubmitWorkModal from './SubmitWorkModal';
import AnimatedProgressBar from './AnimatedProgressBar';
import StreakDisplay from './StreakDisplay';
import Leaderboard from './Leaderboard';

interface EarnerDashboardProps {
  userName: string;
  userColor: string;
  rep: number;
  totalMerets: number;
  totalCredits: number;
  activeMents: number;
  completedMents: number;
  userId?: string;
  currentStreak?: number;
  longestStreak?: number;
}

export default function EarnerDashboard({
  userName,
  userColor,
  rep,
  totalMerets,
  totalCredits,
  activeMents,
  completedMents,
  userId,
  currentStreak = 0,
  longestStreak = 0
}: EarnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history'>('overview');
  const [activeCommitments, setActiveCommitments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<any>(null);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (userId && activeTab === 'active') {
      fetchActiveCommitments();
    }
  }, [userId, activeTab]);

  const fetchActiveCommitments = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Import SupabaseService dynamically to avoid circular dependencies
      const { SupabaseService } = await import('@/lib/supabase-service');
      const commitments = await SupabaseService.getUserCommitments(userId, 'in_progress');
      setActiveCommitments(commitments);
    } catch (error) {
      console.error('Error fetching active commitments:', error);
    } finally {
      setLoading(false);
    }
  };

  const repLevel = Math.floor(rep / 20); // 0-5 levels
  const repProgress = (rep % 20) / 20;
  const repLabels = ['Newcomer', 'Learner', 'Contributor', 'Reliable', 'Trusted', 'Elite'];
  
  // Calculate level from XP (100 XP per level)
  const level = Math.floor(rep / 100) + 1;
  const xpInCurrentLevel = rep % 100;
  const xpForNextLevel = 100;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header with Rep Badge */}
      <View style={{ 
        backgroundColor: userColor,
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Avatar.Text 
            size={64} 
            label={userName[0]} 
            style={{ backgroundColor: '#fff', marginRight: 16 }}
            labelStyle={{ color: userColor }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
              {userName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconSymbol size={20} name="star.fill" color="#FFD700" />
              <Text variant="titleMedium" style={{ color: '#fff', fontWeight: '600' }}>
                {repLabels[repLevel]}
              </Text>
            </View>
          </View>
        </View>

        {/* Rep Progress */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 16,
          padding: 16
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text variant="bodyMedium" style={{ color: '#fff', fontWeight: '600' }}>
              Rep: {rep}/100
            </Text>
            <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {Math.round(repProgress * 100)}% to next level
            </Text>
          </View>
          <ProgressBar 
            progress={repProgress} 
            color="#FFD700"
            style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={{ 
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
      }}>
        {(['overview', 'active', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1 }}
          >
            <View style={{
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: activeTab === tab ? userColor : '#f5f5f5',
              alignItems: 'center'
            }}>
              <Text 
                variant="bodyMedium" 
                style={{ 
                  fontWeight: '600',
                  color: activeTab === tab ? '#fff' : '#666'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {activeTab === 'overview' && (
          <>
            {/* Progress Bar */}
            <Surface style={{ 
              borderRadius: 16, 
              padding: 16, 
              backgroundColor: '#fff',
              elevation: 2,
              marginBottom: 16
            }}>
              <AnimatedProgressBar
                currentXP={xpInCurrentLevel}
                maxXP={xpForNextLevel}
                level={level}
                color="#9C27B0"
                showLabel={true}
              />
            </Surface>

            {/* Streak Display */}
            <View style={{ marginBottom: 16 }}>
              <StreakDisplay
                currentStreak={currentStreak}
                longestStreak={longestStreak}
                compact={false}
              />
            </View>

            {/* Stats Grid */}
            <View style={{ 
              flexDirection: 'row',
              gap: 12,
              marginBottom: 20
            }}>
              <Surface style={{ 
                flex: 1,
                borderRadius: 16,
                padding: 16,
                backgroundColor: '#fff',
                elevation: 2
              }}>
                <IconSymbol size={24} name="dollarsign.circle.fill" color="#4CAF50" style={{ marginBottom: 8 }} />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50', marginBottom: 4 }}>
                  ${totalCredits}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  Total Earned
                </Text>
              </Surface>

              <Surface style={{ 
                flex: 1,
                borderRadius: 16,
                padding: 16,
                backgroundColor: '#fff',
                elevation: 2
              }}>
                <IconSymbol size={24} name="checkmark.circle.fill" color="#2196F3" style={{ marginBottom: 8 }} />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#2196F3', marginBottom: 4 }}>
                  {completedMents}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  Completed
                </Text>
              </Surface>
            </View>

            {/* Active Ments Section */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  Active Ments
                </Text>
                <Chip compact style={{ backgroundColor: userColor }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{activeMents}</Text>
                </Chip>
              </View>

              {activeMents === 0 ? (
                <Surface style={{ 
                  borderRadius: 16,
                  padding: 24,
                  backgroundColor: '#fff',
                  elevation: 2,
                  alignItems: 'center'
                }}>
                  <IconSymbol size={48} name="tray" color="#ccc" style={{ marginBottom: 12 }} />
                  <Text variant="bodyLarge" style={{ color: '#999', textAlign: 'center' }}>
                    No active ments
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#999', textAlign: 'center', marginTop: 4 }}>
                    Browse the marketplace to get started!
                  </Text>
                </Surface>
              ) : (
                <Surface style={{ 
                  borderRadius: 16,
                  padding: 16,
                  backgroundColor: '#fff',
                  elevation: 2
                }}>
                  <Text variant="bodyMedium">Active ments list would go here</Text>
                </Surface>
              )}
            </View>

            {/* Leaderboard */}
            <View>
              <Leaderboard currentUserId={userId} compact={true} />
            </View>
          </>
        )}

        {activeTab === 'active' && (
          <View>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16 }}>
              Active Ments ({activeCommitments.length})
            </Text>
            {loading ? (
              <Surface style={{ 
                borderRadius: 16,
                padding: 32,
                backgroundColor: '#fff',
                elevation: 2,
                alignItems: 'center'
              }}>
                <Text variant="bodyMedium" style={{ color: '#666' }}>
                  Loading...
                </Text>
              </Surface>
            ) : activeCommitments.length === 0 ? (
              <Surface style={{ 
                borderRadius: 16,
                padding: 32,
                backgroundColor: '#fff',
                elevation: 2,
                alignItems: 'center'
              }}>
                <IconSymbol size={64} name="list.bullet.rectangle" color="#ccc" style={{ marginBottom: 16 }} />
                <Text variant="headlineSmall" style={{ color: '#999', textAlign: 'center', marginBottom: 8 }}>
                  No Active Ments
                </Text>
                <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
                  Commit to a ment from the marketplace to get started earning!
                </Text>
              </Surface>
            ) : (
              <View style={{ gap: 12 }}>
                {activeCommitments.map((commitment) => (
                  <Surface key={commitment.id} style={{ 
                    borderRadius: 16,
                    padding: 16,
                    backgroundColor: '#fff',
                    elevation: 2,
                    borderLeftWidth: 4,
                    borderLeftColor: '#4CAF50'
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {commitment.custom_title || 'Task'}
                        </Text>
                        <Text variant="bodySmall" style={{ color: '#666' }}>
                          {commitment.skill_category} • {commitment.effort_minutes} min
                        </Text>
                      </View>
                      <Chip compact style={{ backgroundColor: '#E8F5E9' }}>
                        <Text style={{ color: '#2E7D32', fontWeight: '600', fontSize: 11 }}>In Progress</Text>
                      </Chip>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 12 }}>
                      <IconSymbol size={16} name="dollarsign.circle.fill" color="#4CAF50" />
                      <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#4CAF50' }}>
                        ${(commitment.pay_cents / 100).toFixed(2)}
                      </Text>
                    </View>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setSelectedCommitment(commitment);
                        setShowSubmitModal(true);
                      }}
                      style={{ borderRadius: 12 }}
                      contentStyle={{ paddingVertical: 4 }}
                      buttonColor="#2196F3"
                    >
                      Submit for Approval
                    </Button>
                  </Surface>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16 }}>
              Completed Ments ({completedMents})
            </Text>
            <Surface style={{ 
              borderRadius: 16,
              padding: 16,
              backgroundColor: '#fff',
              elevation: 2
            }}>
              <Text variant="bodyMedium" style={{ color: '#666' }}>
                History list would go here
              </Text>
            </Surface>
          </View>
        )}
      </ScrollView>

      {/* Submit Work Modal */}
      {selectedCommitment && (
        <SubmitWorkModal
          visible={showSubmitModal}
          onDismiss={() => setShowSubmitModal(false)}
          mentId={selectedCommitment.id}
          mentTitle={selectedCommitment.custom_title || 'Task'}
          userId={userId || ''}
          onSuccess={() => {
            fetchActiveCommitments();
          }}
        />
      )}
    </View>
  );
}
