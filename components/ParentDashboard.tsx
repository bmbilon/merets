import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Surface, Text, Button, Chip, Avatar } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ReviewSubmissionModal from './ReviewSubmissionModal';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface ParentDashboardProps {
  parentId: string;
  parentName: string;
}

export default function ParentDashboard({ parentId, parentName }: ParentDashboardProps) {
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      const { SupabaseService } = await import('@/lib/supabase-service');
      const submissions = await SupabaseService.getPendingSubmissions();
      setPendingSubmissions(submissions);
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingSubmissions();
  };

  const handleReviewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleApprove = () => {
    fetchPendingSubmissions();
  };

  const handleReject = () => {
    fetchPendingSubmissions();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const submitted = new Date(timestamp);
    const diffMs = now.getTime() - submitted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getUrgencyColor = (timestamp: string) => {
    const now = new Date();
    const submitted = new Date(timestamp);
    const diffHours = (now.getTime() - submitted.getTime()) / 3600000;

    if (diffHours > 24) return '#f44336'; // Red - over 24 hours
    if (diffHours > 12) return '#FF9800'; // Orange - over 12 hours
    return '#4CAF50'; // Green - fresh
  };

  if (loading) {
    return <LoadingState message="Loading pending submissions..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#2196F3',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20
      }}>
        <Text variant="headlineMedium" style={{ color: 'white', fontWeight: 'bold', marginBottom: 4 }}>
          Parent Dashboard
        </Text>
        <Text variant="bodyLarge" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Review submitted work
        </Text>
      </View>

      {/* Pending Count Badge */}
      {pendingSubmissions.length > 0 && (
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 20,
          marginTop: -20,
          marginBottom: 16,
          borderRadius: 12,
          padding: 16,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FF9800',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                {pendingSubmissions.length}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {pendingSubmissions.length} Pending {pendingSubmissions.length === 1 ? 'Submission' : 'Submissions'}
              </Text>
              <Text variant="bodySmall" style={{ color: '#666' }}>
                Waiting for your review
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Submissions List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {pendingSubmissions.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="All Caught Up!"
            message="No pending submissions to review"
          />
        ) : (
          pendingSubmissions.map((submission) => {
            const kidName = submission.commitment?.user?.name || 'Kid';
            const kidColor = submission.commitment?.user?.color || '#9C27B0';
            const taskTitle = submission.commitment?.task?.title || submission.commitment?.custom_title || 'Task';
            const payAmount = (submission.commitment?.pay_cents || 0) / 100;
            const firstPhoto = submission.evidence_urls?.[0];
            const photoCount = submission.evidence_urls?.length || 0;
            const timeAgo = getTimeAgo(submission.submitted_at);
            const urgencyColor = getUrgencyColor(submission.submitted_at);

            return (
              <Surface
                key={submission.id}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  backgroundColor: 'white',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: urgencyColor
                }}
              >
                {/* Header Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Avatar.Text
                    size={48}
                    label={kidName.substring(0, 2).toUpperCase()}
                    style={{ backgroundColor: kidColor }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                      {kidName}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#666' }}>
                      {taskTitle}
                    </Text>
                  </View>
                  <Chip
                    compact
                    style={{ backgroundColor: urgencyColor + '20' }}
                    textStyle={{ color: urgencyColor, fontSize: 11, fontWeight: '600' }}
                  >
                    {timeAgo}
                  </Chip>
                </View>

                {/* Photo Preview */}
                {firstPhoto && (
                  <TouchableOpacity
                    onPress={() => handleReviewSubmission(submission)}
                    style={{ marginBottom: 12 }}
                  >
                    <View style={{ position: 'relative' }}>
                      <View
                        style={{
                          width: '100%',
                          height: 150,
                          borderRadius: 12,
                          backgroundColor: '#e0e0e0',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={firstPhoto}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </View>
                      {photoCount > 1 && (
                        <View style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 12
                        }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                            +{photoCount - 1} more
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                {/* Submission Note */}
                {submission.submission_note && (
                  <View style={{
                    backgroundColor: '#f5f5f5',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12
                  }}>
                    <Text variant="bodySmall" style={{ color: '#666', fontStyle: 'italic' }}>
                      "{submission.submission_note}"
                    </Text>
                  </View>
                )}

                {/* Footer Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconSymbol size={20} name="dollarsign.circle.fill" color="#4CAF50" />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                      ${payAmount.toFixed(2)}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => handleReviewSubmission(submission)}
                    buttonColor="#2196F3"
                    contentStyle={{ paddingVertical: 4 }}
                  >
                    Review
                  </Button>
                </View>
              </Surface>
            );
          })
        )}
      </ScrollView>

      {/* Review Modal */}
      {selectedSubmission && (
        <ReviewSubmissionModal
          visible={showReviewModal}
          onDismiss={() => {
            setShowReviewModal(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          reviewerId={parentId}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </View>
  );
}
