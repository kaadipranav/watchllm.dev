"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptProviderKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

export async function saveProviderKey(
    projectId: string,
    provider: "openai" | "anthropic" | "groq",
    apiKey: string
) {
    const supabase = createClient();
    const masterSecret = process.env.ENCRYPTION_MASTER_SECRET;

    if (!masterSecret) {
        throw new Error("ENCRYPTION_MASTER_SECRET is not configured on the server.");
    }

    // 1. Verify project ownership/access
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .single();

    if (projectError || !project) {
        throw new Error("Project not found or access denied.");
    }

    // 2. Encrypt the API key
    const { encryptedKey, iv } = await encryptProviderKey(apiKey, masterSecret);

    // 3. Upsert into provider_keys
    // Migration uses unique constraint (project_id, provider, is_active)
    const { error: upsertError } = await supabase
        .from("provider_keys")
        .upsert({
            project_id: projectId,
            provider,
            encrypted_key: encryptedKey,
            encryption_iv: iv,
            is_active: true,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'project_id, provider, is_active'
        });

    if (upsertError) {
        console.error("Error saving provider key:", upsertError);
        throw new Error(`Failed to save ${provider} key.`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function deleteProviderKey(
    projectId: string,
    provider: string
) {
    const supabase = createClient();

    const { error } = await supabase
        .from("provider_keys")
        .delete()
        .eq("project_id", projectId)
        .eq("provider", provider);

    if (error) {
        console.error("Error deleting provider key:", error);
        throw new Error(`Failed to delete ${provider} key.`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function getActiveProviderKeys(projectId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("provider_keys")
        .select("provider, created_at, last_used_at")
        .eq("project_id", projectId)
        .eq("is_active", true);

    if (error) {
        console.error("Error fetching provider keys:", error);
        return [];
    }

    return data;
}
