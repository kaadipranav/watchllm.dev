import Whop from "@whop/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/logger";
import type {
  IPaymentProvider,
  CheckoutSessionParams,
  CheckoutSessionResult,
  PortalSessionParams,
  PortalSessionResult,
  WebhookEvent,
  Plan,
} from "./types";
import { PLAN_CONFIGS } from "./types";

const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY || "",
  appID: process.env.WHOP_APP_ID,
  webhookKey: process.env.WHOP_WEBHOOK_SECRET
    ? btoa(process.env.WHOP_WEBHOOK_SECRET)
    : undefined,
});

const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID || "";

// Whop Plan IDs (create these in your Whop dashboard or via API)
const WHOP_PLAN_IDS: Record<Plan, string | undefined> = {
  free: undefined,
  starter: process.env.WHOP_STARTER_PLAN_ID,
  pro: process.env.WHOP_PRO_PLAN_ID,
};

export class WhopProvider implements IPaymentProvider {
  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const planId = WHOP_PLAN_IDS[params.plan];

    if (!planId) {
      // Create an inline plan if no plan ID is configured
      const config = PLAN_CONFIGS[params.plan];
      
      const checkoutConfig = await whop.checkoutConfigurations.create({
        company_id: WHOP_COMPANY_ID,
        plan: {
          company_id: WHOP_COMPANY_ID,
          initial_price: config.price,
          plan_type: config.interval === "month" ? "renewal" : "one_time",
          renewal_price: config.price,
          currency: "usd",
        },
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
      });

      // Construct the checkout URL with success/cancel URLs as query params
      const checkoutUrl = `https://whop.com/checkout/${checkoutConfig.id}?success_url=${encodeURIComponent(params.successUrl)}&cancel_url=${encodeURIComponent(params.cancelUrl)}`;

      return {
        url: checkoutUrl,
        sessionId: checkoutConfig.id,
      };
    }

    // If plan ID exists, use it
    const checkoutConfig = await whop.checkoutConfigurations.create({
      company_id: WHOP_COMPANY_ID,
      plan_id: planId,
      metadata: {
        userId: params.userId,
        plan: params.plan,
      },
    });

    const checkoutUrl = `https://whop.com/checkout/${checkoutConfig.id}?success_url=${encodeURIComponent(params.successUrl)}&cancel_url=${encodeURIComponent(params.cancelUrl)}`;

    return {
      url: checkoutUrl,
      sessionId: checkoutConfig.id,
    };
  }

  async createPortalSession(
    params: PortalSessionParams
  ): Promise<PortalSessionResult> {
    // Whop users can manage their subscriptions directly on whop.com
    // Redirect them to their account page
    return {
      url: `https://whop.com/hub/memberships`,
    };
  }

  async verifyWebhook(body: string | Buffer, signature: string): Promise<WebhookEvent> {
    const bodyText = typeof body === "string" ? body : body.toString();
    
    // Parse the signature header
    const headers: Record<string, string> = {};
    const sigHeader = signature;
    
    if (sigHeader) {
      headers["webhook-signature"] = sigHeader;
    }

    const webhookData = whop.webhooks.unwrap(bodyText, { headers });

    return {
      type: webhookData.type,
      data: webhookData.data,
    };
  }

  async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    // Whop calls this "membership.activated"
    if (event.type !== "membership.activated") return;

    const membership = event.data;
    const userId = membership.metadata?.userId;
    const plan = membership.metadata?.plan as Plan;

    if (!userId || !plan) {
      console.error("Missing userId or plan in membership metadata");
      return;
    }

    const supabase = createServiceClient();

    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan,
      whop_membership_id: membership.id,
      status: membership.status === "active" ? "active" : "incomplete",
      current_period_end: membership.expires_at
        ? new Date(membership.expires_at).toISOString()
        : null,
      cancel_at_period_end: membership.cancel_at_period_end || false,
    });
  }

  async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    // Whop may not have a direct subscription.updated equivalent
    // Handle membership status changes
    const membership = event.data;

    const supabase = createServiceClient();

    const status = membership.status === "active" ? "active" : 
                   membership.status === "trialing" ? "active" :
                   membership.status === "expired" ? "canceled" : "incomplete";

    await supabase
      .from("subscriptions")
      .update({
        status,
        current_period_end: membership.expires_at
          ? new Date(membership.expires_at).toISOString()
          : null,
        cancel_at_period_end: membership.cancel_at_period_end || false,
      })
      .eq("whop_membership_id", membership.id);
  }

  async handleSubscriptionDeleted(event: WebhookEvent): Promise<void> {
    // Whop calls this "membership.deactivated"
    if (event.type !== "membership.deactivated") return;

    const membership = event.data;

    const supabase = createServiceClient();

    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
      })
      .eq("whop_membership_id", membership.id);
  }

  async handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
    const payment = event.data;
    
    // You can add additional logic here, like sending confirmation emails
    logEvent("info", "Payment succeeded", { paymentId: payment.id });
  }
}
