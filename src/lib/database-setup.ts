// lib/database-setup.ts
import { supabaseAdmin } from './supabase';

export class DatabaseSetup {
  static async setupDatabase(): Promise<void> {
    try {
      // This would contain your database setup logic
      console.log('Setting up database...');
      
      // Create tables if they don't exist
      // This is a simplified version - in production you'd use migrations
      
      // Example: Ensure wallet_balances table exists
      const { error } = await supabaseAdmin
        .from('wallet_balances')
        .select('*')
        .limit(1);
        
      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        console.log('Creating wallet_balances table...');
        // You would run CREATE TABLE statements here
      }
      
      console.log('Database setup completed');
    } catch (error) {
      console.error('Database setup error:', error);
      throw error;
    }
  }

  static async verifySetup(): Promise<boolean> {
    try {
      // Check if required tables exist
      const tables = [
        'users',
        'wallet_balances', 
        'wallet_transactions',
        'usage_logs',
        'calls',
        'sms_messages'
      ];

      for (const table of tables) {
        const { error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
          
        if (error && error.code === '42P01') {
          console.log(`Table ${table} does not exist`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Database verification error:', error);
      return false;
    }
  }

  static async getStats(): Promise<any> {
    try {
      const stats: any = {};

      // Get table counts
      const tables = ['users', 'calls', 'sms_messages', 'wallet_transactions'];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabaseAdmin
            .from(table)
            .select('*', { count: 'exact', head: true });
            
          stats[`${table}_count`] = error ? 0 : count;
        } catch {
          stats[`${table}_count`] = 0;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  static async createTestUser(email: string, name: string): Promise<string> {
    try {
      const userId = `test-${Date.now()}`;
      
      const { error } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Initialize wallet balance
      await supabaseAdmin
        .from('wallet_balances')
        .insert({
          user_id: userId,
          balance: 1000, // $10.00
          created_at: new Date().toISOString()
        });

      return userId;
    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
  }
}
