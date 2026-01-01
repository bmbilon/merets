import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Surface, Text, Chip, Avatar, Divider, IconButton } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Notification {
  id: string;
  type: 'ment_committed' | 'approval_requested' | 'approved' | 'rejected' | 'work_submitted' | 'review_completed' | 'redo_requested' | 'tip_received' | 'redemption_requested';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  actionLabel?: string;
  onAction?: () => void;
  icon: string;
  iconColor: string;
  mentId?: string;
}

interface NotificationInboxProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
}

export default function NotificationInbox({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh
}: NotificationInboxProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all');

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'actionable') return notif.actionable;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionableCount = notifications.filter(n => n.actionable).length;

  const renderNotification = (notif: Notification) => (
    <TouchableOpacity
      key={notif.id}
      onPress={() => {
        if (!notif.read) onMarkAsRead(notif.id);
        if (notif.onAction) notif.onAction();
      }}
      activeOpacity={0.7}
    >
      <Surface
        style={{
          marginBottom: 12,
          borderRadius: 16,
          backgroundColor: notif.read ? '#fff' : '#F3E5F5',
          elevation: notif.read ? 1 : 3,
          overflow: 'hidden'
        }}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: `${notif.iconColor}20`,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <IconSymbol size={24} name={notif.icon as any} color={notif.iconColor} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', flex: 1 }}>
                  {notif.title}
                </Text>
                {!notif.read && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#6200ee',
                    marginLeft: 8,
                    marginTop: 4
                  }} />
                )}
              </View>
              <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 4 }}>
                {notif.message}
              </Text>
              <Text variant="bodySmall" style={{ color: '#999' }}>
                {notif.timestamp}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          {notif.actionable && notif.actionLabel && (
            <>
              <Divider style={{ marginBottom: 12 }} />
              <TouchableOpacity
                onPress={() => {
                  if (notif.onAction) notif.onAction();
                  if (!notif.read) onMarkAsRead(notif.id);
                }}
                style={{
                  backgroundColor: notif.iconColor,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center'
                }}
              >
                <Text variant="bodyMedium" style={{ color: '#fff', fontWeight: 'bold' }}>
                  {notif.actionLabel}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
            Inbox
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={onMarkAllAsRead}>
              <Text variant="bodyMedium" style={{ color: '#6200ee', fontWeight: '600' }}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={{ backgroundColor: filter === 'all' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ color: filter === 'all' ? '#fff' : '#666' }}
          >
            All ({notifications.length})
          </Chip>
          <Chip
            selected={filter === 'unread'}
            onPress={() => setFilter('unread')}
            style={{ backgroundColor: filter === 'unread' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ color: filter === 'unread' ? '#fff' : '#666' }}
          >
            Unread ({unreadCount})
          </Chip>
          <Chip
            selected={filter === 'actionable'}
            onPress={() => setFilter('actionable')}
            style={{ backgroundColor: filter === 'actionable' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ color: filter === 'actionable' ? '#fff' : '#666' }}
          >
            Action ({actionableCount})
          </Chip>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
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
              {filter === 'unread' ? 'All Caught Up!' : 'No Notifications'}
            </Text>
            <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
              {filter === 'unread' 
                ? 'You\'ve read all your notifications.'
                : 'New notifications will appear here.'}
            </Text>
          </Surface>
        ) : (
          filteredNotifications.map(renderNotification)
        )}
      </ScrollView>
    </View>
  );
}
