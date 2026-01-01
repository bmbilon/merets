import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Notification types
type NotificationType = 
  | 'approval_requested'
  | 'approval_granted' 
  | 'approval_denied'
  | 'redo_requested'
  | 'review_received'
  | 'ment_overdue'
  | 'tip_received';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: {
    label: string;
    onPress: () => void;
  };
  mentId?: string;
};

export default function InboxScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // TODO: Replace with actual data from Supabase
  const loadNotifications = async () => {
    // Placeholder data - will connect to real notifications later
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'review_received',
        title: '⭐ Work Rated',
        message: 'Your "Clean bedroom" ment was rated 5 stars!',
        timestamp: new Date().toISOString(),
        read: false,
        actionable: {
          label: 'View Details',
          onPress: () => console.log('View review details')
        }
      },
      {
        id: '2',
        type: 'approval_granted',
        title: '✅ Ment Approved',
        message: 'Your "Study for math test" ment was approved by Mom',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      },
      {
        id: '3',
        type: 'redo_requested',
        title: '🔄 Redo Requested',
        message: 'Dad requested improvements on "Organize garage"',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        actionable: {
          label: 'View Feedback',
          onPress: () => console.log('View redo feedback')
        }
      },
    ];
    setNotifications(mockNotifications);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'approval_requested': return '⏳';
      case 'approval_granted': return '✅';
      case 'approval_denied': return '❌';
      case 'redo_requested': return '🔄';
      case 'review_received': return '⭐';
      case 'ment_overdue': return '⏰';
      case 'tip_received': return '💰';
      default: return '📬';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'approval_granted': return '#4CAF50';
      case 'approval_denied': return '#F44336';
      case 'redo_requested': return '#FF9800';
      case 'review_received': return '#E91E63';
      case 'ment_overdue': return '#F44336';
      case 'tip_received': return '#FFD700';
      default: return '#2196F3';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

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
          filteredNotifications.map((notification, index) => (
            <Card
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard
              ]}
              onPress={() => !notification.read && markAsRead(notification.id)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
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
                      { backgroundColor: getNotificationColor(notification.type) }
                    ]} />
                  )}
                </View>

                <Text variant="bodyMedium" style={styles.notificationMessage}>
                  {notification.message}
                </Text>

                <Text variant="bodySmall" style={styles.timestamp}>
                  {new Date(notification.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </Text>

                {notification.actionable && (
                  <>
                    <Divider style={styles.actionDivider} />
                    <Button
                      mode="contained"
                      onPress={notification.actionable.onPress}
                      style={[
                        styles.actionButton,
                        { backgroundColor: getNotificationColor(notification.type) }
                      ]}
                    >
                      {notification.actionable.label}
                    </Button>
                  </>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
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
  timestamp: {
    color: '#999',
  },
  actionDivider: {
    marginVertical: 12,
  },
  actionButton: {
    borderRadius: 20,
  },
});
