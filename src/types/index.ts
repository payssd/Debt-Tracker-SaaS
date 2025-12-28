export type InvoiceStatus = 'Pending' | 'Paid' | 'Overdue';

export interface Customer {
  id: string;
  name: string;
  contact: string;
  address?: string;
  outstandingTotal: number;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  status: InvoiceStatus;
  statementGenerated: boolean;
}

export interface User {
  id: string;
  email: string;
  role: 'Admin' | 'Staff';
}

export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'expired' | 'past_due';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  paystack_plan_code_monthly: string | null;
  paystack_plan_code_yearly: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  paystack_email_token: string | null;
  billing_interval: 'monthly' | 'yearly' | null;
  status: SubscriptionStatus;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  plan_id: string | null;
  event_type: 'trial_started' | 'subscription_created' | 'subscription_renewed' | 'subscription_canceled' | 'payment_failed' | 'subscription_activated';
  paystack_reference: string | null;
  amount: number | null;
  billing_interval: 'monthly' | 'yearly' | null;
  created_at: string;
  plan?: SubscriptionPlan;
}
