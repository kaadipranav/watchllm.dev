"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update the semantic cache threshold for a project
 */
export async function updateCacheThreshold(
  projectId: string,
  threshold: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Validate threshold range
    if (threshold < 0.5 || threshold > 0.99) {
      return { success: false, error: "Threshold must be between 50% and 99%" };
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: "Project not found" };
    }

    if (project.user_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update the threshold
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        semantic_cache_threshold: threshold,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Failed to update cache threshold:", updateError);
      return { success: false, error: "Failed to update settings" };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating cache threshold:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get cache settings for a project
 */
export async function getCacheSettings(
  projectId: string
): Promise<{
  threshold: number;
  stats: {
    hitRate: number;
    totalCacheHits: number;
    totalRequests: number;
    flaggedResponses: number;
  };
  error?: string;
}> {
  const defaultResponse = {
    threshold: 0.85,
    stats: {
      hitRate: 0,
      totalCacheHits: 0,
      totalRequests: 0,
      flaggedResponses: 0,
    },
  };

  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ...defaultResponse, error: "Unauthorized" };
    }

    // Get project with threshold
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("semantic_cache_threshold, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return { ...defaultResponse, error: "Project not found" };
    }

    if (project.user_id !== user.id) {
      return { ...defaultResponse, error: "Unauthorized" };
    }

    // Get usage stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usageStats } = await supabase
      .from("usage_logs")
      .select("cached")
      .eq("project_id", projectId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const totalRequests = usageStats?.length || 0;
    const totalCacheHits = usageStats?.filter((u) => u.cached).length || 0;
    const hitRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;

    // Get flagged responses count
    const { count: flaggedResponses } = await supabase
      .from("cache_feedback")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("accurate", false);

    return {
      threshold: project.semantic_cache_threshold || 0.85,
      stats: {
        hitRate,
        totalCacheHits,
        totalRequests,
        flaggedResponses: flaggedResponses || 0,
      },
    };
  } catch (error) {
    console.error("Error getting cache settings:", error);
    return { ...defaultResponse, error: "An unexpected error occurred" };
  }
}

/**
 * Get threshold recommendation based on feedback
 */
export async function getThresholdRecommendation(
  projectId: string
): Promise<{
  currentThreshold: number;
  recommendedThreshold: number | null;
  reason: string;
}> {
  const defaultResponse = {
    currentThreshold: 0.85,
    recommendedThreshold: null,
    reason: "Not enough data to make a recommendation",
  };

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return defaultResponse;
    }

    // Get project
    const { data: project } = await supabase
      .from("projects")
      .select("semantic_cache_threshold")
      .eq("id", projectId)
      .single();

    if (!project) {
      return defaultResponse;
    }

    const currentThreshold = project.semantic_cache_threshold || 0.85;

    // Get recent feedback
    const { data: feedback } = await supabase
      .from("cache_feedback")
      .select("accurate, similarity_score")
      .eq("project_id", projectId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (!feedback || feedback.length < 10) {
      return {
        currentThreshold,
        recommendedThreshold: null,
        reason: "Need at least 10 feedback entries to make a recommendation",
      };
    }

    const inaccurateResponses = feedback.filter((f) => !f.accurate);
    const inaccurateRate = inaccurateResponses.length / feedback.length;

    if (inaccurateRate > 0.1) {
      // More than 10% inaccurate - recommend increasing threshold
      const suggestedThreshold = Math.min(currentThreshold + 0.03, 0.98);
      return {
        currentThreshold,
        recommendedThreshold: suggestedThreshold,
        reason: `${(inaccurateRate * 100).toFixed(0)}% of cached responses were flagged as inaccurate. Consider increasing the threshold for stricter matching.`,
      };
    }

    if (inaccurateRate < 0.02 && currentThreshold > 0.88) {
      // Less than 2% inaccurate and threshold is high - could lower
      const suggestedThreshold = Math.max(currentThreshold - 0.02, 0.85);
      return {
        currentThreshold,
        recommendedThreshold: suggestedThreshold,
        reason: `Cache accuracy is excellent (${((1 - inaccurateRate) * 100).toFixed(0)}%). You could lower the threshold to increase savings.`,
      };
    }

    return {
      currentThreshold,
      recommendedThreshold: null,
      reason: "Your current threshold is well-tuned for your usage patterns.",
    };
  } catch (error) {
    console.error("Error getting threshold recommendation:", error);
    return defaultResponse;
  }
}
