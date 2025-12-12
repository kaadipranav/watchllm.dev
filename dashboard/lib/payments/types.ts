/**
 * Payment Provider Types
 * 
 * Unified types for Stripe and Whop payment providers
 */

export type PaymentProvider = "stripe" | "whop";

export type Plan = "free" | "starter" | "pro";

export interface PlanConfig {
  name: Plan;
  price: number; // in USD
  interval: "month" | "one_time";
  features: string[];
  limits: {
    requests: number;
    rateLimit: number;
  };
}

export interface CheckoutSessionParams {
  plan: Plan;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export interface PortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export interface PortalSessionResult {
  url: string;
}

export interface WebhookEvent {
  type: string;
  data: any;
}

export interface SubscriptionData {
  id: string;
  userId: string;
  plan: Plan;
  status: "active" | "canceled" | "past_due" | "incomplete";
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

/**
 * Abstract Payment Provider Interface
 */
export interface IPaymentProvider {
  /**
   * Create a checkout session for a subscription
   */
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;

  /**
   * Create a customer portal session
   */
  createPortalSession(params: PortalSessionParams): Promise<PortalSessionResult>;

  /**
   * Verify and parse webhook event
   */
  verifyWebhook(body: string | Buffer, signature: string): Promise<WebhookEvent>;

  /**
   * Handle subscription created event
   */
  handleSubscriptionCreated(event: WebhookEvent): Promise<void>;

  /**
   * Handle subscription updated event
   */
  handleSubscriptionUpdated(event: WebhookEvent): Promise<void>;

  /**
   * Handle subscription deleted event
   */
  handleSubscriptionDeleted(event: WebhookEvent): Promise<void>;

  /**
   * Handle payment succeeded event
   */
  handlePaymentSucceeded(event: WebhookEvent): Promise<void>;
}

/**
 * Plan configurations
 */
export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  free: {
    name: "free",
    price: 0,
    interval: "month",
    features: [
      "50,000 requests/month",
      "10 req/min rate limit",
      "Basic caching",
      "7-day history",
    ],
    limits: {
      requests: 50000,
      rateLimit: 10,
    },
  },
  starter: {
    name: "starter",
    price: 29,
    interval: "month",
    features: [
      "250,000 requests/month",
      "50 req/min rate limit",
      "Advanced caching",
      "30-day history",
      "Email support",
    ],
    limits: {
      requests: 250000,
      rateLimit: 50,
    },
  },
  pro: {
    name: "pro",
    price: 99,
    interval: "month",
    features: [
      "1,000,000 requests/month",
      "200 req/min rate limit",
      "Priority caching",
      "90-day history",
      "Priority support",
      "Team members",
    ],
    limits: {
      requests: 1000000,
      rateLimit: 200,
    },
  },
};
