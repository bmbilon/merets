import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService, Notification } from '../../lib/notification-service';
import { SupabaseService } from '../../lib/supabase-service';
import ParentalApprovalModal from '../../components/ParentalApprovalModal';
import LoadingState from '../../components/LoadingState';

export default function InboxScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [userId, setUserId] = useState<string>('');
  
  // Parental approval modal state
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  const loadUserAndNotifications = async () => {
    try {
      const selectedUser = await AsyncStorage.getItem('selected_user');
      if (!selectedUser) return;

      const userProfile = await SupabaseService.getUserByName(selectedUser);
      if (!userProfile) return;

      setUserId(userProfile.id);
      await loadNotifications(userProfile.id);
    } catch (error) {
      console.error('[INBOX] Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async (uid: string) => {
    try {
      const data = await NotificationService.getNotifications(uid, false);
      setNotifications(data);
    } catch (error) {
      console.error('[INBOX] Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(userId);
    setRefreshing(false);
  };

  const markAsRead = async (notification: Notification) => {
    if (!notification.read) {
      await NotificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    await NotificationService.markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationAction = async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification);

    // Handle action based on type
    switch (notification.action_type) {
      case 'approve_external_task':
        // Load commitment details and show approval modal
        const commitmentId = notification.action_data?.commitment_id;
        if (commitmentId) {
          try {
            const { data: commitment } = await SupabaseService.getSupabaseClient()
              .from('commitments')
              .select(`
                *,
                task_templates (title, description, base_pay_cents, effort_minutes),
                user_profiles!commitments_user_id_fkey (name),
                issuer:user_profiles!commitments_issuer_id_fkey (name)
              `)
              .eq('id', commitmentId)
              .single();

            if (commitment) {
              setSelectedApproval({
                commitmentId: commitment.id,
                taskTitle: commitment.task_templates.title,
                taskDescription: commitment.task_templates.description,
                issuerName: commitment.issuer.name,
                earnerName: commitment.user_profiles.name,
                payAmount: commitment.task_templates.base_pay_cents / 100,
                timeEstimate: `${commitment.task_templates.effort_minutes} min`,
              });
              setApprovalModalVisible(true);
            }
          } catch (error) {
            console.error('[INBOX] Error loading commitment:', error);
            Alert.alert('Error', 'Could not load task details');
          }
        }
        break;

      case 'view_submission':
        // Navigate to approval queue
        router.push('/parent');
        break;

      case 'view_commitment':
        // Navigate to my ments
        router.push('/aveya-dashboard');
        break;

      case 'view_rating':
        // Navigate to stats/history
        router.push('/skills');
        break;

      default:
        // Just mark as read
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_committed: '✅',
      external_task_pending_approval: '⏳',
      external_task_approved: '✅',
      external_task_denied: '❌',
      work_approved: '🎉',
      work_rejected: '❌',
      payment_received: '💰',
      meret_earned: '🏆',
      rework_requested: '🔄',
      rating_received: '⭐',
      child_committed_external_task: '🔔',
      child_submitted_work: '📋',
      approval_needed: '⏳',
      work_submitted: '📸',
      commitment_made: '👤',
    };
    return icons[type] || '📬';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      work_approved: '#4CAF50',
      external_task_approved: '#4CAF50',
      work_rejected: '#F44336',
      external_task_denied: '#F44336',
      rework_requested: '#FF9800',
      rating_received: '#E91E63',
      payment_received: '#FFD700',
      meret_earned: '#FFD700',
      child_committed_external_task: '#FF9800',
      approval_needed: '#FF9800',
    };
    return colors[type] || '#2196F3';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: '#F44336',
      high: '#FF9800',
      normal: '#2196F3',
      low: '#9E9E9E',
    };
    return colors[priority] || '#2196F3';
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <LoadingState message="Loading notifications..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          📬 Inbox
        </Text>
        {unreadCount > 0 && (
          <Chip icon="bell" style={styles.unreadBadge}>
            {unreadCount} new
          </Chip>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Button
          mode={filter === 'all' ? 'contained' : 'outlined'}
          onPress={() => setFilter('all')}
          style={styles.filterButton}
        >
          All ({notifications.length})
        </Button>
        <Button
          mode={filter === 'unread' ? 'contained' : 'outlined'}
          onPress={() => setFilter('unread')}
          style={styles.filterButton}
        >
          Unread ({unreadCount})
        </Button>
        {unreadCount > 0 && (
          <Button
            mode="text"
            onPress={markAllAsRead}
            style={styles.markAllButton}
            compact
          >
            Mark all read
          </Button>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="headlineSmall" style={styles.emptyIcon}>
              ✨
            </Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              All caught up!
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              {filter === 'unread' 
                ? "You've read all your notifications"
                : "No notifications yet"}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard,
                notification.priority === 'urgent' && styles.urgentCard
              ]}
              onPress={() => handleNotificationAction(notification)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.notification_type)}
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.notificationTitle,
                        !notification.read && styles.unreadTitle
                      ]}
                    >
                      {notification.title}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View style={[
                      styles.unreadDot,
                      { backgroundColor: getNotificationColor(notification.notification_type) }
                    ]} />
                  )}
                </View>

                <Text variant="bodyMedium" style={styles.notificationMessage}>
                  {notification.message}
                </Text>

                <View style={styles.metaRow}>
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {new Date(notification.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                  {notification.priority !== 'normal' && (
                    <Chip
                      style={[
                        styles.priorityChip,
                        { backgroundColor: getPriorityColor(notification.priority) + '20' }
                      ]}
                      textStyle={{ color: getPriorityColor(notification.priority), fontSize: 10 }}
                    >
                      {notification.priority.toUpperCase()}
                    </Chip>
                  )}
                </View>

                {notification.action_type && notification.action_type !== 'none' && (
                  <>
                    <Divider style={styles.actionDivider} />
                    <Button
                      mode="contained"
                      onPress={() => handleNotificationAction(notification)}
                      style={[
                        styles.actionButton,
                        { backgroundColor: getNotificationColor(notification.notification_type) }
                      ]}
                      compact
                    >
                      {notification.action_type === 'approve_external_task' && 'Review & Approve'}
                      {notification.action_type === 'view_submission' && 'View Submission'}
                      {notification.action_type === 'view_commitment' && 'View Task'}
                      {notification.action_type === 'view_rating' && 'View Rating'}
                      {notification.action_type === 'view_dispute' && 'View Dispute'}
                    </Button>
                  </>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Parental Approval Modal */}
      {selectedApproval && (
        <ParentalApprovalModal
          visible={approvalModalVisible}
          onDismiss={() => {
            setApprovalModalVisible(false);
            setSelectedApproval(null);
          }}
          commitmentId={selectedApproval.commitmentId}
          taskTitle={selectedApproval.taskTitle}
          taskDescription={selectedApproval.taskDescription}
          issuerName={selectedApproval.issuerName}
          earnerName={selectedApproval.earnerName}
          payAmount={selectedApproval.payAmount}
          timeEstimate={selectedApproval.timeEstimate}
          parentId={userId}
          onApproved={() => {
            Alert.alert('Approved', 'Task has been approved. Your child can now proceed.');
            onRefresh();
          }}
          onDenied={() => {
            Alert.alert('Denied', 'Task has been denied. Your child has been notified.');
            onRefresh();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: '#E91E6320',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: 'white',
  },
  filterButton: {
    flex: 1,
  },
  markAllButton: {
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    color: '#333',
    fontWeight: 'bold',
  },
  emptyMessage: {
    color: '#666',
    textAlign: 'center',
  },
  notificationCard: {
    marginBottom: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
    elevation: 4,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationTitle: {
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notificationMessage: {
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    color: '#999',
  },
  priorityChip: {
    height: 20,
  },
  actionDivider: {
    marginVertical: 12,
  },
  actionButton: {
    borderRadius: 20,
  },
});
