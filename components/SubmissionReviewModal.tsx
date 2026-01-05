import React, { useState } from 'react';
import { View, Image, ScrollView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Chip, Divider } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SupabaseService } from '../lib/supabase-service';
// CelebrationModal removed - using simple alert instead

interface SubmissionReviewModalProps {
  visible: boolean;
  onDismiss: () => void;
  submission: any;
  reviewerId: string;
  onSuccess: () => void;
}

export default function SubmissionReviewModal({
  visible,
  onDismiss,
  submission,
  reviewerId,
  onSuccess
}: SubmissionReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [reviewNotes, setReviewNotes] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);


  const screenWidth = Dimensions.get('window').width;
  const imageWidth = (screenWidth - 80) / 3; // 3 images with padding

  const handleApprove = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Please select a rating between 1 and 5 stars');
      return;
    }

    setProcessing(true);
    try {
      console.log('[APPROVE] Approving submission:', submission.id);

      const tipCents = tipAmount ? Math.round(parseFloat(tipAmount) * 100) : 0;

      const result = await SupabaseService.approveSubmission(
        submission.id,
        rating,
        reviewerId,
        reviewNotes || undefined,
        tipCents
      );

      console.log('[APPROVE] Raw Result:', JSON.stringify(result, null, 2));

      // Normalize all possible Supabase RPC return shapes
      // - array of rows
      // - { data: [...] }
      // - single object
      const row =
        Array.isArray(result) ? result[0] :
        Array.isArray((result as any)?.data) ? (result as any).data[0] :
        (result as any);

      const ok =
        row?.success === true ||
        row?.success === 'true' ||
        row?.success === 't' ||
        row?.success === 1;

      if (!ok) {
        console.error('[APPROVE] Failed - normalized row:', row);
        console.error('[APPROVE] Failed - raw result:', result);

        const errMsg =
          (result as any)?.error?.message ||
          (row as any)?.error?.message ||
          'Approval failed';

        throw new Error(errMsg);
      }

      console.log('[APPROVE] Success row:', row);

      // NOTE: money_earned_cents is NOT currently returned by the SQL function.
      // This will show $0.00 until/if the function is extended.
      const moneyEarnedCents = row.money_earned_cents ?? 0;

      Alert.alert(
        'Approved! 🎉',
        `${submission.commitment?.user?.name || 'Kid'} earned $${(moneyEarnedCents / 100).toFixed(2)}`,
        [{
          text: 'OK',
          onPress: () => {
            onDismiss();
            onSuccess();
          }
        }]
      );

    } catch (error) {
      console.error('[APPROVE] Error:', error);
      Alert.alert('Error', 'Failed to approve submission. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      console.log('[REJECT] Rejecting submission:', submission.id);
      
      const result = await SupabaseService.rejectSubmission(
        submission.id,
        reviewerId,
        rejectReason
      );

      if (result.success) {
        console.log('[REJECT] Success');
        
        Alert.alert(
          'Submission Rejected',
          `${submission.commitment?.user?.name || 'Kid'} has been notified. They can revise and resubmit.`,
          [{ 
            text: 'OK', 
            onPress: () => {
              onDismiss();
              onSuccess();
            }
          }]
        );
      } else {
        throw new Error('Rejection failed');
      }
    } catch (error) {
      console.error('[REJECT] Error:', error);
      Alert.alert('Error', 'Failed to reject submission. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!submission) return null;

  const commitment = submission.commitment || {};
  const task = commitment.task || {};
  const user = commitment.user || {};
  const photos = submission.evidence_urls || [];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: 'white',
          padding: 20,
          margin: 20,
          borderRadius: 16,
          maxHeight: '90%'
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ marginBottom: 20 }}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Review Submission
            </Text>
            <Text variant="titleMedium" style={{ color: '#666' }}>
              {task.title || commitment.custom_title || 'Task'}
            </Text>
            <Text variant="bodyMedium" style={{ color: '#999', marginTop: 4 }}>
              By {user.name || 'Unknown'}
            </Text>
          </View>

          {/* Photos */}
          {photos.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text variant="bodyLarge" style={{ fontWeight: '600', marginBottom: 12 }}>
                Proof Photos
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {photos.map((photoUrl: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: photoUrl }}
                    style={{ 
                      width: imageWidth, 
                      height: imageWidth, 
                      borderRadius: 12,
                      backgroundColor: '#f0f0f0'
                    }}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          )}

          {/* Submission Notes */}
          {submission.submission_note && (
            <View style={{ marginBottom: 20 }}>
              <Text variant="bodyLarge" style={{ fontWeight: '600', marginBottom: 8 }}>
                Notes from {user.name}
              </Text>
              <View style={{ 
                backgroundColor: '#f5f5f5', 
                padding: 12, 
                borderRadius: 12,
                borderLeftWidth: 3,
                borderLeftColor: '#2196F3'
              }}>
                <Text variant="bodyMedium" style={{ color: '#666' }}>
                  {submission.submission_note}
                </Text>
              </View>
            </View>
          )}

          <Divider style={{ marginBottom: 20 }} />

          {!showRejectForm ? (
            <>
              {/* Rating */}
              <View style={{ marginBottom: 20 }}>
                <Text variant="bodyLarge" style={{ fontWeight: '600', marginBottom: 12 }}>
                  Rate the Work
                </Text>
                <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={{
                        padding: 4,
                        borderRadius: 8,
                        backgroundColor: rating >= star ? '#FFF9E6' : 'transparent'
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>
                        {rating >= star ? '⭐' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text variant="bodySmall" style={{ textAlign: 'center', color: '#666', marginTop: 8 }}>
                  {rating === 5 ? 'Perfect! 120% MP' : 
                   rating === 4 ? 'Great! 100% MP' : 
                   rating === 3 ? 'Acceptable. 70% MP' :
                   rating === 2 ? 'Needs work. 40% MP' :
                   'Poor quality. 20% MP'}
                </Text>
              </View>

              {/* Review Notes */}
              <View style={{ marginBottom: 20 }}>
                <Text variant="bodyLarge" style={{ fontWeight: '600', marginBottom: 8 }}>
                  Feedback (Optional)
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Leave encouraging feedback..."
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  numberOfLines={3}
                  style={{ borderRadius: 12 }}
                />
              </View>

              {/* Tip */}
              <View style={{ marginBottom: 24 }}>
                <Text variant="bodyLarge" style={{ fontWeight: '600', marginBottom: 8 }}>
                  Bonus Tip (Optional)
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['1', '2', '5'].map((amount) => (
                    <Chip
                      key={amount}
                      selected={tipAmount === amount}
                      onPress={() => setTipAmount(amount)}
                      style={{ flex: 1 }}
                    >
                      ${amount}
                    </Chip>
                  ))}
                  <TextInput
                    mode="outlined"
                    placeholder="$"
                    value={tipAmount && !['1', '2', '5'].includes(tipAmount) ? tipAmount : ''}
                    onChangeText={setTipAmount}
                    keyboardType="decimal-pad"
                    style={{ flex: 1, height: 40, minWidth: 80 }}
                    dense
                  />
                </View>
              </View>

              {/* Payment Summary */}
              <View style={{ 
                backgroundColor: '#E8F5E9', 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 20 
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text variant="bodyMedium" style={{ color: '#666' }}>Base Pay:</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    ${((commitment.pay_cents || 0) / 100).toFixed(2)}
                  </Text>
                </View>
                {tipAmount && parseFloat(tipAmount) > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text variant="bodyMedium" style={{ color: '#666' }}>Tip:</Text>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#4CAF50' }}>
                      +${parseFloat(tipAmount).toFixed(2)}
                    </Text>
                  </View>
                )}
                <Divider style={{ marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Total:</Text>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                    ${(((commitment.pay_cents || 0) / 100) + (parseFloat(tipAmount) || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  mode="outlined"
                  onPress={() => setShowRejectForm(true)}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 8 }}
                  textColor="#F44336"
                  disabled={processing}
                >
                  Reject
                </Button>
                <Button
                  mode="contained"
                  onPress={handleApprove}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 8 }}
                  buttonColor="#4CAF50"
                  loading={processing}
                  disabled={processing}
                >
                  Approve & Pay
                </Button>
              </View>
            </>
          ) : (
            <>
              {/* Reject Form */}
              <View style={{ marginBottom: 20 }}>
                <Text variant="bodyLarge" style={{ fontWeight: '600', marginBottom: 8, color: '#F44336' }}>
                  Reason for Rejection
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Explain what needs to be improved..."
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                  numberOfLines={4}
                  style={{ borderRadius: 12 }}
                  error={!rejectReason.trim()}
                />
                <Text variant="bodySmall" style={{ color: '#666', marginTop: 8 }}>
                  {user.name} will be able to revise and resubmit their work.
                </Text>
              </View>

              {/* Reject Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 8 }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleReject}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 8 }}
                  buttonColor="#F44336"
                  loading={processing}
                  disabled={processing || !rejectReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>


    </Portal>
  );
}
