"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/actions/audit";

interface BulkPaymentInput {
  flat_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  payment_reference?: string;
  remarks?: string;
}

export async function bulkRecordRentPayments(
  payments: BulkPaymentInput[]
): Promise<{ imported: number; failed: number; errors: string[] }> {
  const supabase = createClient();
  let imported = 0;
  const errors: string[] = [];

  // Get current PM user for recorded_by
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: pmUser } = await supabase
    .from("pm_users")
    .select("id")
    .eq("auth_user_id", user?.id)
    .single();

  // Pre-fetch active tenants for all flats
  const flatIds = Array.from(new Set(payments.map((p) => p.flat_id)));
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, flat_id")
    .eq("is_active", true)
    .in("flat_id", flatIds);

  const tenantMap = new Map(
    (tenants ?? []).map((t) => [t.flat_id, t.id])
  );

  // Pre-fetch flat details for audit logging
  const { data: flats } = await supabase
    .from("flats")
    .select("id, flat_number, owner_id")
    .in("id", flatIds);

  const flatMap = new Map(
    (flats ?? []).map((f) => [f.id, f])
  );

  const validMethods = [
    "gpay",
    "phonepe",
    "bank_transfer",
    "cash",
    "upi",
    "cheque",
    "other",
  ];

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i];
    const flat = flatMap.get(payment.flat_id);
    const flatLabel = flat?.flat_number ?? payment.flat_id;

    // Validate amount
    if (!payment.amount || payment.amount <= 0) {
      errors.push(`Row ${i + 1} (${flatLabel}): Invalid amount`);
      continue;
    }

    // Validate date
    if (!payment.payment_date) {
      errors.push(`Row ${i + 1} (${flatLabel}): Missing payment date`);
      continue;
    }

    // Find active tenant
    const tenantId = tenantMap.get(payment.flat_id);
    if (!tenantId) {
      errors.push(
        `Row ${i + 1} (${flatLabel}): No active tenant found for this flat`
      );
      continue;
    }

    // Derive payment_month from payment_date
    const dateObj = new Date(payment.payment_date);
    if (isNaN(dateObj.getTime())) {
      errors.push(`Row ${i + 1} (${flatLabel}): Invalid date format`);
      continue;
    }
    const paymentMonth = `${dateObj.getFullYear()}-${String(
      dateObj.getMonth() + 1
    ).padStart(2, "0")}-01`;

    // Check for duplicates (same flat_id + payment_date)
    const { data: existing } = await supabase
      .from("rent_payments")
      .select("id")
      .eq("flat_id", payment.flat_id)
      .eq("payment_date", payment.payment_date)
      .limit(1);

    if (existing && existing.length > 0) {
      errors.push(
        `Row ${i + 1} (${flatLabel}): Duplicate — payment already exists for ${payment.payment_date}`
      );
      continue;
    }

    // Normalize payment method
    const method = validMethods.includes(
      payment.payment_method?.trim().toLowerCase()
    )
      ? payment.payment_method.trim().toLowerCase()
      : "bank_transfer";

    const { error } = await supabase.from("rent_payments").insert({
      flat_id: payment.flat_id,
      tenant_id: tenantId,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_month: paymentMonth,
      payment_method: method,
      payment_status: "full",
      payment_reference: payment.payment_reference?.trim() || null,
      remarks: payment.remarks?.trim() || null,
      recorded_by: pmUser?.id ?? null,
    });

    if (error) {
      errors.push(`Row ${i + 1} (${flatLabel}): ${error.message}`);
    } else {
      imported++;

      // Log audit (non-blocking)
      logAudit({
        action: "create",
        entity_type: "rent_payment",
        entity_id: payment.flat_id,
        description: `Bulk import: Recorded rent payment of \u20B9${payment.amount} for Flat ${flatLabel}`,
      }).catch(() => {});
    }
  }

  revalidatePath("/pm/rent");

  return { imported, failed: errors.length, errors };
}

// Fetch all active flats with their inclusive_rent for matching
export async function getFlatsForMatching(): Promise<
  Array<{
    id: string;
    flat_number: string;
    inclusive_rent: number;
    community_name: string | null;
    owner_name: string | null;
  }>
> {
  const supabase = createClient();

  const { data: flats } = await supabase
    .from("flats")
    .select(
      "id, flat_number, inclusive_rent, community:communities(name), owner:owners(name)"
    )
    .eq("is_active", true)
    .order("flat_number");

  return (flats ?? []).map((f: any) => ({
    id: f.id,
    flat_number: f.flat_number,
    inclusive_rent: f.inclusive_rent,
    community_name: f.community?.name ?? null,
    owner_name: f.owner?.name ?? null,
  }));
}
