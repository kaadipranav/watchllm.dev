import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/lib/config";

/**
 * License Status API
 * Returns current license status for self-hosted deployments.
 * Only available in self-hosted mode.
 */
export async function GET() {
  // Only available in self-hosted mode
  if (!APP_CONFIG.isSelfHosted) {
    return NextResponse.json(
      { error: "License endpoint only available in self-hosted mode" },
      { status: 404 }
    );
  }
  
  try {
    // Try to read license from environment or file
    const licenseJson = process.env.WATCHLLM_LICENSE;
    
    if (!licenseJson) {
      return NextResponse.json({
        status: "missing",
        message: "No license configured. Running in limited mode.",
        features: [],
      });
    }
    
    const license = JSON.parse(licenseJson);
    const expiresAt = new Date(license.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if expired
    if (daysUntilExpiry < 0) {
      const daysExpired = Math.abs(daysUntilExpiry);
      const gracePeriodDays = 30;
      
      if (daysExpired <= gracePeriodDays) {
        return NextResponse.json({
          status: "grace_period",
          message: `License expired ${daysExpired} days ago. Grace period: ${gracePeriodDays - daysExpired} days remaining.`,
          customer: license.customer,
          licenseType: license.license_type,
          expiresAt: license.expires_at,
          features: license.features || [],
          graceDaysRemaining: gracePeriodDays - daysExpired,
        });
      }
      
      return NextResponse.json({
        status: "expired",
        message: `License expired on ${license.expires_at}. Please renew.`,
        customer: license.customer,
        licenseType: license.license_type,
        expiresAt: license.expires_at,
        features: [],
      });
    }
    
    // Valid license
    return NextResponse.json({
      status: "valid",
      message: `License valid for ${license.customer}`,
      customer: license.customer,
      licenseType: license.license_type,
      expiresAt: license.expires_at,
      daysUntilExpiry,
      features: license.features || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to parse license",
        error: `${error}`,
      },
      { status: 500 }
    );
  }
}
