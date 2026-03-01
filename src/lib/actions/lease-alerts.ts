"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Check for leases expiring within 60, 30, and 7 days and create notifications.
 * Uses the admin client (service role) since this runs as a background check,
 * not in user context.
 */
export async function checkLeaseExpirations(): Promise<{ created: number }> {
  const admin = createAdminClient();
  const today = new Date();

  // Get all active tenants with lease_end_date within the next 60 days
  const sixtyDaysFromNow = new Date(today);
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  const { data: expiringTenants } = await admin
    .from("tenants")
    .select(
      "id, name, lease_end_date, flat_id, flat:flats(flat_number, owner_id)"
    )
    .eq("is_active", true)
    .not("lease_end_date", "is", null)
    .lte("lease_end_date", sixtyDaysFromNow.toISOString().split("T")[0])
    .gte("lease_end_date", today.toISOString().split("T")[0]);

  let created = 0;

  for (const tenant of expiringTenants ?? []) {
    const leaseEnd = new Date(tenant.lease_end_date);
    const daysUntilExpiry = Math.ceil(
      (leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const flat = tenant.flat as any;

    // Only notify at 60, 30, 7 day marks
    let threshold: number | null = null;
    if (daysUntilExpiry <= 7) threshold = 7;
    else if (daysUntilExpiry <= 30) threshold = 30;
    else if (daysUntilExpiry <= 60) threshold = 60;

    if (!threshold) continue;

    // Check if we already sent this specific threshold notification for this tenant
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("notification_type", "lease_expiring")
      .eq("entity_type", "tenant")
      .eq("entity_id", tenant.id)
      .ilike("message", `%${threshold} day%`);

    if ((count ?? 0) > 0) continue; // Already notified for this threshold

    // Get all PM users to notify
    const { data: pmUsers } = await admin
      .from("pm_users")
      .select("id")
      .eq("is_active", true);

    const flatLabel = flat?.flat_number ?? "Unknown";
    const message = `Lease for ${tenant.name} in Flat ${flatLabel} expires in ${threshold} days (${new Date(tenant.lease_end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})`;

    // Notify all PM users
    for (const pm of pmUsers ?? []) {
      await admin.from("notifications").insert({
        recipient_type: "pm",
        recipient_id: pm.id,
        notification_type: "lease_expiring",
        title: `Lease Expiring — ${threshold} Days`,
        message,
        entity_type: "tenant",
        entity_id: tenant.id,
      });
      created++;
    }

    // Also notify the flat's owner
    if (flat?.owner_id) {
      await admin.from("notifications").insert({
        recipient_type: "owner",
        recipient_id: flat.owner_id,
        notification_type: "lease_expiring",
        title: `Lease Expiring — ${threshold} Days`,
        message: `Lease for tenant in Flat ${flatLabel} expires in ${threshold} days`,
        entity_type: "tenant",
        entity_id: tenant.id,
      });
      created++;
    }
  }

  return { created };
}
