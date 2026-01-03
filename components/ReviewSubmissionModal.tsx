import React, { useState } from 'react';
import { View, Image, ScrollView, Dimensions, Alert } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, IconButton, Chip } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import RepBadge from './RepBadge';

interface ReviewSubmissionModalProps {
  visible: boolean;
  onDismiss: () => void;
  submission: any;
  reviewerId: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function ReviewSubmissionModal({
  visible,
  onDismiss,
  submission,
  reviewerId,
  onApprove,
  onReject
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState(4); // Default to 4 stars (positive reinforcement)
  const [bonusTip, setBonusTip] = useState('0');
  const [reviewNotes, setReviewNotes] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const photos = submission?.evidence_urls || [];
  const kidName = submission?.commitment?.user?.name || 'Kid';
  const kidRep = submission?.commitment?.user?.rep_score || 0;
  const taskTitle = submission?.commitment?.task?.title || submission?.commitment?.custom_title || 'Task';
  const basePay = (submission?.commitment?.pay_cents || 0) / 100;
  const tipAmount = parseFloat(bonusTip) || 0;
  const totalPay = basePay + tipAmount;

  const { SupabaseService } = require('@/lib/supabase-service');

  const handleApprove = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before approving');
      return;
    }

    Alert.alert(
      'Approve Submission?',
      `This will pay ${kidName} $${totalPay.toFixed(2)} and update their Rep.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Pay',
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await SupabaseService.approveSubmission(
                submission.id,
                rating,
                reviewerId,
                reviewNotes || undefined,
                Math.round(tipAmount * 100) // Convert to cents
              );

              if (result) {
                Alert.alert(
                  '✅ Approved!',
                  `${kidName} earned $${totalPay.toFixed(2)} and gained Rep!`,
                  [{ text: 'OK', onPress: () => {
                    onApprove();
                    resetForm();
                    onDismiss();
                  }}]
                );
              } else {
                throw new Error('Approval failed');
              }
            } catch (error) {
              console.error('Error approving submission:', error);
              Alert.alert('Error', 'Failed to approve submission. Please try again.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection');
      return;
    }

    Alert.alert(
      'Reject Submission?',
      `This will return the task to the marketplace. ${kidName} will see your reason.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await SupabaseService.rejectSubmission(
                submission.id,
                reviewerId,
                rejectionReason
              );

              if (result) {
                Alert.alert(
                  '❌ Rejected',
                  'Task has been returned to the marketplace.',
                  [{ text: 'OK', onPress: () => {
                    onReject();
                    resetForm();
                    onDismiss();
                  }}]
                );
              } else {
                throw new Error('Rejection failed');
              }
            } catch (error) {
              console.error('Error rejecting submission:', error);
              Alert.alert('Error', 'Failed to reject submission. Please try again.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setRating(4);
    setBonusTip('0');
    setReviewNotes('');
    setCurrentPhotoIndex(0);
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const addTip = (amount: number) => {
    const current = parseFloat(bonusTip) || 0;
    setBonusTip((current + amount).toFixed(2));
  };

  if (!submission) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: 'white',
          margin: 20,
          borderRadius: 16,
          maxHeight: '90%'
        }}
      >
        <ScrollView>
          {/* Header */}
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View>
                  <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{kidName}</Text>
                  <RepBadge score={kidRep} variant="compact" />
                </View>
              </View>
              <IconButton icon="close" onPress={onDismiss} />
            </View>
            <Text variant="titleMedium" style={{ marginTop: 8, color: '#666' }}>
              {taskTitle}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <IconSymbol size={20} name="dollarsign.circle.fill" color="#4CAF50" />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                ${basePay.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <View style={{ padding: 20, backgroundColor: '#f5f5f5' }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: photos[currentPhotoIndex] }}
                  style={{
                    width: '100%',
                    height: 300,
                    borderRadius: 12,
                    backgroundColor: '#e0e0e0'
                  }}
                  resizeMode="cover"
                />
                {photos.length > 1 && (
                  <>
                    <View style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        {currentPhotoIndex + 1} of {photos.length}
                      </Text>
                    </View>
                    <View style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 0,
                      right: 0,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8
                    }}>
                      <IconButton
                        icon="chevron-left"
                        size={24}
                        mode="contained"
                        containerColor="rgba(0,0,0,0.6)"
                        iconColor="white"
                        onPress={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                        disabled={currentPhotoIndex === 0}
                      />
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        mode="contained"
                        containerColor="rgba(0,0,0,0.6)"
                        iconColor="white"
                        onPress={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
                        disabled={currentPhotoIndex === photos.length - 1}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Submission Details */}
          <View style={{ padding: 20 }}>
            {submission.submission_note && (
              <View style={{ marginBottom: 16 }}>
                <Text variant="labelLarge" style={{ marginBottom: 4, fontWeight: '600' }}>
                  Kid's Notes:
                </Text>
                <Text variant="bodyMedium" style={{ color: '#666' }}>
                  {submission.submission_note}
                </Text>
              </View>
            )}

            {/* Quality Rating */}
            <View style={{ marginBottom: 16 }}>
              <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600' }}>
                Quality Rating *
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconButton
                    key={star}
                    icon={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    iconColor={star <= rating ? '#FFB300' : '#ccc'}
                    onPress={() => setRating(star)}
                  />
                ))}
              </View>
              <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            </View>

            {/* Bonus Tip */}
            <View style={{ marginBottom: 16 }}>
              <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600' }}>
                Bonus Tip (Optional)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <Button mode="outlined" compact onPress={() => addTip(1)}>+$1</Button>
                <Button mode="outlined" compact onPress={() => addTip(2)}>+$2</Button>
                <Button mode="outlined" compact onPress={() => addTip(5)}>+$5</Button>
                <Button mode="outlined" compact onPress={() => setBonusTip('0')}>Clear</Button>
              </View>
              <TextInput
                mode="outlined"
                label="Tip Amount"
                value={bonusTip}
                onChangeText={setBonusTip}
                keyboardType="decimal-pad"
                left={<TextInput.Icon icon="currency-usd" />}
              />
              <View style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#E8F5E9',
                borderRadius: 8
              }}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  Total Payout: ${totalPay.toFixed(2)}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  Base: ${basePay.toFixed(2)} + Tip: ${tipAmount.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Review Notes */}
            <View style={{ marginBottom: 16 }}>
              <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600' }}>
                Review Notes (Optional)
              </Text>
              <TextInput
                mode="outlined"
                label="Feedback for kid"
                value={reviewNotes}
                onChangeText={setReviewNotes}
                multiline
                numberOfLines={3}
                placeholder="Great job! Next time try..."
              />
            </View>

            {/* Rejection Input (conditional) */}
            {showRejectInput && (
              <View style={{ marginBottom: 16 }}>
                <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600', color: '#f44336' }}>
                  Rejection Reason *
                </Text>
                <TextInput
                  mode="outlined"
                  label="Why are you rejecting this?"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  placeholder="The work doesn't meet the requirements because..."
                  error={showRejectInput && !rejectionReason.trim()}
                />
                <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                  {kidName} will see this message
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              {!showRejectInput ? (
                <>
                  <Button
                    mode="contained"
                    onPress={handleApprove}
                    disabled={submitting}
                    loading={submitting}
                    buttonColor="#4CAF50"
                    contentStyle={{ paddingVertical: 8 }}
                  >
                    Approve & Pay ${totalPay.toFixed(2)}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowRejectInput(true)}
                    disabled={submitting}
                    textColor="#f44336"
                    style={{ borderColor: '#f44336' }}
                  >
                    Reject Submission
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    mode="contained"
                    onPress={handleReject}
                    disabled={submitting || !rejectionReason.trim()}
                    loading={submitting}
                    buttonColor="#f44336"
                    contentStyle={{ paddingVertical: 8 }}
                  >
                    Confirm Rejection
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setShowRejectInput(false);
                      setRejectionReason('');
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
