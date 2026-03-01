"use server";

import { createClient as createNewClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Old Supabase connection (service_role key to bypass RLS)
const OLD_URL = "https://rsqvusfanywhzqryzqck.supabase.co";
const OLD_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXZ1c2Zhbnl3aHpxcnl6cWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY1ODAwNCwiZXhwIjoyMDc3MjM0MDA0fQ.4hRWtalyP3k4D5mHBas7v2bvphz4F6KEiAJOLCUgrLw";

function getOldClient() {
  return createClient(OLD_URL, OLD_SERVICE_ROLE_KEY);
}

type MigrationResult = { imported: number; failed: number; errors: string[] };

/**
 * Paginated fetch from old Supabase (default limit is 1000)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll(table: string, filter?: { column: string; value: string }): Promise<any[]> {
  const oldDb = getOldClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    let query = oldDb.from(table).select("*").range(offset, offset + pageSize - 1);
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

/**
 * Step 1: Migrate Flats & Owners
 * - All 170 flats from PHF (Prestige High Fields)
 * - 21 unique owners extracted by owner_email
 * - Old flat_id format: "phf-{FlatNumber}"
 * - Old status "unpaid"/"paid" → "occupied", "unoccupied" → "vacant"
 */
export async function migrateFlatsAndOwners(): Promise<MigrationResult> {
  const newDb = createNewClient();
  const errors: string[] = [];
  let imported = 0;

  // 1. Fetch all old flats
  let oldFlats;
  try {
    oldFlats = await fetchAll("flats");
  } catch (e) {
    return { imported: 0, failed: 0, errors: [(e as Error).message] };
  }

  if (oldFlats.length === 0) {
    return { imported: 0, failed: 0, errors: ["No flats found in old database"] };
  }

  // 2. Ensure community "Prestige High Fields" exists
  const { data: existingCommunity } = await newDb
    .from("communities")
    .select("id")
    .eq("name", "Prestige High Fields")
    .maybeSingle();

  let communityId: string;
  if (existingCommunity) {
    communityId = existingCommunity.id;
  } else {
    const { data: newCommunity, error: communityErr } = await newDb
      .from("communities")
      .insert({
        name: "Prestige High Fields",
        city: "Hyderabad",
        state: "Telangana",
        community_type: "gated_community",
      })
      .select("id")
      .single();

    if (communityErr || !newCommunity) {
      return { imported: 0, failed: 0, errors: [`Failed to create community: ${communityErr?.message}`] };
    }
    communityId = newCommunity.id;
  }

  // 3. Extract unique owners by email and create them
  const ownerMap = new Map<string, string>(); // email -> new owner id
  const uniqueOwners = new Map<string, string>(); // email -> name
  for (const f of oldFlats) {
    const email = (f.owner_email || "").trim().toLowerCase();
    const name = (f.owner_name || "").trim();
    if (email && !uniqueOwners.has(email)) {
      uniqueOwners.set(email, name);
    }
  }

  for (const [email, name] of Array.from(uniqueOwners.entries())) {
    const { data: existing } = await newDb
      .from("owners")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      ownerMap.set(email, existing.id);
    } else {
      const { data: newOwner, error: ownerErr } = await newDb
        .from("owners")
        .insert({
          name: name || email.split("@")[0],
          email,
          brokerage_calc_method: "days_of_rent",
          brokerage_days: 8,
        })
        .select("id")
        .single();

      if (ownerErr) {
        errors.push(`Owner ${email}: ${ownerErr.message}`);
      } else if (newOwner) {
        ownerMap.set(email, newOwner.id);
      }
    }
  }

  // 4. Create flats (idempotent — skip if already exists)
  for (const f of oldFlats) {
    const ownerEmail = (f.owner_email || "").trim().toLowerCase();
    const ownerId = ownerMap.get(ownerEmail);
    if (!ownerId) {
      errors.push(`Flat ${f.FlatNumber}: No owner for ${ownerEmail}`);
      continue;
    }

    const flatNumber = String(f.FlatNumber || "").trim();
    if (!flatNumber) {
      errors.push(`Flat ${f.flat_id}: Missing FlatNumber`);
      continue;
    }

    // Check if already migrated
    const { data: existingFlat } = await newDb
      .from("flats")
      .select("id")
      .eq("community_id", communityId)
      .eq("flat_number", flatNumber)
      .maybeSingle();

    if (existingFlat) {
      imported++;
      continue;
    }

    // "2.5BHK" → "2.5", "3BHK" → "3"
    const bhkRaw = (f.bhk_type || "2BHK").replace(/BHK/i, "").trim();

    // All 170 flats are "unpaid" = occupied with active tenants
    const status = f.status === "unoccupied" ? "vacant" : "occupied";

    // Extract rent_due_day from due_date
    let rentDueDay = 1;
    if (f.due_date) {
      const d = new Date(f.due_date);
      if (!isNaN(d.getTime())) {
        rentDueDay = d.getDate();
      }
    }

    const { error: flatErr } = await newDb.from("flats").insert({
      community_id: communityId,
      owner_id: ownerId,
      flat_number: flatNumber,
      bhk_type: bhkRaw || "2",
      carpet_area_sft: f.square_feet || null,
      base_rent: f.rent_amount || 0,
      maintenance_amount: f.maintenance_amount || 0,
      rent_due_day: Math.min(28, Math.max(1, rentDueDay)),
      status,
    });

    if (flatErr) {
      errors.push(`Flat ${flatNumber}: ${flatErr.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/pm/flats");
  revalidatePath("/pm/owners");
  return { imported, failed: errors.length, errors };
}

/**
 * Step 2: Migrate Tenants
 * - 148 tenancies (all active), 55 family + 93 bachelor
 * - Maps old flat_id "phf-{number}" → FlatNumber → new flat UUID
 * - Preserves tenant doc URLs (Aadhaar, PAN, offer letter, agreement)
 * - Phone stored as number in old DB → convert to string
 */
export async function migrateTenants(): Promise<MigrationResult> {
  const newDb = createNewClient();
  const errors: string[] = [];
  let imported = 0;

  let oldTenancies;
  try {
    oldTenancies = await fetchAll("tenancies");
  } catch (e) {
    return { imported: 0, failed: 0, errors: [(e as Error).message] };
  }

  if (oldTenancies.length === 0) {
    return { imported: 0, failed: 0, errors: ["No tenancies found"] };
  }

  // Build mapping: old flat_id → FlatNumber
  let oldFlats;
  try {
    oldFlats = await fetchAll("flats");
  } catch (e) {
    return { imported: 0, failed: 0, errors: [(e as Error).message] };
  }

  const oldFlatIdToNumber = new Map<string, string>();
  const oldFlatIdToRent = new Map<string, { rent: number; maintenance: number }>();
  for (const f of oldFlats) {
    oldFlatIdToNumber.set(f.flat_id, String(f.FlatNumber));
    oldFlatIdToRent.set(f.flat_id, {
      rent: f.rent_amount || 0,
      maintenance: f.maintenance_amount || 0,
    });
  }

  // Build mapping: flat_number → new flat UUID
  const { data: newFlats } = await newDb
    .from("flats")
    .select("id, flat_number")
    .eq("is_active", true);

  const flatNumberToId = new Map<string, string>();
  for (const f of newFlats ?? []) {
    flatNumberToId.set(f.flat_number, f.id);
  }

  for (const t of oldTenancies) {
    const flatNumber = oldFlatIdToNumber.get(t.flat_id);
    if (!flatNumber) {
      errors.push(`Tenant ${t.tenant_name}: Cannot resolve flat_id ${t.flat_id}`);
      continue;
    }

    const newFlatId = flatNumberToId.get(flatNumber);
    if (!newFlatId) {
      errors.push(`Tenant ${t.tenant_name}: New flat ${flatNumber} not found`);
      continue;
    }

    // Check if tenant already exists for this flat (avoid duplicates)
    const { data: existingTenant } = await newDb
      .from("tenants")
      .select("id")
      .eq("flat_id", newFlatId)
      .eq("name", t.tenant_name || "Unknown")
      .maybeSingle();

    if (existingTenant) {
      imported++;
      continue;
    }

    const tenantType = (t.family_status || "").toLowerCase() === "bachelors" ? "bachelor" : "family";

    let occupationType = null;
    if (t.occupation_type === "Working") occupationType = "employee";
    else if (t.occupation_type === "Business") occupationType = "business_owner";

    let bachelorGender = null;
    if (t.gender === "Men") bachelorGender = "male";
    else if (t.gender === "Women") bachelorGender = "female";

    // Phone is stored as number in old DB
    const phone = t.phone_number ? String(t.phone_number) : null;

    // Get flat rent for monthly_rent snapshot
    const flatRent = oldFlatIdToRent.get(t.flat_id);

    const { error: tenantErr } = await newDb.from("tenants").insert({
      flat_id: newFlatId,
      name: t.tenant_name || "Unknown",
      phone,
      email: t.tenant_email || null,
      tenant_type: tenantType,
      occupation_type: occupationType,
      company_name: t.company_name || null,
      business_name: t.business_name || null,
      family_member_count: t.family_members || null,
      bachelor_occupant_count: t.bachelors_count || null,
      bachelor_gender: bachelorGender,
      // Document URLs from old Supabase storage (remain accessible as public URLs)
      aadhaar_file_id: t.aadhar_url || null,
      pan_file_id: t.pan_url || null,
      employment_proof_file_id: t.offer_letter_url || null,
      spouse_aadhaar_file_id: t.partner_aadhar_url || null,
      agreement_file_id: t.agreement_url || null,
      // Lease details
      lease_start_date: t.agreement_start_date || t.start_date || null,
      lease_end_date: t.agreement_end_date || null,
      security_deposit: t.deposit_amount || null,
      monthly_rent: flatRent?.rent || null,
      monthly_maintenance: flatRent?.maintenance || null,
      monthly_inclusive_rent: flatRent ? flatRent.rent + flatRent.maintenance : null,
      is_active: t.is_active ?? true,
      exit_date: t.moved_out_on || t.end_date || null,
    });

    if (tenantErr) {
      errors.push(`Tenant ${t.tenant_name} (flat ${flatNumber}): ${tenantErr.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/pm/flats");
  return { imported, failed: errors.length, errors };
}

/**
 * Step 3: Migrate Rent Payments
 * - 932+ payment records from rental_documents (paginated)
 * - Many have null paid_amount — those are payment proof screenshots
 * - file_url contains old Supabase storage URLs for payment proof images
 * - Maps to rent_payments with proof URLs stored in proof_file_ids
 */
export async function migrateRentPayments(): Promise<MigrationResult> {
  const newDb = createNewClient();
  const errors: string[] = [];
  let imported = 0;

  let oldPayments;
  try {
    oldPayments = await fetchAll("rental_documents", { column: "type", value: "payment" });
  } catch (e) {
    return { imported: 0, failed: 0, errors: [(e as Error).message] };
  }

  if (oldPayments.length === 0) {
    return { imported: 0, failed: 0, errors: ["No payment records found"] };
  }

  // Build flat mappings
  let oldFlats;
  try {
    oldFlats = await fetchAll("flats");
  } catch (e) {
    return { imported: 0, failed: 0, errors: [(e as Error).message] };
  }

  const oldFlatIdToNumber = new Map<string, string>();
  const oldFlatIdToRent = new Map<string, number>();
  for (const f of oldFlats) {
    oldFlatIdToNumber.set(f.flat_id, String(f.FlatNumber));
    oldFlatIdToRent.set(f.flat_id, (f.rent_amount || 0) + (f.maintenance_amount || 0));
  }

  const { data: newFlats } = await newDb
    .from("flats")
    .select("id, flat_number")
    .eq("is_active", true);
  const flatNumberToId = new Map<string, string>();
  for (const f of newFlats ?? []) {
    flatNumberToId.set(f.flat_number, f.id);
  }

  // Get tenants for flat → tenant mapping
  const { data: tenants } = await newDb.from("tenants").select("id, flat_id");
  const flatToTenant = new Map<string, string>();
  for (const t of tenants ?? []) {
    flatToTenant.set(t.flat_id, t.id);
  }

  for (const p of oldPayments) {
    const flatNumber = oldFlatIdToNumber.get(p.flat_id);
    if (!flatNumber) {
      errors.push(`Payment ${p.id}: Cannot resolve flat_id ${p.flat_id}`);
      continue;
    }

    const newFlatId = flatNumberToId.get(flatNumber);
    if (!newFlatId) {
      errors.push(`Payment ${p.id}: New flat ${flatNumber} not found`);
      continue;
    }

    const tenantId = flatToTenant.get(newFlatId);
    if (!tenantId) {
      errors.push(`Payment ${p.id}: No tenant for flat ${flatNumber}`);
      continue;
    }

    // Use paid_amount if available, otherwise use flat's inclusive rent
    let amount = p.paid_amount;
    if (!amount || amount <= 0) {
      amount = oldFlatIdToRent.get(p.flat_id) || 0;
    }
    if (amount <= 0) continue; // Skip if still no amount

    // Payment date: prefer payment_date, fallback to month + "-01", then uploaded_at
    let paymentDate = p.payment_date;
    if (!paymentDate && p.month) {
      paymentDate = `${p.month}-01`;
    }
    if (!paymentDate) {
      paymentDate = p.uploaded_at?.split("T")[0] || new Date().toISOString().split("T")[0];
    }

    // Derive payment_month
    const dateObj = new Date(paymentDate);
    if (isNaN(dateObj.getTime())) continue; // Skip invalid dates

    const paymentMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-01`;

    // Build proof URLs from file_url (can be string or array)
    const proofUrls: string[] = [];
    if (p.file_url) {
      if (Array.isArray(p.file_url)) {
        proofUrls.push(...p.file_url.filter(Boolean));
      } else if (typeof p.file_url === "string") {
        proofUrls.push(p.file_url);
      }
    }

    const { error: insertErr } = await newDb.from("rent_payments").insert({
      flat_id: newFlatId,
      tenant_id: tenantId,
      amount,
      payment_date: paymentDate,
      payment_month: paymentMonth,
      payment_method: "other",
      payment_status: "full",
      remarks: p.remarks || null,
      proof_file_ids: proofUrls.length > 0 ? proofUrls : null,
    });

    if (insertErr) {
      errors.push(`Payment ${p.id} (flat ${flatNumber}): ${insertErr.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/pm/rent");
  return { imported, failed: errors.length, errors };
}

/**
 * Step 4: Migrate Maintenance/Expenses
 * - Old database has 0 maintenance records currently
 * - Included for completeness in case records are added later
 */
export async function migrateExpenses(): Promise<MigrationResult> {
  const newDb = createNewClient();
  const errors: string[] = [];
  let imported = 0;

  let oldMaintenance;
  try {
    oldMaintenance = await fetchAll("maintenance");
  } catch (e) {
    return { imported: 0, failed: 0, errors: [(e as Error).message] };
  }

  if (oldMaintenance.length === 0) {
    return { imported: 0, failed: 0, errors: ["No maintenance records found (old DB has 0)"] };
  }

  // Build flat mappings
  let oldFlats;
  try {
    oldFlats = await fetchAll("flats");
  } catch (e) {
    return { imported: 0, failed: 0, errors: [(e as Error).message] };
  }

  const oldFlatIdToNumber = new Map<string, string>();
  for (const f of oldFlats) {
    oldFlatIdToNumber.set(f.flat_id, String(f.FlatNumber));
  }

  const { data: newFlats } = await newDb
    .from("flats")
    .select("id, flat_number")
    .eq("is_active", true);
  const flatNumberToId = new Map<string, string>();
  for (const f of newFlats ?? []) {
    flatNumberToId.set(f.flat_number, f.id);
  }

  const categoryMap: Record<string, string> = {
    Plumbing: "plumbing",
    Electrical: "electrical",
    Carpentry: "carpentry",
    Cleaning: "deep_cleaning",
    Painting: "paint",
    "Pest Control": "pest_control",
    "General Repair": "other",
    "Appliance Repair": "other",
    Security: "other",
    Other: "other",
  };

  for (const m of oldMaintenance) {
    const flatNumber = oldFlatIdToNumber.get(m.flat_id);
    if (!flatNumber) {
      errors.push(`Maintenance ${m.id}: Cannot resolve flat_id ${m.flat_id}`);
      continue;
    }

    const newFlatId = flatNumberToId.get(flatNumber);
    if (!newFlatId) {
      errors.push(`Maintenance ${m.id}: New flat ${flatNumber} not found`);
      continue;
    }

    const category = categoryMap[m.category || "Other"] || "other";
    const expenseDate = m.reported_at?.split("T")[0] || new Date().toISOString().split("T")[0];

    const { error: insertErr } = await newDb.from("expenses").insert({
      flat_id: newFlatId,
      category,
      description: m.description || `${m.category || "General"} maintenance`,
      amount: m.cost || 0,
      expense_date: expenseDate,
      remarks: [m.remarks, m.severity ? `Severity: ${m.severity}` : null]
        .filter(Boolean)
        .join(" | ") || null,
      reported_by: "pm_inspection",
      paid_by: "pm",
      recovery_status: "pending",
    });

    if (insertErr) {
      errors.push(`Maintenance ${m.id} (flat ${flatNumber}): ${insertErr.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/pm/expenses");
  return { imported, failed: errors.length, errors };
}

/**
 * Migrate all data in sequence
 */
export async function migrateAll(): Promise<MigrationResult> {
  const r1 = await migrateFlatsAndOwners();
  const r2 = await migrateTenants();
  const r3 = await migrateRentPayments();
  const r4 = await migrateExpenses();

  return {
    imported: r1.imported + r2.imported + r3.imported + r4.imported,
    failed: r1.failed + r2.failed + r3.failed + r4.failed,
    errors: [...r1.errors, ...r2.errors, ...r3.errors, ...r4.errors],
  };
}
