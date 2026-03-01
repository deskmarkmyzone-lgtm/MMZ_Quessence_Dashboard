"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ImportResult = { imported: number; failed: number; errors: string[] };

export async function importFlats(
  data: Record<string, string>[],
  communityId: string,
  ownerId: string
): Promise<ImportResult> {
  const supabase = createClient();
  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const flatNumber = row.flat_number?.trim();
    if (!flatNumber) {
      errors.push(`Row ${i + 1}: Missing flat_number`);
      continue;
    }

    const baseRent = parseFloat(row.base_rent || "0");
    const maintenance = parseFloat(row.maintenance_amount || "0");

    if (isNaN(baseRent) || isNaN(maintenance)) {
      errors.push(`Row ${i + 1}: Invalid rent or maintenance amount`);
      continue;
    }

    const inclusiveRent = baseRent + maintenance;

    // Derive tower/floor/unit from 4-digit flat numbers
    let tower: number | null = null;
    let floor: number | null = null;
    let unit: number | null = null;
    if (/^\d{4}$/.test(flatNumber)) {
      tower = parseInt(flatNumber[0], 10);
      floor = parseInt(flatNumber.substring(1, 3), 10);
      unit = parseInt(flatNumber[3], 10);
    }

    const { error } = await supabase.from("flats").insert({
      community_id: communityId,
      owner_id: ownerId,
      flat_number: flatNumber,
      tower,
      floor,
      unit,
      bhk_type: row.bhk_type?.trim() || "2",
      carpet_area_sft: parseFloat(row.carpet_area_sft || "0") || null,
      base_rent: baseRent,
      maintenance_amount: maintenance,
      inclusive_rent: inclusiveRent,
      rent_due_day: parseInt(row.rent_due_day || "1") || 1,
      status: "vacant",
    });

    if (error) {
      errors.push(`Row ${i + 1} (${flatNumber}): ${error.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/pm/flats");
  return { imported, failed: errors.length, errors };
}

export async function importRentPayments(
  data: Record<string, string>[]
): Promise<ImportResult> {
  const supabase = createClient();
  let imported = 0;
  const errors: string[] = [];

  // Pre-fetch flat mapping (flat_number -> flat_id + active tenant_id)
  const { data: flats } = await supabase
    .from("flats")
    .select("id, flat_number")
    .eq("is_active", true);

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, flat_id")
    .eq("is_active", true);

  const flatMap = new Map((flats ?? []).map((f) => [f.flat_number, f.id]));
  const tenantMap = new Map((tenants ?? []).map((t) => [t.flat_id, t.id]));

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const flatNumber = row.flat_number?.trim();
    if (!flatNumber) {
      errors.push(`Row ${i + 1}: Missing flat_number`);
      continue;
    }

    const flatId = flatMap.get(flatNumber);
    if (!flatId) {
      errors.push(`Row ${i + 1}: Flat ${flatNumber} not found`);
      continue;
    }

    const tenantId = tenantMap.get(flatId);
    if (!tenantId) {
      errors.push(`Row ${i + 1}: No active tenant for flat ${flatNumber}`);
      continue;
    }

    const amount = parseFloat(row.amount || "0");
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: Invalid amount`);
      continue;
    }

    const paymentDate = row.payment_date?.trim();
    if (!paymentDate) {
      errors.push(`Row ${i + 1}: Missing payment_date`);
      continue;
    }

    // Derive payment_month from payment_date (first of that month)
    const dateObj = new Date(paymentDate);
    const paymentMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-01`;

    const validMethods = [
      "gpay",
      "phonepe",
      "bank_transfer",
      "cash",
      "upi",
      "cheque",
      "other",
    ];
    const method = validMethods.includes(
      row.payment_method?.trim().toLowerCase()
    )
      ? row.payment_method.trim().toLowerCase()
      : "other";

    const validStatuses = ["full", "partial", "unpaid"];
    const status = validStatuses.includes(
      row.payment_status?.trim().toLowerCase()
    )
      ? row.payment_status.trim().toLowerCase()
      : "full";

    const { error } = await supabase.from("rent_payments").insert({
      flat_id: flatId,
      tenant_id: tenantId,
      amount,
      payment_date: paymentDate,
      payment_month: paymentMonth,
      payment_method: method,
      payment_status: status,
      remarks: row.remarks?.trim() || null,
    });

    if (error) {
      errors.push(`Row ${i + 1} (${flatNumber}): ${error.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/pm/rent");
  return { imported, failed: errors.length, errors };
}

export async function importExpenses(
  data: Record<string, string>[]
): Promise<ImportResult> {
  const supabase = createClient();
  let imported = 0;
  const errors: string[] = [];

  // Pre-fetch flat mapping
  const { data: flats } = await supabase
    .from("flats")
    .select("id, flat_number")
    .eq("is_active", true);

  const flatMap = new Map((flats ?? []).map((f) => [f.flat_number, f.id]));

  const validCategories = [
    "deep_cleaning",
    "paint",
    "electrical",
    "plumbing",
    "ac",
    "geyser",
    "carpentry",
    "pest_control",
    "chimney",
    "other",
  ];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const flatNumber = row.flat_number?.trim();
    if (!flatNumber) {
      errors.push(`Row ${i + 1}: Missing flat_number`);
      continue;
    }

    const flatId = flatMap.get(flatNumber);
    if (!flatId) {
      errors.push(`Row ${i + 1}: Flat ${flatNumber} not found`);
      continue;
    }

    const amount = parseFloat(row.amount || "0");
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: Invalid amount`);
      continue;
    }

    const category = validCategories.includes(
      row.category?.trim().toLowerCase()
    )
      ? row.category.trim().toLowerCase()
      : "other";

    const { error } = await supabase.from("expenses").insert({
      flat_id: flatId,
      category,
      description: row.description?.trim() || `${category} expense`,
      amount,
      expense_date:
        row.expense_date?.trim() || new Date().toISOString().split("T")[0],
      vendor_name: row.vendor_name?.trim() || null,
      reported_by: "pm_inspection",
      paid_by: "pm",
      recovery_status: "pending",
    });

    if (error) {
      errors.push(`Row ${i + 1} (${flatNumber}): ${error.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/pm/expenses");
  return { imported, failed: errors.length, errors };
}
