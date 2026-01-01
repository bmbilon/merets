import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, Button, Chip, Avatar, Divider, IconButton } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ReceiptCard from './ReceiptCard';

interface ParentApprovalQueueProps {
  pendingSubmissions: any[];
  loading?: boolean;
  onReview: (submission: any) => void;
  onRefresh: () => void;
}

export default function ParentApprovalQueue({ 
  pendingSubmissions, 
  loading = false,
  onReview,
  onRefresh
}: ParentApprovalQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);



  const renderSubmissionCard = (submission: any) => {
    const isExpanded = expandedId === submission.id;
    const commitment = submission.commitment || {};
    const task = commitment.task || {};
    const user = commitment.user || {};
    const photos = submission.proof_photos || [];

    return (
      <Surface
        key={submission.id}
        style={{
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: '#fff',
          elevation: 2,
          overflow: 'hidden',
          borderLeftWidth: 4,
          borderLeftColor: '#FF9800'
        }}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Avatar.Text 
                  size={32} 
                  label={(user.name || 'K')[0]} 
                  style={{ backgroundColor: '#E91E63' }}
                />
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {user.name || 'Unknown'}
                </Text>
              </View>
              <Text variant="titleSmall" style={{ fontWeight: '600', marginTop: 4 }}>
                {task.title || commitment.custom_title || 'Task'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                ${((commitment.pay_cents || 0) / 100).toFixed(2)}
              </Text>
              <Chip compact style={{ backgroundColor: '#FFF3E0', marginTop: 4 }}>
                <Text style={{ color: '#F57C00', fontWeight: '600', fontSize: 10 }}>Pending Review</Text>
              </Chip>
            </View>
          </View>

          {/* Photo Preview */}
          {photos.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {photos.slice(0, 3).map((photoUrl: string, index: number) => (
                <View key={index} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }}>
                    <IconSymbol size={24} name="photo" color="#999" />
                  </View>
                </View>
              ))}
              {photos.length > 3 && (
                <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }}>
                  <Text variant="bodySmall" style={{ fontWeight: '600', color: '#666' }}>+{photos.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Submission Notes Preview */}
          {submission.submission_notes && (
            <Text variant="bodySmall" style={{ color: '#666', marginBottom: 12, fontStyle: 'italic' }} numberOfLines={2}>
              "{submission.submission_notes}"
            </Text>
          )}

          {/* Review Button */}
          <Button
            mode="contained"
            onPress={() => onReview(submission)}
            style={{ borderRadius: 12 }}
            contentStyle={{ paddingVertical: 8 }}
            buttonColor="#2196F3"
            icon="eye"
          >
            Review Submission
          </Button>
        </View>
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
            Approvals
          </Text>
          {pendingSubmissions.length > 0 && (
            <Chip style={{ backgroundColor: '#FF9800' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{pendingSubmissions.length}</Text>
            </Chip>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
      >
        {loading ? (
          <Surface style={{ 
            borderRadius: 16,
            padding: 32,
            backgroundColor: '#fff',
            elevation: 2,
            alignItems: 'center',
            marginTop: 40
          }}>
            <Text variant="bodyMedium" style={{ color: '#666' }}>Loading submissions...</Text>
          </Surface>
        ) : pendingSubmissions.length === 0 ? (
          <Surface style={{ 
            borderRadius: 16,
            padding: 32,
            backgroundColor: '#fff',
            elevation: 2,
            alignItems: 'center',
            marginTop: 40
          }}>
            <IconSymbol size={64} name="checkmark.circle" color="#ccc" style={{ marginBottom: 16 }} />
            <Text variant="headlineSmall" style={{ color: '#999', textAlign: 'center', marginBottom: 8 }}>
              All Caught Up!
            </Text>
            <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
              No pending approvals at the moment.
            </Text>
          </Surface>
        ) : (
          pendingSubmissions.map(renderSubmissionCard)
        )}
      </ScrollView>


    </View>
  );
}
