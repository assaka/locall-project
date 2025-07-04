import { WalletService } from '../wallet-service';
import { jest } from '@jest/globals';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabase,
}));

describe('WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      const mockBalance = { balance: 1000, currency: 'USD' };
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockBalance,
        error: null,
      });

      const result = await WalletService.getBalance('user123');
      
      expect(result).toEqual(mockBalance);
      expect(mockSupabase.from).toHaveBeenCalledWith('wallets');
    });

    it('should throw error when balance not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(WalletService.getBalance('user123')).rejects.toThrow();
    });
  });

  describe('deductBalance', () => {
    it('should deduct balance successfully', async () => {
      const mockWallet = { id: 'wallet1', balance: 1000 };
      const deductAmount = 100;

      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockWallet, error: null })
        .mockResolvedValueOnce({ data: { ...mockWallet, balance: 900 }, error: null });

      mockSupabase.from().update().eq.mockResolvedValue({
        data: { ...mockWallet, balance: 900 },
        error: null,
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'trans1', amount: deductAmount, type: 'deduction' },
        error: null,
      });

      const result = await WalletService.deductBalance('user123', deductAmount, 'Call charges');
      
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(900);
    });

    it('should fail when insufficient balance', async () => {
      const mockWallet = { id: 'wallet1', balance: 50 };
      const deductAmount = 100;

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockWallet,
        error: null,
      });

      const result = await WalletService.deductBalance('user123', deductAmount, 'Call charges');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });
  });

  describe('addBalance', () => {
    it('should add balance successfully', async () => {
      const mockWallet = { id: 'wallet1', balance: 1000 };
      const addAmount = 500;

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockWallet,
        error: null,
      });

      mockSupabase.from().update().eq.mockResolvedValue({
        data: { ...mockWallet, balance: 1500 },
        error: null,
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'trans1', amount: addAmount, type: 'credit' },
        error: null,
      });

      const result = await WalletService.addBalance('user123', addAmount, 'Top-up');
      
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1500);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      const mockTransactions = [
        { id: 'trans1', amount: 100, type: 'deduction', description: 'Call charges' },
        { id: 'trans2', amount: 500, type: 'credit', description: 'Top-up' },
      ];

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const result = await WalletService.getTransactionHistory('user123');
      
      expect(result).toEqual(mockTransactions);
      expect(mockSupabase.from).toHaveBeenCalledWith('wallet_transactions');
    });
  });

  describe('checkLowBalance', () => {
    it('should detect low balance', async () => {
      const mockUser = { 
        id: 'user123', 
        wallet_balance: 50, 
        low_balance_threshold: 100 
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await WalletService.checkLowBalance('user123');
      
      expect(result.isLowBalance).toBe(true);
      expect(result.currentBalance).toBe(50);
      expect(result.threshold).toBe(100);
    });

    it('should not detect low balance when sufficient', async () => {
      const mockUser = { 
        id: 'user123', 
        wallet_balance: 150, 
        low_balance_threshold: 100 
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await WalletService.checkLowBalance('user123');
      
      expect(result.isLowBalance).toBe(false);
    });
  });
});
