#!/usr/bin/env node
/**
 * MMZ File Preservation Script
 * Downloads ALL files from old Supabase Storage and re-uploads to new Supabase Storage
 * Then updates tenant + rent_payment records to point to new URLs
 *
 * Run: node scripts/preserve-files.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Old Supabase
const OLD_URL = "https://rsqvusfanywhzqryzqck.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXZ1c2Zhbnl3aHpxcnl6cWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY1ODAwNCwiZXhwIjoyMDc3MjM0MDA0fQ.4hRWtalyP3k4D5mHBas7v2bvphz4F6KEiAJOLCUgrLw";

// New Supabase
const NEW_URL = "https://xzhsckwdcmkwaqmezjud.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHNja3dkY21rd2FxbWV6anVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNDYxMCwiZXhwIjoyMDg3ODgwNjEwfQ.48mqrzQzBJnLMVRdBdJfc8eHu4V5GuSUmkhMejRMUsc";

const oldDb = createClient(OLD_URL, OLD_KEY);
const newDb = createClient(NEW_URL, NEW_KEY);

const OLD_BUCKET = "tenant-docs";
const NEW_BUCKET = "mmz-files";

// Folders to migrate
const FOLDERS = [
  "aadhar",
  "bachelor-aadhar",
  "exit-pdfs",
  "maintenance-bills",
  "pan",
  "payments",
  "previous_tenants",
  "rent-screenshots",
  "rental-agreements",
  "work-docs",
];

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

/**
 * List ALL files in a storage folder (paginated, handles >100)
 */
async function listAllFiles(bucket, folder) {
  const all = [];
  const pageSize = 100;
  let offset = 0;
  while (true) {
    const { data, error } = await oldDb.storage
      .from(bucket)
      .list(folder, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`List ${folder}: ${error.message}`);
    if (!data || data.length === 0) break;
    // Filter out "folders" (no id means it's a folder, not a file)
    const files = data.filter(f => f.id);
    all.push(...files);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/**
 * Download a file from old storage and upload to new storage
 */
async function transferFile(folder, fileName) {
  const oldPath = `${folder}/${fileName}`;
  const newPath = `migrated/${folder}/${fileName}`;

  // Download from old storage
  const { data: fileData, error: downloadErr } = await oldDb.storage
    .from(OLD_BUCKET)
    .download(oldPath);

  if (downloadErr) {
    return { success: false, error: `Download ${oldPath}: ${downloadErr.message}` };
  }

  if (!fileData) {
    return { success: false, error: `Download ${oldPath}: Empty response` };
  }

  // Convert Blob to ArrayBuffer
  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Determine content type
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  const contentType = contentTypes[ext] || "application/octet-stream";

  // Upload to new storage
  const { error: uploadErr } = await newDb.storage
    .from(NEW_BUCKET)
    .upload(newPath, buffer, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (uploadErr) {
    return { success: false, error: `Upload ${newPath}: ${uploadErr.message}` };
  }

  // Get public URL from new storage
  const { data: urlData } = newDb.storage
    .from(NEW_BUCKET)
    .getPublicUrl(newPath);

  return { success: true, newUrl: urlData.publicUrl, oldPath, newPath };
}

/**
 * Ensure the mmz-files bucket exists
 */
async function ensureBucket() {
  const { data: buckets } = await newDb.storage.listBuckets();
  const exists = buckets?.some(b => b.name === NEW_BUCKET);

  if (!exists) {
    log("📦", `Creating bucket '${NEW_BUCKET}'...`);
    const { error } = await newDb.storage.createBucket(NEW_BUCKET, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (error) throw new Error(`Create bucket: ${error.message}`);
    log("✅", `Bucket '${NEW_BUCKET}' created`);
  } else {
    log("✅", `Bucket '${NEW_BUCKET}' already exists`);
  }
}

/**
 * Build a URL mapping: old URL → new URL
 */
function buildUrlMapping(transfers) {
  const map = new Map();
  for (const t of transfers) {
    if (!t.success || !t.newUrl) continue;
    // Old URL format: https://rsqvusfanywhzqryzqck.supabase.co/storage/v1/object/public/tenant-docs/{folder}/{file}
    const oldUrl = `${OLD_URL}/storage/v1/object/public/${OLD_BUCKET}/${t.oldPath}`;
    map.set(oldUrl, t.newUrl);
  }
  return map;
}

/**
 * Update tenant records to point to new URLs
 */
async function updateTenantUrls(urlMap) {
  log("🔄", "Updating tenant document URLs...");
  let updated = 0;

  const { data: tenants } = await newDb
    .from("tenants")
    .select("id, aadhaar_file_id, pan_file_id, employment_proof_file_id, spouse_aadhaar_file_id, agreement_file_id");

  if (!tenants) return 0;

  for (const t of tenants) {
    const updates = {};
    let hasUpdate = false;

    for (const [field, column] of [
      ["aadhaar_file_id", "aadhaar_file_id"],
      ["pan_file_id", "pan_file_id"],
      ["employment_proof_file_id", "employment_proof_file_id"],
      ["spouse_aadhaar_file_id", "spouse_aadhaar_file_id"],
      ["agreement_file_id", "agreement_file_id"],
    ]) {
      const oldUrl = t[column];
      if (oldUrl && urlMap.has(oldUrl)) {
        updates[column] = urlMap.get(oldUrl);
        hasUpdate = true;
      }
    }

    if (hasUpdate) {
      const { error } = await newDb.from("tenants").update(updates).eq("id", t.id);
      if (!error) updated++;
    }
  }

  return updated;
}

/**
 * Update rent payment proof URLs
 */
async function updatePaymentUrls(urlMap) {
  log("🔄", "Updating payment proof URLs...");
  let updated = 0;

  const { data: payments } = await newDb
    .from("rent_payments")
    .select("id, proof_file_ids")
    .not("proof_file_ids", "is", null);

  if (!payments) return 0;

  for (const p of payments) {
    if (!p.proof_file_ids || !Array.isArray(p.proof_file_ids)) continue;

    let hasUpdate = false;
    const newUrls = p.proof_file_ids.map(url => {
      const newUrl = urlMap.get(url);
      if (newUrl) {
        hasUpdate = true;
        return newUrl;
      }
      return url;
    });

    if (hasUpdate) {
      const { error } = await newDb
        .from("rent_payments")
        .update({ proof_file_ids: newUrls })
        .eq("id", p.id);
      if (!error) updated++;
    }
  }

  return updated;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║    MMZ File Preservation: Old → New          ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  const start = Date.now();
  const allTransfers = [];
  let totalFiles = 0;
  let successCount = 0;
  let errorCount = 0;

  try {
    // Ensure new bucket exists
    await ensureBucket();
    console.log();

    // Also save a local backup manifest
    const backupDir = path.resolve("backups/old-supabase-files");
    fs.mkdirSync(backupDir, { recursive: true });

    // Process each folder
    for (const folder of FOLDERS) {
      log("📂", `Processing folder: ${folder}/`);

      let files;
      try {
        files = await listAllFiles(OLD_BUCKET, folder);
      } catch (err) {
        log("❌", `Failed to list ${folder}: ${err.message}`);
        continue;
      }

      log("📊", `  Found ${files.length} files`);
      totalFiles += files.length;

      let folderSuccess = 0;
      let folderError = 0;

      // Process files in batches of 5 (to avoid overwhelming the API)
      for (let i = 0; i < files.length; i += 5) {
        const batch = files.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map(f => transferFile(folder, f.name))
        );

        for (const r of results) {
          if (r.status === "fulfilled" && r.value.success) {
            folderSuccess++;
            successCount++;
            allTransfers.push(r.value);
          } else {
            folderError++;
            errorCount++;
            const errMsg = r.status === "fulfilled" ? r.value.error : r.reason?.message;
            if (folderError <= 3) log("  ❌", errMsg);
          }
        }

        // Progress indicator every 25 files
        if ((i + 5) % 25 === 0 || i + 5 >= files.length) {
          process.stdout.write(`\r  Progress: ${Math.min(i + 5, files.length)}/${files.length}`);
        }
      }
      console.log(); // New line after progress
      log("✅", `  ${folder}: ${folderSuccess} transferred, ${folderError} errors`);
    }

    // Save transfer manifest
    const manifest = allTransfers.map(t => ({
      oldPath: t.oldPath,
      newPath: t.newPath,
      newUrl: t.newUrl,
    }));
    fs.writeFileSync(
      path.join(backupDir, "transfer-manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
    log("💾", `Transfer manifest saved to ${backupDir}/transfer-manifest.json`);

    // Build URL mapping and update records
    console.log();
    const urlMap = buildUrlMapping(allTransfers);
    log("🗺️", `URL mapping built: ${urlMap.size} mappings`);

    if (urlMap.size > 0) {
      const tenantsUpdated = await updateTenantUrls(urlMap);
      log("✅", `Updated ${tenantsUpdated} tenant records with new URLs`);

      const paymentsUpdated = await updatePaymentUrls(urlMap);
      log("✅", `Updated ${paymentsUpdated} payment records with new URLs`);
    }

    // Summary
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log();
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║          FILE PRESERVATION SUMMARY           ║");
    console.log("╠══════════════════════════════════════════════╣");
    console.log(`║  Total files found:     ${String(totalFiles).padStart(6)}              ║`);
    console.log(`║  Successfully moved:    ${String(successCount).padStart(6)}              ║`);
    console.log(`║  Errors:                ${String(errorCount).padStart(6)}              ║`);
    console.log(`║  URL mappings created:  ${String(urlMap.size).padStart(6)}              ║`);
    console.log(`║  Time:                  ${elapsed.padStart(6)}s             ║`);
    console.log("╚══════════════════════════════════════════════╝");

  } catch (err) {
    console.error("❌ FATAL ERROR:", err.message);
    process.exit(1);
  }
}

main();
