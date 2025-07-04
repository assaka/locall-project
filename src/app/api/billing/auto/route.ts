import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// GET - Fetch auto-billing configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const { data: config, error } = await supabase
      .from('auto_billing_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default configuration if none exists
    if (!config) {
      const defaultConfig = {
        workspace_id: workspaceId,
        auto_topup_enabled: false,
        low_balance_threshold: 10.00,
        topup_amount: 50.00,
        max_topup_frequency: 'daily',
        billing_alerts_enabled: true,
        usage_alerts_enabled: true,
        billing_cycle: 'monthly',
        auto_billing_enabled: false
      };

      return NextResponse.json({
        success: true,
        configuration: defaultConfig,
        isDefault: true
      });
    }

    return NextResponse.json({
      success: true,
      configuration: config,
      isDefault: false
    });

  } catch (error) {
    console.error('Error fetching auto-billing configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auto-billing configuration' },
      { status: 500 }
    );
  }
}

// POST - Configure auto-billing settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      autoTopupEnabled,
      lowBalanceThreshold,
      topupAmount,
      maxTopupFrequency,
      billingAlertsEnabled,
      usageAlertsEnabled,
      billingCycle,
      autoBillingEnabled,
      paymentMethodId
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Validate payment method if auto-billing is enabled
    if (autoBillingEnabled && !paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Payment method required for auto-billing' },
        { status: 400 }
      );
    }

    // Validate threshold and topup amounts
    if (lowBalanceThreshold < 0 || topupAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid threshold or topup amount' },
        { status: 400 }
      );
    }

    // Get workspace to verify Stripe customer
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('stripe_customer_id')
      .eq('id', workspaceId)
      .single();

    if (!workspace?.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'No Stripe customer found for workspace' },
        { status: 400 }
      );
    }

    // Verify payment method belongs to customer
    if (paymentMethodId) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.customer !== workspace.stripe_customer_id) {
          return NextResponse.json(
            { success: false, error: 'Invalid payment method' },
            { status: 400 }
          );
        }
      } catch (stripeError) {
        return NextResponse.json(
          { success: false, error: 'Invalid payment method' },
          { status: 400 }
        );
      }
    }

    const configData = {
      workspace_id: workspaceId,
      auto_topup_enabled: autoTopupEnabled || false,
      low_balance_threshold: lowBalanceThreshold || 10.00,
      topup_amount: topupAmount || 50.00,
      max_topup_frequency: maxTopupFrequency || 'daily',
      billing_alerts_enabled: billingAlertsEnabled !== false,
      usage_alerts_enabled: usageAlertsEnabled !== false,
      billing_cycle: billingCycle || 'monthly',
      auto_billing_enabled: autoBillingEnabled || false,
      payment_method_id: paymentMethodId,
      updated_at: new Date().toISOString()
    };

    // Check if configuration exists
    const { data: existingConfig } = await supabase
      .from('auto_billing_config')
      .select('id')
      .eq('workspace_id', workspaceId)
      .single();

    let result;
    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('auto_billing_config')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('auto_billing_config')
        .insert([{ ...configData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Schedule balance monitoring if auto-topup is enabled
    if (autoTopupEnabled) {
      await scheduleBalanceMonitoring(workspaceId);
    }

    return NextResponse.json({
      success: true,
      configuration: result
    });

  } catch (error) {
    console.error('Error configuring auto-billing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure auto-billing' },
      { status: 500 }
    );
  }
}

// PUT - Process auto top-up
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, force = false } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Get auto-billing configuration
    const { data: config } = await supabase
      .from('auto_billing_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (!config || !config.auto_topup_enabled) {
      return NextResponse.json(
        { success: false, error: 'Auto top-up not enabled' },
        { status: 400 }
      );
    }

    // Get current balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('workspace_id', workspaceId)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Check if top-up is needed
    if (!force && wallet.balance >= config.low_balance_threshold) {
      return NextResponse.json({
        success: true,
        message: 'Balance above threshold, no top-up needed',
        currentBalance: wallet.balance,
        threshold: config.low_balance_threshold
      });
    }

    // Check top-up frequency limits
    if (!force) {
      const frequencyCheck = await checkTopupFrequency(workspaceId, config.max_topup_frequency);
      if (!frequencyCheck.allowed) {
        return NextResponse.json({
          success: false,
          error: `Top-up frequency limit exceeded. Next allowed: ${frequencyCheck.nextAllowed}`,
          currentBalance: wallet.balance
        });
      }
    }

    // Process the top-up
    const topupResult = await processAutoTopup(workspaceId, config);

    if (!topupResult.success) {
      return NextResponse.json({
        success: false,
        error: topupResult.error,
        currentBalance: wallet.balance
      });
    }

    // Send notification
    await sendTopupNotification(workspaceId, {
      amount: config.topup_amount,
      newBalance: topupResult.newBalance,
      transactionId: topupResult.transactionId
    });

    return NextResponse.json({
      success: true,
      message: 'Auto top-up completed successfully',
      amount: config.topup_amount,
      newBalance: topupResult.newBalance,
      transactionId: topupResult.transactionId
    });

  } catch (error) {
    console.error('Error processing auto top-up:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process auto top-up' },
      { status: 500 }
    );
  }
}

// Helper function to check top-up frequency
async function checkTopupFrequency(workspaceId: string, frequency: string) {
  const now = new Date();
  let timeLimit: Date;

  switch (frequency) {
    case 'hourly':
      timeLimit = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'daily':
      timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const { data: recentTopups } = await supabase
    .from('transactions')
    .select('created_at')
    .eq('workspace_id', workspaceId)
    .eq('type', 'auto_topup')
    .gte('created_at', timeLimit.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  const allowed = !recentTopups || recentTopups.length === 0;
  const nextAllowed = recentTopups && recentTopups.length > 0 
    ? new Date(new Date(recentTopups[0].created_at).getTime() + (frequency === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
    : now;

  return { allowed, nextAllowed };
}

// Helper function to process auto top-up
async function processAutoTopup(workspaceId: string, config: any) {
  try {
    // Get workspace and customer info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('stripe_customer_id, name')
      .eq('id', workspaceId)
      .single();

    if (!workspace?.stripe_customer_id) {
      return { success: false, error: 'No Stripe customer found' };
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(config.topup_amount * 100), // Convert to cents
      currency: 'usd',
      customer: workspace.stripe_customer_id,
      payment_method: config.payment_method_id,
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        type: 'auto_topup',
        workspace_id: workspaceId
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return { 
        success: false, 
        error: `Payment failed: ${paymentIntent.status}` 
      };
    }

    // Update wallet balance
    const { data: updatedWallet, error: walletError } = await supabase
      .rpc('increment_wallet_balance', {
        workspace_id_param: workspaceId,
        amount_param: config.topup_amount
      });

    if (walletError) throw walletError;

    // Get updated balance
    const { data: currentWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('workspace_id', workspaceId)
      .single();

    // Record transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        workspace_id: workspaceId,
        type: 'auto_topup',
        amount: config.topup_amount,
        description: `Auto top-up - Low balance alert`,
        stripe_payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (transactionError) throw transactionError;

    return {
      success: true,
      newBalance: currentWallet?.balance || 0,
      transactionId: transaction.id
    };

  } catch (error) {
    console.error('Auto top-up processing error:', error);
    return { 
      success: false, 
      error: 'Payment processing failed' 
    };
  }
}

// Helper function to schedule balance monitoring
async function scheduleBalanceMonitoring(workspaceId: string) {
  // This would typically integrate with a job queue like Redis or a cron service
  // For now, we'll log that monitoring should be scheduled
  console.log(`Balance monitoring scheduled for workspace: ${workspaceId}`);
  
  // In a production environment, you would:
  // 1. Add the workspace to a monitoring queue
  // 2. Set up a periodic job to check balances
  // 3. Use a service like AWS EventBridge or Google Cloud Scheduler
}

// Helper function to send top-up notification
async function sendTopupNotification(workspaceId: string, details: any) {
  try {
    // Get workspace admin emails
    const { data: admins } = await supabase
      .from('workspace_members')
      .select(`
        user_id,
        users (
          email
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('role', 'admin');

    if (!admins || admins.length === 0) return;

    // Send email notification (integrate with your email service)
    const emailData = {
      to: admins.map((admin: any) => admin.users?.email).filter(Boolean),
      subject: 'Auto Top-up Completed',
      template: 'auto-topup-notification',
      data: {
        amount: details.amount,
        newBalance: details.newBalance,
        transactionId: details.transactionId,
        timestamp: new Date().toISOString()
      }
    };

    // This would integrate with your email service (SendGrid, SES, etc.)
    console.log('Auto top-up notification sent:', emailData);

  } catch (error) {
    console.error('Error sending top-up notification:', error);
  }
}
