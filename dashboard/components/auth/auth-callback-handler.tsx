"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * A fail-safe component that catches authentication codes if they land on the root page
 * instead of the /auth/callback route. This can happen if Supabase redirect settings
 * are not pinning the path correctly.
 */
export function AuthCallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        
        // Handle auth errors
        if (error) {
            console.error("Auth callback error:", error, errorDescription);
            router.replace(`/login?error=${error}&error_description=${errorDescription || ""}`);
            return;
        }
        
        // Handle auth success
        if (code) {
            console.log("Auth callback: detected code, redirecting to /auth/callback");
            // Reconstruct the full callback URL with all existing parameters
            const params = new URLSearchParams(searchParams.toString());
            router.replace(`/auth/callback?${params.toString()}`);
        }
    }, [searchParams, router]);

    return null;
}
