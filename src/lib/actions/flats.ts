"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import type { FlatInput } from "@/types";
import { logAudit } from "./audit";

function deriveTowerFloorUnit(flatNumber: string): {
  tower: number | null;
  floor: number | null;
  unit: number | null;
} {
  // If flat_number is exactly 4 digits, derive tower/floor/unit
  // e.g. "3154" -> tower=3, floor=15, unit=4
  if (/^\d{4}$/.test(flatNumber)) {
    const tower = parseInt(flatNumber[0], 10);
    const floor = parseInt(flatNumber.substring(1, 3), 10);
    const unit = parseInt(flatNumber[3], 10);
    return { tower, floor, unit };
  }
  return { tower: null, floor: null, unit: null };
}

export async function createFlat(
  input: FlatInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.flat_number || input.flat_number.trim().length === 0) {
      return { success: false, error: "Flat number is required" };
    }
    if (!input.community_id) {
      return { success: false, error: "Community is required" };
    }
    if (!input.owner_id) {
      return { success: false, error: "Owner is required" };
    }
    if (!input.bhk_type) {
      return { success: false, error: "BHK type is required" };
    }
    if (!input.base_rent || input.base_rent <= 0) {
      return { success: false, error: "Base rent is required and must be positive" };
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

    const { tower, floor, unit } = deriveTowerFloorUnit(input.flat_number);

    const inclusiveRent =
      (input.base_rent ?? 0) + (input.maintenance_amount ?? 0);

    const { data, error } = await supabase
      .from("flats")
      .insert({
        community_id: input.community_id,
        owner_id: input.owner_id,
        flat_number: input.flat_number.trim(),
        tower,
        floor,
        unit,
        bhk_type: input.bhk_type,
        carpet_area_sft: input.carpet_area_sft ?? null,
        base_rent: input.base_rent,
        maintenance_amount: input.maintenance_amount ?? 0,
        inclusive_rent: inclusiveRent,
        rent_due_day: input.rent_due_day ?? 1,
        status: input.status ?? "vacant",
        notes: input.notes ?? null,
        created_by: pmUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "create",
      entity_type: "flat",
      entity_id: data.id,
      description: `Created flat "${input.flat_number}" in community ${input.community_id}`,
    });

    revalidatePath("/pm/flats");

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create flat",
    };
  }
}

export async function updateFlat(
  id: string,
  input: Partial<FlatInput>
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const updateData: Record<string, unknown> = {};

    if (input.flat_number !== undefined) {
      updateData.flat_number = input.flat_number.trim();
      const { tower, floor, unit: unitNum } = deriveTowerFloorUnit(
        input.flat_number
      );
      updateData.tower = tower;
      updateData.floor = floor;
      updateData.unit = unitNum;
    }
    if (input.community_id !== undefined)
      updateData.community_id = input.community_id;
    if (input.owner_id !== undefined) updateData.owner_id = input.owner_id;
    if (input.bhk_type !== undefined) updateData.bhk_type = input.bhk_type;
    if (input.carpet_area_sft !== undefined)
      updateData.carpet_area_sft = input.carpet_area_sft;
    if (input.base_rent !== undefined) updateData.base_rent = input.base_rent;
    if (input.maintenance_amount !== undefined)
      updateData.maintenance_amount = input.maintenance_amount;
    if (input.rent_due_day !== undefined)
      updateData.rent_due_day = input.rent_due_day;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Recalculate inclusive_rent if base_rent or maintenance_amount changed
    if (
      input.base_rent !== undefined ||
      input.maintenance_amount !== undefined
    ) {
      // Fetch current values for any field not provided
      const { data: current } = await supabase
        .from("flats")
        .select("base_rent, maintenance_amount")
        .eq("id", id)
        .single();

      const baseRent = input.base_rent ?? current?.base_rent ?? 0;
      const maintenance =
        input.maintenance_amount ?? current?.maintenance_amount ?? 0;
      updateData.inclusive_rent = baseRent + maintenance;
    }

    const { error } = await supabase
      .from("flats")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "flat",
      entity_id: id,
      description: `Updated flat ${id}`,
      changes: updateData as Record<string, unknown>,
    });

    revalidatePath("/pm/flats");
    revalidatePath(`/pm/flats/${id}`);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update flat",
    };
  }
}
