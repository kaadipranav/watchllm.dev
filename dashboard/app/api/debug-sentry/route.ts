import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/**
 * Test endpoint to verify Sentry error tracking
 * 
 * This endpoint intentionally throws an error to test Sentry integration.
 * Visit /api/debug-sentry to trigger an error and verify it appears in Sentry dashboard.
 * 
 * ⚠️ SECURITY: This should be disabled or protected in production
 */
export async function GET() {
  // Only allow in development/staging
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: "Debug endpoints disabled in production" },
      { status: 403 }
    );
  }

  try {
    // Capture a custom message
    Sentry.captureMessage("Test message from debug-sentry endpoint", "info");

    // Capture with context
    Sentry.captureMessage("Debug endpoint called", {
      level: "warning",
      tags: {
        endpoint: "debug-sentry",
        environment: process.env.NODE_ENV,
      },
      extra: {
        timestamp: new Date().toISOString(),
        userAgent: "test",
      },
    });

    // Throw an intentional error
    throw new Error("🔴 Test error from debug-sentry endpoint - If you see this in Sentry, it's working!");
  } catch (error) {
    // Capture the error with Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: "debug-sentry",
        intentional: "true",
      },
      extra: {
        note: "This is a test error for Sentry verification",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Error sent to Sentry. Check your Sentry dashboard!",
        error: error instanceof Error ? error.message : String(error),
        instructions: [
          "1. Go to your Sentry dashboard: https://sentry.io/",
          "2. Check the 'Issues' tab",
          "3. You should see the test error from this endpoint",
          "4. Verify environment, release, and tags are correct",
        ],
      },
      { status: 200 }
    );
  }
}
