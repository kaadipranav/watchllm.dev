import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWeeklyReportEmail } from "@/lib/email";
import { PLAN_LIMITS } from "@/lib/utils";

const CRON_HEADER = "x-cron-secret";

export async function POST(request: Request) {
  const cronSecret = request.headers.get(CRON_HEADER);
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: projects, error } = await supabase.from("projects").select("id, name, plan, user_id");
  if (error || !projects) {
    return NextResponse.json({ error: "Unable to load projects" }, { status: 500 });
  }

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const periodStart = weekAgo.toISOString();
  const periodEnd = now.toISOString();

  let sent = 0;

  for (const project of projects) {
    try {
      const { data: stats } = await supabase.rpc("get_project_usage_stats", {
        p_project_id: project.id,
        p_start_date: periodStart,
        p_end_date: periodEnd,
      });

      if (!stats || !project.user_id) {
        continue;
      }

      const { data } = await supabase.auth.admin.getUserById(project.user_id);
      const user = data.user;
      if (!user?.email) {
        continue;
      }

      const requestsByProvider = Object.fromEntries(
        Object.entries(stats.requests_by_provider || {}).map(([provider, count]) => [
          provider,
          Number(count ?? 0),
        ])
      ) as Record<string, number>;
      const limit = PLAN_LIMITS[(project.plan as keyof typeof PLAN_LIMITS) ?? "free"]?.requestsPerMonth || PLAN_LIMITS.free.requestsPerMonth;

      await sendWeeklyReportEmail(user.email, {
        name: user.user_metadata?.full_name ?? user.email.split("@")[0],
        projectName: project.name,
        periodStart,
        periodEnd,
        totalRequests: Number(stats.total_requests ?? 0),
        cachedRequests: Number(stats.cached_requests ?? 0),
        cacheHitRate: Number(stats.cache_hit_rate ?? 0),
        totalCost: Number(stats.total_cost_usd ?? 0),
        avgLatency: Number(stats.avg_latency_ms ?? 0),
        requestsByProvider,
        limit,
        plan: project.plan,
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/(dashboard)/usage`,
      });

      sent += 1;
    } catch (error) {
      console.error("Weekly report failed for project", project.id, error);
    }
  }

  return NextResponse.json({ success: true, emailsSent: sent });
}