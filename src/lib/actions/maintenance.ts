"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import { logAudit } from "./audit";

export interface MaintenanceInput {
  flat_id: string;
  quarter: string; // e.g., "Q1-2026"
  period_start: string; // ISO date
  period_end: string; // ISO date
  maintenance_amount: number;
  previous_pending: number;
  is_paid: boolean;
  paid_date?: string;
  paid_by?: string;
}

export async function recordMaintenance(
  input: MaintenanceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.flat_id) {
      return { success: false, error: "Flat is required" };
    }
    if (!input.quarter || input.quarter.trim().length === 0) {
      return { success: false, error: "Quarter is required" };
    }
    if (!input.period_start) {
      return { success: false, error: "Period start date is required" };
    }
    if (!input.period_end) {
      return { success: false, error: "Period end date is required" };
    }
    if (!input.maintenance_amount || input.maintenance_amount <= 0) {
      return { success: false, error: "Maintenance amount must be positive" };
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

    const totalAmount = input.maintenance_amount + (input.previous_pending ?? 0);

    const { data, error } = await supabase
      .from("community_maintenance")
      .insert({
        flat_id: input.flat_id,
        quarter: input.quarter.trim(),
        period_start: input.period_start,
        period_end: input.period_end,
        maintenance_amount: input.maintenance_amount,
        previous_pending: input.previous_pending ?? 0,
        total_amount: totalAmount,
        is_paid: input.is_paid,
        paid_date: input.is_paid ? (input.paid_date ?? null) : null,
        paid_by: input.is_paid ? (input.paid_by ?? null) : null,
        recorded_by: pmUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Get flat number for audit
    const { data: flat } = await supabase
      .from("flats")
      .select("flat_number")
      .eq("id", input.flat_id)
      .single();

    const flatLabel = flat?.flat_number ?? input.flat_id;

    await logAudit({
      action: "create",
      entity_type: "community_maintenance",
      entity_id: data.id,
      description: `Recorded maintenance of \u20B9${input.maintenance_amount} for ${input.quarter} on Flat ${flatLabel}`,
    });

    revalidatePath("/pm/maintenance");

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to record maintenance",
    };
  }
}
