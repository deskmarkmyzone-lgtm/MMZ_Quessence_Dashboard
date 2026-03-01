#!/usr/bin/env node
/**
 * Fix URLs: Replace all old Supabase storage URLs with new ones
 * Uses the transfer manifest to build a filename-based mapping
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const NEW_URL = "https://xzhsckwdcmkwaqmezjud.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHNja3dkY21rd2FxbWV6anVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNDYxMCwiZXhwIjoyMDg3ODgwNjEwfQ.48mqrzQzBJnLMVRdBdJfc8eHu4V5GuSUmkhMejRMUsc";

const OLD_BASE = "https://rsqvusfanywhzqryzqck.supabase.co/storage/v1/object/public/tenant-docs/";

const db = createClient(NEW_URL, NEW_KEY);

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

/**
 * Replace old URL prefix with new one
 */
function migrateUrl(oldUrl) {
  if (!oldUrl || typeof oldUrl !== "string") return oldUrl;
  if (!oldUrl.includes("rsqvusfanywhzqryzqck")) return oldUrl; // Already new or external

  // Extract the path after the old base URL
  // Old format: https://rsqvusfanywhzqryzqck.supabase.co/storage/v1/object/public/tenant-docs/aadhar/filename.jpg
  // New format: https://xzhsckwdcmkwaqmezjud.supabase.co/storage/v1/object/public/mmz-files/migrated/aadhar/filename.jpg

  const idx = oldUrl.indexOf("tenant-docs/");
  if (idx === -1) return oldUrl; // Can't parse

  const relativePath = oldUrl.substring(idx + "tenant-docs/".length);
  return `${NEW_URL}/storage/v1/object/public/mmz-files/migrated/${relativePath}`;
}

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║        URL Migration: Old → New              ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // 1. Fix tenant document URLs
  log("👤", "Updating tenant document URLs...");
  const { data: tenants } = await db
    .from("tenants")
    .select("id, aadhaar_file_id, pan_file_id, employment_proof_file_id, spouse_aadhaar_file_id, agreement_file_id");

  let tenantUpdated = 0;
  for (const t of tenants ?? []) {
    const updates = {};
    let hasChange = false;

    const fields = ["aadhaar_file_id", "pan_file_id", "employment_proof_file_id", "spouse_aadhaar_file_id", "agreement_file_id"];
    for (const field of fields) {
      const oldVal = t[field];
      if (oldVal && oldVal.includes("rsqvusfanywhzqryzqck")) {
        updates[field] = migrateUrl(oldVal);
        hasChange = true;
      }
    }

    if (hasChange) {
      const { error } = await db.from("tenants").update(updates).eq("id", t.id);
      if (!error) tenantUpdated++;
      else log("❌", `Tenant ${t.id}: ${error.message}`);
    }
  }
  log("✅", `Updated ${tenantUpdated} tenant records`);

  // 2. Fix rent payment proof URLs
  log("💰", "Updating rent payment proof URLs...");
  const { data: payments } = await db
    .from("rent_payments")
    .select("id, proof_file_ids")
    .not("proof_file_ids", "is", null);

  let paymentUpdated = 0;
  for (const p of payments ?? []) {
    if (!Array.isArray(p.proof_file_ids)) continue;

    let hasChange = false;
    const newUrls = p.proof_file_ids.map(url => {
      if (url && url.includes("rsqvusfanywhzqryzqck")) {
        hasChange = true;
        return migrateUrl(url);
      }
      return url;
    });

    if (hasChange) {
      const { error } = await db
        .from("rent_payments")
        .update({ proof_file_ids: newUrls })
        .eq("id", p.id);
      if (!error) paymentUpdated++;
      else log("❌", `Payment ${p.id}: ${error.message}`);
    }
  }
  log("✅", `Updated ${paymentUpdated} payment records`);

  // 3. Verify
  console.log("\n=== VERIFICATION ===");

  // Check tenant URLs
  const { data: checkTenants } = await db
    .from("tenants")
    .select("aadhaar_file_id, pan_file_id, employment_proof_file_id, agreement_file_id, spouse_aadhaar_file_id")
    .not("aadhaar_file_id", "is", null);

  let newCount = 0, oldCount = 0;
  for (const t of checkTenants ?? []) {
    for (const url of [t.aadhaar_file_id, t.pan_file_id, t.employment_proof_file_id, t.agreement_file_id, t.spouse_aadhaar_file_id]) {
      if (!url) continue;
      if (url.includes("xzhsckwdcmkwaqmezjud")) newCount++;
      else if (url.includes("rsqvusfanywhzqryzqck")) oldCount++;
    }
  }
  log("📊", `Tenant URLs: ${newCount} new, ${oldCount} old`);

  // Check payment URLs
  const { data: checkPayments } = await db
    .from("rent_payments")
    .select("proof_file_ids")
    .not("proof_file_ids", "is", null)
    .limit(5);

  let payNewCount = 0, payOldCount = 0;
  for (const p of checkPayments ?? []) {
    for (const url of p.proof_file_ids ?? []) {
      if (url?.includes("xzhsckwdcmkwaqmezjud")) payNewCount++;
      else if (url?.includes("rsqvusfanywhzqryzqck")) payOldCount++;
    }
  }
  log("📊", `Sample payment URLs: ${payNewCount} new, ${payOldCount} old`);

  console.log("\n✅ URL migration complete!");
}

main().catch(console.error);
