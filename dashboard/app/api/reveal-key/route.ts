import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyId } = body;
    if (!keyId) return NextResponse.json({ error: "keyId is required" }, { status: 400 });

    const supabase = createClient();

    // Rely on RLS policies to ensure user can only read their own keys
    const { data, error } = await supabase
      .from("api_keys")
      .select("key")
      .eq("id", keyId)
      .single();

    if (error || !data) return NextResponse.json({ error: "API key not found" }, { status: 404 });

    return NextResponse.json({ key: data.key });
  } catch (err) {
    console.error("/api/reveal-key error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}