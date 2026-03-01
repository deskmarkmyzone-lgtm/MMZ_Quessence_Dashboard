"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import type { OwnerInput } from "@/types";
import { logAudit } from "./audit";

export async function createOwner(
  input: OwnerInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Owner name is required" };
    }
    if (!input.email || input.email.trim().length === 0) {
      return { success: false, error: "Owner email is required" };
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
      .from("owners")
      .insert({
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone ?? null,
        pan_number: input.pan_number ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        pincode: input.pincode ?? null,
        brokerage_calc_method: input.brokerage_calc_method ?? "days_of_rent",
        brokerage_days: input.brokerage_days ?? 8,
        brokerage_percentage: input.brokerage_percentage ?? null,
        brokerage_fixed_amount: input.brokerage_fixed_amount ?? null,
        gst_applicable: input.gst_applicable ?? false,
        gst_number: input.gst_number ?? null,
        communication_pref: input.communication_pref ?? "whatsapp",
        family_group_name: input.family_group_name ?? null,
        created_by: pmUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "create",
      entity_type: "owner",
      entity_id: data.id,
      description: `Created owner "${input.name}"`,
    });

    revalidatePath("/pm/owners");

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create owner",
    };
  }
}

export async function generateOnboardingToken(
  ownerId: string
): Promise<ActionResult<{ token: string }>> {
  try {
    const supabase = createClient();

    // Generate a random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { error } = await supabase
      .from("owners")
      .update({
        onboarding_token: token,
        onboarding_completed: false,
      })
      .eq("id", ownerId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "owner",
      entity_id: ownerId,
      description: "Generated onboarding link for owner",
    });

    revalidatePath(`/pm/owners/${ownerId}`);

    return { success: true, data: { token } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate onboarding token",
    };
  }
}

export async function updateOwner(
  id: string,
  input: OwnerInput
): Promise<ActionResult> {
  try {
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Owner name is required" };
    }
    if (!input.email || input.email.trim().length === 0) {
      return { success: false, error: "Owner email is required" };
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("owners")
      .update({
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone ?? null,
        pan_number: input.pan_number ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        pincode: input.pincode ?? null,
        brokerage_calc_method: input.brokerage_calc_method ?? "days_of_rent",
        brokerage_days: input.brokerage_days ?? 8,
        brokerage_percentage: input.brokerage_percentage ?? null,
        brokerage_fixed_amount: input.brokerage_fixed_amount ?? null,
        gst_applicable: input.gst_applicable ?? false,
        gst_number: input.gst_number ?? null,
        communication_pref: input.communication_pref ?? "whatsapp",
        family_group_name: input.family_group_name ?? null,
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "owner",
      entity_id: id,
      description: `Updated owner "${input.name}"`,
      changes: input as unknown as Record<string, unknown>,
    });

    revalidatePath("/pm/owners");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update owner",
    };
  }
}
