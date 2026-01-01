import { supabase } from './supabase';

export interface Notification {
  id: string;
  created_at: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  message: string;
  commitment_id?: string;
  submission_id?: string;
  task_template_id?: string;
  read: boolean;
  archived: boolean;
  action_type?: string;
  action_data?: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export class NotificationService {
  // Get all notifications for a user
  static async getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      
      if (unreadOnly) {
        query = query.eq('read', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[NOTIFICATIONS] Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_count', { p_user_id: userId });
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('mark_notification_read', { p_notification_id: notificationId });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('mark_all_read', { p_user_id: userId });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking all as read:', error);
      return false;
    }
  }

  // Archive notification
  static async archiveNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ archived: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error archiving notification:', error);
      return false;
    }
  }

  // Approve external task commitment (parent action)
  static async approveExternalTask(commitmentId: string, parentId: string, notes?: string): Promise<boolean> {
    try {
      // Update commitment
      const { error: updateError } = await supabase
        .from('commitments')
        .update({
          parental_approval_status: 'approved',
          parent_approver_id: parentId,
          parent_approval_notes: notes
        })
        .eq('id', commitmentId);
      
      if (updateError) throw updateError;

      // Get commitment details for notification
      const { data: commitment, error: fetchError } = await supabase
        .from('commitments')
        .select(`
          user_id,
          task_template_id,
          task_templates (title)
        `)
        .eq('id', commitmentId)
        .single();
      
      if (fetchError) throw fetchError;

      // Send notification to earner
      await supabase.rpc('send_notification', {
        p_recipient_id: commitment.user_id,
        p_type: 'external_task_approved',
        p_title: '✅ Task Approved',
        p_message: `Your parent approved "${commitment.task_templates.title}". You can now proceed!`,
        p_commitment_id: commitmentId,
        p_action_type: 'view_commitment',
        p_action_data: { commitment_id: commitmentId },
        p_priority: 'high'
      });

      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error approving external task:', error);
      return false;
    }
  }

  // Deny external task commitment (parent action)
  static async denyExternalTask(commitmentId: string, parentId: string, reason: string): Promise<boolean> {
    try {
      // Update commitment
      const { error: updateError } = await supabase
        .from('commitments')
        .update({
          parental_approval_status: 'denied',
          parent_approver_id: parentId,
          parent_approval_notes: reason,
          status: 'cancelled'
        })
        .eq('id', commitmentId);
      
      if (updateError) throw updateError;

      // Get commitment details for notification
      const { data: commitment, error: fetchError } = await supabase
        .from('commitments')
        .select(`
          user_id,
          task_template_id,
          task_templates (title)
        `)
        .eq('id', commitmentId)
        .single();
      
      if (fetchError) throw fetchError;

      // Send notification to earner
      await supabase.rpc('send_notification', {
        p_recipient_id: commitment.user_id,
        p_type: 'external_task_denied',
        p_title: '❌ Task Not Approved',
        p_message: `Your parent did not approve "${commitment.task_templates.title}". Reason: ${reason}`,
        p_commitment_id: commitmentId,
        p_action_type: 'none',
        p_priority: 'high'
      });

      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error denying external task:', error);
      return false;
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          console.log('[NOTIFICATIONS] New notification received:', payload);
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return subscription;
  }

  // Unsubscribe from notifications
  static unsubscribeFromNotifications(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}
