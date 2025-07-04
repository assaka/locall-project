// lib/wallet-service.ts
import { supabaseAdmin } from './supabase';

export interface DeductionData {
  service: string;
  quantity: number;
  cost: number;
  metadata?: any;
}

export interface DeductionResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

export class WalletService {
  static async getBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.balance || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  static async topUpWallet(
    userId: string,
    amount: number,
    paymentIntentId: string,
    description?: string
  ): Promise<void> {
    try {
      // Update balance
      const { error: balanceError } = await supabaseAdmin
        .rpc('increment_wallet_balance', {
          user_id: userId,
          amount: amount
        });

      if (balanceError) throw balanceError;

      // Record transaction
      await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'top-up',
          amount: amount,
          description: description || 'Wallet top-up',
          payment_intent_id: paymentIntentId
        });

    } catch (error) {
      console.error('Error topping up wallet:', error);
      throw error;
    }
  }

  static async deductFromWallet(
    userId: string,
    data: DeductionData
  ): Promise<DeductionResult> {
    try {
      const currentBalance = await this.getBalance(userId);

      if (currentBalance < data.cost) {
        return {
          success: false,
          newBalance: currentBalance,
          error: 'Insufficient balance'
        };
      }

      // Deduct balance
      const { error: balanceError } = await supabaseAdmin
        .rpc('decrement_wallet_balance', {
          user_id: userId,
          amount: data.cost
        });

      if (balanceError) throw balanceError;

      // Record transaction
      await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'deduction',
          amount: -data.cost,
          description: `${data.service} - ${data.quantity} units`
        });

      // Record usage log
      await supabaseAdmin
        .from('usage_logs')
        .insert({
          user_id: userId,
          service: data.service,
          quantity: data.quantity,
          cost: data.cost,
          metadata: data.metadata
        });

      const newBalance = currentBalance - data.cost;

      return {
        success: true,
        newBalance
      };

    } catch (error) {
      console.error('Error deducting from wallet:', error);
      throw error;
    }
  }

  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  static async getUsageLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting usage logs:', error);
      return [];
    }
  }

  static async updateLowBalanceThreshold(
    userId: string,
    threshold: number
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ low_balance_threshold: threshold })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating threshold:', error);
      throw error;
    }
  }
}
