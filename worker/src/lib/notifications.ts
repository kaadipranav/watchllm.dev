import type { Env, ProjectRecord } from "../types";
import { PLAN_LIMITS } from "../types";
import type { RedisClient } from "./redis";
import type { SupabaseClient } from "./supabase";

const WEBHOOK_PATH = "/api/notifications/usage-alert";
const ALERT_TTL_SECONDS = 24 * 60 * 60;

export async function maybeSendUsageAlert(
  env: Env,
  supabase: SupabaseClient,
  redis: RedisClient,
  project: ProjectRecord
) {
  const limit = PLAN_LIMITS[project.plan]?.requestsPerMonth || PLAN_LIMITS.free.requestsPerMonth;
  if (limit <= 0) return;

  const usageCount = await supabase.getMonthlyUsage(project.id);
  if (usageCount < limit * 0.8) return;

  const alertKey = `usage-alert:${project.id}`;
  if (await redis.exists(alertKey)) return;

  const baseUrl = env.APP_URL?.replace(/\/$/, "") || "";
  const secret = env.EMAIL_TRIGGER_SECRET;
  if (!baseUrl || !secret) {
    console.warn("Skipping usage alert because env is incomplete");
    return;
  }

  const target = `${baseUrl}${WEBHOOK_PATH}`;

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-email-trigger-secret": secret,
      },
      body: JSON.stringify({ projectId: project.id, usageCount, limit }),
    });

    if (response.ok) {
      await redis.set(alertKey, Date.now(), ALERT_TTL_SECONDS);
    }
  } catch (error) {
    console.error("Usage alert webhook failed", error);
  }
}