import * as configcat from "configcat-node";

/**
 * Feature Flags Configuration for Worker using ConfigCat
 * 
 * This module provides centralized feature flag management for the Cloudflare Worker.
 * Feature flags allow enabling/disabling features without redeployment.
 */

// Feature flag keys (must match ConfigCat dashboard)
export const WorkerFeatureFlags = {
  // Guardian Mode: AI-powered validation and hallucination detection
  GUARDIAN_MODE: "guardianMode",
  
  // Rate Limiting: Enforce usage quotas and rate limits
  RATE_LIMITING: "rateLimiting",
  
  // Cost Alerts: Real-time cost threshold monitoring
  COST_ALERTS: "costAlerts",
  
  // Advanced Caching: Enhanced semantic caching strategies
  ADVANCED_CACHING: "advancedCaching",
  
  // Debug Logging: Verbose logging for troubleshooting
  DEBUG_LOGGING: "debugLogging",
  
  // Maintenance Mode: Disable non-critical features during maintenance
  MAINTENANCE_MODE: "maintenanceMode",
} as const;

/**
 * Initialize ConfigCat client for worker
 * Note: This creates a new client instance - manage carefully in Workers
 */
export function createWorkerFeatureFlagClient(sdkKey: string): configcat.IConfigCatClient {
  if (!sdkKey) {
    console.warn("[Worker FeatureFlags] SDK key not provided");
    // Return client with demo key for development
    return configcat.getClient(
      "configcat-sdk-1/PKDVCLf-VkiY0Iv78Sv_Xr",
      configcat.PollingMode.ManualPoll
    );
  }

  return configcat.getClient(
    sdkKey,
    configcat.PollingMode.ManualPoll, // Use manual polling for Workers
    {
      logger: configcat.createConsoleLogger(configcat.LogLevel.Warn),
    }
  );
}

/**
 * Check if a feature flag is enabled in worker context
 */
export async function isWorkerFeatureEnabled(
  client: configcat.IConfigCatClient,
  flagKey: string,
  defaultValue = false,
  userId?: string
): Promise<boolean> {
  try {
    // Force refresh to get latest values (important for Workers)
    await client.forceRefreshAsync();
    
    const value = await client.getValueAsync(
      flagKey,
      defaultValue,
      userId ? new configcat.User(userId) : undefined
    );
    return value as boolean;
  } catch (error) {
    console.error(`[Worker FeatureFlags] Error checking flag ${flagKey}:`, error);
    return defaultValue;
  }
}

/**
 * Get feature flag value (for non-boolean flags) in worker context
 */
export async function getWorkerFeatureFlagValue<T extends configcat.SettingValue>(
  client: configcat.IConfigCatClient,
  flagKey: string,
  defaultValue: T,
  userId?: string
): Promise<T> {
  try {
    await client.forceRefreshAsync();
    
    const value = await client.getValueAsync(
      flagKey,
      defaultValue,
      userId ? new configcat.User(userId) : undefined
    );
    return value as T;
  } catch (error) {
    console.error(`[Worker FeatureFlags] Error getting flag ${flagKey}:`, error);
    return defaultValue;
  }
}
