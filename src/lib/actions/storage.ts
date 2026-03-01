"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";

export async function uploadFile(
  formData: FormData,
  entityType: string,
  entityId: string,
  category: string
): Promise<ActionResult<{ path: string; url: string }>> {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const supabase = createClient();

    const storagePath = `${entityType}/${entityId}/${category}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("mmz-files")
      .upload(storagePath, file);

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("mmz-files").getPublicUrl(storagePath);

    // Insert a record into file_references
    const { error: refError } = await supabase
      .from("file_references")
      .insert({
        storage_path: storagePath,
        storage_url: publicUrl,
        entity_type: entityType,
        entity_id: entityId,
        file_category: category,
        file_name: file.name,
        file_size_bytes: file.size,
        file_type: file.type,
      });

    if (refError) {
      console.error("Failed to insert file reference:", refError.message);
    }

    return { success: true, data: { path: storagePath, url: publicUrl } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload file",
    };
  }
}

export async function getFileUrl(storagePath: string): Promise<string> {
  // If the stored value is already a full URL (e.g. migrated data), use it directly
  if (storagePath.startsWith("http")) return storagePath;

  const supabase = createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from("mmz-files").getPublicUrl(storagePath);

  return publicUrl;
}
