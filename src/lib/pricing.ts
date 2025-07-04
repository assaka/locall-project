// lib/pricing.ts

// Pricing configuration (amounts in cents)
export const PRICING = {
  PHONE_NUMBER_COST: parseInt(process.env.PHONE_NUMBER_COST || '100'), // $1.00
  CALL_COST_PER_SECOND: parseInt(process.env.CALL_COST_PER_SECOND || '1'), // $0.01
  SMS_COST_PER_SEGMENT: parseInt(process.env.SMS_COST_PER_SEGMENT || '5'), // $0.05
  ROUTING_EXECUTION_COST: parseInt(process.env.ROUTING_EXECUTION_COST || '2'), // $0.02
};

export type ServiceType = 'phone_purchase' | 'call' | 'sms' | 'routing';

export function calculateCost(service: ServiceType, quantity: number): number {
  switch (service) {
    case 'phone_purchase':
      return PRICING.PHONE_NUMBER_COST * quantity;
    case 'call':
      return PRICING.CALL_COST_PER_SECOND * quantity; // quantity = seconds
    case 'sms':
      return PRICING.SMS_COST_PER_SEGMENT * quantity; // quantity = segments
    case 'routing':
      return PRICING.ROUTING_EXECUTION_COST * quantity; // quantity = executions
    default:
      return 0;
  }
}

export function getServiceDisplayName(service: ServiceType): string {
  switch (service) {
    case 'phone_purchase':
      return 'Phone Number Purchase';
    case 'call':
      return 'Voice Call';
    case 'sms':
      return 'SMS Message';
    case 'routing':
      return 'Call Routing';
    default:
      return service;
  }
}

export function formatCurrency(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}
