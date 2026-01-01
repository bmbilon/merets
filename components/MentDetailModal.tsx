import React, { useState } from 'react';
import { View, ScrollView, Modal } from 'react-native';
import { Surface, Text, Button, Chip, Avatar, Divider, IconButton } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ReceiptCard from './ReceiptCard';

interface Ment {
  id: string;
  title: string;
  description: string;
  credits: number;
  timeEstimate: string;
  dueDate: string;
  issuerName: string;
  issuerTrustBadge?: string;
  approvalRequired: boolean;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  qualityStandard?: string;
  requirements?: string[];
}

interface MentDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  ment: Ment | null;
  onCommit: (mentId: string) => void;
}

export default function MentDetailModal({ visible, onDismiss, ment, onCommit }: MentDetailModalProps) {
  const [showContract, setShowContract] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  if (!ment) return null;

  const handleCommit = () => {
    setShowContract(false);
    setShowReceipt(true);
    setTimeout(() => {
      onCommit(ment.id);
    }, 2000);
  };

  const difficultyColor = {
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336'
  }[ment.difficulty];

  return (
    <>
      <Modal
        visible={visible && !showContract}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onDismiss}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            paddingTop: 60,
            borderBottomWidth: 1,
            borderBottomColor: '#e0e0e0'
          }}>
            <IconButton
              icon={() => <IconSymbol size={24} name="xmark" color="#333" />}
              onPress={onDismiss}
            />
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              Ment Details
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {/* Title & Pay */}
            <View style={{ marginBottom: 24 }}>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                {ment.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  ${ment.credits}
                </Text>
                <Chip
                  compact
                  style={{ backgroundColor: `${difficultyColor}20` }}
                  textStyle={{ color: difficultyColor, fontWeight: '600' }}
                >
                  {ment.difficulty.charAt(0).toUpperCase() + ment.difficulty.slice(1)}
                </Chip>
              </View>
            </View>

            {/* Issuer Info */}
            <Surface style={{ 
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              backgroundColor: '#f5f5f5'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar.Text size={48} label={ment.issuerName[0]} style={{ backgroundColor: '#2196F3' }} />
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {ment.issuerName} {ment.issuerTrustBadge}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    Issuer
                  </Text>
                </View>
              </View>
            </Surface>

            {/* Description */}
            <View style={{ marginBottom: 24 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                Description
              </Text>
              <Text variant="bodyLarge" style={{ color: '#666', lineHeight: 24 }}>
                {ment.description}
              </Text>
            </View>

            {/* Requirements */}
            {ment.requirements && ment.requirements.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                  Requirements
                </Text>
                {ment.requirements.map((req, index) => (
                  <View key={index} style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                    <IconSymbol size={20} name="checkmark.circle.fill" color="#4CAF50" />
                    <Text variant="bodyMedium" style={{ flex: 1, color: '#666' }}>
                      {req}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Details Grid */}
            <View style={{ marginBottom: 24 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                Details
              </Text>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium" style={{ color: '#666' }}>Time Estimate</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{ment.timeEstimate}</Text>
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium" style={{ color: '#666' }}>Due Date</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{ment.dueDate}</Text>
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium" style={{ color: '#666' }}>Category</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{ment.category}</Text>
                </View>
                {ment.qualityStandard && (
                  <>
                    <Divider />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="bodyMedium" style={{ color: '#666' }}>Quality Standard</Text>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{ment.qualityStandard}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Contract Terms */}
            <Surface style={{ 
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              backgroundColor: '#E3F2FD',
              borderWidth: 1,
              borderColor: '#2196F3'
            }}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12, color: '#1976D2' }}>
                📋 Ment Contract Terms
              </Text>
              <View style={{ gap: 8 }}>
                <Text variant="bodySmall" style={{ color: '#1565C0' }}>
                  • Payment of ${ment.credits} guaranteed upon completion
                </Text>
                <Text variant="bodySmall" style={{ color: '#1565C0' }}>
                  • Quality rating affects your Merets, not your pay
                </Text>
                <Text variant="bodySmall" style={{ color: '#1565C0' }}>
                  • Redo possible if rated ≤2★ (one chance to improve)
                </Text>
                {ment.approvalRequired && (
                  <Text variant="bodySmall" style={{ color: '#1565C0' }}>
                    • Parent/Guardian approval required before starting
                  </Text>
                )}
              </View>
            </Surface>
          </ScrollView>

          {/* Bottom Action */}
          <View style={{ 
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            backgroundColor: '#fff'
          }}>
            <Button
              mode="contained"
              onPress={() => setShowContract(true)}
              style={{ borderRadius: 12 }}
              contentStyle={{ paddingVertical: 12 }}
            >
              {ment.approvalRequired ? 'Commit (Await Approval)' : 'Commit to This Ment'}
            </Button>
          </View>
        </View>
      </Modal>

      {/* Contract Confirmation Modal */}
      <Modal
        visible={showContract}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContract(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20
        }}>
          <Surface style={{ 
            width: '100%',
            maxWidth: 400,
            borderRadius: 24,
            padding: 24,
            backgroundColor: '#fff'
          }}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Accept Ment Contract?
            </Text>
            
            <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 24, textAlign: 'center' }}>
              By committing, you agree to complete "{ment.title}" by {ment.dueDate} according to the terms outlined.
            </Text>

            <View style={{ gap: 12 }}>
              <Button
                mode="contained"
                onPress={handleCommit}
                style={{ borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                Yes, I Commit
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowContract(false)}
                style={{ borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                Go Back
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>

      {/* Receipt */}
      <ReceiptCard
        visible={showReceipt}
        onDismiss={() => {
          setShowReceipt(false);
          onDismiss();
        }}
        title="Ment Committed!"
        subtitle={ment.title}
        icon="checkmark.circle.fill"
        iconColor="#4CAF50"
        items={[
          { label: 'Payment', value: `$${ment.credits}`, highlight: true, icon: 'dollarsign.circle' },
          { label: 'Due', value: ment.dueDate, icon: 'calendar' },
          { label: 'Status', value: ment.approvalRequired ? 'Awaiting Approval' : 'Active', icon: 'clock.fill' }
        ]}
        nextSteps={
          ment.approvalRequired
            ? [
                'Your parent/guardian will be notified',
                'You\'ll get a notification when approved',
                'Then you can start working!'
              ]
            : [
                'Start working on this ment',
                'Submit when complete',
                'Get paid after review'
              ]
        }
      />
    </>
  );
}
