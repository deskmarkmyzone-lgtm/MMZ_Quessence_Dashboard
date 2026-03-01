#!/usr/bin/env node
/**
 * Verify migration results in new Supabase
 */
import { createClient } from "@supabase/supabase-js";

const NEW_URL = "https://xzhsckwdcmkwaqmezjud.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHNja3dkY21rd2FxbWV6anVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNDYxMCwiZXhwIjoyMDg3ODgwNjEwfQ.48mqrzQzBJnLMVRdBdJfc8eHu4V5GuSUmkhMejRMUsc";

const db = createClient(NEW_URL, NEW_KEY);

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║          MIGRATION VERIFICATION              ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // Table counts
  const tables = ["communities", "owners", "flats", "tenants", "rent_payments", "expenses", "documents", "notifications", "audit_log", "mmz_settings"];
  console.log("=== TABLE COUNTS ===");
  for (const table of tables) {
    const { count } = await db.from(table).select("id", { count: "exact", head: true });
    console.log(`  ${table.padEnd(20)} ${count ?? 0}`);
  }

  // Community details
  console.log("\n=== COMMUNITIES ===");
  const { data: communities } = await db.from("communities").select("name, city, is_active");
  for (const c of communities ?? []) {
    console.log(`  ${c.name} (${c.city}) - ${c.is_active ? "Active" : "Inactive"}`);
  }

  // Flat status breakdown
  console.log("\n=== FLAT STATUS ===");
  const { data: flats } = await db.from("flats").select("status").eq("is_active", true);
  const statusCounts = {};
  for (const f of flats ?? []) {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
  }
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status.padEnd(20)} ${count}`);
  }

  // Owner count
  console.log("\n=== OWNERS ===");
  const { data: owners } = await db.from("owners").select("name, email").eq("is_active", true);
  console.log(`  Total active owners: ${owners?.length ?? 0}`);
  for (const o of (owners ?? []).slice(0, 5)) {
    console.log(`  - ${o.name} (${o.email})`);
  }
  if ((owners?.length ?? 0) > 5) console.log(`  ... and ${owners.length - 5} more`);

  // Tenant type breakdown
  console.log("\n=== TENANTS ===");
  const { data: tenants } = await db.from("tenants").select("tenant_type, is_active");
  const tenantStats = { total: tenants?.length ?? 0, active: 0, family: 0, bachelor: 0 };
  for (const t of tenants ?? []) {
    if (t.is_active) tenantStats.active++;
    if (t.tenant_type === "family") tenantStats.family++;
    else tenantStats.bachelor++;
  }
  console.log(`  Total: ${tenantStats.total}, Active: ${tenantStats.active}`);
  console.log(`  Family: ${tenantStats.family}, Bachelor: ${tenantStats.bachelor}`);

  // Rent payments summary
  console.log("\n=== RENT PAYMENTS ===");
  const { count: paymentCount } = await db.from("rent_payments").select("id", { count: "exact", head: true });
  console.log(`  Total payments: ${paymentCount}`);

  const { data: paymentStats } = await db.from("rent_payments").select("amount");
  const totalRent = (paymentStats ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);
  console.log(`  Total rent recorded: ₹${totalRent.toLocaleString("en-IN")}`);

  // Proof of files
  const { data: withProofs } = await db
    .from("rent_payments")
    .select("id")
    .not("proof_file_ids", "is", null);
  console.log(`  Payments with proof: ${withProofs?.length ?? 0}`);

  // Check if URLs point to new Supabase
  const { data: samplePayments } = await db
    .from("rent_payments")
    .select("proof_file_ids")
    .not("proof_file_ids", "is", null)
    .limit(3);

  if (samplePayments && samplePayments.length > 0) {
    const sampleUrl = samplePayments[0].proof_file_ids?.[0] || "";
    const pointsToNew = sampleUrl.includes("xzhsckwdcmkwaqmezjud");
    const pointsToOld = sampleUrl.includes("rsqvusfanywhzqryzqck");
    console.log(`  URLs pointing to new storage: ${pointsToNew ? "✅ Yes" : "❌ No"}`);
    if (pointsToOld) console.log(`  ⚠️ Some URLs still point to old storage`);
  }

  // Tenant doc URLs
  console.log("\n=== TENANT DOCUMENT URLS ===");
  const { data: tenantsWithDocs } = await db
    .from("tenants")
    .select("aadhaar_file_id, pan_file_id, employment_proof_file_id, agreement_file_id, spouse_aadhaar_file_id")
    .not("aadhaar_file_id", "is", null);

  let newUrlCount = 0;
  let oldUrlCount = 0;
  for (const t of tenantsWithDocs ?? []) {
    for (const url of [t.aadhaar_file_id, t.pan_file_id, t.employment_proof_file_id, t.agreement_file_id, t.spouse_aadhaar_file_id]) {
      if (!url) continue;
      if (url.includes("xzhsckwdcmkwaqmezjud")) newUrlCount++;
      else if (url.includes("rsqvusfanywhzqryzqck")) oldUrlCount++;
    }
  }
  console.log(`  Tenants with documents: ${tenantsWithDocs?.length ?? 0}`);
  console.log(`  URLs pointing to new storage: ${newUrlCount}`);
  console.log(`  URLs still pointing to old storage: ${oldUrlCount}`);

  // Storage bucket check
  console.log("\n=== NEW STORAGE BUCKET ===");
  const { data: buckets } = await db.storage.listBuckets();
  for (const b of buckets ?? []) {
    console.log(`  ${b.name} (public: ${b.public})`);
  }

  // Count files in new bucket
  const folders = ["migrated/aadhar", "migrated/pan", "migrated/rent-screenshots", "migrated/rental-agreements", "migrated/work-docs"];
  let totalNewFiles = 0;
  for (const folder of folders) {
    let count = 0;
    let offset = 0;
    while (true) {
      const { data } = await db.storage.from("mmz-files").list(folder, { limit: 1000, offset });
      if (!data || data.length === 0) break;
      count += data.filter(f => f.id).length;
      if (data.length < 1000) break;
      offset += 1000;
    }
    totalNewFiles += count;
  }
  console.log(`  Files in mmz-files bucket: ~${totalNewFiles}+ (sampled key folders)`);

  console.log("\n✅ Verification complete!");
}

main().catch(console.error);
