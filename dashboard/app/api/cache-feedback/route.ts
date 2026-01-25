import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/cache-feedback
 * Submit feedback on whether a cached response was accurate
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, requestId, accurate, similarityScore, notes } = body;

    if (!projectId || requestId === undefined || accurate === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, requestId, accurate" },
        { status: 400 }
      );
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Insert feedback
    const { data, error: insertError } = await supabase
      .from("cache_feedback")
      .insert({
        project_id: projectId,
        request_id: requestId,
        accurate: accurate,
        similarity_score: similarityScore || null,
        notes: notes || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert cache feedback:", insertError);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    // If inaccurate, check if we should suggest threshold adjustment
    if (!accurate) {
      // Get recent inaccurate feedback count
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentInaccurate } = await supabase
        .from("cache_feedback")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("accurate", false)
        .gte("created_at", oneHourAgo);

      // If many inaccurate responses in the last hour, include suggestion
      if (recentInaccurate && recentInaccurate >= 5) {
        return NextResponse.json({
          success: true,
          feedbackId: data.id,
          suggestion: {
            type: "increase_threshold",
            message: "Multiple inaccurate cached responses detected. Consider increasing your similarity threshold.",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId: data.id,
    });
  } catch (error) {
    console.error("Error processing cache feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cache-feedback
 * Get cache feedback statistics for a project
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId parameter" },
        { status: 400 }
      );
    }

    // Verify user owns this project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, semantic_cache_threshold")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get feedback summary
    const { data: feedback } = await supabase
      .from("cache_feedback")
      .select("accurate, similarity_score, created_at")
      .eq("project_id", projectId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    const totalFeedback = feedback?.length || 0;
    const accurateFeedback = feedback?.filter((f) => f.accurate).length || 0;
    const inaccurateFeedback = totalFeedback - accurateFeedback;
    const accuracyRate = totalFeedback > 0 ? (accurateFeedback / totalFeedback) * 100 : null;

    // Calculate average similarity for inaccurate responses
    const inaccurateWithScores = feedback?.filter(
      (f) => !f.accurate && f.similarity_score !== null
    ) || [];
    const avgInaccurateSimilarity =
      inaccurateWithScores.length > 0
        ? inaccurateWithScores.reduce((sum, f) => sum + (f.similarity_score || 0), 0) /
          inaccurateWithScores.length
        : null;

    return NextResponse.json({
      projectId,
      currentThreshold: project.semantic_cache_threshold,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      stats: {
        totalFeedback,
        accurateFeedback,
        inaccurateFeedback,
        accuracyRate,
        avgInaccurateSimilarity,
      },
      // Include recommendation if there's enough data
      recommendation:
        totalFeedback >= 10
          ? getRecommendation(
              project.semantic_cache_threshold,
              accuracyRate || 100,
              avgInaccurateSimilarity
            )
          : null,
    });
  } catch (error) {
    console.error("Error fetching cache feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getRecommendation(
  currentThreshold: number,
  accuracyRate: number,
  avgInaccurateSimilarity: number | null
): { threshold: number; reason: string } | null {
  // If accuracy is below 90%, recommend increasing threshold
  if (accuracyRate < 90) {
    const increase = accuracyRate < 80 ? 0.05 : 0.03;
    const newThreshold = Math.min(currentThreshold + increase, 0.98);
    return {
      threshold: newThreshold,
      reason: `Cache accuracy is ${accuracyRate.toFixed(0)}%. Increasing threshold to reduce false positives.`,
    };
  }

  // If accuracy is very high and threshold is strict, consider lowering
  if (accuracyRate >= 98 && currentThreshold >= 0.92) {
    const newThreshold = Math.max(currentThreshold - 0.02, 0.88);
    return {
      threshold: newThreshold,
      reason: `Cache accuracy is excellent (${accuracyRate.toFixed(0)}%). You could lower the threshold to increase savings.`,
    };
  }

  // If we have similarity scores for inaccurate responses, use that info
  if (avgInaccurateSimilarity !== null && avgInaccurateSimilarity < currentThreshold) {
    // Inaccurate responses are happening at lower similarity than threshold
    // This shouldn't happen normally, but might indicate edge cases
    return {
      threshold: currentThreshold,
      reason: "Current threshold appears appropriate based on feedback patterns.",
    };
  }

  return null;
}
