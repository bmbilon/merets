import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Card, Button, Text, Portal, Modal, IconButton, Chip, TextInput, Switch } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import IssuerService from '../lib/supabase-issuer-service';

interface Commitment {
  id: string;
  user_id: string;
  task_template_id?: string;
  custom_title?: string;
  custom_description?: string;
  skill_category: string;
  effort_minutes: number;
  pay_cents: number;
status: 'draft' | 'pending_approval' | 'accepted' | 'in_progress' | 'submitted' | 'ready_for_review' | 'completed' | 'redo_requested' | 'rejected';
  created_at: string;
  completed_at?: string;
}

interface UserProfile {
  id: string;
  name: string;
  handle?: string;
}

interface Props {
  reviewerId: string;
  onReviewComplete?: () => void;
  filterEarnerId?: string;
}

export const CommitmentReviewPanel: React.FC<Props> = ({ reviewerId, onReviewComplete, filterEarnerId }) => {
  const [pendingApprovals, setPendingApprovals] = useState<Commitment[]>([]);
  const [completedAwaitingReview, setCompletedAwaitingReview] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(4);
const [reviewNote, setReviewNote] = useState('');
  const [requestRedo, setRequestRedo] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    loadCommitments();
  }, [filterEarnerId]);

  const loadCommitments = async () => {
    try {
      setLoading(true);

      // Load user profiles for display
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, handle');
      
      if (profiles) {
        const profileMap: Record<string, UserProfile> = {};
        profiles.forEach(p => {
          profileMap[p.id] = p;
        });
        setUserProfiles(profileMap);
      }

      // Get commitments pending approval (status = 'pending')
      let pendingQuery = supabase
        .from('commitments')
        .select('*')
.eq('status', 'pending_approval');
      
      if (filterEarnerId) {
        pendingQuery = pendingQuery.eq('user_id', filterEarnerId);
      }
      
      const { data: pending } = await pendingQuery.order('created_at', { ascending: false });

      setPendingApprovals(pending || []);

      // Get approved commitments that are awaiting quality review
      // These are commitments that kids have marked as complete but haven't been reviewed yet
      let completedQuery = supabase
        .from('commitments')
        .select('*')
.eq('status', 'ready_for_review');
      
      if (filterEarnerId) {
        completedQuery = completedQuery.eq('user_id', filterEarnerId);
      }
      
      const { data: completed } = await completedQuery.order('completed_at', { ascending: false });

      setCompletedAwaitingReview(completed || []);

    } catch (error) {
      console.error('Error loading commitments:', error);
      Alert.alert('Error', 'Failed to load commitments');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommitment = async (commitmentId: string) => {
    try {
await IssuerService.approvePreWork(commitmentId, reviewerId);

      if (error) throw error;

      Alert.alert('Success', 'Commitment approved!');
      loadCommitments();
      onReviewComplete?.();
    } catch (error) {
      console.error('Error approving commitment:', error);
      Alert.alert('Error', 'Failed to approve commitment');
    }
  };

  const handleRejectCommitment = async (commitmentId: string) => {
    Alert.alert(
      'Reject Commitment',
      'Are you sure you want to reject this commitment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
await IssuerService.rejectPreWork(commitmentId, reviewerId, 'Rejected by issuer');

              if (error) throw error;

              Alert.alert('Rejected', 'Commitment has been rejected');
              loadCommitments();
              onReviewComplete?.();
            } catch (error) {
              console.error('Error rejecting commitment:', error);
              Alert.alert('Error', 'Failed to reject commitment');
            }
          }
        }
      ]
    );
  };

  const handleSubmitReview = async () => {
    if (!selectedCommitment) return;

    try {
      // Insert review record - this will trigger the database function that:
      // 1. Creates meret_event with quality multiplier
      // 2. Creates earning_event if pay > 0
      // 3. Creates rep_event with calculated composite score
      // 4. Updates user_profiles cached values
await IssuerService.submitQualityReview(
        selectedCommitment.id,
        reviewerId,
        selectedStars,
        reviewNote || undefined,
        requestRedo
      );

      Alert.alert(
        'Review Complete! 🎉',
        `${selectedStars} star${selectedStars !== 1 ? 's' : ''} awarded. Merets and earnings have been credited.`
      );

      setSelectedCommitment(null);
      setSelectedStars(4);
setReviewNote('');
      setRequestRedo(false);
      loadCommitments();
      onReviewComplete?.();

    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const renderStarSelector = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 20 }}>
      {[1, 2, 3, 4, 5].map(stars => (
        <IconButton
          key={stars}
          icon="star"
          iconColor={selectedStars >= stars ? '#FFD700' : '#E0E0E0'}
          size={40}
          onPress={() => setSelectedStars(stars)}
          style={{
            backgroundColor: selectedStars >= stars ? '#FFF8DC' : '#F5F5F5',
            borderWidth: 2,
            borderColor: selectedStars >= stars ? '#FFD700' : '#E0E0E0'
          }}
        />
      ))}
    </View>
  );

  const getQualityLabel = (stars: number) => {
    const labels = {
      1: '⭐ Needs Improvement',
      2: '⭐⭐ Acceptable',
      3: '⭐⭐⭐ Good Work',
      4: '⭐⭐⭐⭐ Great Job!',
      5: '⭐⭐⭐⭐⭐ Perfect!'
    };
    return labels[stars as keyof typeof labels] || '';
  };

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text>Loading commitments...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text variant="titleLarge" style={{ marginBottom: 12, fontWeight: 'bold' }}>
            ⏳ Pending Approval ({pendingApprovals.length})
          </Text>
          {pendingApprovals.map(commitment => (
            <Card key={commitment.id} style={{ marginBottom: 12 }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text variant="titleMedium" style={{ flex: 1, fontWeight: 'bold' }}>
                    {commitment.custom_title || 'Task'}
                  </Text>
                  <Chip mode="flat" style={{ backgroundColor: '#FFF3CD' }}>
                    {commitment.effort_minutes}min
                  </Chip>
                </View>

                {commitment.custom_description && (
                  <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 8 }}>
                    {commitment.custom_description}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <Chip icon="hammer-wrench" mode="outlined">
                    {commitment.skill_category}
                  </Chip>
                  <Chip icon="currency-usd" style={{ backgroundColor: '#E8F5E8' }}>
                    ${(commitment.pay_cents / 100).toFixed(2)}
                  </Chip>
                </View>

                <Text variant="bodySmall" style={{ color: '#666', marginBottom: 8 }}>
                  Requested by: {userProfiles[commitment.user_id]?.name || 'Unknown'}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button
                    mode="contained"
                    onPress={() => handleApproveCommitment(commitment.id)}
                    style={{ flex: 1, backgroundColor: '#4CAF50' }}
                  >
                    ✅ Approve
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleRejectCommitment(commitment.id)}
                    style={{ flex: 1 }}
                    textColor="#F44336"
                  >
                    ❌ Reject
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Completed - Awaiting Quality Review */}
      {completedAwaitingReview.length > 0 && (
        <View>
          <Text variant="titleLarge" style={{ marginBottom: 12, fontWeight: 'bold' }}>
            🎯 Ready for Review ({completedAwaitingReview.length})
          </Text>
          {completedAwaitingReview.map(commitment => (
            <Card key={commitment.id} style={{ marginBottom: 12 }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text variant="titleMedium" style={{ flex: 1, fontWeight: 'bold' }}>
                    {commitment.custom_title || 'Task'}
                  </Text>
                  <Chip mode="flat" style={{ backgroundColor: '#E8F5E8' }}>
                    Completed
                  </Chip>
                </View>

                <Text variant="bodySmall" style={{ color: '#666', marginBottom: 8 }}>
                  By: {userProfiles[commitment.user_id]?.name || 'Unknown'} • {commitment.effort_minutes}min
                </Text>

                <Button
                  mode="contained"
                  onPress={() => setSelectedCommitment(commitment)}
                  style={{ backgroundColor: '#2196F3' }}
                >
                  ⭐ Review & Rate Quality
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {pendingApprovals.length === 0 && completedAwaitingReview.length === 0 && (
        <Card style={{ padding: 20 }}>
          <Card.Content style={{ alignItems: 'center' }}>
            <Text variant="titleMedium" style={{ color: '#666', textAlign: 'center' }}>
              ✅ All caught up!
            </Text>
            <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center', marginTop: 8 }}>
              No commitments pending review
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Review Modal */}
      <Portal>
        <Modal
          visible={!!selectedCommitment}
          onDismiss={() => setSelectedCommitment(null)}
          contentContainerStyle={{
            backgroundColor: 'white',
            margin: 20,
            padding: 20,
            borderRadius: 16
          }}
        >
          {selectedCommitment && (
            <View style={{ gap: 16 }}>
              <Text variant="headlineSmall" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                Review Work Quality
              </Text>

              <Card style={{ backgroundColor: '#F5F5F5' }}>
                <Card.Content>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {selectedCommitment.custom_title}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: '#666' }}>
                    By: {userProfiles[selectedCommitment.user_id]?.name}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <Chip icon="clock">{selectedCommitment.effort_minutes}min</Chip>
                    <Chip icon="currency-usd">${(selectedCommitment.pay_cents / 100).toFixed(2)}</Chip>
                  </View>
                </Card.Content>
              </Card>

              <Text variant="titleMedium" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                How well was it done?
              </Text>

              {renderStarSelector()}

<Text variant="bodyLarge" style={{ textAlign: 'center', fontWeight: 'bold', color: '#2196F3' }}>
                {getQualityLabel(selectedStars)}
              </Text>

              {selectedStars <= 2 && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text>Request Redo</Text>
                    <Switch value={requestRedo} onValueChange={setRequestRedo} />
                  </View>
                  <TextInput
                    mode="outlined"
                    label="Comment (required for 1–2★)"
                    value={reviewNote}
                    onChangeText={setReviewNote}
                    multiline
                  />
                </View>
              )}

              <View style={{
                backgroundColor: '#E3F2FD',
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: '#2196F3'
              }}>
                <Text variant="bodySmall" style={{ color: '#1565C0', lineHeight: 18 }}>
                  💡 Your rating affects Merets earned and Rep score:
                  {'\n'}• 5★ = 1.2x Merets
                  {'\n'}• 4★ = 1.0x Merets (standard)
                  {'\n'}• 3★ = 0.7x Merets
                  {'\n'}• 2★ = 0.4x Merets
                  {'\n'}• 1★ = 0.2x Merets
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <Button
                  mode="outlined"
                  onPress={() => setSelectedCommitment(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmitReview}
                  style={{ flex: 1, backgroundColor: '#4CAF50' }}
                >
                  Submit Review
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
};
