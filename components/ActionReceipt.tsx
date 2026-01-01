import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Card, Text, Button, Divider, Chip } from 'react-native-paper';

export type ActionReceiptData = {
  // What changed
  creditsEarned?: number;
  meretsEarned?: number;
  repChange?: number; // Can be positive or negative
  
  // Context
  actionType: 'commit' | 'submit' | 'approve' | 'reject' | 'review' | 'redeem' | 'tip';
  title: string;
  description?: string;
  
  // What's next
  nextStep?: {
    message: string;
    action?: {
      label: string;
      onPress: () => void;
    };
  };
  
  // Who was notified
  notified?: string[];
};

interface ActionReceiptProps {
  visible: boolean;
  data: ActionReceiptData;
  onClose: () => void;
}

export function ActionReceipt({ visible, data, onClose }: ActionReceiptProps) {
  const getActionEmoji = () => {
    switch (data.actionType) {
      case 'commit': return '✨';
      case 'submit': return '📤';
      case 'approve': return '✅';
      case 'reject': return '❌';
      case 'review': return '⭐';
      case 'redeem': return '🎁';
      case 'tip': return '💰';
      default: return '✓';
    }
  };

  const getActionColor = () => {
    switch (data.actionType) {
      case 'commit': return '#E91E63';
      case 'submit': return '#2196F3';
      case 'approve': return '#4CAF50';
      case 'reject': return '#F44336';
      case 'review': return '#FF9800';
      case 'redeem': return '#9C27B0';
      case 'tip': return '#FFD700';
      default: return '#666';
    }
  };

  const hasChanges = data.creditsEarned || data.meretsEarned || data.repChange;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.emoji, { color: getActionColor() }]}>
                  {getActionEmoji()}
                </Text>
                <Text variant="headlineSmall" style={styles.title}>
                  {data.title}
                </Text>
                {data.description && (
                  <Text variant="bodyMedium" style={styles.description}>
                    {data.description}
                  </Text>
                )}
              </View>

              {/* What Changed */}
              {hasChanges && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      What Changed
                    </Text>
                    <View style={styles.changes}>
                      {data.creditsEarned !== undefined && data.creditsEarned > 0 && (
                        <Chip
                          icon="currency-usd"
                          style={[styles.chip, { backgroundColor: '#4CAF5020' }]}
                          textStyle={{ color: '#4CAF50', fontWeight: 'bold' }}
                        >
                          +${(data.creditsEarned / 100).toFixed(2)}
                        </Chip>
                      )}
                      {data.meretsEarned !== undefined && data.meretsEarned > 0 && (
                        <Chip
                          icon="star"
                          style={[styles.chip, { backgroundColor: '#FF980020' }]}
                          textStyle={{ color: '#FF9800', fontWeight: 'bold' }}
                        >
                          +{data.meretsEarned.toFixed(1)} Merets
                        </Chip>
                      )}
                      {data.repChange !== undefined && data.repChange !== 0 && (
                        <Chip
                          icon={data.repChange > 0 ? 'arrow-up' : 'arrow-down'}
                          style={[
                            styles.chip,
                            { backgroundColor: data.repChange > 0 ? '#2196F320' : '#F4433620' }
                          ]}
                          textStyle={{
                            color: data.repChange > 0 ? '#2196F3' : '#F44336',
                            fontWeight: 'bold'
                          }}
                        >
                          {data.repChange > 0 ? '+' : ''}{data.repChange} Rep
                        </Chip>
                      )}
                    </View>
                  </View>
                </>
              )}

              {/* What's Next */}
              {data.nextStep && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      What's Next
                    </Text>
                    <Text variant="bodyMedium" style={styles.nextStepText}>
                      {data.nextStep.message}
                    </Text>
                    {data.nextStep.action && (
                      <Button
                        mode="outlined"
                        onPress={() => {
                          onClose();
                          data.nextStep?.action?.onPress();
                        }}
                        style={styles.actionButton}
                      >
                        {data.nextStep.action.label}
                      </Button>
                    )}
                  </View>
                </>
              )}

              {/* Who Was Notified */}
              {data.notified && data.notified.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      Who Was Notified
                    </Text>
                    <View style={styles.notifiedList}>
                      {data.notified.map((person, index) => (
                        <Chip
                          key={index}
                          icon="bell"
                          style={styles.notifiedChip}
                          textStyle={{ fontSize: 12 }}
                        >
                          {person}
                        </Chip>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Close Button */}
              <Button
                mode="contained"
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: getActionColor() }]}
              >
                Done
              </Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: 'white',
    elevation: 8,
    borderRadius: 16,
  },
  content: {
    gap: 16,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    color: '#666',
  },
  divider: {
    marginVertical: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#333',
    fontWeight: '600',
  },
  changes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 20,
  },
  nextStepText: {
    color: '#555',
    lineHeight: 22,
  },
  actionButton: {
    marginTop: 8,
  },
  notifiedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notifiedChip: {
    backgroundColor: '#E3F2FD',
  },
  closeButton: {
    marginTop: 8,
    borderRadius: 25,
  },
});
