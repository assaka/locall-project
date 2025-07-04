import { callManagementService } from '../management';
import { supabase } from '@/app/utils/supabaseClient';

// Mock Supabase
jest.mock('@/app/utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      head: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Call Management Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Queue Management', () => {
    it('should create a new call queue', async () => {
      const mockQueue = {
        id: 'queue-1',
        workspace_id: 'workspace-1',
        name: 'Test Queue',
        max_wait_time: 300,
        max_queue_size: 50,
        priority: 1,
        is_active: true,
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockQueue,
        error: null,
      });

      const result = await callManagementService.createQueue({
        workspace_id: 'workspace-1',
        name: 'Test Queue',
        max_wait_time: 300,
        max_queue_size: 50,
        priority: 1,
        is_active: true,
      });

      expect(result).toEqual(mockQueue);
      expect(mockSupabase.from).toHaveBeenCalledWith('call_queues');
    });

    it('should add a call to queue', async () => {
      const mockQueuedCall = {
        id: 'queued-1',
        call_sid: 'call-1',
        queue_id: 'queue-1',
        caller_number: '+1234567890',
        priority: 1,
        position: 1,
        estimated_wait_time: 180,
        queued_at: new Date().toISOString(),
      };

      // Mock count query
      mockSupabase.from().select().eq.mockReturnValueOnce({
        count: jest.fn().mockReturnValueOnce({
          head: jest.fn().mockResolvedValueOnce({ count: 0 })
        })
      });

      // Mock insert
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockQueuedCall,
        error: null,
      });

      // Mock process queue calls
      mockSupabase.from().select().eq().order().limit().single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await callManagementService.addToQueue(
        'call-1',
        'queue-1',
        '+1234567890',
        1
      );

      expect(result).toEqual(mockQueuedCall);
    });

    it('should get queue position for a call', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { position: 3 },
        error: null,
      });

      const position = await callManagementService.getQueuePosition('call-1');

      expect(position).toBe(3);
      expect(mockSupabase.from).toHaveBeenCalledWith('queued_calls');
    });
  });

  describe('Agent Management', () => {
    it('should create a new call agent', async () => {
      const mockAgent = {
        id: 'agent-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        extension: '1001',
        skills: ['sales', 'support'],
        status: 'available',
        max_concurrent_calls: 3,
        current_calls: 0,
        priority: 1,
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockAgent,
        error: null,
      });

      const result = await callManagementService.createAgent({
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        extension: '1001',
        skills: ['sales', 'support'],
        status: 'available',
        max_concurrent_calls: 3,
        current_calls: 0,
        priority: 1,
      });

      expect(result).toEqual(mockAgent);
      expect(mockSupabase.from).toHaveBeenCalledWith('call_agents');
    });

    it('should update agent status', async () => {
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { status: 'busy' },
        error: null,
      });

      const result = await callManagementService.updateAgentStatus('agent-1', 'busy');

      expect(result.status).toBe('busy');
      expect(mockSupabase.from).toHaveBeenCalledWith('call_agents');
    });

    it('should get available agents', async () => {
      const mockAgents = [
        { id: 'agent-1', status: 'available', skills: ['sales'] },
        { id: 'agent-2', status: 'available', skills: ['support'] },
      ];

      mockSupabase.from().select().eq().mockResolvedValue({
        data: mockAgents,
        error: null,
      });

      const agents = await callManagementService.getAvailableAgents('workspace-1');

      expect(agents).toEqual(mockAgents);
    });
  });

  describe('Conference Management', () => {
    it('should create a new conference', async () => {
      const mockConference = {
        id: 'conf-1',
        workspace_id: 'workspace-1',
        name: 'Team Meeting',
        host_user_id: 'user-1',
        max_participants: 10,
        status: 'scheduled',
        is_recording: false,
        participants: [],
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockConference,
        error: null,
      });

      const result = await callManagementService.createConference({
        workspace_id: 'workspace-1',
        name: 'Team Meeting',
        host_user_id: 'user-1',
        max_participants: 10,
        status: 'scheduled',
        is_recording: false,
        participants: [],
      });

      expect(result).toEqual(mockConference);
      expect(mockSupabase.from).toHaveBeenCalledWith('conferences');
    });

    it('should join a conference', async () => {
      const mockParticipant = {
        id: 'participant-1',
        conference_id: 'conf-1',
        call_sid: 'call-1',
        user_id: 'user-1',
        joined_at: new Date().toISOString(),
        role: 'participant',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockParticipant,
        error: null,
      });

      const result = await callManagementService.joinConference('conf-1', 'call-1', 'user-1');

      expect(result).toEqual(mockParticipant);
    });
  });

  describe('IVR Management', () => {
    it('should create an IVR flow', async () => {
      const mockFlow = {
        id: 'flow-1',
        workspace_id: 'workspace-1',
        name: 'Main Menu',
        description: 'Main customer service menu',
        config: {
          welcome_message: 'Welcome to our service',
          menu_options: {
            '1': { action: 'queue', target: 'sales' },
            '2': { action: 'queue', target: 'support' },
          },
        },
        is_active: true,
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockFlow,
        error: null,
      });

      const result = await callManagementService.createIVRFlow({
        workspace_id: 'workspace-1',
        name: 'Main Menu',
        description: 'Main customer service menu',
        config: {
          welcome_message: 'Welcome to our service',
          menu_options: {
            '1': { action: 'queue', target: 'sales' },
            '2': { action: 'queue', target: 'support' },
          },
        },
        is_active: true,
      });

      expect(result).toEqual(mockFlow);
    });

    it('should process IVR input', async () => {
      const mockFlow = {
        config: {
          menu_options: {
            '1': { action: 'queue', target: 'sales' },
            '2': { action: 'queue', target: 'support' },
          },
        },
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockFlow,
        error: null,
      });

      const result = await callManagementService.processIVRInput('flow-1', '1');

      expect(result).toEqual({ action: 'queue', target: 'sales' });
    });
  });

  describe('Call Transfer', () => {
    it('should initiate a call transfer', async () => {
      const mockTransfer = {
        id: 'transfer-1',
        call_sid: 'call-1',
        from_agent_id: 'agent-1',
        to_agent_id: 'agent-2',
        transfer_type: 'attended',
        status: 'initiated',
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockTransfer,
        error: null,
      });

      const result = await callManagementService.initiateTransfer(
        'call-1',
        'agent-1',
        'agent-2',
        'attended'
      );

      expect(result).toEqual(mockTransfer);
    });

    it('should complete a call transfer', async () => {
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { status: 'completed' },
        error: null,
      });

      const result = await callManagementService.completeTransfer('transfer-1');

      expect(result.status).toBe('completed');
    });
  });

  describe('Script Management', () => {
    it('should create a call script', async () => {
      const mockScript = {
        id: 'script-1',
        workspace_id: 'workspace-1',
        name: 'Sales Script',
        content: 'Hello, this is a sales call...',
        type: 'sales',
        variables: ['customer_name', 'product'],
        is_active: true,
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockScript,
        error: null,
      });

      const result = await callManagementService.createScript({
        workspace_id: 'workspace-1',
        name: 'Sales Script',
        content: 'Hello, this is a sales call...',
        type: 'sales',
        variables: ['customer_name', 'product'],
        is_active: true,
      });

      expect(result).toEqual(mockScript);
    });

    it('should get scripts for agent', async () => {
      const mockScripts = [
        { id: 'script-1', name: 'Sales Script', type: 'sales' },
        { id: 'script-2', name: 'Support Script', type: 'support' },
      ];

      mockSupabase.from().select().eq().mockResolvedValue({
        data: mockScripts,
        error: null,
      });

      const scripts = await callManagementService.getScriptsForAgent('agent-1');

      expect(scripts).toEqual(mockScripts);
    });
  });

  describe('Analytics and Reporting', () => {
    it('should get agent call statistics', async () => {
      const mockStats = {
        total_calls: 45,
        answered_calls: 40,
        missed_calls: 5,
        average_call_duration: 240,
        total_talk_time: 9600,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const stats = await callManagementService.getAgentStats(
        'agent-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(stats).toEqual(mockStats);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_agent_call_stats', {
        agent_id: 'agent-1',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });
    });

    it('should get queue statistics', async () => {
      const mockStats = {
        total_calls: 120,
        average_wait_time: 180,
        abandoned_calls: 15,
        service_level: 0.85,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const stats = await callManagementService.getQueueStats('queue-1');

      expect(stats).toEqual(mockStats);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_queue_stats', {
        queue_id: 'queue-1',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle queue creation errors', async () => {
      const error = new Error('Database error');
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(callManagementService.createQueue({
        workspace_id: 'workspace-1',
        name: 'Test Queue',
        max_wait_time: 300,
        max_queue_size: 50,
        priority: 1,
        is_active: true,
      })).rejects.toThrow('Database error');
    });

    it('should handle agent creation errors', async () => {
      const error = new Error('Validation error');
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(callManagementService.createAgent({
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        extension: '1001',
        skills: ['sales'],
        status: 'available',
        max_concurrent_calls: 3,
        current_calls: 0,
        priority: 1,
      })).rejects.toThrow('Validation error');
    });
  });
});
