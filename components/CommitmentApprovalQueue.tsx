import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Surface, Text, Button, Chip, Avatar } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface CommitmentApprovalQueueProps {
  pendingCommitments: any[];
  loading?: boolean;
  onApprove: (commitmentId: string) => void;
  onDeny: (commitmentId: string) => void;
  onRefresh: () => void;
}

export default function CommitmentApprovalQueue({ 
  pendingCommitments, 
  loading = false,
  onApprove,
  onDeny,
  onRefresh
}: CommitmentApprovalQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const renderCommitmentCard = (commitment: any) => {
    const isExpanded = expandedId === commitment.id;
    const task = commitment.task || {};
    const earner = commitment.user || {};
    const issuer = commitment.issuer || {};

    return (
      <Surface
        key={commitment.id}
        style={{
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: '#fff',
          elevation: 2,
          overflow: 'hidden',
          borderLeftWidth: 4,
          borderLeftColor: '#2196F3'
        }}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Avatar.Text 
                  size={32} 
                  label={earner.name?.[0] || '?'} 
                  style={{ backgroundColor: '#2196F3' }} 
                />
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {earner.name || 'Unknown'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    wants to commit
                  </Text>
                </View>
              </View>
            </View>
            <Chip
              compact
              style={{ backgroundColor: '#E3F2FD' }}
              textStyle={{ color: '#1976D2', fontWeight: '600' }}
            >
              External Task
            </Chip>
          </View>

          {/* Task Info */}
          <View style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 12, 
            borderRadius: 12,
            marginBottom: 12
          }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {task.title || 'Unknown Task'}
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 8 }}>
              {task.description || 'No description'}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <IconSymbol size={16} name="dollarsign.circle" color="#4CAF50" />
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  ${(commitment.pay_cents / 100).toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <IconSymbol size={16} name="clock" color="#FF9800" />
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  {commitment.effort_minutes} min
                </Text>
              </View>
              {task.skill_category && (
                <Chip compact style={{ height: 24 }}>
                  {task.skill_category}
                </Chip>
              )}
            </View>
          </View>

          {/* Issuer Info */}
          <View style={{ 
            backgroundColor: '#FFF3E0', 
            padding: 12, 
            borderRadius: 12,
            marginBottom: 12
          }}>
            <Text variant="labelMedium" style={{ color: '#E65100', marginBottom: 4 }}>
              ⚠️ External Issuer
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar.Text 
                size={24} 
                label={issuer.name?.[0] || '?'} 
                style={{ backgroundColor: '#FF9800' }} 
              />
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                {issuer.name || 'Unknown Issuer'}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
              This task is from someone outside your family. Your approval is required.
            </Text>
          </View>

          {/* Expandable Details */}
          {isExpanded && (
            <View style={{ marginBottom: 12 }}>
              <Text variant="labelMedium" style={{ marginBottom: 8, color: '#666' }}>
                Additional Details:
              </Text>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" style={{ color: '#666' }}>Committed:</Text>
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                    {new Date(commitment.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" style={{ color: '#666' }}>Status:</Text>
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                    Awaiting Approval
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Toggle Details Button */}
          <Button
            mode="text"
            compact
            onPress={() => setExpandedId(isExpanded ? null : commitment.id)}
            style={{ marginBottom: 8 }}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              mode="contained"
              onPress={() => onApprove(commitment.id)}
              style={{ flex: 1, borderRadius: 12 }}
              buttonColor="#4CAF50"
            >
              Approve
            </Button>
            <Button
              mode="outlined"
              onPress={() => onDeny(commitment.id)}
              style={{ flex: 1, borderRadius: 12 }}
              textColor="#F44336"
            >
              Deny
            </Button>
          </View>
        </View>
      </Surface>
    );
  };

  if (loading) {
    return <LoadingState message="Loading commitment approvals..." />;
  }

  if (pendingCommitments.length === 0) {
    return (
      <EmptyState
        icon="checkmark.circle"
        title="No Pending Approvals"
        message="All external task commitments have been reviewed."
        actionLabel="Refresh"
        onAction={onRefresh}
      />
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 16 }}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
          External Task Commitments
        </Text>
        <Text variant="bodySmall" style={{ color: '#666' }}>
          {pendingCommitments.length} commitment{pendingCommitments.length !== 1 ? 's' : ''} awaiting your approval
        </Text>
      </View>

      {pendingCommitments.map(renderCommitmentCard)}
    </ScrollView>
  );
}
