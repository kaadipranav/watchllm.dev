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
        if (code) {
            // Reconstruct the full callback URL with all existing parameters
            const params = new URLSearchParams(searchParams.toString());
            router.replace(`/auth/callback?${params.toString()}`);
        }
    }, [searchParams, router]);

    return null;
}
