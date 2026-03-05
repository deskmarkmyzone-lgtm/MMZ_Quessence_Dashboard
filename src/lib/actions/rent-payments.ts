"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import type { PaymentMethod, PaymentStatus } from "@/types";
import { logAudit } from "./audit";
import { createNotification } from "./notifications";

export interface RentPaymentInput {
  flat_id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string;
  base_rent_portion?: number;
  maintenance_portion?: number;
  remarks?: string;
  proof_file_ids?: string[];
}

export interface RentPaymentSummary {
  id: string;
  payment_month: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_status: string;
}

export async function fetchRentPaymentsForFlat(
  flatId: string
): Promise<ActionResult<RentPaymentSummary[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("rent_payments")
      .select("id, payment_month, payment_date, amount, payment_method, payment_status")
      .eq("flat_id", flatId)
      .order("payment_month", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data ?? [] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch rent payments",
    };
  }
}

export async function recordRentPayment(
  input: RentPaymentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.flat_id) {
      return { success: false, error: "Flat is required" };
    }
    if (!input.tenant_id) {
      return { success: false, error: "Tenant is required" };
    }
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "Amount must be positive" };
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
      .from("rent_payments")
      .insert({
        flat_id: input.flat_id,
        tenant_id: input.tenant_id,
        amount: input.amount,
        payment_date: input.payment_date,
        payment_month: input.payment_month,
        payment_method: input.payment_method,
        payment_status: input.payment_status,
        payment_reference: input.payment_reference ?? null,
        base_rent_portion: input.base_rent_portion ?? null,
        maintenance_portion: input.maintenance_portion ?? null,
        remarks: input.remarks ?? null,
        proof_file_ids: input.proof_file_ids ?? null,
        recorded_by: pmUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Get flat number + owner for audit and notification
    const { data: flat } = await supabase
      .from("flats")
      .select("flat_number, owner_id")
      .eq("id", input.flat_id)
      .single();

    const flatLabel = flat?.flat_number ?? input.flat_id;

    await logAudit({
      action: "create",
      entity_type: "rent_payment",
      entity_id: data.id,
      description: `Recorded rent payment of \u20B9${input.amount} for Flat ${flatLabel}`,
    });

    // Notify the flat's owner
    if (flat?.owner_id) {
      await createNotification({
        recipient_type: "owner",
        recipient_id: flat.owner_id,
        notification_type: "expense_recorded",
        title: "Rent Payment Recorded",
        message: `Rent of \u20B9${input.amount.toLocaleString("en-IN")} recorded for Flat ${flatLabel} on ${input.payment_date}`,
        entity_type: "rent_payment",
        entity_id: data.id,
      }).catch(() => {}); // Non-blocking — don't fail the action if notification fails
    }

    revalidatePath("/pm/rent");
    revalidatePath(`/pm/flats/${input.flat_id}`);

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to record rent payment",
    };
  }
}
