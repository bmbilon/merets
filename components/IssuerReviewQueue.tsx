import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Surface, Text, Button, Chip, Avatar, Divider, TextInput, IconButton } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ReceiptCard from './ReceiptCard';

interface SubmittedMent {
  id: string;
  mentTitle: string;
  mentDescription: string;
  credits: number;
  earnerName: string;
  earnerAge: number;
  earnerRep: number;
  submittedDate: string;
  submissionNotes?: string;
  proofPhotos?: string[];
  dueDate: string;
}

interface IssuerReviewQueueProps {
  submittedMents: SubmittedMent[];
  onReview: (mentId: string, rating: number, comment: string, tip?: number) => void;
  onRequestRedo: (mentId: string, comment: string) => void;
}

export default function IssuerReviewQueue({ 
  submittedMents, 
  onReview,
  onRequestRedo
}: IssuerReviewQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState('');
  const [addToFavorites, setAddToFavorites] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleSubmitReview = (ment: SubmittedMent) => {
    const tipAmount = tip ? parseFloat(tip) : undefined;
    onReview(ment.id, rating, comment, tipAmount);
    
    const totalPay = ment.credits + (tipAmount || 0);
    
    setReceiptData({
      title: 'Review Submitted',
      subtitle: ment.mentTitle,
      icon: 'star.fill',
      iconColor: '#FFD700',
      items: [
        { label: 'Rating', value: `${rating} stars`, icon: 'star.fill', highlight: true },
        { label: 'Base Pay', value: `$${ment.credits}`, icon: 'dollarsign.circle' },
        ...(tipAmount ? [{ label: 'Tip', value: `$${tipAmount}`, icon: 'gift.fill', highlight: true }] : []),
        { label: 'Total', value: `$${totalPay}`, icon: 'banknote', highlight: true },
        { label: 'Earner', value: ment.earnerName, icon: 'person.fill' }
      ],
      nextSteps: [
        `${ment.earnerName} has been notified`,
        'Credits have been issued',
        'Rep has been updated',
        ...(addToFavorites ? ['Earner added to your favorites'] : [])
      ]
    });
    setShowReceipt(true);
    setReviewingId(null);
    setExpandedId(null);
    setRating(5);
    setComment('');
    setTip('');
    setAddToFavorites(false);
  };

  const handleRequestRedo = (ment: SubmittedMent) => {
    onRequestRedo(ment.id, comment);
    
    setReceiptData({
      title: 'Redo Requested',
      subtitle: ment.mentTitle,
      icon: 'arrow.clockwise.circle.fill',
      iconColor: '#FF9800',
      items: [
        { label: 'Earner', value: ment.earnerName, icon: 'person.fill' },
        { label: 'Feedback', value: comment.substring(0, 50) + '...', icon: 'text.bubble' }
      ],
      nextSteps: [
        `${ment.earnerName} has been notified`,
        'They can revise and resubmit',
        'You\'ll review again after resubmission'
      ]
    });
    setShowReceipt(true);
    setReviewingId(null);
    setExpandedId(null);
    setComment('');
  };

  const renderStarRating = () => (
    <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          activeOpacity={0.7}
        >
          <IconSymbol
            size={40}
            name={star <= rating ? "star.fill" : "star"}
            color={star <= rating ? "#FFD700" : "#ccc"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMentCard = (ment: SubmittedMent) => {
    const isExpanded = expandedId === ment.id;
    const isReviewing = reviewingId === ment.id;

    return (
      <Surface
        key={ment.id}
        style={{
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: '#fff',
          elevation: 2,
          overflow: 'hidden'
        }}
      >
        <TouchableOpacity
          onPress={() => setExpandedId(isExpanded ? null : ment.id)}
          activeOpacity={0.7}
          disabled={isReviewing}
        >
          <View style={{ padding: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                  {ment.mentTitle}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Avatar.Text 
                    size={28} 
                    label={ment.earnerName[0]} 
                    style={{ backgroundColor: '#E91E63' }}
                  />
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {ment.earnerName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol size={14} name="star.fill" color="#FFD700" />
                    <Text variant="bodySmall" style={{ color: '#666' }}>
                      {ment.earnerRep} Rep
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  ${ment.credits}
                </Text>
                {!isReviewing && (
                  <IconSymbol 
                    size={20} 
                    name={isExpanded ? "chevron.up" : "chevron.down"} 
                    color="#666" 
                  />
                )}
              </View>
            </View>

            {/* Quick Info */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip
                icon={() => <IconSymbol size={14} name="calendar" color="#666" />}
                compact
                style={{ backgroundColor: '#f5f5f5' }}
              >
                Submitted {ment.submittedDate}
              </Chip>
              <Chip
                icon={() => <IconSymbol size={14} name="checkmark.circle.fill" color="#4CAF50" />}
                compact
                style={{ backgroundColor: '#E8F5E9' }}
                textStyle={{ color: '#2E7D32' }}
              >
                Ready for Review
              </Chip>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && !isReviewing && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Divider style={{ marginBottom: 16 }} />
            
            {/* Submission Notes */}
            {ment.submissionNotes && (
              <View style={{ marginBottom: 16 }}>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                  Submission Notes
                </Text>
                <Text variant="bodyMedium" style={{ color: '#666' }}>
                  {ment.submissionNotes}
                </Text>
              </View>
            )}

            {/* Proof Photos */}
            {ment.proofPhotos && ment.proofPhotos.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                  Proof of Completion
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                  <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
                    {ment.proofPhotos.map((photo, index) => (
                      <Surface key={index} style={{ borderRadius: 12 }}>
                        <View style={{ overflow: 'hidden', borderRadius: 12 }}>
                          <Image
                            source={{ uri: photo }}
                            style={{ width: 120, height: 120 }}
                            resizeMode="cover"
                          />
                        </View>
                      </Surface>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <Button
              mode="contained"
              onPress={() => setReviewingId(ment.id)}
              style={{ borderRadius: 12 }}
              contentStyle={{ paddingVertical: 8 }}
              icon={() => <IconSymbol size={20} name="star.fill" color="#fff" />}
            >
              Review This Ment
            </Button>
          </View>
        )}

        {/* Review Form */}
        {isReviewing && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Divider style={{ marginBottom: 16 }} />
            
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Rate the Work
            </Text>
            
            {renderStarRating()}

            <TextInput
              label="Comment (required if ≤2★)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={{ marginBottom: 16 }}
            />

            <TextInput
              label="Tip (optional)"
              value={tip}
              onChangeText={setTip}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Icon icon={() => <Text>$</Text>} />}
              style={{ marginBottom: 16 }}
            />

            <TouchableOpacity
              onPress={() => setAddToFavorites(!addToFavorites)}
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: addToFavorites ? '#FFF3E0' : '#f5f5f5',
                marginBottom: 16
              }}
            >
              <IconSymbol 
                size={24} 
                name={addToFavorites ? "heart.fill" : "heart"} 
                color={addToFavorites ? "#FF9800" : "#666"} 
              />
              <Text variant="bodyMedium" style={{ flex: 1, color: addToFavorites ? '#E65100' : '#666' }}>
                Add to Favorites
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                mode="contained"
                onPress={() => handleSubmitReview(ment)}
                style={{ flex: 1, borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
                disabled={rating <= 2 && !comment.trim()}
              >
                Submit Review
              </Button>
              {rating <= 2 && (
                <Button
                  mode="outlined"
                  onPress={() => handleRequestRedo(ment)}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 8 }}
                  textColor="#FF9800"
                  disabled={!comment.trim()}
                >
                  Request Redo
                </Button>
              )}
            </View>

            <Button
              mode="text"
              onPress={() => {
                setReviewingId(null);
                setRating(5);
                setComment('');
                setTip('');
                setAddToFavorites(false);
              }}
              style={{ marginTop: 8 }}
            >
              Cancel
            </Button>
          </View>
        )}
      </Surface>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
            Review Queue
          </Text>
          {submittedMents.length > 0 && (
            <Chip style={{ backgroundColor: '#4CAF50' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{submittedMents.length}</Text>
            </Chip>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
      >
        {submittedMents.length === 0 ? (
          <Surface style={{ 
            borderRadius: 16,
            padding: 32,
            backgroundColor: '#fff',
            elevation: 2,
            alignItems: 'center',
            marginTop: 40
          }}>
            <IconSymbol size={64} name="tray" color="#ccc" style={{ marginBottom: 16 }} />
            <Text variant="headlineSmall" style={{ color: '#999', textAlign: 'center', marginBottom: 8 }}>
              No Pending Reviews
            </Text>
            <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
              Submitted work will appear here for review.
            </Text>
          </Surface>
        ) : (
          submittedMents.map(renderMentCard)
        )}
      </ScrollView>

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptCard
          visible={showReceipt}
          onDismiss={() => setShowReceipt(false)}
          {...receiptData}
        />
      )}
    </View>
  );
}
