import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const plan = searchParams.get("plan");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      // Determine target after onboarding (or immediate redirect)
      const target =
        plan && plan !== "free"
          ? `/dashboard/billing?upgrade=${encodeURIComponent(plan)}`
          : searchParams.get("next") ?? "/dashboard";

      // If user has not provided name yet, route to onboarding to collect KYC basics
      if (!user?.user_metadata?.full_name) {
        const nextParam = encodeURIComponent(target);
        return NextResponse.redirect(`${origin}/onboarding?next=${nextParam}`);
      }

      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
