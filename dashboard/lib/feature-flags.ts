import * as configcat from "configcat-js-ssr";

/**
 * Feature Flags Configuration using ConfigCat
 * 
 * This module provides centralized feature flag management for the dashboard.
 * Feature flags allow enabling/disabling features without redeployment.
 * 
 * @see https://configcat.com/docs/sdk-reference/node
 */

// Feature flag keys (must match ConfigCat dashboard)
export const FeatureFlags = {
  // Guardian Mode: AI-powered hallucination detection and assertion validation
  GUARDIAN_MODE: "guardianMode",
  
  // Advanced Analytics: Extended analytics features and visualizations
  ADVANCED_ANALYTICS: "advancedAnalytics",
  
  // Cost Forecasting: Predictive cost analysis and budget alerts
  COST_FORECASTING: "costForecasting",
  
  // Anomaly Detection: Real-time anomaly alerts for unusual patterns
  ANOMALY_DETECTION: "anomalyDetection",
  
  // Export Features: CSV/JSON export of logs and analytics
  EXPORT_FEATURES: "exportFeatures",
  
  // Webhooks: Custom webhook notifications for events
  WEBHOOKS: "webhooks",
  
  // Team Collaboration: Multi-user project access and roles
  TEAM_COLLABORATION: "teamCollaboration",
} as const;

// ConfigCat client singleton
let configCatClient: configcat.IConfigCatClient | null = null;

/**
 * Initialize the ConfigCat client
 * Call this once at application startup
 */
export function initializeFeatureFlags(): configcat.IConfigCatClient {
  if (configCatClient) {
    return configCatClient;
  }

  const sdkKey = process.env.CONFIGCAT_SDK_KEY;
  
  if (!sdkKey) {
    console.warn("[FeatureFlags] CONFIGCAT_SDK_KEY not configured. Feature flags disabled.");
    // Return a client with default values (all flags off)
    configCatClient = configcat.getClient(
      "configcat-sdk-1/PKDVCLf-VkiY0Iv78Sv_Xr", // Public demo key
      configcat.PollingMode.AutoPoll,
      {
        pollIntervalSeconds: 60,
        logger: configcat.createConsoleLogger(configcat.LogLevel.Warn),
      }
    );
    return configCatClient;
  }

  configCatClient = configcat.getClient(
    sdkKey,
    configcat.PollingMode.AutoPoll,
    {
      pollIntervalSeconds: 60, // Poll for updates every minute
      logger: configcat.createConsoleLogger(
        process.env.NODE_ENV === "development"
          ? configcat.LogLevel.Info
          : configcat.LogLevel.Warn
      ),
    }
  );

  return configCatClient;
}

/**
 * Get the ConfigCat client instance
 */
export function getFeatureFlagClient(): configcat.IConfigCatClient {
  if (!configCatClient) {
    return initializeFeatureFlags();
  }
  return configCatClient;
}

/**
 * Check if a feature flag is enabled
 * 
 * @param flagKey - The feature flag key
 * @param defaultValue - Default value if flag cannot be evaluated
 * @param userId - Optional user ID for percentage-based rollouts
 * @returns Promise<boolean> indicating if feature is enabled
 */
export async function isFeatureEnabled(
  flagKey: string,
  defaultValue = false,
  userId?: string
): Promise<boolean> {
  try {
    const client = getFeatureFlagClient();
    const value = await client.getValueAsync(
      flagKey, 
      defaultValue,
      userId ? new configcat.User(userId) : undefined
    );
    return value as boolean;
  } catch (error) {
    console.error(`[FeatureFlags] Error checking flag ${flagKey}:`, error);
    return defaultValue;
  }
}

/**
 * Get feature flag value (for non-boolean flags)
 * 
 * @param flagKey - The feature flag key
 * @param defaultValue - Default value if flag cannot be evaluated
 * @param userId - Optional user ID for percentage-based rollouts
 * @returns Promise<any> flag value
 */
export async function getFeatureFlagValue<T extends configcat.SettingValue>(
  flagKey: string,
  defaultValue: T,
  userId?: string
): Promise<T> {
  try {
    const client = getFeatureFlagClient();
    const value = await client.getValueAsync(
      flagKey,
      defaultValue,
      userId ? new configcat.User(userId) : undefined
    );
    return value as T;
  } catch (error) {
    console.error(`[FeatureFlags] Error getting flag ${flagKey}:`, error);
    return defaultValue;
  }
}

/**
 * Get all feature flags for a user
 * Useful for client-side rendering or debugging
 */
export async function getAllFeatureFlags(userId?: string): Promise<Record<string, boolean>> {
  const flags: Record<string, boolean> = {};
  
  for (const [key, flagKey] of Object.entries(FeatureFlags)) {
    flags[flagKey] = await isFeatureEnabled(flagKey, false, userId);
  }
  
  return flags;
}

/**
 * Force refresh feature flags from ConfigCat
 * Useful for testing or admin panels
 */
export async function refreshFeatureFlags(): Promise<void> {
  try {
    const client = getFeatureFlagClient();
    await client.forceRefreshAsync();
    console.log("[FeatureFlags] Successfully refreshed from ConfigCat");
  } catch (error) {
    console.error("[FeatureFlags] Error refreshing flags:", error);
  }
}

/**
 * Dispose the ConfigCat client
 * Call this on application shutdown
 */
export function disposeFeatureFlags(): void {
  if (configCatClient) {
    configCatClient.dispose();
    configCatClient = null;
  }
}

// React hook for client-side feature flag usage
export function useFeatureFlag(flagKey: string, defaultValue = false) {
  // This is a server-side utility
  // For client-side, you'll need to pass flags via props or API
  throw new Error("useFeatureFlag is not implemented. Use server-side isFeatureEnabled or pass flags via props.");
}
