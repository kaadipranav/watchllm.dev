import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const plan = searchParams.get("plan");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle auth errors
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${error}&error_description=${errorDescription || ""}`);
  }

  if (code) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${origin}/login?error=exchange_code_failed&error_description=${error.message}`);
      }
      
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
    } catch (error) {
      console.error("Auth callback exception:", error);
      return NextResponse.redirect(`${origin}/login?error=callback_exception&error_description=${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error&error_description=No authorization code received`);
}
