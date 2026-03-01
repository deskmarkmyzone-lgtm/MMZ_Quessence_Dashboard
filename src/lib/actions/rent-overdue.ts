"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Check for overdue rent payments and create notifications.
 * Uses the admin client (service role) since this runs as a background check,
 * not in user context.
 *
 * Logic:
 * - Fetch all occupied flats with active tenants
 * - For each flat, check if a rent_payment exists for the current month
 * - If no payment exists AND the flat's rent_due_day has passed, create notifications
 * - Thresholds: 3 days late, 7 days late, 15 days late (different severity messages)
 * - Prevents duplicate notifications by checking existing ones with same entity_id and description pattern
 * - Notifies PM team and the flat's owner
 */
export async function checkRentOverdue(): Promise<{ created: number }> {
  const admin = createAdminClient();
  const today = new Date();
  const currentDay = today.getDate();

  // Build the current month's date range for payment lookup
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    .toISOString()
    .split("T")[0];

  // Fetch all active tenants in occupied flats
  const { data: activeTenants } = await admin
    .from("tenants")
    .select(
      "id, name, flat_id, monthly_rent, monthly_inclusive_rent, rent_due_day, flat:flats(id, flat_number, owner_id, status, inclusive_rent)"
    )
    .eq("is_active", true);

  if (!activeTenants || activeTenants.length === 0) {
    return { created: 0 };
  }

  // Fetch all rent payments for the current month in one query
  const { data: currentMonthPayments } = await admin
    .from("rent_payments")
    .select("flat_id")
    .gte("payment_month", monthStart)
    .lt("payment_month", nextMonthStart);

  const paidFlatIds = new Set(
    (currentMonthPayments ?? []).map((p: any) => p.flat_id)
  );

  // Get all active PM users for notifications
  const { data: pmUsers } = await admin
    .from("pm_users")
    .select("id")
    .eq("is_active", true);

  let created = 0;

  for (const tenant of activeTenants) {
    const flat = tenant.flat as any;

    // Skip if flat is not occupied or data is missing
    if (!flat || flat.status !== "occupied") continue;

    // Skip if rent has already been paid this month
    if (paidFlatIds.has(flat.id)) continue;

    const rentDueDay = tenant.rent_due_day ?? 1;

    // Skip if the due day hasn't passed yet this month
    if (currentDay <= rentDueDay) continue;

    const daysOverdue = currentDay - rentDueDay;

    // Only notify at specific thresholds: 3, 7, 15 days overdue
    let threshold: number | null = null;
    if (daysOverdue >= 15) threshold = 15;
    else if (daysOverdue >= 7) threshold = 7;
    else if (daysOverdue >= 3) threshold = 3;

    if (!threshold) continue;

    const flatLabel = flat.flat_number ?? "Unknown";
    const expectedRent =
      tenant.monthly_inclusive_rent ?? tenant.monthly_rent ?? flat.inclusive_rent ?? 0;

    // Build a threshold-specific description pattern for dedup
    const thresholdTag = `${threshold} days overdue`;

    // Check if we already sent this specific threshold notification for this tenant this month
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("notification_type", "rent_overdue")
      .eq("entity_type", "rent_payment")
      .eq("entity_id", tenant.id)
      .ilike("message", `%${thresholdTag}%`)
      .gte("created_at", monthStart)
      .lt("created_at", nextMonthStart);

    if ((count ?? 0) > 0) continue; // Already notified for this threshold this month

    // Build severity-specific message
    let severityLabel: string;
    if (threshold >= 15) {
      severityLabel = "URGENT";
    } else if (threshold >= 7) {
      severityLabel = "Warning";
    } else {
      severityLabel = "Reminder";
    }

    const message = `[${severityLabel}] Rent for Flat ${flatLabel} is ${thresholdTag}. Tenant: ${tenant.name}. Expected: \u20B9${expectedRent.toLocaleString("en-IN")}`;
    const title = `Rent Overdue \u2014 ${threshold} Days (Flat ${flatLabel})`;

    // Notify all PM users
    for (const pm of pmUsers ?? []) {
      await admin.from("notifications").insert({
        recipient_type: "pm",
        recipient_id: pm.id,
        notification_type: "rent_overdue",
        title,
        message,
        entity_type: "rent_payment",
        entity_id: tenant.id,
      });
      created++;
    }

    // Notify the flat's owner
    if (flat.owner_id) {
      await admin.from("notifications").insert({
        recipient_type: "owner",
        recipient_id: flat.owner_id,
        notification_type: "rent_overdue",
        title,
        message: `Rent for Flat ${flatLabel} is ${thresholdTag}. Expected: \u20B9${expectedRent.toLocaleString("en-IN")}`,
        entity_type: "rent_payment",
        entity_id: tenant.id,
      });
      created++;
    }
  }

  return { created };
}
