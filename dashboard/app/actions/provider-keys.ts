"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptProviderKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

export async function saveProviderKey(
    projectId: string,
    provider: "openai" | "anthropic" | "groq" | "openrouter",
    apiKey: string,
    name?: string
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

    // 2. Check if we've hit the limit (3 active keys per provider)
    const { data: existingKeys, error: countError } = await supabase
        .from("provider_keys")
        .select("id")
        .eq("project_id", projectId)
        .eq("provider", provider)
        .eq("is_active", true);

    if (countError) {
        console.error("Error checking key count:", countError);
        throw new Error("Failed to check existing keys.");
    }

    if (existingKeys && existingKeys.length >= 3) {
        throw new Error(`Maximum of 3 active keys allowed per provider. Please delete an existing ${provider} key first.`);
    }

    // 3. Encrypt the API key
    const { encryptedKey, iv } = await encryptProviderKey(apiKey, masterSecret);

    // 4. Calculate priority (next available slot: 1, 2, or 3)
    const priority = (existingKeys?.length || 0) + 1;

    // 5. Insert the new key
    const { error: insertError } = await supabase
        .from("provider_keys")
        .insert({
            project_id: projectId,
            provider,
            encrypted_key: encryptedKey,
            encryption_iv: iv,
            name: name || `${provider} Key ${priority}`,
            priority,
            is_active: true,
            updated_at: new Date().toISOString(),
        });

    if (insertError) {
        console.error("Error saving provider key:", insertError);
        throw new Error(`Failed to save ${provider} key.`);
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/api-keys");
    return { success: true };
}

export async function deleteProviderKey(
    projectId: string,
    keyId: string
) {
    const supabase = createClient();

    // Verify ownership before deleting
    const { error } = await supabase
        .from("provider_keys")
        .delete()
        .eq("id", keyId)
        .eq("project_id", projectId); // Ensure user owns this key

    if (error) {
        console.error("Error deleting provider key:", error);
        throw new Error("Failed to delete provider key.");
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/api-keys");
    return { success: true };
}

export async function getActiveProviderKeys(projectId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("provider_keys")
        .select("id, provider, name, priority, created_at, last_used_at")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .order("provider", { ascending: true })
        .order("priority", { ascending: true });

    if (error) {
        console.error("Error fetching provider keys:", error);
        return [];
    }

    return data;
}
