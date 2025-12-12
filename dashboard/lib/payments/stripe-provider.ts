import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  IPaymentProvider,
  CheckoutSessionParams,
  CheckoutSessionResult,
  PortalSessionParams,
  PortalSessionResult,
  WebhookEvent,
  Plan,
} from "./types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Stripe Price IDs (set these via environment variables or create them programmatically)
const STRIPE_PRICE_IDS: Record<Plan, string | undefined> = {
  free: undefined,
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
};

export class StripeProvider implements IPaymentProvider {
  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const priceId = STRIPE_PRICE_IDS[params.plan];

    if (!priceId) {
      throw new Error(`No Stripe price ID configured for plan: ${params.plan}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: params.userEmail,
      client_reference_id: params.userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        plan: params.plan,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
      },
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session");
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  async createPortalSession(
    params: PortalSessionParams
  ): Promise<PortalSessionResult> {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return {
      url: session.url,
    };
  }

  async verifyWebhook(body: string | Buffer, signature: string): Promise<WebhookEvent> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    return {
      type: event.type,
      data: event.data.object,
    };
  }

  async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    const subscription = event.data as Stripe.Subscription;
    const userId = subscription.metadata.userId;
    const plan = subscription.metadata.plan as Plan;

    if (!userId || !plan) {
      console.error("Missing userId or plan in subscription metadata");
      return;
    }

    const supabase = createServiceClient();

    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
  }

  async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    const subscription = event.data as Stripe.Subscription;

    const supabase = createServiceClient();

    await supabase
      .from("subscriptions")
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  async handleSubscriptionDeleted(event: WebhookEvent): Promise<void> {
    const subscription = event.data as Stripe.Subscription;

    const supabase = createServiceClient();

    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  async handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
    const invoice = event.data as Stripe.Invoice;
    
    // You can add additional logic here, like sending confirmation emails
    console.log(`Payment succeeded for invoice: ${invoice.id}`);
  }
}
