import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Surface, Text, Chip, Divider, IconButton, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_type: string;
  action_data: any;
}

interface EnhancedInboxProps {
  userId: string;
  userName: string;
}

export default function EnhancedInbox({ userId, userName }: EnhancedInboxProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'child_committed_external_task':
        return '📋';
      case 'work_submitted':
        return '📸';
      case 'work_approved':
      case 'commitment_approved':
        return '✅';
      case 'work_rejected':
      case 'commitment_denied':
        return '❌';
      case 'payment_received':
        return '💰';
      case 'achievement_unlocked':
        return '🏆';
      case 'level_up':
        return '⭐';
      case 'streak_milestone':
        return '🔥';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'work_approved':
      case 'commitment_approved':
      case 'payment_received':
        return '#4CAF50';
      case 'work_rejected':
      case 'commitment_denied':
        return '#F44336';
      case 'work_submitted':
      case 'child_committed_external_task':
        return '#FF9800';
      case 'achievement_unlocked':
      case 'level_up':
        return '#9C27B0';
      case 'streak_milestone':
        return '#FF6B00';
      default:
        return '#2196F3';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey = '';
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = date.toLocaleDateString();
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={{ paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text variant="headlineMedium" style={{ color: '#fff', fontWeight: 'bold' }}>
            Inbox
          </Text>
          {unreadCount > 0 && (
            <Badge size={24} style={{ backgroundColor: '#FF6B00' }}>
              {unreadCount}
            </Badge>
          )}
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={{ backgroundColor: filter === 'all' ? '#fff' : 'rgba(255,255,255,0.3)' }}
            textStyle={{ color: filter === 'all' ? '#2196F3' : '#fff' }}
          >
            All ({notifications.length})
          </Chip>
          <Chip
            selected={filter === 'unread'}
            onPress={() => setFilter('unread')}
            style={{ backgroundColor: filter === 'unread' ? '#fff' : 'rgba(255,255,255,0.3)' }}
            textStyle={{ color: filter === 'unread' ? '#2196F3' : '#fff' }}
          >
            Unread ({unreadCount})
          </Chip>
          {unreadCount > 0 && (
            <Chip
              onPress={markAllAsRead}
              style={{ backgroundColor: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}
              textStyle={{ color: '#fff', fontSize: 12 }}
            >
              Mark all read
            </Chip>
          )}
        </View>
      </LinearGradient>

      {/* Notifications List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              All caught up!
            </Text>
            <Text style={{ color: '#666', textAlign: 'center' }}>
              {filter === 'unread' 
                ? 'No unread notifications'
                : 'You have no notifications'}
            </Text>
          </View>
        ) : (
          Object.entries(groupedNotifications).map(([date, notifs]) => (
            <View key={date} style={{ marginBottom: 16 }}>
              <Text 
                variant="labelLarge" 
                style={{ 
                  paddingHorizontal: 20, 
                  paddingVertical: 8, 
                  color: '#666',
                  fontWeight: 'bold'
                }}
              >
                {date}
              </Text>
              {notifs.map((notification, index) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => markAsRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <Surface 
                    style={{ 
                      marginHorizontal: 16,
                      marginBottom: 8,
                      borderRadius: 12,
                      elevation: notification.read ? 1 : 3,
                      opacity: notification.read ? 0.7 : 1,
                      borderLeftWidth: 4,
                      borderLeftColor: getNotificationColor(notification.type)
                    }}
                  >
                    <View style={{ padding: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 32, marginRight: 12 }}>
                          {getNotificationIcon(notification.type)}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text 
                              variant="titleMedium" 
                              style={{ 
                                fontWeight: notification.read ? 'normal' : 'bold',
                                flex: 1
                              }}
                            >
                              {notification.title}
                            </Text>
                            <IconButton
                              icon="close"
                              size={16}
                              onPress={() => deleteNotification(notification.id)}
                              style={{ margin: 0 }}
                            />
                          </View>
                          <Text style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                            {notification.message}
                          </Text>
                          <Text style={{ color: '#999', fontSize: 12 }}>
                            {getTimeAgo(notification.created_at)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
