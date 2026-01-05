import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendUsageAlertEmail } from "@/lib/email";
import { PLAN_LIMITS } from "@/lib/utils";
import { logEvent } from "@/lib/logger";

const CRON_HEADER = "x-cron-secret";

// Alert thresholds (percentage of limit reached)
const ALERT_THRESHOLDS = [50, 75, 90, 95, 100];

/**
 * Cost Alerts Cron Job
 * 
 * Runs periodically (recommended: every hour via Vercel cron or external service)
 * Checks all projects for usage thresholds and sends email alerts
 * 
 * Usage:
 *   POST /api/cron/cost-alerts
 *   Headers: { "x-cron-secret": "your-cron-secret" }
 */
export async function POST(request: Request) {
    const cronSecret = request.headers.get(CRON_HEADER);

    if (cronSecret !== process.env.CRON_SECRET) {
        logEvent("warn", "cost-alerts.unauthorized", { action: "cron.cost-alerts" });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get all projects with their usage for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: projects, error: projectError } = await supabase
        .from("projects")
        .select("id, name, plan, user_id, cost_alert_threshold, cost_alerts_enabled");

    if (projectError || !projects) {
        logEvent("error", "cost-alerts.fetch-projects-failed", { error: projectError?.message });
        return NextResponse.json({ error: "Unable to load projects" }, { status: 500 });
    }

    let alertsSent = 0;
    let projectsChecked = 0;

    for (const project of projects) {
        // Skip if alerts are disabled for this project
        if (project.cost_alerts_enabled === false) {
            continue;
        }

        try {
            // Get current month's request count for this project
            const { count: requestCount, error: countError } = await supabase
                .from("usage_logs")
                .select("*", { count: "exact", head: true })
                .eq("project_id", project.id)
                .gte("created_at", startOfMonth.toISOString());

            if (countError) {
                logEvent("error", "cost-alerts.count-failed", { projectId: project.id, error: countError.message });
                continue;
            }

            const currentUsage = requestCount || 0;
            const planLimits = PLAN_LIMITS[(project.plan as keyof typeof PLAN_LIMITS) ?? "free"];
            const limit = planLimits?.requestsPerMonth || PLAN_LIMITS.free.requestsPerMonth;
            const usagePercentage = (currentUsage / limit) * 100;

            projectsChecked++;

            // Define thresholds to check: standard ones + user custom threshold
            const customThreshold = project.cost_alert_threshold || 80;
            const thresholdsToCheck = [...new Set([...ALERT_THRESHOLDS, customThreshold])].sort((a, b) => a - b);

            // Check if we've crossed any threshold
            const crossedThreshold = thresholdsToCheck.find(threshold => {
                // Only alert if we've just crossed this threshold (within 5% buffer)
                // AND we haven't sent this specific alert yet (checked below)
                return usagePercentage >= threshold && usagePercentage < threshold + 5;
            });

            if (!crossedThreshold || !project.user_id) {
                continue;
            }

            // Check if we've already sent an alert for this threshold this month
            const alertKey = `alert_${project.id}_${startOfMonth.toISOString().slice(0, 7)}_${crossedThreshold}`;

            const { data: existingAlert } = await supabase
                .from("sent_alerts")
                .select("id")
                .eq("alert_key", alertKey)
                .single();

            if (existingAlert) {
                // Already sent this alert, skip
                continue;
            }

            // Get user email
            const { data: userData } = await supabase.auth.admin.getUserById(project.user_id);
            const user = userData?.user;

            if (!user?.email) {
                continue;
            }

            // Send the usage alert email
            await sendUsageAlertEmail(user.email, {
                name: user.user_metadata?.full_name ?? user.email.split("@")[0],
                projectName: project.name,
                usage: currentUsage,
                limit,
                percentage: usagePercentage,
                plan: project.plan || "free",
                ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing`,
            });

            // Record that we sent this alert
            await supabase.from("sent_alerts").insert({
                alert_key: alertKey,
                project_id: project.id,
                user_id: project.user_id,
                threshold: crossedThreshold,
                usage_at_alert: currentUsage,
                limit_at_alert: limit,
            });

            logEvent("info", "cost-alerts.sent", {
                projectId: project.id,
                userId: project.user_id,
                threshold: crossedThreshold,
                usage: currentUsage,
                limit,
            });

            alertsSent++;
        } catch (error: any) {
            logEvent("error", "cost-alerts.project-failed", {
                projectId: project.id,
                error: error?.message,
            });
        }
    }

    logEvent("info", "cost-alerts.completed", {
        projectsChecked,
        alertsSent,
    });

    return NextResponse.json({
        success: true,
        projectsChecked,
        alertsSent,
    });
}

/**
 * GET endpoint for health check
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        endpoint: "cost-alerts",
        description: "Send POST request with x-cron-secret header to trigger cost alerts check",
    });
}
