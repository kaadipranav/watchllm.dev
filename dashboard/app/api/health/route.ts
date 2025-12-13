import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("projects").select("id").limit(1);

    if (error) throw error;

    return NextResponse.json({ status: "ok", dependencies: { supabase: "healthy" } });
  } catch (error) {
    return NextResponse.json(
      { status: "degraded", dependencies: { supabase: "unhealthy" }, error: `${error}` },
      { status: 503 }
    );
  }
}