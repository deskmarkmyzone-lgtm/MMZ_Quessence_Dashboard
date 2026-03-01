#!/usr/bin/env node
/**
 * MMZ Data Migration Script
 * Migrates all data from old Supabase → new Supabase
 * Run: node scripts/migrate-data.mjs
 */
import { createClient } from "@supabase/supabase-js";

// Old Supabase (service_role key to bypass RLS)
const OLD_URL = "https://rsqvusfanywhzqryzqck.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXZ1c2Zhbnl3aHpxcnl6cWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY1ODAwNCwiZXhwIjoyMDc3MjM0MDA0fQ.4hRWtalyP3k4D5mHBas7v2bvphz4F6KEiAJOLCUgrLw";

// New Supabase (service_role key to bypass RLS)
const NEW_URL = "https://xzhsckwdcmkwaqmezjud.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHNja3dkY21rd2FxbWV6anVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNDYxMCwiZXhwIjoyMDg3ODgwNjEwfQ.48mqrzQzBJnLMVRdBdJfc8eHu4V5GuSUmkhMejRMUsc";

const oldDb = createClient(OLD_URL, OLD_KEY);
const newDb = createClient(NEW_URL, NEW_KEY);

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

/**
 * Paginated fetch (Supabase default limit is 1000)
 */
async function fetchAll(table, filter) {
  const all = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    let query = oldDb.from(table).select("*").range(offset, offset + pageSize - 1);
    if (filter) query = query.eq(filter.column, filter.value);
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

// ============================================================
// STEP 1: Migrate Flats & Owners
// ============================================================
async function migrateFlatsAndOwners() {
  log("🏠", "Starting flats & owners migration...");
  const errors = [];
  let imported = 0;

  const oldFlats = await fetchAll("flats");
  log("📊", `Found ${oldFlats.length} flats in old DB`);

  // Ensure community exists
  const { data: existingCommunity } = await newDb
    .from("communities")
    .select("id")
    .eq("name", "Prestige High Fields")
    .maybeSingle();

  let communityId;
  if (existingCommunity) {
    communityId = existingCommunity.id;
    log("✅", "Community 'Prestige High Fields' already exists");
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
    if (communityErr) throw new Error(`Failed to create community: ${communityErr.message}`);
    communityId = newCommunity.id;
    log("✅", "Created community 'Prestige High Fields'");
  }

  // Extract unique owners
  const uniqueOwners = new Map();
  for (const f of oldFlats) {
    const email = (f.owner_email || "").trim().toLowerCase();
    const name = (f.owner_name || "").trim();
    if (email && !uniqueOwners.has(email)) {
      uniqueOwners.set(email, name);
    }
  }
  log("👥", `Found ${uniqueOwners.size} unique owners`);

  // Create owners
  const ownerMap = new Map(); // email -> new owner id
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
  log("✅", `Owners mapped: ${ownerMap.size}`);

  // Create flats
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

    const bhkRaw = (f.bhk_type || "2BHK").replace(/BHK/i, "").trim();
    const status = f.status === "unoccupied" ? "vacant" : "occupied";

    let rentDueDay = 1;
    if (f.due_date) {
      const d = new Date(f.due_date);
      if (!isNaN(d.getTime())) rentDueDay = d.getDate();
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

  log("🏠", `Flats imported: ${imported}, errors: ${errors.length}`);
  if (errors.length > 0) log("⚠️", `First 5 errors: ${errors.slice(0, 5).join("; ")}`);
  return { imported, errors };
}

// ============================================================
// STEP 2: Migrate Tenants
// ============================================================
async function migrateTenants() {
  log("👤", "Starting tenants migration...");
  const errors = [];
  let imported = 0;

  const oldTenancies = await fetchAll("tenancies");
  log("📊", `Found ${oldTenancies.length} tenancies in old DB`);

  const oldFlats = await fetchAll("flats");
  const oldFlatIdToNumber = new Map();
  const oldFlatIdToRent = new Map();
  for (const f of oldFlats) {
    oldFlatIdToNumber.set(f.flat_id, String(f.FlatNumber));
    oldFlatIdToRent.set(f.flat_id, { rent: f.rent_amount || 0, maintenance: f.maintenance_amount || 0 });
  }

  const { data: newFlats } = await newDb.from("flats").select("id, flat_number").eq("is_active", true);
  const flatNumberToId = new Map();
  for (const f of newFlats ?? []) flatNumberToId.set(f.flat_number, f.id);

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

    // Check for duplicates
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

    const phone = t.phone_number ? String(t.phone_number) : null;
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
      aadhaar_file_id: t.aadhar_url || null,
      pan_file_id: t.pan_url || null,
      employment_proof_file_id: t.offer_letter_url || null,
      spouse_aadhaar_file_id: t.partner_aadhar_url || null,
      agreement_file_id: t.agreement_url || null,
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

  log("👤", `Tenants imported: ${imported}, errors: ${errors.length}`);
  if (errors.length > 0) log("⚠️", `First 5 errors: ${errors.slice(0, 5).join("; ")}`);
  return { imported, errors };
}

// ============================================================
// STEP 3: Migrate Rent Payments
// ============================================================
async function migrateRentPayments() {
  log("💰", "Starting rent payments migration...");
  const errors = [];
  let imported = 0;
  let skipped = 0;

  const oldPayments = await fetchAll("rental_documents", { column: "type", value: "payment" });
  log("📊", `Found ${oldPayments.length} payment records in old DB`);

  const oldFlats = await fetchAll("flats");
  const oldFlatIdToNumber = new Map();
  const oldFlatIdToRent = new Map();
  for (const f of oldFlats) {
    oldFlatIdToNumber.set(f.flat_id, String(f.FlatNumber));
    oldFlatIdToRent.set(f.flat_id, (f.rent_amount || 0) + (f.maintenance_amount || 0));
  }

  const { data: newFlats } = await newDb.from("flats").select("id, flat_number").eq("is_active", true);
  const flatNumberToId = new Map();
  for (const f of newFlats ?? []) flatNumberToId.set(f.flat_number, f.id);

  const { data: tenants } = await newDb.from("tenants").select("id, flat_id");
  const flatToTenant = new Map();
  for (const t of tenants ?? []) flatToTenant.set(t.flat_id, t.id);

  // Check existing payment count to avoid duplicates
  const { count: existingCount } = await newDb
    .from("rent_payments")
    .select("id", { count: "exact", head: true });
  if (existingCount && existingCount > 0) {
    log("⚠️", `New DB already has ${existingCount} rent payments. Will skip duplicates by date+flat.`);
  }

  // Build set of existing payments for dedup
  const { data: existingPayments } = await newDb
    .from("rent_payments")
    .select("flat_id, payment_date");
  const existingSet = new Set();
  for (const ep of existingPayments ?? []) {
    existingSet.add(`${ep.flat_id}_${ep.payment_date}`);
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

    let amount = p.paid_amount;
    if (!amount || amount <= 0) {
      amount = oldFlatIdToRent.get(p.flat_id) || 0;
    }
    if (amount <= 0) {
      skipped++;
      continue;
    }

    let paymentDate = p.payment_date;
    if (!paymentDate && p.month) paymentDate = `${p.month}-01`;
    if (!paymentDate) paymentDate = p.uploaded_at?.split("T")[0] || new Date().toISOString().split("T")[0];

    const dateObj = new Date(paymentDate);
    if (isNaN(dateObj.getTime())) {
      skipped++;
      continue;
    }

    // Dedup check
    const dedupKey = `${newFlatId}_${paymentDate}`;
    if (existingSet.has(dedupKey)) {
      imported++;
      continue;
    }

    const paymentMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-01`;

    const proofUrls = [];
    if (p.file_url) {
      if (Array.isArray(p.file_url)) proofUrls.push(...p.file_url.filter(Boolean));
      else if (typeof p.file_url === "string") proofUrls.push(p.file_url);
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
      errors.push(`Payment flat ${flatNumber} ${paymentDate}: ${insertErr.message}`);
    } else {
      imported++;
      existingSet.add(dedupKey); // Prevent duplicates within batch
    }
  }

  log("💰", `Rent payments imported: ${imported}, skipped: ${skipped}, errors: ${errors.length}`);
  if (errors.length > 0) log("⚠️", `First 5 errors: ${errors.slice(0, 5).join("; ")}`);
  return { imported, errors };
}

// ============================================================
// STEP 4: Migrate Agreements as Documents
// ============================================================
async function migrateAgreements() {
  log("📄", "Starting agreements migration...");
  const errors = [];
  let imported = 0;

  const oldAgreements = await fetchAll("rental_documents", { column: "type", value: "agreement" });
  log("📊", `Found ${oldAgreements.length} agreement records in old DB`);

  if (oldAgreements.length === 0) return { imported: 0, errors: [] };

  const oldFlats = await fetchAll("flats");
  const oldFlatIdToNumber = new Map();
  for (const f of oldFlats) {
    oldFlatIdToNumber.set(f.flat_id, String(f.FlatNumber));
  }

  // We'll store agreement file URLs alongside the tenant record
  // Update tenants that don't have agreement_file_id yet
  const { data: newFlats } = await newDb.from("flats").select("id, flat_number").eq("is_active", true);
  const flatNumberToId = new Map();
  for (const f of newFlats ?? []) flatNumberToId.set(f.flat_number, f.id);

  for (const a of oldAgreements) {
    if (!a.file_url) continue;

    const flatNumber = oldFlatIdToNumber.get(a.flat_id);
    if (!flatNumber) continue;

    const newFlatId = flatNumberToId.get(flatNumber);
    if (!newFlatId) continue;

    const fileUrl = Array.isArray(a.file_url) ? a.file_url[0] : a.file_url;
    if (!fileUrl) continue;

    // Update tenant's agreement_file_id if null
    const { data: tenant } = await newDb
      .from("tenants")
      .select("id, agreement_file_id")
      .eq("flat_id", newFlatId)
      .eq("is_active", true)
      .maybeSingle();

    if (tenant && !tenant.agreement_file_id) {
      const { error } = await newDb
        .from("tenants")
        .update({ agreement_file_id: fileUrl })
        .eq("id", tenant.id);
      if (!error) imported++;
      else errors.push(`Agreement flat ${flatNumber}: ${error.message}`);
    }
  }

  log("📄", `Agreements linked: ${imported}, errors: ${errors.length}`);
  return { imported, errors };
}

// ============================================================
// STEP 5: Migrate Expenses/Maintenance
// ============================================================
async function migrateExpenses() {
  log("🔧", "Starting expenses migration...");
  let oldMaintenance;
  try {
    oldMaintenance = await fetchAll("maintenance");
  } catch {
    log("ℹ️", "No maintenance table or empty — skipping");
    return { imported: 0, errors: [] };
  }

  if (oldMaintenance.length === 0) {
    log("ℹ️", "No maintenance records found in old DB (0 records)");
    return { imported: 0, errors: [] };
  }

  // Same logic as in actions.ts...
  return { imported: 0, errors: [] };
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║      MMZ Data Migration: Old → New          ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  const start = Date.now();

  try {
    // Test connections
    log("🔌", "Testing old DB connection...");
    const { count: oldFlatCount } = await oldDb.from("flats").select("id", { count: "exact", head: true });
    log("✅", `Old DB: ${oldFlatCount} flats`);

    log("🔌", "Testing new DB connection...");
    const { count: newFlatCount } = await newDb.from("flats").select("id", { count: "exact", head: true });
    log("✅", `New DB: ${newFlatCount ?? 0} flats currently`);

    console.log();

    // Run migration steps
    const r1 = await migrateFlatsAndOwners();
    console.log();
    const r2 = await migrateTenants();
    console.log();
    const r3 = await migrateRentPayments();
    console.log();
    const r4 = await migrateAgreements();
    console.log();
    const r5 = await migrateExpenses();

    // Summary
    const totalImported = r1.imported + r2.imported + r3.imported + r4.imported + r5.imported;
    const totalErrors = r1.errors.length + r2.errors.length + r3.errors.length + r4.errors.length + r5.errors.length;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log();
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║              MIGRATION SUMMARY               ║");
    console.log("╠══════════════════════════════════════════════╣");
    console.log(`║  Flats & Owners: ${String(r1.imported).padStart(5)} imported, ${String(r1.errors.length).padStart(3)} errors  ║`);
    console.log(`║  Tenants:        ${String(r2.imported).padStart(5)} imported, ${String(r2.errors.length).padStart(3)} errors  ║`);
    console.log(`║  Rent Payments:  ${String(r3.imported).padStart(5)} imported, ${String(r3.errors.length).padStart(3)} errors  ║`);
    console.log(`║  Agreements:     ${String(r4.imported).padStart(5)} imported, ${String(r4.errors.length).padStart(3)} errors  ║`);
    console.log(`║  Expenses:       ${String(r5.imported).padStart(5)} imported, ${String(r5.errors.length).padStart(3)} errors  ║`);
    console.log("╠══════════════════════════════════════════════╣");
    console.log(`║  TOTAL:          ${String(totalImported).padStart(5)} imported, ${String(totalErrors).padStart(3)} errors  ║`);
    console.log(`║  Time:           ${elapsed.padStart(5)}s                       ║`);
    console.log("╚══════════════════════════════════════════════╝");

    if (totalErrors > 0) {
      console.log("\n=== ALL ERRORS ===");
      const allErrors = [...r1.errors, ...r2.errors, ...r3.errors, ...r4.errors, ...r5.errors];
      for (const e of allErrors.slice(0, 20)) {
        console.log(`  ❌ ${e}`);
      }
      if (allErrors.length > 20) {
        console.log(`  ... and ${allErrors.length - 20} more errors`);
      }
    }

    // Verify final counts
    console.log("\n=== NEW DB VERIFICATION ===");
    const counts = {};
    for (const table of ["communities", "owners", "flats", "tenants", "rent_payments", "expenses"]) {
      const { count } = await newDb.from(table).select("id", { count: "exact", head: true });
      counts[table] = count ?? 0;
      console.log(`  ${table}: ${count}`);
    }

  } catch (err) {
    console.error("❌ FATAL ERROR:", err.message);
    process.exit(1);
  }
}

main();
