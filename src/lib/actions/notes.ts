"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import { logAudit } from "./audit";

export interface NoteInput {
  entity_type: string; // 'flat', 'tenant', 'expense', 'document', 'rent_payment'
  entity_id: string;
  content: string;
  is_internal: boolean; // true = PM-only, false = visible to owner
}

export interface Note {
  id: string;
  content: string;
  is_internal: boolean;
  author_name: string;
  author_type: string;
  created_at: string;
}

export async function addNote(
  input: NoteInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.entity_type) {
      return { success: false, error: "Entity type is required" };
    }
    if (!input.entity_id) {
      return { success: false, error: "Entity ID is required" };
    }
    if (!input.content || input.content.trim().length === 0) {
      return { success: false, error: "Note content is required" };
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let authorName = "Unknown";
    let authorId: string | null = null;

    if (user) {
      const { data: pmUser } = await supabase
        .from("pm_users")
        .select("id, name")
        .eq("auth_user_id", user.id)
        .single();

      if (pmUser) {
        authorName = pmUser.name;
        authorId = pmUser.id;
      }
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        content: input.content.trim(),
        is_internal: input.is_internal,
        author_type: "pm",
        author_id: authorId,
        author_name: authorName,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "create",
      entity_type: "note",
      entity_id: data.id,
      description: `Added ${input.is_internal ? "internal" : "owner-visible"} note on ${input.entity_type} ${input.entity_id}`,
    });

    // Revalidate common paths where notes might be displayed
    revalidatePath(`/pm/flats/${input.entity_id}`);
    revalidatePath(`/pm/owners/${input.entity_id}`);

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add note",
    };
  }
}

export async function getNotesByEntity(
  entityType: string,
  entityId: string
): Promise<Note[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notes")
      .select("id, content, is_internal, author_name, author_type, created_at")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch notes:", error.message);
      return [];
    }

    return data ?? [];
  } catch {
    console.error("Failed to fetch notes");
    return [];
  }
}
