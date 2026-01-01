import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Chip } from 'react-native-paper';
import { NotificationService } from '../lib/notification-service';

interface ParentalApprovalModalProps {
  visible: boolean;
  onDismiss: () => void;
  commitmentId: string;
  taskTitle: string;
  taskDescription: string;
  issuerName: string;
  earnerName: string;
  payAmount: number;
  timeEstimate: string;
  parentId: string;
  onApproved: () => void;
  onDenied: () => void;
}

export default function ParentalApprovalModal({
  visible,
  onDismiss,
  commitmentId,
  taskTitle,
  taskDescription,
  issuerName,
  earnerName,
  payAmount,
  timeEstimate,
  parentId,
  onApproved,
  onDenied
}: ParentalApprovalModalProps) {
  const [notes, setNotes] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const success = await NotificationService.approveExternalTask(
        commitmentId,
        parentId,
        notes || undefined
      );
      
      if (success) {
        onApproved();
        onDismiss();
      } else {
        alert('Failed to approve task. Please try again.');
      }
    } catch (error) {
      console.error('[APPROVAL] Error approving:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      alert('Please provide a reason for denying this task.');
      return;
    }

    setProcessing(true);
    try {
      const success = await NotificationService.denyExternalTask(
        commitmentId,
        parentId,
        denyReason
      );
      
      if (success) {
        onDenied();
        onDismiss();
      } else {
        alert('Failed to deny task. Please try again.');
      }
    } catch (error) {
      console.error('[APPROVAL] Error denying:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={styles.title}>
            🔔 Approval Needed
          </Text>

          <View style={styles.infoCard}>
            <Text variant="titleMedium" style={styles.taskTitle}>
              {taskTitle}
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {taskDescription}
            </Text>

            <View style={styles.detailsRow}>
              <Chip icon="account" style={styles.chip}>
                {earnerName} wants to commit
              </Chip>
            </View>

            <View style={styles.detailsRow}>
              <Chip icon="briefcase" style={styles.chip}>
                Issuer: {issuerName}
              </Chip>
            </View>

            <View style={styles.detailsRow}>
              <Chip icon="cash" style={styles.chip}>
                ${payAmount.toFixed(2)}
              </Chip>
              <Chip icon="clock" style={styles.chip}>
                {timeEstimate}
              </Chip>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Text variant="bodyMedium" style={styles.warningText}>
              ⚠️ This task is from an external issuer. Please review carefully before approving.
            </Text>
          </View>

          {!showDenyInput ? (
            <>
              <TextInput
                label="Optional notes (visible to child)"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="Any guidance or expectations..."
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => setShowDenyInput(true)}
                  style={[styles.button, styles.denyButton]}
                  disabled={processing}
                >
                  Deny
                </Button>
                <Button
                  mode="contained"
                  onPress={handleApprove}
                  style={[styles.button, styles.approveButton]}
                  loading={processing}
                  disabled={processing}
                >
                  Approve
                </Button>
              </View>
            </>
          ) : (
            <>
              <TextInput
                label="Reason for denying (required)"
                value={denyReason}
                onChangeText={setDenyReason}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="Explain why this task is not appropriate..."
                autoFocus
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowDenyInput(false);
                    setDenyReason('');
                  }}
                  style={styles.button}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleDeny}
                  style={[styles.button, styles.denyConfirmButton]}
                  loading={processing}
                  disabled={processing}
                  buttonColor="#F44336"
                >
                  Confirm Deny
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  taskTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 4,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginBottom: 16,
  },
  warningText: {
    color: '#E65100',
  },
  input: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    borderColor: '#F44336',
  },
  denyConfirmButton: {
    backgroundColor: '#F44336',
  },
});
