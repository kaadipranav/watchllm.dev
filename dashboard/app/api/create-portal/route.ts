import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getPaymentProvider, getPaymentProviderType } from "@/lib/payments";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providerType = getPaymentProviderType();
    const paymentProvider = getPaymentProvider();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // For Stripe, get customer ID from subscription
    if (providerType === "stripe") {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

      if (!subscription?.stripe_customer_id) {
        return NextResponse.json(
          { error: "No subscription found" },
          { status: 404 }
        );
      }

      const { url } = await paymentProvider.createPortalSession({
        customerId: subscription.stripe_customer_id,
        returnUrl: `${appUrl}/dashboard/billing`,
      });

      return NextResponse.json({ url });
    }

    // For Whop, no customer ID needed
    const { url } = await paymentProvider.createPortalSession({
      customerId: "",
      returnUrl: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
