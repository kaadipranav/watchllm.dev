import { NextResponse } from "next/server";
import { sendUsageAlertEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/utils";

const SECRET_HEADER = "x-email-trigger-secret";

export async function POST(request: Request) {
  const alertSecret = request.headers.get(SECRET_HEADER);
  if (alertSecret !== process.env.EMAIL_TRIGGER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId;
  const usageCount = Number(body?.usageCount ?? 0);
  const providedLimit = Number(body?.limit ?? 0);

  if (!projectId || usageCount <= 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, plan, user_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: user, error: userError } = await supabase.auth.admin.getUserById(project.user_id);
  if (userError || !user?.email) {
    return NextResponse.json({ error: "Unable to resolve user" }, { status: 404 });
  }

  const limit = providedLimit > 0 ? providedLimit : PLAN_LIMITS[project.plan]?.requestsPerMonth || PLAN_LIMITS.free.requestsPerMonth;
  const percentage = Math.min(100, Math.round((usageCount / limit) * 100));

  await sendUsageAlertEmail(user.email, {
    name: user.user_metadata?.full_name ?? user.email.split("@")[0],
    projectName: project.name,
    usage: usageCount,
    limit,
    percentage,
    plan: project.plan,
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/(dashboard)/usage`,
  });

  return NextResponse.json({ success: true });
}