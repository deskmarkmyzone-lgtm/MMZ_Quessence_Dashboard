/**
 * Probe old Supabase storage to discover buckets and files
 */
import { createClient } from "@supabase/supabase-js";

const OLD_URL = "https://rsqvusfanywhzqryzqck.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXZ1c2Zhbnl3aHpxcnl6cWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY1ODAwNCwiZXhwIjoyMDc3MjM0MDA0fQ.4hRWtalyP3k4D5mHBas7v2bvphz4F6KEiAJOLCUgrLw";

const supabase = createClient(OLD_URL, OLD_KEY);

async function main() {
  // 1. List all storage buckets
  console.log("=== STORAGE BUCKETS ===");
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.error("Error listing buckets:", bucketsErr.message);
    return;
  }
  console.log("Buckets:", buckets.map(b => `${b.name} (public: ${b.public})`).join(", "));

  // 2. For each bucket, list top-level files/folders
  for (const bucket of buckets) {
    console.log(`\n=== BUCKET: ${bucket.name} ===`);
    const { data: files, error: filesErr } = await supabase.storage
      .from(bucket.name)
      .list("", { limit: 50, sortBy: { column: "name", order: "asc" } });

    if (filesErr) {
      console.error(`Error listing ${bucket.name}:`, filesErr.message);
      continue;
    }

    if (!files || files.length === 0) {
      console.log("  (empty)");
      continue;
    }

    let totalFiles = 0;
    for (const f of files) {
      const isFolder = !f.id;
      if (isFolder) {
        // List files inside folder
        const { data: subFiles } = await supabase.storage
          .from(bucket.name)
          .list(f.name, { limit: 100 });
        const count = subFiles?.length ?? 0;
        console.log(`  📁 ${f.name}/ (${count} files)`);
        totalFiles += count;

        // Show first 3 files as example
        if (subFiles && subFiles.length > 0) {
          for (const sf of subFiles.slice(0, 3)) {
            console.log(`     - ${sf.name} (${sf.metadata?.size ? (sf.metadata.size / 1024).toFixed(1) + 'KB' : 'unknown size'})`);
          }
          if (subFiles.length > 3) {
            console.log(`     ... and ${subFiles.length - 3} more`);
          }
        }
      } else {
        console.log(`  📄 ${f.name} (${f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) + 'KB' : 'unknown size'})`);
        totalFiles++;
      }
    }
    console.log(`  Total: ~${totalFiles} files`);
  }

  // 3. Also check: sample tenant doc URLs from tenancies table
  console.log("\n=== SAMPLE TENANT DOC URLS ===");
  const { data: tenancies } = await supabase
    .from("tenancies")
    .select("tenant_name, aadhar_url, pan_url, offer_letter_url, agreement_url, partner_aadhar_url")
    .not("aadhar_url", "is", null)
    .limit(5);

  if (tenancies) {
    for (const t of tenancies) {
      console.log(`\n  ${t.tenant_name}:`);
      if (t.aadhar_url) console.log(`    Aadhaar: ${t.aadhar_url.substring(0, 100)}...`);
      if (t.pan_url) console.log(`    PAN: ${t.pan_url.substring(0, 100)}...`);
      if (t.offer_letter_url) console.log(`    Offer Letter: ${t.offer_letter_url.substring(0, 100)}...`);
      if (t.agreement_url) console.log(`    Agreement: ${t.agreement_url.substring(0, 100)}...`);
      if (t.partner_aadhar_url) console.log(`    Partner Aadhaar: ${t.partner_aadhar_url.substring(0, 100)}...`);
    }
  }

  // 4. Count URLs
  const { data: allTenancies } = await supabase.from("tenancies").select("aadhar_url, pan_url, offer_letter_url, agreement_url, partner_aadhar_url");
  if (allTenancies) {
    const counts = {
      aadhaar: allTenancies.filter(t => t.aadhar_url).length,
      pan: allTenancies.filter(t => t.pan_url).length,
      offerLetter: allTenancies.filter(t => t.offer_letter_url).length,
      agreement: allTenancies.filter(t => t.agreement_url).length,
      partnerAadhaar: allTenancies.filter(t => t.partner_aadhar_url).length,
    };
    console.log("\n=== DOCUMENT URL COUNTS ===");
    console.log(`  Aadhaar: ${counts.aadhaar}`);
    console.log(`  PAN: ${counts.pan}`);
    console.log(`  Offer Letter: ${counts.offerLetter}`);
    console.log(`  Agreement: ${counts.agreement}`);
    console.log(`  Partner Aadhaar: ${counts.partnerAadhaar}`);
    console.log(`  Total URLs: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  }

  // 5. Sample rental document file_url
  console.log("\n=== SAMPLE PAYMENT PROOF URLS ===");
  const { data: payments } = await supabase
    .from("rental_documents")
    .select("flat_id, type, file_url")
    .not("file_url", "is", null)
    .limit(5);

  if (payments) {
    for (const p of payments) {
      const url = typeof p.file_url === "string" ? p.file_url : JSON.stringify(p.file_url);
      console.log(`  ${p.flat_id} (${p.type}): ${url.substring(0, 120)}...`);
    }

    // Count total payment files
    const { count } = await supabase
      .from("rental_documents")
      .select("id", { count: "exact", head: true })
      .not("file_url", "is", null);
    console.log(`  Total records with file URLs: ${count}`);
  }
}

main().catch(console.error);
