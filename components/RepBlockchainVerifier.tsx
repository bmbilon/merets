import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, DataTable } from 'react-native-paper';
import { useRepAttribution } from '@/hooks/useRepAttribution';

interface RepBlockchainVerifierProps {
  userId: string;
  userName: string;
}

export default function RepBlockchainVerifier({ userId, userName }: RepBlockchainVerifierProps) {
  const { repData, auditTrail, blockchainStatus, loading, verifyBlockchain, fetchAuditTrail } = useRepAttribution(userId);
  const [verifying, setVerifying] = useState(false);
  const [showFullAudit, setShowFullAudit] = useState(false);

  useEffect(() => {
    // Load initial audit trail
    fetchAuditTrail(20);
  }, [fetchAuditTrail]);

  const handleVerify = async () => {
    setVerifying(true);
    await verifyBlockchain();
    setVerifying(false);
  };

  const handleLoadMore = async () => {
    await fetchAuditTrail(100);
    setShowFullAudit(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading blockchain data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🔒 Rep Blockchain Verifier</Text>
          <Text style={styles.headerSubtitle}>
            Immutable ledger of {userName}'s accountability
          </Text>
        </View>
      </Card>

      {/* Blockchain Status */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Blockchain Integrity</Text>
          <Button
            mode="outlined"
            onPress={handleVerify}
            loading={verifying}
            disabled={verifying}
            compact
          >
            Verify Now
          </Button>
        </View>

        {blockchainStatus ? (
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  blockchainStatus.is_valid ? styles.statusChipValid : styles.statusChipInvalid,
                ]}
                textStyle={styles.statusChipText}
              >
                {blockchainStatus.is_valid ? '✓ VERIFIED' : '✗ INVALID'}
              </Chip>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Total Entries:</Text>
              <Text style={styles.statusValue}>{blockchainStatus.total_entries}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Verified Entries:</Text>
              <Text style={styles.statusValue}>{blockchainStatus.verified_entries}</Text>
            </View>

            {!blockchainStatus.is_valid && blockchainStatus.error_message && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>⚠️ Integrity Issue Detected</Text>
                <Text style={styles.errorMessage}>{blockchainStatus.error_message}</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Each Rep change is cryptographically linked to the previous entry,
                creating an immutable chain that cannot be tampered with.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.notVerifiedContainer}>
            <Text style={styles.notVerifiedText}>
              Click "Verify Now" to check blockchain integrity
            </Text>
          </View>
        )}
      </Card>

      {/* Current Rep Attribution */}
      {repData && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Rep Breakdown</Text>
            <Text style={styles.repScore}>{repData.repScore}</Text>
          </View>

          <DataTable>
            <DataTable.Row>
              <DataTable.Cell>Completion Rate</DataTable.Cell>
              <DataTable.Cell numeric>{repData.completionRate.toFixed(1)}%</DataTable.Cell>
              <DataTable.Cell numeric>40% weight</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Quality Score</DataTable.Cell>
              <DataTable.Cell numeric>{repData.qualityScore.toFixed(1)}%</DataTable.Cell>
              <DataTable.Cell numeric>30% weight</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Consistency</DataTable.Cell>
              <DataTable.Cell numeric>{repData.consistencyScore.toFixed(1)}%</DataTable.Cell>
              <DataTable.Cell numeric>15% weight</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Volume Bonus</DataTable.Cell>
              <DataTable.Cell numeric>+{repData.volumeBonus}</DataTable.Cell>
              <DataTable.Cell numeric>10% weight</DataTable.Cell>
            </DataTable.Row>

            {repData.failurePenalty > 0 && (
              <DataTable.Row>
                <DataTable.Cell>Failure Penalty</DataTable.Cell>
                <DataTable.Cell numeric style={styles.penaltyCell}>
                  -{repData.failurePenalty}%
                </DataTable.Cell>
                <DataTable.Cell numeric>-5% weight</DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{repData.completedCommitments}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{repData.totalCommitments}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.statValueNegative]}>
                {repData.failedCommitments}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Audit Trail */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Audit Trail</Text>
          <Text style={styles.cardSubtitle}>
            {auditTrail.length} recent entries
          </Text>
        </View>

        {auditTrail.length === 0 ? (
          <View style={styles.emptyAudit}>
            <Text style={styles.emptyAuditText}>No Rep history yet</Text>
          </View>
        ) : (
          <>
            {auditTrail.slice(0, showFullAudit ? auditTrail.length : 10).map((entry) => (
              <View key={entry.entry_id} style={styles.auditEntry}>
                <View style={styles.auditHeader}>
                  <Chip
                    mode="flat"
                    compact
                    style={[
                      styles.actionChip,
                      entry.change_amount > 0 ? styles.actionChipPositive : styles.actionChipNegative,
                    ]}
                  >
                    {entry.change_amount > 0 ? '+' : ''}{entry.change_amount}
                  </Chip>
                  <Text style={styles.auditTimestamp}>
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <Text style={styles.auditReason}>{entry.reason}</Text>

                <View style={styles.auditDetails}>
                  <Text style={styles.auditDetailText}>
                    {entry.old_rep} → {entry.new_rep}
                  </Text>
                  <Text style={styles.auditActionType}>
                    {entry.action_type.replace(/_/g, ' ')}
                  </Text>
                </View>

                <View style={styles.hashContainer}>
                  <Text style={styles.hashLabel}>Hash:</Text>
                  <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                    {entry.blockchain_hash}
                  </Text>
                </View>
              </View>
            ))}

            {!showFullAudit && auditTrail.length > 10 && (
              <Button
                mode="outlined"
                onPress={handleLoadMore}
                style={styles.loadMoreButton}
              >
                Load More Entries
              </Button>
            )}
          </>
        )}
      </Card>

      {/* Info Section */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>About the Rep Blockchain</Text>
        </View>
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemEmoji}>🔒</Text>
            <View style={styles.infoItemText}>
              <Text style={styles.infoItemTitle}>Immutable</Text>
              <Text style={styles.infoItemDescription}>
                Rep history cannot be deleted or modified, only appended
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoItemEmoji}>⚡</Text>
            <View style={styles.infoItemText}>
              <Text style={styles.infoItemTitle}>Automatic</Text>
              <Text style={styles.infoItemDescription}>
                Every task completion, failure, and rating automatically updates Rep
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoItemEmoji}>🔗</Text>
            <View style={styles.infoItemText}>
              <Text style={styles.infoItemTitle}>Blockchain-Linked</Text>
              <Text style={styles.infoItemDescription}>
                Each entry is cryptographically linked to the previous entry
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoItemEmoji}>✓</Text>
            <View style={styles.infoItemText}>
              <Text style={styles.infoItemTitle}>Verifiable</Text>
              <Text style={styles.infoItemDescription}>
                Anyone can verify the integrity of the entire chain
              </Text>
            </View>
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    backgroundColor: '#6200ee',
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  repScore: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6200ee',
  },
  statusContainer: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusChip: {
    height: 28,
  },
  statusChipValid: {
    backgroundColor: '#E8F5E9',
  },
  statusChipInvalid: {
    backgroundColor: '#FFEBEE',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#C62828',
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  notVerifiedContainer: {
    padding: 20,
    alignItems: 'center',
  },
  notVerifiedText: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statValueNegative: {
    color: '#F44336',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  penaltyCell: {
    color: '#F44336',
  },
  emptyAudit: {
    padding: 20,
    alignItems: 'center',
  },
  emptyAuditText: {
    fontSize: 14,
    color: '#666',
  },
  auditEntry: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6200ee',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionChip: {
    height: 24,
  },
  actionChipPositive: {
    backgroundColor: '#E8F5E9',
  },
  actionChipNegative: {
    backgroundColor: '#FFEBEE',
  },
  auditTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  auditReason: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  auditDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  auditDetailText: {
    fontSize: 12,
    color: '#666',
  },
  auditActionType: {
    fontSize: 11,
    color: '#999',
    textTransform: 'capitalize',
  },
  hashContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  hashLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  hashValue: {
    flex: 1,
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  loadMoreButton: {
    marginTop: 8,
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoItemEmoji: {
    fontSize: 24,
  },
  infoItemText: {
    flex: 1,
    gap: 4,
  },
  infoItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  infoItemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
