import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPaymentProvider, getPaymentProviderType } from "@/lib/payments";
import { logEvent } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersObj = headers();
    
    // Get the appropriate signature header based on provider
    const providerType = getPaymentProviderType();
    const signature = providerType === "stripe"
      ? headersObj.get("stripe-signature") || ""
      : headersObj.get("webhook-signature") || headersObj.get("whop-signature") || "";

    if (!signature) {
      console.error("Missing webhook signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    const paymentProvider = getPaymentProvider();

    // Verify and parse webhook
    const event = await paymentProvider.verifyWebhook(body, signature);

    // Handle different event types based on provider
    if (providerType === "stripe") {
      switch (event.type) {
        case "checkout.session.completed":
        case "customer.subscription.created":
          await paymentProvider.handleSubscriptionCreated(event);
          break;

        case "customer.subscription.updated":
          await paymentProvider.handleSubscriptionUpdated(event);
          break;

        case "customer.subscription.deleted":
          await paymentProvider.handleSubscriptionDeleted(event);
          break;

        case "invoice.payment_succeeded":
          await paymentProvider.handlePaymentSucceeded(event);
          break;

        case "invoice.payment_failed":
          // Handle payment failure - could send email or mark subscription as past_due
          logEvent("warn", "Payment failed", { data: event.data });
          break;

        default:
          logEvent("info", "Unhandled Stripe event type", { type: event.type });
      }
    } else if (providerType === "whop") {
      switch (event.type) {
        case "membership.activated":
          await paymentProvider.handleSubscriptionCreated(event);
          break;

        case "membership.updated":
          await paymentProvider.handleSubscriptionUpdated(event);
          break;

        case "membership.deactivated":
          await paymentProvider.handleSubscriptionDeleted(event);
          break;

        case "payment.succeeded":
          await paymentProvider.handlePaymentSucceeded(event);
          break;

        case "payment.failed":
          // Handle payment failure
          logEvent("warn", "Payment failed", { data: event.data });
          break;

        default:
          logEvent("info", "Unhandled Whop event type", { type: event.type });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logEvent("error", "Webhook error", { error: error.message });
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 400 }
    );
  }
}
