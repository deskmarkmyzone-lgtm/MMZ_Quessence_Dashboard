"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import type { CommunityInput } from "@/types";
import { logAudit } from "./audit";

export async function createCommunity(
  input: CommunityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Community name is required" };
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: pmUser } = await supabase
      .from("pm_users")
      .select("id")
      .eq("auth_user_id", user?.id)
      .single();

    const { data, error } = await supabase
      .from("communities")
      .insert({
        name: input.name.trim(),
        address: input.address ?? null,
        city: input.city ?? "",
        state: input.state ?? "",
        pincode: input.pincode ?? null,
        total_units: input.total_units ?? null,
        community_type: input.community_type ?? null,
        contact_person_name: input.contact_person_name ?? null,
        contact_person_phone: input.contact_person_phone ?? null,
        contact_person_email: input.contact_person_email ?? null,
        association_name: input.association_name ?? null,
        created_by: pmUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "create",
      entity_type: "community",
      entity_id: data.id,
      description: `Created community "${input.name}"`,
    });

    revalidatePath("/pm/communities");

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create community",
    };
  }
}

export async function updateCommunity(
  id: string,
  input: CommunityInput
): Promise<ActionResult> {
  try {
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Community name is required" };
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("communities")
      .update({
        name: input.name.trim(),
        address: input.address ?? null,
        city: input.city ?? "",
        state: input.state ?? "",
        pincode: input.pincode ?? null,
        total_units: input.total_units ?? null,
        community_type: input.community_type ?? null,
        contact_person_name: input.contact_person_name ?? null,
        contact_person_phone: input.contact_person_phone ?? null,
        contact_person_email: input.contact_person_email ?? null,
        association_name: input.association_name ?? null,
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "community",
      entity_id: id,
      description: `Updated community "${input.name}"`,
      changes: input as unknown as Record<string, unknown>,
    });

    revalidatePath("/pm/communities");
    revalidatePath(`/pm/communities/${id}`);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update community",
    };
  }
}

export async function deleteCommunity(id: string): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("communities")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "delete",
      entity_type: "community",
      entity_id: id,
      description: `Soft-deleted community ${id}`,
    });

    revalidatePath("/pm/communities");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete community",
    };
  }
}
