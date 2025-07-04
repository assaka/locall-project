import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/ivr/route';

// Mock Supabase
const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
};

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin
}));

// Mock environment variables
process.env.BASE_URL = 'http://localhost:3000';
process.env.CALENDLY_LINK = 'https://calendly.com/test';

describe('IVR System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset date mocking
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('GET /api/ivr - Initial Call Handler', () => {
    it('should return after-hours menu during non-business hours', async () => {
      // Set time to 8 PM (20:00) - after hours
      jest.setSystemTime(new Date('2024-01-15T20:00:00Z'));
      
      const url = new URL('http://localhost:3000/api/ivr?from=+1234567890&to=+1987654321');
      const request = new NextRequest(url);

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      const response = await GET(request);
      const ncco = await response.json();

      expect(response.status).toBe(200);
      expect(ncco).toHaveLength(2);
      expect(ncco[0].action).toBe('talk');
      expect(ncco[0].text).toContain('office is currently closed');
      expect(ncco[1].action).toBe('input');
    });

    it('should return business hours menu during business hours', async () => {
      // Set time to 2 PM (14:00) on a weekday - business hours
      jest.setSystemTime(new Date('2024-01-15T14:00:00Z'));
      
      const url = new URL('http://localhost:3000/api/ivr?from=+1234567890&to=+1987654321');
      const request = new NextRequest(url);

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      const response = await GET(request);
      const ncco = await response.json();

      expect(response.status).toBe(200);
      expect(ncco).toHaveLength(2);
      expect(ncco[0].action).toBe('talk');
      expect(ncco[0].text).toContain('For sales, press 1');
      expect(ncco[1].action).toBe('input');
    });

    it('should handle missing parameters gracefully', async () => {
      const url = new URL('http://localhost:3000/api/ivr');
      const request = new NextRequest(url);

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('Missing required parameters');
    });
  });

  describe('POST /api/ivr/webhook - DTMF Handler', () => {
    it('should handle appointment scheduling during after-hours', async () => {
      jest.setSystemTime(new Date('2024-01-15T20:00:00Z'));

      const requestBody = {
        from: '+1234567890',
        to: '+1987654321',
        dtmf: '1',
        conversation_uuid: 'test-uuid'
      };

      const request = new NextRequest('http://localhost:3000/api/ivr/webhook', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      // Mock fetch for SMS sending
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const response = await POST(request);
      const ncco = await response.json();

      expect(response.status).toBe(200);
      expect(ncco).toHaveLength(2);
      expect(ncco[0].action).toBe('talk');
      expect(ncco[0].text).toContain('send you a text message');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sms/send-calendly'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('+1234567890')
        })
      );
    });

    it('should handle voicemail option during after-hours', async () => {
      jest.setSystemTime(new Date('2024-01-15T20:00:00Z'));

      const requestBody = {
        from: '+1234567890',
        to: '+1987654321',
        dtmf: '2',
        conversation_uuid: 'test-uuid'
      };

      const request = new NextRequest('http://localhost:3000/api/ivr/webhook', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      const response = await POST(request);
      const ncco = await response.json();

      expect(response.status).toBe(200);
      expect(ncco[0].action).toBe('talk');
      expect(ncco[0].text).toContain('leave your message');
      expect(ncco[1].action).toBe('record');
      expect(ncco[1].endOnKey).toBe('#');
    });

    it('should handle sales transfer during business hours', async () => {
      jest.setSystemTime(new Date('2024-01-15T14:00:00Z'));

      const requestBody = {
        from: '+1234567890',
        to: '+1987654321',
        dtmf: '1',
        conversation_uuid: 'test-uuid'
      };

      const request = new NextRequest('http://localhost:3000/api/ivr/webhook', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      const response = await POST(request);
      const ncco = await response.json();

      expect(response.status).toBe(200);
      expect(ncco[0].action).toBe('talk');
      expect(ncco[0].text).toContain('Please hold');
      expect(ncco[1].action).toBe('connect');
      expect(ncco[1].endpoint[0].type).toBe('phone');
    });

    it('should handle invalid DTMF input gracefully', async () => {
      jest.setSystemTime(new Date('2024-01-15T14:00:00Z'));

      const requestBody = {
        from: '+1234567890',
        to: '+1987654321',
        dtmf: '9', // Invalid option
        conversation_uuid: 'test-uuid'
      };

      const request = new NextRequest('http://localhost:3000/api/ivr/webhook', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      const response = await POST(request);
      const ncco = await response.json();

      expect(response.status).toBe(200);
      expect(ncco[0].action).toBe('talk');
      expect(ncco[0].text).toContain('Invalid selection');
      expect(ncco[1].action).toBe('input');
    });

    it('should handle database errors gracefully', async () => {
      const requestBody = {
        from: '+1234567890',
        to: '+1987654321',
        dtmf: '1',
        conversation_uuid: 'test-uuid'
      };

      const request = new NextRequest('http://localhost:3000/api/ivr/webhook', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      mockSupabaseAdmin.from().insert().select().single.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await POST(request);
      const ncco = await response.json();

      expect(response.status).toBe(200);
      expect(ncco[0].action).toBe('talk');
      expect(ncco[0].text).toContain('technical difficulties');
    });
  });

  describe('Business Hours Logic', () => {
    it('should correctly identify weekend as after-hours', async () => {
      // Set to Saturday
      jest.setSystemTime(new Date('2024-01-13T14:00:00Z'));
      
      const url = new URL('http://localhost:3000/api/ivr?from=+1234567890&to=+1987654321');
      const request = new NextRequest(url);

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      const response = await GET(request);
      const ncco = await response.json();

      expect(ncco[0].text).toContain('office is currently closed');
    });

    it('should correctly identify early morning as after-hours', async () => {
      // Set to 7 AM on a weekday
      jest.setSystemTime(new Date('2024-01-15T07:00:00Z'));
      
      const url = new URL('http://localhost:3000/api/ivr?from=+1234567890&to=+1987654321');
      const request = new NextRequest(url);

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-log-id' },
        error: null
      });

      const response = await GET(request);
      const ncco = await response.json();

      expect(ncco[0].text).toContain('office is currently closed');
    });
  });
});
