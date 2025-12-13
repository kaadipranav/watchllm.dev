import * as Sentry from "@sentry/nextjs";
import { logEvent, captureError } from "@/lib/logger";
import { sendPaymentFailedEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    captureError(error, { action: "stripe.webhook", result: "invalid_signature" });
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (!userId) {
          logEvent("warn", "checkout.completed missing userId", {
            action: "stripe.webhook",
            eventType: event.type,
          });
          break;
        }

        logEvent("info", "checkout.completed", {
          action: "stripe.webhook",
          eventType: event.type,
          userId,
          plan,
          sessionId: session.id,
        });

        // Update or create subscription
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: plan || "starter",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Get user by customer ID
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!existingSub) break;

        logEvent("info", "subscription.updated", {
          action: "stripe.webhook",
          eventType: event.type,
          userId: existingSub.user_id,
          customerId,
          plan: subscription.metadata?.plan,
          status: subscription.status,
        });

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            plan: subscription.metadata?.plan || "starter",
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        logEvent("info", "subscription.deleted", {
          action: "stripe.webhook",
          eventType: event.type,
          customerId,
        });

        // Downgrade to free plan
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        logEvent("warn", "invoice.payment_failed", {
          action: "stripe.webhook",
          eventType: event.type,
          invoiceId: invoice.id,
          customerId,
        });

        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("user_id, plan")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (subscription?.user_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(subscription.user_id);
          const user = userData?.user;
          if (user?.email) {
            await sendPaymentFailedEmail(user.email, {
              name: user.user_metadata?.full_name ?? user.email.split("@")[0],
              amount: ((invoice.amount_due ?? invoice.total ?? 0) as number) / 100,
              plan: subscription.plan ?? "starter",
              ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/(dashboard)/billing`,
            });
            logEvent("info", "payment_failed_email_sent", {
              action: "stripe.webhook",
              eventType: event.type,
              invoiceId: invoice.id,
              customerId,
              userId: subscription.user_id,
            });
          }
        }

        break;
      }

      default:
        logEvent("debug", "unhandled_stripe_event", {
          action: "stripe.webhook",
          eventType: event.type,
        });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    captureError(error, {
      action: "stripe.webhook",
      eventType: event?.type,
    });
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
