import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, Button, Chip, Avatar, Divider, IconButton } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ReceiptCard from './ReceiptCard';

interface PendingApproval {
  id: string;
  mentTitle: string;
  mentDescription: string;
  credits: number;
  timeEstimate: string;
  dueDate: string;
  earnerName: string;
  earnerAge: number;
  issuerName: string;
  issuerTrust: string;
  category: string;
  safetyNotes?: string;
}

interface ParentApprovalQueueProps {
  pendingApprovals: PendingApproval[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export default function ParentApprovalQueue({ 
  pendingApprovals, 
  onApprove, 
  onReject 
}: ParentApprovalQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleApprove = (approval: PendingApproval) => {
    onApprove(approval.id);
    setReceiptData({
      title: 'Ment Approved',
      subtitle: approval.mentTitle,
      icon: 'checkmark.circle.fill',
      iconColor: '#4CAF50',
      items: [
        { label: 'Earner', value: approval.earnerName, icon: 'person.fill' },
        { label: 'Payment', value: `$${approval.credits}`, icon: 'dollarsign.circle' },
        { label: 'Due', value: approval.dueDate, icon: 'calendar' }
      ],
      nextSteps: [
        `${approval.earnerName} can now start working`,
        'You\'ll be notified when they submit',
        'Review will be required after completion'
      ]
    });
    setShowReceipt(true);
    setExpandedId(null);
  };

  const handleReject = (approval: PendingApproval) => {
    onReject(approval.id);
    setReceiptData({
      title: 'Ment Rejected',
      subtitle: approval.mentTitle,
      icon: 'xmark.circle.fill',
      iconColor: '#F44336',
      items: [
        { label: 'Earner', value: approval.earnerName, icon: 'person.fill' },
        { label: 'Issuer', value: approval.issuerName, icon: 'person.badge.shield.checkmark' }
      ],
      nextSteps: [
        `${approval.earnerName} has been notified`,
        'They can browse other available ments',
        'You can discuss concerns with them directly'
      ]
    });
    setShowReceipt(true);
    setExpandedId(null);
  };

  const renderApprovalCard = (approval: PendingApproval) => {
    const isExpanded = expandedId === approval.id;

    return (
      <Surface
        key={approval.id}
        style={{
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: '#fff',
          elevation: 2,
          overflow: 'hidden'
        }}
      >
        <TouchableOpacity
          onPress={() => setExpandedId(isExpanded ? null : approval.id)}
          activeOpacity={0.7}
        >
          <View style={{ padding: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Avatar.Text 
                    size={32} 
                    label={approval.earnerName[0]} 
                    style={{ backgroundColor: '#E91E63' }}
                  />
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {approval.earnerName}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    • {approval.earnerAge} years old
                  </Text>
                </View>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginTop: 4 }}>
                  {approval.mentTitle}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  ${approval.credits}
                </Text>
                <IconSymbol 
                  size={20} 
                  name={isExpanded ? "chevron.up" : "chevron.down"} 
                  color="#666" 
                />
              </View>
            </View>

            {/* Quick Info */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip
                icon={() => <IconSymbol size={14} name="clock.fill" color="#666" />}
                compact
                style={{ backgroundColor: '#f5f5f5' }}
              >
                {approval.timeEstimate}
              </Chip>
              <Chip
                icon={() => <IconSymbol size={14} name="calendar" color="#666" />}
                compact
                style={{ backgroundColor: '#f5f5f5' }}
              >
                {approval.dueDate}
              </Chip>
              <Chip
                compact
                style={{ backgroundColor: '#E3F2FD' }}
                textStyle={{ color: '#1976D2' }}
              >
                {approval.category}
              </Chip>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Divider style={{ marginBottom: 16 }} />
            
            {/* Description */}
            <View style={{ marginBottom: 16 }}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Description
              </Text>
              <Text variant="bodyMedium" style={{ color: '#666' }}>
                {approval.mentDescription}
              </Text>
            </View>

            {/* Issuer Info */}
            <View style={{ marginBottom: 16 }}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Issuer
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar.Text size={40} label={approval.issuerName[0]} style={{ backgroundColor: '#2196F3' }} />
                <View>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {approval.issuerName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol size={16} name="checkmark.seal.fill" color="#4CAF50" />
                    <Text variant="bodySmall" style={{ color: '#666' }}>
                      {approval.issuerTrust}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Safety Notes */}
            {approval.safetyNotes && (
              <Surface style={{ 
                backgroundColor: '#FFF3E0',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#FFB74D'
              }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <IconSymbol size={20} name="exclamationmark.triangle.fill" color="#FF9800" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall" style={{ fontWeight: 'bold', color: '#E65100', marginBottom: 4 }}>
                      Safety Notes
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#E65100' }}>
                      {approval.safetyNotes}
                    </Text>
                  </View>
                </View>
              </Surface>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                mode="contained"
                onPress={() => handleApprove(approval)}
                style={{ flex: 1, borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
                buttonColor="#4CAF50"
              >
                Approve
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleReject(approval)}
                style={{ flex: 1, borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
                textColor="#F44336"
              >
                Reject
              </Button>
            </View>
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
            Approvals
          </Text>
          {pendingApprovals.length > 0 && (
            <Chip style={{ backgroundColor: '#FF9800' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{pendingApprovals.length}</Text>
            </Chip>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
      >
        {pendingApprovals.length === 0 ? (
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
          pendingApprovals.map(renderApprovalCard)
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
