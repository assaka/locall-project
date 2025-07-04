/**
 * Real-time Notification Service using Supabase Realtime
 * Provides WebSocket-based real-time notifications for LoCall
 */

import React from 'react';
import { supabase } from '../app/utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeNotification {
  id: string;
  type: 'call_status' | 'form_submission' | 'system_alert' | 'billing' | 'integration' | 'user_activity';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  workspace_id: string;
  user_id?: string;
  created_at: string;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: string;
  data?: Record<string, any>;
}

export interface NotificationSubscription {
  channel: RealtimeChannel;
  callback: (notification: RealtimeNotification) => void;
  types?: string[];
}

class RealtimeNotificationService {
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  /**
   * Subscribe to real-time notifications for a workspace
   */
  async subscribe(
    workspaceId: string,
    callback: (notification: RealtimeNotification) => void,
    options: {
      types?: string[];
      userId?: string;
    } = {}
  ): Promise<string> {
    const subscriptionId = `workspace_${workspaceId}_${Date.now()}`;
    
    try {
      // Create a channel for workspace notifications
      const channel = supabase
        .channel(`notifications:${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'realtime_notifications',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            const notification = payload.new as RealtimeNotification;
            
            // Filter by notification types if specified
            if (options.types && !options.types.includes(notification.type)) {
              return;
            }
            
            // Filter by user if specified
            if (options.userId && notification.user_id !== options.userId) {
              return;
            }
            
            callback(notification);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'realtime_notifications',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            const notification = payload.new as RealtimeNotification;
            
            // Handle notification updates (e.g., mark as read)
            if (options.types && !options.types.includes(notification.type)) {
              return;
            }
            
            if (options.userId && notification.user_id !== options.userId) {
              return;
            }
            
            callback(notification);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log(`✅ Subscribed to notifications for workspace ${workspaceId}`);
          } else if (status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.handleReconnection(workspaceId, callback, options);
          }
        });

      // Store subscription
      this.subscriptions.set(subscriptionId, {
        channel,
        callback,
        types: options.types,
      });

      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to system-wide notifications (admin only)
   */
  async subscribeToSystemNotifications(
    callback: (notification: RealtimeNotification) => void
  ): Promise<string> {
    const subscriptionId = `system_${Date.now()}`;
    
    try {
      const channel = supabase
        .channel('system_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'realtime_notifications',
            filter: 'type=eq.system_alert',
          },
          (payload) => {
            const notification = payload.new as RealtimeNotification;
            callback(notification);
          }
        )
        .subscribe();

      this.subscriptions.set(subscriptionId, {
        channel,
        callback,
      });

      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to system notifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to call status updates
   */
  async subscribeToCallUpdates(
    workspaceId: string,
    callback: (notification: RealtimeNotification) => void
  ): Promise<string> {
    return this.subscribe(workspaceId, callback, {
      types: ['call_status'],
    });
  }

  /**
   * Subscribe to form submissions
   */
  async subscribeToFormSubmissions(
    workspaceId: string,
    callback: (notification: RealtimeNotification) => void
  ): Promise<string> {
    return this.subscribe(workspaceId, callback, {
      types: ['form_submission'],
    });
  }

  /**
   * Send a real-time notification
   */
  async sendNotification(notification: Omit<RealtimeNotification, 'id' | 'created_at' | 'read'>): Promise<RealtimeNotification> {
    try {
      const { data, error } = await supabase
        .from('realtime_notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString(),
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      return data as RealtimeNotification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send call status notification
   */
  async sendCallNotification(
    workspaceId: string,
    callData: {
      callId: string;
      status: string;
      phoneNumber: string;
      duration?: number;
      userId?: string;
    }
  ): Promise<RealtimeNotification> {
    const statusMessages = {
      'initiated': 'Call initiated',
      'ringing': 'Call ringing',
      'answered': 'Call answered',
      'completed': 'Call completed',
      'failed': 'Call failed',
      'busy': 'Number busy',
      'no_answer': 'No answer',
    };

    return this.sendNotification({
      type: 'call_status',
      title: statusMessages[callData.status as keyof typeof statusMessages] || 'Call Update',
      message: `Call ${callData.status} for ${callData.phoneNumber}${callData.duration ? ` (${callData.duration}s)` : ''}`,
      data: callData,
      priority: callData.status === 'failed' ? 'high' : 'normal',
      workspace_id: workspaceId,
      user_id: callData.userId,
    });
  }

  /**
   * Send form submission notification
   */
  async sendFormNotification(
    workspaceId: string,
    formData: {
      formId: string;
      formName: string;
      submissionId: string;
      contactInfo?: string;
      userId?: string;
    }
  ): Promise<RealtimeNotification> {
    return this.sendNotification({
      type: 'form_submission',
      title: 'New Form Submission',
      message: `New submission received for "${formData.formName}"${formData.contactInfo ? ` from ${formData.contactInfo}` : ''}`,
      data: formData,
      priority: 'normal',
      workspace_id: workspaceId,
      user_id: formData.userId,
      actions: [
        {
          id: 'view_submission',
          label: 'View Submission',
          type: 'link',
          action: `/dashboard/forms/submissions/${formData.submissionId}`,
        },
      ],
    });
  }

  /**
   * Send system alert notification
   */
  async sendSystemAlert(
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    data?: Record<string, any>
  ): Promise<RealtimeNotification> {
    return this.sendNotification({
      type: 'system_alert',
      title: 'System Alert',
      message,
      data,
      priority,
      workspace_id: 'system',
    });
  }

  /**
   * Send billing notification
   */
  async sendBillingNotification(
    workspaceId: string,
    billingData: {
      type: 'low_balance' | 'payment_failed' | 'invoice_generated' | 'subscription_renewed';
      amount?: number;
      currency?: string;
      dueDate?: string;
      userId?: string;
    }
  ): Promise<RealtimeNotification> {
    const messages = {
      'low_balance': `Low balance warning${billingData.amount ? `: $${billingData.amount} remaining` : ''}`,
      'payment_failed': 'Payment failed - Please update your payment method',
      'invoice_generated': `New invoice generated${billingData.amount ? ` for $${billingData.amount}` : ''}`,
      'subscription_renewed': 'Subscription renewed successfully',
    };

    return this.sendNotification({
      type: 'billing',
      title: 'Billing Update',
      message: messages[billingData.type],
      data: billingData,
      priority: billingData.type === 'payment_failed' ? 'high' : 'normal',
      workspace_id: workspaceId,
      user_id: billingData.userId,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('realtime_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for a workspace
   */
  async getUnreadNotifications(
    workspaceId: string,
    userId?: string,
    limit = 50
  ): Promise<RealtimeNotification[]> {
    try {
      let query = supabase
        .from('realtime_notifications')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as RealtimeNotification[];
    } catch (error) {
      console.error('Failed to get unread notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      await subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`🔌 Unsubscribed from notifications: ${subscriptionId}`);
    }
  }

  /**
   * Unsubscribe from all notifications
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(
      (id) => this.unsubscribe(id)
    );
    await Promise.all(unsubscribePromises);
    this.subscriptions.clear();
    this.isConnected = false;
  }

  /**
   * Handle reconnection logic
   */
  private async handleReconnection(
    workspaceId: string,
    callback: (notification: RealtimeNotification) => void,
    options: { types?: string[]; userId?: string; }
  ): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.subscribe(workspaceId, callback, options);
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Check connection status
   */
  isConnectedToRealtime(): boolean {
    return this.isConnected;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }
}

// Export singleton instance
export const realtimeNotificationService = new RealtimeNotificationService();

// React hook for using real-time notifications
export function useRealtimeNotifications(
  workspaceId: string,
  options: {
    types?: string[];
    userId?: string;
    onNotification?: (notification: RealtimeNotification) => void;
  } = {}
) {
  const [notifications, setNotifications] = React.useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const [subscriptionId, setSubscriptionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let currentSubscriptionId: string | null = null;

    const initializeSubscription = async () => {
      try {
        // Get initial unread notifications
        const unreadNotifications = await realtimeNotificationService.getUnreadNotifications(
          workspaceId,
          options.userId
        );
        setNotifications(unreadNotifications);

        // Subscribe to real-time updates
        currentSubscriptionId = await realtimeNotificationService.subscribe(
          workspaceId,
          (notification) => {
            setNotifications((prev) => [notification, ...prev]);
            options.onNotification?.(notification);
          },
          {
            types: options.types,
            userId: options.userId,
          }
        );
        setSubscriptionId(currentSubscriptionId);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to initialize real-time notifications:', error);
        setIsConnected(false);
      }
    };

    initializeSubscription();

    return () => {
      if (currentSubscriptionId) {
        realtimeNotificationService.unsubscribe(currentSubscriptionId);
      }
    };
  }, [workspaceId, options.userId, JSON.stringify(options.types)]);

  const markAsRead = React.useCallback(async (notificationId: string) => {
    try {
      await realtimeNotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = React.useCallback(async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await Promise.all(unreadIds.map((id) => realtimeNotificationService.markAsRead(id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications]);

  return {
    notifications,
    isConnected,
    markAsRead,
    markAllAsRead,
    unreadCount: notifications.filter((n) => !n.read).length,
  };
}
