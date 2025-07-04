import { notificationService } from '../service';
import { supabase } from '@/app/utils/supabaseClient';

// Note: Jest types and mocks are configured in jest.setup.js
declare global {
  namespace jest {
    interface Matchers<R> {
      toEqual(expected: any): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalled(): R;
      toBe(expected: any): R;
      toBeNull(): R;
      toContain(expected: any): R;
      toThrow(error?: string | Error): R;
    }
  }
}

const mockSupabase = supabase as any;

describe('Notification Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Template Management', () => {
    test('should create notification template', async () => {
      const mockTemplate = {
        id: 'template-1',
        workspace_id: 'workspace-1',
        name: 'Welcome Call',
        type: 'email',
        subject: 'Welcome to our service',
        content: 'Thank you for calling us',
        variables: ['customer_name', 'call_duration'],
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      });

      const result = await notificationService.createTemplate({
        workspace_id: 'workspace-1',
        name: 'Welcome Call',
        type: 'email',
        subject: 'Welcome to our service',
        content: 'Thank you for calling us',
        variables: ['customer_name', 'call_duration'],
        is_active: true,
      });

      expect(result).toEqual(mockTemplate);
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_templates');
    });

    test('should send email notification', async () => {
      const mockNotification = {
        id: 'notification-1',
        workspace_id: 'workspace-1',
        recipient: 'user@example.com',
        type: 'email',
        subject: 'Test Subject',
        content: 'Test Content',
        status: 'sent',
        sent_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      const result = await notificationService.sendEmail({
        workspace_id: 'workspace-1',
        to: 'user@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
        template_id: 'template-1',
      });

      expect(result).toEqual(mockNotification);
    });

    test('should send SMS notification', async () => {
      const mockNotification = {
        id: 'notification-2',
        workspace_id: 'workspace-1',
        recipient: '+1234567890',
        type: 'sms',
        content: 'Test SMS content',
        status: 'sent',
        sent_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      const result = await notificationService.sendSMS({
        workspace_id: 'workspace-1',
        to: '+1234567890',
        content: 'Test SMS content',
        template_id: 'template-2',
      });

      expect(result).toEqual(mockNotification);
    });
  });

  describe('Notification Rules', () => {
    test('should create notification rule', async () => {
      const mockRule = {
        id: 'rule-1',
        workspace_id: 'workspace-1',
        name: 'Missed Call Alert',
        event_type: 'call_missed',
        conditions: { duration: { min: 0, max: 5 } },
        template_id: 'template-1',
        recipients: ['admin@example.com'],
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockRule,
        error: null,
      });

      const result = await notificationService.createRule({
        workspace_id: 'workspace-1',
        name: 'Missed Call Alert',
        event_type: 'call_missed',
        conditions: { duration: { min: 0, max: 5 } },
        template_id: 'template-1',
        recipients: ['admin@example.com'],
        is_active: true,
      });

      expect(result).toEqual(mockRule);
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_rules');
    });

    test('should process notification rules', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          event_type: 'call_completed',
          template_id: 'template-1',
          recipients: ['admin@example.com'],
          conditions: {},
        },
      ];

      mockSupabase.from().select().eq().mockResolvedValue({
        data: mockRules,
        error: null,
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'notification-1', status: 'sent' },
        error: null,
      });

      await notificationService.processEvent('workspace-1', 'call_completed', {
        call_id: 'call-1',
        duration: 120,
      });

      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    });
  });

  describe('Scheduled Notifications', () => {
    test('should schedule notification', async () => {
      const mockScheduled = {
        id: 'scheduled-1',
        workspace_id: 'workspace-1',
        template_id: 'template-1',
        recipient: 'user@example.com',
        scheduled_for: new Date(Date.now() + 60000).toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockScheduled,
        error: null,
      });

      const result = await notificationService.scheduleNotification({
        workspace_id: 'workspace-1',
        template_id: 'template-1',
        recipient: 'user@example.com',
        scheduled_for: new Date(Date.now() + 60000).toISOString(),
      });

      expect(result).toEqual(mockScheduled);
      expect(mockSupabase.from).toHaveBeenCalledWith('scheduled_notifications');
    });

    test('should process scheduled notifications', async () => {
      const mockScheduledNotifications = [
        {
          id: 'scheduled-1',
          template_id: 'template-1',
          recipient: 'user@example.com',
          scheduled_for: new Date().toISOString(),
        },
      ];

      mockSupabase.from().select().lte().eq().mockResolvedValue({
        data: mockScheduledNotifications,
        error: null,
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'notification-1', status: 'sent' },
        error: null,
      });

      mockSupabase.from().update().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      await notificationService.processScheduledNotifications();

      expect(mockSupabase.from().update).toHaveBeenCalled();
    });
  });

  describe('Device Management', () => {
    test('should register device for push notifications', async () => {
      const mockDevice = {
        id: 'device-1',
        user_id: 'user-1',
        device_token: 'device-token-123',
        platform: 'ios',
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockDevice,
        error: null,
      });

      const result = await notificationService.registerDevice({
        user_id: 'user-1',
        device_token: 'device-token-123',
        platform: 'ios',
      });

      expect(result).toEqual(mockDevice);
      expect(mockSupabase.from).toHaveBeenCalledWith('push_devices');
    });

    test('should send push notification', async () => {
      const mockNotification = {
        id: 'notification-3',
        workspace_id: 'workspace-1',
        recipient: 'user-1',
        type: 'push',
        content: 'You have a new call',
        status: 'sent',
        sent_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      const result = await notificationService.sendPushNotification({
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        title: 'New Call',
        content: 'You have a new call',
        data: { call_id: 'call-1' },
      });

      expect(result).toEqual(mockNotification);
    });
  });

  describe('Statistics and Analytics', () => {
    test('should get notification statistics', async () => {
      const mockStats = {
        total_sent: 150,
        delivery_rate: 0.95,
        open_rate: 0.65,
        click_rate: 0.12,
        bounce_rate: 0.05,
        by_type: {
          email: { sent: 100, delivered: 95, opened: 60 },
          sms: { sent: 30, delivered: 29, opened: 25 },
          push: { sent: 20, delivered: 19, opened: 15 },
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const result = await notificationService.getStatistics('workspace-1', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });

      expect(result).toEqual(mockStats);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_notification_stats', {
        workspace_id: 'workspace-1',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });
    });
  });

  describe('Preferences', () => {
    test('should update user notification preferences', async () => {
      const mockPreferences = {
        id: 'pref-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        call_notifications: true,
        form_notifications: true,
        marketing_notifications: false,
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: mockPreferences,
        error: null,
      });

      const result = await notificationService.updatePreferences('user-1', 'workspace-1', {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        call_notifications: true,
        form_notifications: true,
        marketing_notifications: false,
      });

      expect(result).toEqual(mockPreferences);
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_preferences');
    });
  });

  describe('Error Handling', () => {
    test('should handle template creation errors', async () => {
      const error = new Error('Template name already exists');
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(notificationService.createTemplate({
        workspace_id: 'workspace-1',
        name: 'Duplicate Template',
        type: 'email',
        subject: 'Test',
        content: 'Test content',
        variables: [],
        is_active: true,
      })).rejects.toThrow('Template name already exists');
    });

    test('should handle email sending errors gracefully', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: new Error('Email service unavailable'),
      });

      const result = await notificationService.sendEmail({
        workspace_id: 'workspace-1',
        to: 'invalid@email',
        subject: 'Test',
        content: 'Test content',
      });

      expect(result).toBeNull();
    });

    test('should handle missing templates gracefully', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      const result = await notificationService.renderTemplate('non-existent-template', {
        customer_name: 'John Doe',
      });

      expect(result).toBeNull();
    });
  });
});
