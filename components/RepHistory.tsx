import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { getUserRepHistory } from '@/lib/rep-calculator';
import { formatRepChange, getRepChangeColor } from '@/lib/rep-service';

interface RepHistoryProps {
  userId: string;
  limit?: number;
}

interface RepHistoryEntry {
  id: string;
  old_rep: number;
  new_rep: number;
  change_amount: number;
  change_reason: string;
  created_at: string;
  related_commitment_id?: string;
  related_submission_id?: string;
}

export default function RepHistory({ userId, limit = 20 }: RepHistoryProps) {
  const [history, setHistory] = useState<RepHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getUserRepHistory(userId, limit);
      setHistory(data);
    } catch (error) {
      console.error('Error loading Rep history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Rep history...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No Rep History Yet</Text>
        <Text style={styles.emptyDescription}>
          Complete tasks to start building your reputation!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rep History</Text>
        <Text style={styles.headerSubtitle}>
          Track your reputation changes over time
        </Text>
      </View>

      {history.map((entry) => (
        <Card key={entry.id} style={styles.historyCard}>
          <View style={styles.cardContent}>
            {/* Left: Change indicator */}
            <View style={styles.changeIndicator}>
              <View
                style={[
                  styles.changeBadge,
                  { backgroundColor: getRepChangeColor(entry.change_amount) }
                ]}
              >
                <Text style={styles.changeText}>
                  {formatRepChange(entry.change_amount)}
                </Text>
              </View>
              <Text style={styles.changeEmoji}>
                {entry.change_amount > 0 ? '📈' : entry.change_amount < 0 ? '📉' : '➡️'}
              </Text>
            </View>

            {/* Middle: Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.reasonText}>{entry.change_reason}</Text>
              <View style={styles.repTransition}>
                <Chip
                  mode="flat"
                  compact
                  style={styles.repChip}
                  textStyle={styles.repChipText}
                >
                  {entry.old_rep}
                </Chip>
                <Text style={styles.arrow}>→</Text>
                <Chip
                  mode="flat"
                  compact
                  style={[
                    styles.repChip,
                    entry.change_amount > 0 && styles.repChipPositive,
                    entry.change_amount < 0 && styles.repChipNegative
                  ]}
                  textStyle={styles.repChipText}
                >
                  {entry.new_rep}
                </Chip>
              </View>
              <Text style={styles.timeText}>{formatDate(entry.created_at)}</Text>
            </View>
          </View>
        </Card>
      ))}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  historyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  changeIndicator: {
    alignItems: 'center',
    gap: 4,
  },
  changeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  changeEmoji: {
    fontSize: 14,
  },
  detailsContainer: {
    flex: 1,
    gap: 6,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  repTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repChip: {
    height: 24,
    backgroundColor: '#f0f0f0',
  },
  repChipPositive: {
    backgroundColor: '#E8F5E9',
  },
  repChipNegative: {
    backgroundColor: '#FFEBEE',
  },
  repChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 12,
    color: '#999',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
});
