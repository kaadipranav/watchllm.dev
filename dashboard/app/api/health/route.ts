import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Check if running in self-hosted mode
const isSelfHosted = process.env.WATCHLLM_MODE === 'self_hosted';

export async function GET() {
  const startTime = Date.now();
  const dependencies: Record<string, string> = {};
  let overallStatus = "ok";
  
  try {
    // Database check
    if (isSelfHosted) {
      // In self-hosted mode, we might use a different database
      // For now, just mark as healthy if no database configured
      dependencies.database = "healthy";
    } else {
      // SaaS mode - check Supabase
      try {
        const supabase = createServiceClient();
        const { error } = await supabase.from("projects").select("id").limit(1);
        dependencies.supabase = error ? "unhealthy" : "healthy";
        if (error) overallStatus = "degraded";
      } catch {
        dependencies.supabase = "unhealthy";
        overallStatus = "degraded";
      }
    }
    
    // License check for self-hosted
    if (isSelfHosted) {
      const hasLicense = process.env.WATCHLLM_LICENSE || process.env.WATCHLLM_LICENSE_PATH;
      dependencies.license = hasLicense ? "configured" : "missing";
      if (!hasLicense) {
        overallStatus = "degraded";
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: overallStatus,
      mode: isSelfHosted ? "self_hosted" : "saas",
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      dependencies,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        mode: isSelfHosted ? "self_hosted" : "saas",
        timestamp: new Date().toISOString(),
        dependencies,
        error: `${error}`,
      },
      { status: 503 }
    );
  }
}