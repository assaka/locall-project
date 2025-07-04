// lib/billing-service.ts
import { supabaseAdmin } from './supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

export interface BillingCustomer {
  id: string;
  workspace_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Stripe.Address;
  tax_ids?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface BillingSubscription {
  id: string;
  workspace_id: string;
  stripe_subscription_id: string;
  customer_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  plan_id: string;
  plan_name: string;
  current_period_start: Date;
  current_period_end: Date;
  trial_end?: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BillingInvoice {
  id: string;
  workspace_id: string;
  stripe_invoice_id: string;
  customer_id: string;
  subscription_id?: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount_due: number;
  amount_paid: number;
  currency: string;
  invoice_number: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  payment_intent_id?: string;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentMethod {
  id: string;
  workspace_id: string;
  stripe_payment_method_id: string;
  customer_id: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: Date;
}

export interface UsageRecord {
  id: string;
  workspace_id: string;
  subscription_id?: string;
  metric_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  period_start: Date;
  period_end: Date;
  created_at: Date;
}

export interface BillingAlert {
  id: string;
  workspace_id: string;
  alert_type: 'usage_threshold' | 'payment_failed' | 'subscription_canceled' | 'invoice_overdue';
  threshold_value?: number;
  current_value?: number;
  message: string;
  is_resolved: boolean;
  created_at: Date;
  resolved_at?: Date;
}

export class BillingService {

  // Customer Management
  static async createCustomer(data: {
    workspace_id: string;
    email: string;
    name?: string;
    phone?: string;
    address?: Stripe.Address;
    metadata?: Record<string, string>;
  }): Promise<BillingCustomer> {
    try {
      // Create Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
        metadata: {
          workspace_id: data.workspace_id,
          ...data.metadata
        }
      });

      // Store in database
      const { data: customer, error } = await supabaseAdmin
        .from('billing_customers')
        .insert({
          workspace_id: data.workspace_id,
          stripe_customer_id: stripeCustomer.id,
          email: data.email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return customer;

    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  static async updateCustomer(customerId: string, data: Partial<BillingCustomer>): Promise<BillingCustomer> {
    try {
      // Get current customer
      const { data: customer } = await supabaseAdmin
        .from('billing_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (!customer) throw new Error('Customer not found');

      // Update Stripe customer
      const updateData: Stripe.CustomerUpdateParams = {};
      if (data.email) updateData.email = data.email;
      if (data.name) updateData.name = data.name;
      if (data.phone) updateData.phone = data.phone;
      if (data.address) updateData.address = data.address;

      if (Object.keys(updateData).length > 0) {
        await stripe.customers.update(customer.stripe_customer_id, updateData);
      }

      // Update database
      const { data: updatedCustomer, error } = await supabaseAdmin
        .from('billing_customers')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return updatedCustomer;

    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  static async getCustomer(workspaceId: string): Promise<BillingCustomer | null> {
    const { data, error } = await supabaseAdmin
      .from('billing_customers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Subscription Management
  static async createSubscription(data: {
    customer_id: string;
    price_id: string;
    trial_period_days?: number;
    payment_method_id?: string;
    metadata?: Record<string, string>;
  }): Promise<BillingSubscription> {
    try {
      const { data: customer } = await supabaseAdmin
        .from('billing_customers')
        .select('*')
        .eq('id', data.customer_id)
        .single();

      if (!customer) throw new Error('Customer not found');

      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.stripe_customer_id,
        items: [{ price: data.price_id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          workspace_id: customer.workspace_id,
          customer_id: data.customer_id,
          ...data.metadata
        }
      };

      if (data.trial_period_days) {
        subscriptionData.trial_period_days = data.trial_period_days;
      }

      if (data.payment_method_id) {
        subscriptionData.default_payment_method = data.payment_method_id;
      }

      const stripeSubscription = await stripe.subscriptions.create(subscriptionData);

      // Get plan details
      const price = await stripe.prices.retrieve(data.price_id, { expand: ['product'] });
      const planName = typeof price.product === 'object' && 'name' in price.product ? 
        (price.product as any).name : 'Unknown Plan';

      // Store in database
      const { data: subscription, error } = await supabaseAdmin
        .from('billing_subscriptions')
        .insert({
          workspace_id: customer.workspace_id,
          stripe_subscription_id: stripeSubscription.id,
          customer_id: data.customer_id,
          status: stripeSubscription.status,
          plan_id: data.price_id,
          plan_name: planName,
          current_period_start: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
          trial_end: (stripeSubscription as any).trial_end ? new Date((stripeSubscription as any).trial_end * 1000).toISOString() : null,
          cancel_at_period_end: (stripeSubscription as any).cancel_at_period_end,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return subscription;

    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<BillingSubscription> {
    try {
      const { data: subscription } = await supabaseAdmin
        .from('billing_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) throw new Error('Subscription not found');

      let stripeSubscription;
      if (cancelAtPeriodEnd) {
        stripeSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
      } else {
        stripeSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      }

      // Update database
      const { data: updatedSubscription, error } = await supabaseAdmin
        .from('billing_subscriptions')
        .update({
          status: stripeSubscription.status,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return updatedSubscription;

    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  static async getSubscriptions(workspaceId: string): Promise<BillingSubscription[]> {
    const { data, error } = await supabaseAdmin
      .from('billing_subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Payment Method Management
  static async addPaymentMethod(data: {
    customer_id: string;
    payment_method_id: string;
    set_as_default?: boolean;
  }): Promise<PaymentMethod> {
    try {
      const { data: customer } = await supabaseAdmin
        .from('billing_customers')
        .select('*')
        .eq('id', data.customer_id)
        .single();

      if (!customer) throw new Error('Customer not found');

      // Attach payment method to customer
      await stripe.paymentMethods.attach(data.payment_method_id, {
        customer: customer.stripe_customer_id
      });

      // Get payment method details
      const stripePaymentMethod = await stripe.paymentMethods.retrieve(data.payment_method_id);

      // Set as default if requested
      if (data.set_as_default) {
        await stripe.customers.update(customer.stripe_customer_id, {
          invoice_settings: {
            default_payment_method: data.payment_method_id
          }
        });

        // Update existing default payment methods
        await supabaseAdmin
          .from('payment_methods')
          .update({ is_default: false })
          .eq('customer_id', data.customer_id);
      }

      let paymentMethodData: any = {
        workspace_id: customer.workspace_id,
        stripe_payment_method_id: data.payment_method_id,
        customer_id: data.customer_id,
        type: stripePaymentMethod.type,
        is_default: data.set_as_default || false,
        created_at: new Date().toISOString()
      };

      // Add card-specific details
      if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
        paymentMethodData.brand = stripePaymentMethod.card.brand;
        paymentMethodData.last4 = stripePaymentMethod.card.last4;
        paymentMethodData.exp_month = stripePaymentMethod.card.exp_month;
        paymentMethodData.exp_year = stripePaymentMethod.card.exp_year;
      }

      const { data: paymentMethod, error } = await supabaseAdmin
        .from('payment_methods')
        .insert(paymentMethodData)
        .select()
        .single();

      if (error) throw error;
      return paymentMethod;

    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  static async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { data: paymentMethod } = await supabaseAdmin
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .single();

      if (!paymentMethod) throw new Error('Payment method not found');

      // Detach from Stripe
      await stripe.paymentMethods.detach(paymentMethod.stripe_payment_method_id);

      // Remove from database
      await supabaseAdmin
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }

  static async getPaymentMethods(workspaceId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Invoice Management
  static async getInvoices(workspaceId: string, limit: number = 50): Promise<BillingInvoice[]> {
    const { data, error } = await supabaseAdmin
      .from('billing_invoices')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async downloadInvoice(invoiceId: string): Promise<string> {
    try {
      const { data: invoice } = await supabaseAdmin
        .from('billing_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (!invoice) throw new Error('Invoice not found');

      const stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id);
      
      if (!stripeInvoice.invoice_pdf) {
        throw new Error('Invoice PDF not available');
      }

      return stripeInvoice.invoice_pdf;

    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  // Usage Tracking
  static async recordUsage(data: {
    workspace_id: string;
    subscription_id?: string;
    metric_name: string;
    quantity: number;
    unit_price: number;
    period_start: Date;
    period_end: Date;
  }): Promise<UsageRecord> {
    const totalAmount = data.quantity * data.unit_price;

    const { data: usageRecord, error } = await supabaseAdmin
      .from('usage_records')
      .insert({
        workspace_id: data.workspace_id,
        subscription_id: data.subscription_id,
        metric_name: data.metric_name,
        quantity: data.quantity,
        unit_price: data.unit_price,
        total_amount: totalAmount,
        period_start: data.period_start.toISOString(),
        period_end: data.period_end.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return usageRecord;
  }

  static async getUsageAnalytics(workspaceId: string, timeRange: string = '30d') {
    const startDate = this.getStartDate(timeRange);

    const { data: usageRecords, error } = await supabaseAdmin
      .from('usage_records')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('period_start', startDate.toISOString())
      .order('period_start', { ascending: true });

    if (error) throw error;

    // Group by metric and calculate totals
    const metricTotals: Record<string, { quantity: number; amount: number }> = {};
    const dailyUsage: Record<string, Record<string, number>> = {};

    usageRecords?.forEach(record => {
      // Metric totals
      if (!metricTotals[record.metric_name]) {
        metricTotals[record.metric_name] = { quantity: 0, amount: 0 };
      }
      metricTotals[record.metric_name].quantity += record.quantity;
      metricTotals[record.metric_name].amount += record.total_amount;

      // Daily usage
      const date = record.period_start.split('T')[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = {};
      }
      if (!dailyUsage[date][record.metric_name]) {
        dailyUsage[date][record.metric_name] = 0;
      }
      dailyUsage[date][record.metric_name] += record.quantity;
    });

    const totalUsageAmount = Object.values(metricTotals).reduce((sum, metric) => sum + metric.amount, 0);

    return {
      metric_totals: metricTotals,
      daily_usage: dailyUsage,
      total_usage_amount: totalUsageAmount,
      time_range: timeRange
    };
  }

  // Billing Alerts
  static async createAlert(data: {
    workspace_id: string;
    alert_type: string;
    threshold_value?: number;
    current_value?: number;
    message: string;
  }): Promise<BillingAlert> {
    const { data: alert, error } = await supabaseAdmin
      .from('billing_alerts')
      .insert({
        workspace_id: data.workspace_id,
        alert_type: data.alert_type,
        threshold_value: data.threshold_value,
        current_value: data.current_value,
        message: data.message,
        is_resolved: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return alert;
  }

  static async resolveAlert(alertId: string): Promise<BillingAlert> {
    const { data: alert, error } = await supabaseAdmin
      .from('billing_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return alert;
  }

  static async getAlerts(workspaceId: string, unresolved_only: boolean = false): Promise<BillingAlert[]> {
    let query = supabaseAdmin
      .from('billing_alerts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (unresolved_only) {
      query = query.eq('is_resolved', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // Webhook Processing
  static async processWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.created':
        case 'invoice.updated':
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          await this.handleInvoiceUpdate(event.data.object as Stripe.Invoice);
          break;

        case 'payment_method.attached':
        case 'payment_method.detached':
          await this.handlePaymentMethodUpdate(event.data.object as Stripe.PaymentMethod);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const { data: existingSubscription } = await supabaseAdmin
      .from('billing_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSubscription) {
      await supabaseAdmin
        .from('billing_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
          cancel_at_period_end: (subscription as any).cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      // Create alert for subscription cancellation
      if (subscription.status === 'canceled') {
        await this.createAlert({
          workspace_id: existingSubscription.workspace_id,
          alert_type: 'subscription_canceled',
          message: `Subscription ${existingSubscription.plan_name} has been canceled`
        });
      }
    }
  }

  private static async handleInvoiceUpdate(invoice: Stripe.Invoice): Promise<void> {
    const workspaceId = invoice.metadata?.workspace_id;
    if (!workspaceId) return;

    const invoiceData = {
      workspace_id: workspaceId,
      stripe_invoice_id: invoice.id,
      customer_id: invoice.metadata?.customer_id,
      subscription_id: (invoice as any).subscription ? (invoice as any).subscription.toString() : null,
      status: invoice.status || 'draft',
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      invoice_number: invoice.number || '',
      invoice_pdf: (invoice as any).invoice_pdf,
      hosted_invoice_url: (invoice as any).hosted_invoice_url,
      payment_intent_id: (invoice as any).payment_intent ? (invoice as any).payment_intent.toString() : null,
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('billing_invoices')
      .upsert({
        ...invoiceData,
        created_at: new Date(invoice.created * 1000).toISOString()
      }, {
        onConflict: 'stripe_invoice_id'
      });

    // Create alert for payment failures
    if (invoice.status === 'open' && invoice.attempt_count && invoice.attempt_count > 1) {
      await this.createAlert({
        workspace_id: workspaceId,
        alert_type: 'payment_failed',
        message: `Payment failed for invoice ${invoice.number}. Amount: ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`
      });
    }
  }

  private static async handlePaymentMethodUpdate(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    // This would sync payment method changes if needed
    // For now, we rely on the manual payment method management
  }

  private static getStartDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
