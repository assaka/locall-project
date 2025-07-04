/**
 * Comprehensive Notification System
 * Features: Push, Email, SMS, Scheduling, Templates
 */

import { supabase } from '../../app/utils/supabaseClient';

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  subject?: string;
  content: string;
  variables: string[];
  workspace_id?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  workspace_id?: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'in_app';
  channel: string;
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'system' | 'marketing' | 'transactional' | 'alert';
  template_id?: string;
  created_at: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  trigger_event: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface NotificationCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

export interface NotificationAction {
  type: 'email' | 'sms' | 'push' | 'webhook';
  template_id: string;
  recipients: string[];
  delay_minutes?: number;
}

export interface NotificationSubscription {
  id: string;
  user_id: string;
  workspace_id: string;
  event_type: string;
  channels: ('email' | 'sms' | 'push')[];
  is_active: boolean;
  preferences: {
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quiet_hours?: { start: string; end: string };
    timezone: string;
  };
}

export interface PushDevice {
  id: string;
  user_id: string;
  device_token: string;
  platform: 'ios' | 'android' | 'web';
  app_version: string;
  is_active: boolean;
  last_seen: string;
  created_at: string;
}

export interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_read: number;
  delivery_rate: number;
  read_rate: number;
  by_channel: Record<string, { sent: number; delivered: number; read: number }>;
  by_category: Record<string, { sent: number; delivered: number; read: number }>;
}

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // =====================
  // TEMPLATE MANAGEMENT
  // =====================

  /**
   * Create notification template
   */
  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationTemplate> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('notification_templates')
      .insert({
        ...template,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update notification template
   */
  async updateTemplate(
    templateId: string, 
    updates: Partial<Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<NotificationTemplate> {
    const { data, error } = await supabase
      .from('notification_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Render template with variables
   */
  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<{ subject?: string; content: string }> {
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) throw new Error('Template not found');

    let content = template.content;
    let subject = template.subject;

    // Replace variables in content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
      if (subject) {
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });

    return { subject, content };
  }

  // =====================
  // NOTIFICATION SENDING
  // =====================

  /**
   * Send notification
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Process notification immediately if not scheduled
    if (!notification.scheduled_at) {
      await this.processNotification(data.id);
    }

    return data;
  }

  /**
   * Send email notification
   */
  async sendEmail(
    recipient: string,
    subject: string,
    content: string,
    options: {
      userId?: string;
      workspaceId?: string;
      templateId?: string;
      priority?: Notification['priority'];
      category?: Notification['category'];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Notification> {
    return await this.sendNotification({
      user_id: options.userId,
      workspace_id: options.workspaceId,
      type: 'email',
      channel: 'email',
      recipient,
      subject,
      content,
      status: 'pending',
      priority: options.priority || 'normal',
      category: options.category || 'transactional',
      template_id: options.templateId,
      metadata: options.metadata
    });
  }

  /**
   * Send SMS notification
   */
  async sendSMS(
    phoneNumber: string,
    message: string,
    options: {
      userId?: string;
      workspaceId?: string;
      templateId?: string;
      priority?: Notification['priority'];
      category?: Notification['category'];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Notification> {
    return await this.sendNotification({
      user_id: options.userId,
      workspace_id: options.workspaceId,
      type: 'sms',
      channel: 'sms',
      recipient: phoneNumber,
      content: message,
      status: 'pending',
      priority: options.priority || 'normal',
      category: options.category || 'transactional',
      template_id: options.templateId,
      metadata: options.metadata
    });
  }

  /**
   * Send push notification
   */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    options: {
      workspaceId?: string;
      data?: Record<string, any>;
      priority?: Notification['priority'];
      category?: Notification['category'];
    } = {}
  ): Promise<Notification[]> {
    // Get user's devices
    const { data: devices } = await supabase
      .from('push_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!devices || devices.length === 0) {
      throw new Error('No active devices found for user');
    }

    const notifications: Notification[] = [];

    // Send to each device
    for (const device of devices) {
      const notification = await this.sendNotification({
        user_id: userId,
        workspace_id: options.workspaceId,
        type: 'push',
        channel: device.platform,
        recipient: device.device_token,
        subject: title,
        content: body,
        status: 'pending',
        priority: options.priority || 'normal',
        category: options.category || 'transactional',
        metadata: {
          ...options.data,
          device_id: device.id,
          platform: device.platform
        }
      });

      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Send templated notification
   */
  async sendTemplatedNotification(
    templateId: string,
    recipient: string,
    variables: Record<string, any>,
    options: {
      userId?: string;
      workspaceId?: string;
      scheduledAt?: Date;
      priority?: Notification['priority'];
      category?: Notification['category'];
    } = {}
  ): Promise<Notification> {
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) throw new Error('Template not found');

    const { subject, content } = await this.renderTemplate(templateId, variables);

    return await this.sendNotification({
      user_id: options.userId,
      workspace_id: options.workspaceId,
      type: template.type,
      channel: template.type,
      recipient,
      subject,
      content,
      status: 'pending',
      scheduled_at: options.scheduledAt?.toISOString(),
      priority: options.priority || 'normal',
      category: options.category || 'transactional',
      template_id: templateId,
      metadata: variables
    });
  }

  // =====================
  // NOTIFICATION RULES
  // =====================

  /**
   * Create notification rule
   */
  async createRule(rule: Omit<NotificationRule, 'id' | 'created_at'>): Promise<NotificationRule> {
    const { data, error } = await supabase
      .from('notification_rules')
      .insert({
        ...rule,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Trigger notification rules for an event
   */
  async triggerRules(
    eventType: string, 
    eventData: Record<string, any>, 
    workspaceId: string
  ): Promise<void> {
    // Get active rules for this event type
    const { data: rules } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('trigger_event', eventType)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    if (!rules) return;

    // Process each rule
    for (const rule of rules) {
      if (await this.evaluateConditions(rule.conditions, eventData)) {
        await this.executeActions(rule.actions, eventData, workspaceId);
      }
    }
  }

  /**
   * Evaluate rule conditions
   */
  private async evaluateConditions(
    conditions: NotificationCondition[], 
    eventData: Record<string, any>
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const fieldValue = eventData[condition.field];
      
      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value;
        case 'neq':
          return fieldValue !== condition.value;
        case 'gt':
          return Number(fieldValue) > Number(condition.value);
        case 'gte':
          return Number(fieldValue) >= Number(condition.value);
        case 'lt':
          return Number(fieldValue) < Number(condition.value);
        case 'lte':
          return Number(fieldValue) <= Number(condition.value);
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  /**
   * Execute rule actions
   */
  private async executeActions(
    actions: NotificationAction[], 
    eventData: Record<string, any>, 
    workspaceId: string
  ): Promise<void> {
    for (const action of actions) {
      // Delay if specified
      if (action.delay_minutes && action.delay_minutes > 0) {
        const scheduledAt = new Date(Date.now() + action.delay_minutes * 60 * 1000);
        await this.scheduleAction(action, eventData, workspaceId, scheduledAt);
      } else {
        await this.executeAction(action, eventData, workspaceId);
      }
    }
  }

  /**
   * Execute individual action
   */
  private async executeAction(
    action: NotificationAction, 
    eventData: Record<string, any>, 
    workspaceId: string
  ): Promise<void> {
    for (const recipient of action.recipients) {
      await this.sendTemplatedNotification(
        action.template_id,
        recipient,
        eventData,
        {
          workspaceId,
          category: 'system'
        }
      );
    }
  }

  /**
   * Schedule action for later execution
   */
  private async scheduleAction(
    action: NotificationAction, 
    eventData: Record<string, any>, 
    workspaceId: string, 
    scheduledAt: Date
  ): Promise<void> {
    // Store scheduled action in database
    await supabase
      .from('scheduled_notifications')
      .insert({
        action,
        event_data: eventData,
        workspace_id: workspaceId,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending'
      });
  }

  // =====================
  // SUBSCRIPTION MANAGEMENT
  // =====================

  /**
   * Create notification subscription
   */
  async createSubscription(subscription: Omit<NotificationSubscription, 'id'>): Promise<NotificationSubscription> {
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update subscription preferences
   */
  async updateSubscription(
    subscriptionId: string, 
    updates: Partial<Omit<NotificationSubscription, 'id' | 'user_id'>>
  ): Promise<NotificationSubscription> {
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId: string, workspaceId?: string): Promise<NotificationSubscription[]> {
    let query = supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data } = await query;
    return data || [];
  }

  // =====================
  // DEVICE MANAGEMENT
  // =====================

  /**
   * Register push device
   */
  async registerDevice(device: Omit<PushDevice, 'id' | 'created_at' | 'last_seen'>): Promise<PushDevice> {
    // Deactivate existing devices with same token
    await supabase
      .from('push_devices')
      .update({ is_active: false })
      .eq('device_token', device.device_token);

    const { data, error } = await supabase
      .from('push_devices')
      .insert({
        ...device,
        is_active: true,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update device last seen
   */
  async updateDeviceLastSeen(deviceToken: string): Promise<void> {
    await supabase
      .from('push_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_token', deviceToken);
  }

  /**
   * Deactivate device
   */
  async deactivateDevice(deviceToken: string): Promise<void> {
    await supabase
      .from('push_devices')
      .update({ is_active: false })
      .eq('device_token', deviceToken);
  }

  // =====================
  // NOTIFICATION PROCESSING
  // =====================

  /**
   * Process pending notification
   */
  private async processNotification(notificationId: string): Promise<void> {
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (!notification || notification.status !== 'pending') return;

    try {
      let success = false;

      switch (notification.type) {
        case 'email':
          success = await this.sendEmailNotification(notification);
          break;
        case 'sms':
          success = await this.sendSMSNotification(notification);
          break;
        case 'push':
          success = await this.sendPushNotification(notification);
          break;
        case 'webhook':
          success = await this.sendWebhookNotification(notification);
          break;
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      // Update notification status
      await supabase
        .from('notifications')
        .update({
          status: success ? 'sent' : 'failed',
          sent_at: success ? new Date().toISOString() : null,
          error_message: success ? null : 'Failed to send notification'
        })
        .eq('id', notificationId);

    } catch (error) {
      console.error('Error processing notification:', error);
      
      await supabase
        .from('notifications')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', notificationId);
    }
  }

  /**
   * Send email via external service
   */
  private async sendEmailNotification(notification: Notification): Promise<boolean> {
    // Integration with email service (SendGrid, Mailgun, etc.)
    console.log('Sending email:', {
      to: notification.recipient,
      subject: notification.subject,
      content: notification.content
    });

    // Mock implementation - replace with actual email service
    return true;
  }

  /**
   * Send SMS via external service
   */
  private async sendSMSNotification(notification: Notification): Promise<boolean> {
    // Integration with SMS service (Twilio, etc.)
    console.log('Sending SMS:', {
      to: notification.recipient,
      message: notification.content
    });

    // Mock implementation - replace with actual SMS service
    return true;
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: Notification): Promise<boolean> {
    // Integration with push notification service (FCM, APNs, etc.)
    console.log('Sending push notification:', {
      token: notification.recipient,
      title: notification.subject,
      body: notification.content,
      data: notification.metadata
    });

    // Mock implementation - replace with actual push service
    return true;
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(notification: Notification): Promise<boolean> {
    try {
      const response = await fetch(notification.recipient, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: notification.subject,
          content: notification.content,
          metadata: notification.metadata
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook notification failed:', error);
      return false;
    }
  }

  // =====================
  // ANALYTICS & REPORTING
  // =====================

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    workspaceId?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<NotificationStats> {
    let query = supabase
      .from('notifications')
      .select('type, status, category');

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: notifications } = await query;

    if (!notifications) {
      return {
        total_sent: 0,
        total_delivered: 0,
        total_read: 0,
        delivery_rate: 0,
        read_rate: 0,
        by_channel: {},
        by_category: {}
      };
    }

    const stats = this.calculateNotificationStats(notifications);
    return stats;
  }

  /**
   * Calculate notification statistics
   */
  private calculateNotificationStats(notifications: any[]): NotificationStats {
    const totalSent = notifications.filter(n => ['sent', 'delivered', 'read'].includes(n.status)).length;
    const totalDelivered = notifications.filter(n => ['delivered', 'read'].includes(n.status)).length;
    const totalRead = notifications.filter(n => n.status === 'read').length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;

    // Group by channel
    const byChannel: Record<string, { sent: number; delivered: number; read: number }> = {};
    const byCategory: Record<string, { sent: number; delivered: number; read: number }> = {};

    notifications.forEach(notification => {
      // By channel
      if (!byChannel[notification.type]) {
        byChannel[notification.type] = { sent: 0, delivered: 0, read: 0 };
      }

      if (['sent', 'delivered', 'read'].includes(notification.status)) {
        byChannel[notification.type].sent++;
      }
      if (['delivered', 'read'].includes(notification.status)) {
        byChannel[notification.type].delivered++;
      }
      if (notification.status === 'read') {
        byChannel[notification.type].read++;
      }

      // By category
      if (!byCategory[notification.category]) {
        byCategory[notification.category] = { sent: 0, delivered: 0, read: 0 };
      }

      if (['sent', 'delivered', 'read'].includes(notification.status)) {
        byCategory[notification.category].sent++;
      }
      if (['delivered', 'read'].includes(notification.status)) {
        byCategory[notification.category].delivered++;
      }
      if (notification.status === 'read') {
        byCategory[notification.category].read++;
      }
    });

    return {
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_read: totalRead,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
      read_rate: Math.round(readRate * 100) / 100,
      by_channel: byChannel,
      by_category: byCategory
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);
  }

  /**
   * Mark notification as delivered
   */
  async markAsDelivered(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', notificationId);
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    const now = new Date().toISOString();

    // Get notifications that should be sent now
    const { data: scheduled } = await supabase
      .from('notifications')
      .select('id')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .not('scheduled_at', 'is', null);

    if (!scheduled) return;

    // Process each notification
    for (const notification of scheduled) {
      await this.processNotification(notification.id);
    }
  }
}

export const notificationService = NotificationService.getInstance();
