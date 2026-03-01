"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import type {
  ExpenseCategory,
  ExpenseReporter,
  ExpensePayer,
} from "@/types";
import { logAudit } from "./audit";
import { createNotification } from "./notifications";

export interface ExpenseInput {
  flat_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  vendor_name?: string;
  vendor_phone?: string;
  reported_by: ExpenseReporter;
  paid_by: ExpensePayer;
  remarks?: string;
  receipt_file_ids?: string[];
}

export async function recordExpense(
  input: ExpenseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.flat_id) {
      return { success: false, error: "Flat is required" };
    }
    if (!input.category) {
      return { success: false, error: "Category is required" };
    }
    if (!input.description || input.description.trim().length === 0) {
      return { success: false, error: "Description is required" };
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

    // If paid_by is 'pm', set recovery_status to 'pending'
    const recoveryStatus = input.paid_by === "pm" ? "pending" : "pending";

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        flat_id: input.flat_id,
        category: input.category,
        description: input.description.trim(),
        amount: input.amount,
        expense_date: input.expense_date,
        vendor_name: input.vendor_name ?? null,
        vendor_phone: input.vendor_phone ?? null,
        reported_by: input.reported_by,
        paid_by: input.paid_by,
        recovery_status: recoveryStatus,
        remarks: input.remarks ?? null,
        receipt_file_ids: input.receipt_file_ids ?? null,
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
    const categoryLabel = input.category.replace(/_/g, " ");

    await logAudit({
      action: "create",
      entity_type: "expense",
      entity_id: data.id,
      description: `Recorded expense of \u20B9${input.amount} for ${categoryLabel} on Flat ${flatLabel}`,
    });

    // Notify the flat's owner
    if (flat?.owner_id) {
      await createNotification({
        recipient_type: "owner",
        recipient_id: flat.owner_id,
        notification_type: "expense_recorded",
        title: "Expense Recorded",
        message: `${categoryLabel} expense of \u20B9${input.amount.toLocaleString("en-IN")} recorded for Flat ${flatLabel}`,
        entity_type: "expense",
        entity_id: data.id,
      }).catch(() => {}); // Non-blocking
    }

    revalidatePath("/pm/expenses");
    revalidatePath(`/pm/flats/${input.flat_id}`);

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record expense",
    };
  }
}
