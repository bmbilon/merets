import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar, Chip, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import RepBadge from './RepBadge';
import RepHistory from './RepHistory';
import { supabase } from '@/lib/supabase';
import { getRepTier, getRepProgress, getRepPrivileges } from '@/lib/rep-service';

interface RepProfileProps {
  userId: string;
  userName: string;
}

interface RepStats {
  repScore: number;
  totalCommitments: number;
  completedCommitments: number;
  failedCommitments: number;
  averageQuality: number;
  consistencyScore: number;
  completionRate: number;
}

export default function RepProfile({ userId, userName }: RepProfileProps) {
  const [stats, setStats] = useState<RepStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadRepStats();
  }, [userId]);

  const loadRepStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          rep_score,
          total_commitments,
          completed_commitments,
          failed_commitments,
          average_quality_rating,
          consistency_score
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const completionRate = data.total_commitments > 0
          ? Math.round((data.completed_commitments / data.total_commitments) * 100)
          : 0;

        setStats({
          repScore: data.rep_score || 10,
          totalCommitments: data.total_commitments || 0,
          completedCommitments: data.completed_commitments || 0,
          failedCommitments: data.failed_commitments || 0,
          averageQuality: data.average_quality_rating || 0,
          consistencyScore: data.consistency_score || 0,
          completionRate
        });
      }
    } catch (error) {
      console.error('Error loading Rep stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Rep profile...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load Rep profile</Text>
      </View>
    );
  }

  const tierInfo = getRepTier(stats.repScore);
  const progress = getRepProgress(stats.repScore);
  const privileges = getRepPrivileges(stats.repScore);

  if (showHistory) {
    return (
      <View style={styles.container}>
        <View style={styles.backButton}>
          <Chip
            icon="arrow-left"
            onPress={() => setShowHistory(false)}
            mode="outlined"
          >
            Back to Profile
          </Chip>
        </View>
        <RepHistory userId={userId} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Rep Badge */}
      <LinearGradient
        colors={[tierInfo.color, tierInfo.color + 'CC']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{userName}'s Reputation</Text>
        <View style={styles.repBadgeContainer}>
          <RepBadge
            repScore={stats.repScore}
            variant="full"
            showProgress={true}
            showPrivileges={false}
          />
        </View>
      </LinearGradient>

      {/* Privileges Section */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🎁 Rep Privileges</Text>
        </View>
        <View style={styles.privilegesGrid}>
          <View style={[
            styles.privilegeCard,
            privileges.payMultiplier > 1.0 && styles.privilegeCardActive
          ]}>
            <Text style={styles.privilegeEmoji}>💰</Text>
            <Text style={styles.privilegeTitle}>Pay Bonus</Text>
            <Text style={styles.privilegeValue}>
              {privileges.payMultiplier > 1.0
                ? `+${Math.round((privileges.payMultiplier - 1) * 100)}%`
                : 'Locked'}
            </Text>
            <Text style={styles.privilegeRequirement}>
              {privileges.payMultiplier >= 1.25 ? 'Unlocked!' : 'Requires 50+ Rep'}
            </Text>
          </View>

          <View style={[
            styles.privilegeCard,
            privileges.canAutoApprove && styles.privilegeCardActive
          ]}>
            <Text style={styles.privilegeEmoji}>✅</Text>
            <Text style={styles.privilegeTitle}>Auto-Approve</Text>
            <Text style={styles.privilegeValue}>
              {privileges.canAutoApprove ? 'Active' : 'Locked'}
            </Text>
            <Text style={styles.privilegeRequirement}>
              {privileges.canAutoApprove ? 'Unlocked!' : 'Requires 80+ Rep'}
            </Text>
          </View>

          <View style={[
            styles.privilegeCard,
            privileges.canInstantPay && styles.privilegeCardActive
          ]}>
            <Text style={styles.privilegeEmoji}>⚡</Text>
            <Text style={styles.privilegeTitle}>Instant Pay</Text>
            <Text style={styles.privilegeValue}>
              {privileges.canInstantPay ? 'Active' : 'Locked'}
            </Text>
            <Text style={styles.privilegeRequirement}>
              {privileges.canInstantPay ? 'Unlocked!' : 'Requires 90+ Rep'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Stats Breakdown */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📊 Rep Factors</Text>
          <Text style={styles.cardSubtitle}>What contributes to your Rep score</Text>
        </View>

        {/* Completion Rate */}
        <View style={styles.factorRow}>
          <View style={styles.factorHeader}>
            <Text style={styles.factorLabel}>Completion Rate</Text>
            <Text style={styles.factorValue}>{stats.completionRate}%</Text>
          </View>
          <ProgressBar
            progress={stats.completionRate / 100}
            color="#4CAF50"
            style={styles.progressBar}
          />
          <Text style={styles.factorDescription}>
            {stats.completedCommitments} of {stats.totalCommitments} tasks completed
          </Text>
          <Text style={styles.factorWeight}>Weight: 40% of Rep score</Text>
        </View>

        {/* Quality Score */}
        <View style={styles.factorRow}>
          <View style={styles.factorHeader}>
            <Text style={styles.factorLabel}>Quality Score</Text>
            <Text style={styles.factorValue}>
              {stats.averageQuality > 0 ? `${stats.averageQuality.toFixed(1)} ⭐` : 'No ratings yet'}
            </Text>
          </View>
          <ProgressBar
            progress={stats.averageQuality / 5}
            color="#FF9800"
            style={styles.progressBar}
          />
          <Text style={styles.factorDescription}>
            Average quality rating from parents
          </Text>
          <Text style={styles.factorWeight}>Weight: 30% of Rep score</Text>
        </View>

        {/* Consistency */}
        <View style={styles.factorRow}>
          <View style={styles.factorHeader}>
            <Text style={styles.factorLabel}>Consistency</Text>
            <Text style={styles.factorValue}>
              {Math.round(stats.consistencyScore * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={stats.consistencyScore}
            color="#2196F3"
            style={styles.progressBar}
          />
          <Text style={styles.factorDescription}>
            Based on streak and recent activity
          </Text>
          <Text style={styles.factorWeight}>Weight: 15% of Rep score</Text>
        </View>

        {/* Volume */}
        <View style={styles.factorRow}>
          <View style={styles.factorHeader}>
            <Text style={styles.factorLabel}>Volume Bonus</Text>
            <Text style={styles.factorValue}>{stats.completedCommitments} tasks</Text>
          </View>
          <ProgressBar
            progress={Math.min(1, stats.completedCommitments / 100)}
            color="#9C27B0"
            style={styles.progressBar}
          />
          <Text style={styles.factorDescription}>
            More completed tasks = higher bonus
          </Text>
          <Text style={styles.factorWeight}>Weight: 10% of Rep score</Text>
        </View>

        {/* Failures */}
        {stats.failedCommitments > 0 && (
          <View style={styles.factorRow}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorLabel}>Failure Penalty</Text>
              <Text style={[styles.factorValue, styles.factorValueNegative]}>
                {stats.failedCommitments} failures
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(1, stats.failedCommitments / 10)}
              color="#F44336"
              style={styles.progressBar}
            />
            <Text style={styles.factorDescription}>
              Failed or cancelled tasks reduce Rep
            </Text>
            <Text style={styles.factorWeight}>Penalty: Up to -5% of Rep score</Text>
          </View>
        )}
      </Card>

      {/* View History Button */}
      <View style={styles.historyButtonContainer}>
        <Chip
          icon="history"
          mode="outlined"
          onPress={() => setShowHistory(true)}
          style={styles.historyButton}
        >
          View Rep History
        </Chip>
      </View>

      {/* Tips Section */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>💡 Tips to Improve Rep</Text>
        </View>
        <View style={styles.tipsList}>
          <View style={styles.tipRow}>
            <Text style={styles.tipEmoji}>✅</Text>
            <Text style={styles.tipText}>Complete tasks consistently to build your completion rate</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipEmoji}>⭐</Text>
            <Text style={styles.tipText}>Deliver high-quality work to earn 5-star ratings</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipEmoji}>🔥</Text>
            <Text style={styles.tipText}>Maintain your streak by completing tasks daily</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipEmoji}>⚠️</Text>
            <Text style={styles.tipText}>Avoid cancelling or failing tasks - Rep drops quickly!</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipEmoji}>📈</Text>
            <Text style={styles.tipText}>Rep earned slowly, lost quickly - be consistent!</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  repBadgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButton: {
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  privilegesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  privilegeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  privilegeCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  privilegeEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  privilegeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  privilegeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  privilegeRequirement: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  factorRow: {
    marginBottom: 20,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  factorValueNegative: {
    color: '#F44336',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginBottom: 6,
  },
  factorDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  factorWeight: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  historyButtonContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  historyButton: {
    paddingHorizontal: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
