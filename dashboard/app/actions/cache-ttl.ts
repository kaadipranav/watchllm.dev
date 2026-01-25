"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update cache TTL settings for a project
 */
export async function updateCacheTTL(
  projectId: string,
  ttlSeconds: number | null,
  endpointOverrides: Record<string, number | null> = {}
) {
  try {
    const supabase = await createClient();

    // Verify user has access to this project
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Check project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return { error: "Project not found or access denied" };
    }

    // Validate TTL value
    if (ttlSeconds !== null && (ttlSeconds < 60 || ttlSeconds > 31536000)) {
      return { error: "TTL must be between 60 seconds and 1 year, or null for never expire" };
    }

    // Validate endpoint overrides
    for (const [endpoint, ttl] of Object.entries(endpointOverrides)) {
      if (!endpoint.startsWith("/v1/")) {
        return { error: `Invalid endpoint: ${endpoint}` };
      }
      if (ttl !== null && (ttl < 60 || ttl > 31536000)) {
        return { error: `Invalid TTL for ${endpoint}: must be between 60 seconds and 1 year` };
      }
    }

    // Update project settings
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        cache_ttl_seconds: ttlSeconds,
        cache_ttl_overrides: Object.keys(endpointOverrides).length > 0 ? endpointOverrides : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Error updating cache TTL:", updateError);
      return { error: "Failed to update TTL settings" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error in updateCacheTTL:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get cache TTL settings for a project
 */
export async function getCacheTTLSettings(projectId: string) {
  try {
    const supabase = await createClient();

    // Verify user has access to this project
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const { data: project, error } = await supabase
      .from("projects")
      .select("id, cache_ttl_seconds, cache_ttl_overrides")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (error || !project) {
      return { error: "Project not found" };
    }

    return {
      ttlSeconds: project.cache_ttl_seconds ?? 86400,
      endpointOverrides: project.cache_ttl_overrides ?? {},
    };
  } catch (error) {
    console.error("Error in getCacheTTLSettings:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Invalidate cache entries for a project
 */
export async function invalidateCache(
  projectId: string,
  filters: {
    model?: string;
    kind?: string;
    before?: string;
    after?: string;
    all?: boolean;
  }
) {
  try {
    const supabase = await createClient();

    // Verify user has access to this project
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Check project ownership and get API key for worker call
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return { error: "Project not found or access denied" };
    }

    // Get an API key for this project to call the worker
    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("key")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!apiKey) {
      return { error: "No active API key found for this project" };
    }

    // Call the worker's cache invalidation endpoint
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://api.watchllm.com";
    
    const response = await fetch(`${workerUrl}/v1/cache/invalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.key}`,
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error?.message || "Failed to invalidate cache" };
    }

    const result = await response.json();

    // Log the invalidation in Supabase
    await supabase.from("cache_invalidations").insert({
      project_id: projectId,
      user_id: user.id,
      invalidation_type: "manual",
      entries_invalidated: result.entries_invalidated || 0,
      filters,
    });

    revalidatePath("/dashboard/settings");
    return {
      success: true,
      entriesInvalidated: result.entries_invalidated || 0,
    };
  } catch (error) {
    console.error("Error in invalidateCache:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get cache age statistics for a project
 */
export async function getCacheAgeStats(projectId: string) {
  try {
    const supabase = await createClient();

    // Verify user has access to this project
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Check project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return { error: "Project not found or access denied" };
    }

    // Get an API key for this project to call the worker
    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("key")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!apiKey) {
      // Return empty stats if no API key (project not set up yet)
      return {
        stats: {
          total: 0,
          under1h: 0,
          oneToSixH: 0,
          sixTo24H: 0,
          oneTo7D: 0,
          sevenTo30D: 0,
          over30D: 0,
          avgAgeHours: 0,
          expiredCount: 0,
        },
      };
    }

    // Call the worker's cache stats endpoint
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://api.watchllm.com";
    
    const response = await fetch(`${workerUrl}/v1/cache/stats`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey.key}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error?.message || "Failed to get cache stats" };
    }

    const result = await response.json();

    return {
      stats: {
        total: result.total_entries || 0,
        under1h: result.age_distribution?.under_1h || 0,
        oneToSixH: result.age_distribution?.["1h_to_6h"] || 0,
        sixTo24H: result.age_distribution?.["6h_to_24h"] || 0,
        oneTo7D: result.age_distribution?.["1d_to_7d"] || 0,
        sevenTo30D: result.age_distribution?.["7d_to_30d"] || 0,
        over30D: result.age_distribution?.over_30d || 0,
        avgAgeHours: result.average_age_hours || 0,
        expiredCount: result.expired_count || 0,
      },
    };
  } catch (error) {
    console.error("Error in getCacheAgeStats:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get TTL recommendation based on cache usage patterns
 */
export async function getTTLRecommendation(projectId: string) {
  try {
    const supabase = await createClient();

    // Verify user has access to this project
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Call the recommendation function
    const { data, error } = await supabase
      .rpc("get_cache_ttl_recommendation", { p_project_id: projectId })
      .single();

    if (error) {
      console.error("Error getting TTL recommendation:", error);
      return { error: "Failed to get recommendation" };
    }

    // Type assertion for RPC result
    const result = data as {
      current_ttl_seconds: number;
      recommended_ttl_seconds: number | null;
      reason: string;
      stale_hit_percentage: number;
    } | null;

    if (!result) {
      return { error: "No recommendation data available" };
    }

    return {
      currentTTL: result.current_ttl_seconds,
      recommendedTTL: result.recommended_ttl_seconds,
      reason: result.reason,
      staleHitPercentage: result.stale_hit_percentage,
    };
  } catch (error) {
    console.error("Error in getTTLRecommendation:", error);
    return { error: "An unexpected error occurred" };
  }
}
