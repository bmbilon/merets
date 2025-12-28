import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Chip, Avatar, ActivityIndicator, Button, IconButton } from 'react-native-paper';
import IssuerService, { IssuerStats } from '../lib/supabase-issuer-service';
import CommitmentReviewPanel from './CommitmentReviewPanel';
import { supabase } from '../lib/supabase';

interface EarnerWithRelationship {
  id: string;
  issuer_id: string;
  earner_id: string;
  relationship_type: string;
  permission_level: string;
  earner: {
    id: string;
    name: string;
    handle: string;
    rep_score: number;
    merets_balance: number;
  };
}

export default function IssuerDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<IssuerStats | null>(null);
  const [earners, setEarners] = useState<EarnerWithRelationship[]>([]);
  const [selectedEarnerId, setSelectedEarnerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      if (data.user?.id) await loadDashboardData(data.user.id);

      subscription = supabase.auth.onAuthStateChange((_event, session) => {
        const id = session?.user?.id ?? null;
        setUserId(id);
        if (id) loadDashboardData(id);
      });
    };

    init();
    return () => {
      // Clean up listener
      // @ts-ignore - different return shape depending on SDK version
      if (subscription && typeof subscription.subscription?.unsubscribe === 'function') {
        // @ts-ignore
        subscription.subscription.unsubscribe();
      }
    };
  }, []);

  const loadDashboardData = async (uid?: string) => {
    const id = uid ?? userId;
    if (!id) return;

    try {
      setLoading(true);
      
      // Load stats and earners in parallel
      const [statsData, earnersData] = await Promise.all([
        IssuerService.getIssuerStats(id),
        IssuerService.getEarnersForIssuer(id)
      ]);

      setStats(statsData);
      setEarners(earnersData);
    } catch (error) {
      console.error('Error loading issuer dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getRelationshipLabel = (type: string): string => {
    const labels: Record<string, string> = {
      parent: '👨‍👩‍👧 Parent',
      guardian: '🛡️ Guardian',
      grandparent: '👴 Grandparent',
      aunt_uncle: '👨‍👩‍👧‍👦 Aunt/Uncle',
      teacher: '📚 Teacher',
      coach: '⚽ Coach',
      mentor: '🎯 Mentor',
      other: '🤝 Other'
    };
    return labels[type] || type;
  };

  const getPermissionLabel = (level: string): string => {
    const labels: Record<string, string> = {
      full: 'Full Access',
      approve_only: 'Approve Only',
      review_only: 'Review Only',
      view_only: 'View Only'
    };
    return labels[level] || level;
  };

  const getPermissionColor = (level: string): string => {
    const colors: Record<string, string> = {
      full: '#4CAF50',
      approve_only: '#2196F3',
      review_only: '#FF9800',
      view_only: '#9E9E9E'
    };
    return colors[level] || '#9E9E9E';
  };

  const getRepBand = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'Elite', color: '#FFD700' };
    if (score >= 70) return { label: 'Proven', color: '#4CAF50' };
    if (score >= 50) return { label: 'Solid', color: '#2196F3' };
    if (score >= 30) return { label: 'Building', color: '#FF9800' };
    return { label: 'New', color: '#9E9E9E' };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.pending_approvals}</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.awaiting_review}</Text>
              <Text style={styles.statLabel}>Awaiting Review</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.total_approved}</Text>
              <Text style={styles.statLabel}>Total Approved</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.earners_count}</Text>
              <Text style={styles.statLabel}>Earners</Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Commitment Review Panel */}
      {userId && (
        <Card style={styles.reviewCard}>
          <Card.Title 
            title="Review Commitments"
            titleStyle={styles.sectionTitle}
          />
          <Card.Content>
            <CommitmentReviewPanel
              reviewerId={userId}
              onReviewComplete={() => loadDashboardData()}
            />
          </Card.Content>
        </Card>
      )}

      {/* Earners List */}
      <Card style={styles.earnersCard}>
        <Card.Title
          title={`Your Earners (${earners.length})`}
          titleStyle={styles.sectionTitle}
        />
        <Card.Content>
          {earners.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No earners connected yet</Text>
              <Text style={styles.emptySubtext}>
                Connect with family members to start approving their work
              </Text>
            </View>
          ) : (
            earners.map((relationship) => {
              const repBand = getRepBand(relationship.earner.rep_score);
              return (
                <Card key={relationship.id} style={styles.earnerCard}>
                  <Card.Content style={styles.earnerContent}>
                    <View style={styles.earnerHeader}>
                      <Avatar.Text
                        size={48}
                        label={(relationship.earner.name || '?').charAt(0).toUpperCase()}
                        style={{ backgroundColor: repBand.color }}
                      />
                      <View style={styles.earnerInfo}>
                        <Text style={styles.earnerName}>{relationship.earner.name}</Text>
                        <Text style={styles.earnerHandle}>@{relationship.earner.handle}</Text>
                        <View style={styles.chipRow}>
                          <Chip
                            mode="flat"
                            style={[styles.chip, { backgroundColor: repBand.color + '20' }]}
                            textStyle={{ color: repBand.color, fontSize: 10 }}
                          >
                            {repBand.label} Rep
                          </Chip>
                          <Chip
                            mode="flat"
                            style={styles.chip}
                            textStyle={{ fontSize: 10 }}
                          >
                            {relationship.earner.merets_balance} Merets
                          </Chip>
                        </View>
                      </View>
                    </View>

                    <View style={styles.relationshipRow}>
                      <Chip
                        icon="account-multiple"
                        mode="outlined"
                        style={styles.relationshipChip}
                        textStyle={{ fontSize: 11 }}
                      >
                        {getRelationshipLabel(relationship.relationship_type)}
                      </Chip>
                      <Chip
                        icon="shield-check"
                        mode="outlined"
                        style={[
                          styles.permissionChip,
                          { borderColor: getPermissionColor(relationship.permission_level) }
                        ]}
                        textStyle={{
                          fontSize: 11,
                          color: getPermissionColor(relationship.permission_level)
                        }}
                      >
                        {getPermissionLabel(relationship.permission_level)}
                      </Chip>
                    </View>

                    <Button
                      mode="contained"
                      onPress={() => setSelectedEarnerId(
                        selectedEarnerId === relationship.earner_id ? null : relationship.earner_id
                      )}
                      style={styles.viewButton}
                    >
                      {selectedEarnerId === relationship.earner_id
                        ? 'Hide Commitments'
                        : 'View Commitments'}
                    </Button>

                    {/* Show earner-specific commitments when selected */}
                    {selectedEarnerId === relationship.earner_id && userId && (
                      <View style={styles.earnerCommitments}>
                        <Text style={styles.earnerCommitmentsTitle}>
                          Commitments for {relationship.earner.name}
                        </Text>
                        <CommitmentReviewPanel
                          reviewerId={userId}
                          onReviewComplete={() => loadDashboardData()}
                          filterEarnerId={relationship.earner_id}
                        />
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  reviewCard: {
    margin: 12,
    backgroundColor: '#fff',
  },
  earnersCard: {
    margin: 12,
    marginTop: 0,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  earnerCard: {
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  earnerContent: {
    padding: 12,
  },
  earnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earnerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  earnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  earnerHandle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    height: 24,
  },
  relationshipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  relationshipChip: {
    flex: 1,
  },
  permissionChip: {
    flex: 1,
  },
  viewButton: {
    marginTop: 8,
  },
  earnerCommitments: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  earnerCommitmentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
});
