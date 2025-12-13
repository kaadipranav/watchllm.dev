import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import type { Plan } from "@/lib/payments/types";
import * as Sentry from "@sentry/nextjs";
import { logEvent } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !["starter", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get the active payment provider
    const paymentProvider = getPaymentProvider();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session
    const { url } = await paymentProvider.createCheckoutSession({
      plan: plan as Plan,
      userId: user.id,
      userEmail: user.email,
      successUrl: `${appUrl}/dashboard/billing?success=true`,
      cancelUrl: `${appUrl}/dashboard/billing?canceled=true`,
    });

    logEvent("info", "checkout.session.created", {
      userId: user.id,
      action: "upgrade",
      result: "success",
      plan,
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    Sentry.captureException(error);
    logEvent("error", "checkout.session.failed", {
      action: "upgrade",
      result: "failed",
      error: error?.message,
    });
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
