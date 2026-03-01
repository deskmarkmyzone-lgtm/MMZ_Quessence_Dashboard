#!/usr/bin/env node
/**
 * Apply SQL migration to new Supabase via service_role RPC
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const NEW_URL = "https://xzhsckwdcmkwaqmezjud.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHNja3dkY21rd2FxbWV6anVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNDYxMCwiZXhwIjoyMDg3ODgwNjEwfQ.48mqrzQzBJnLMVRdBdJfc8eHu4V5GuSUmkhMejRMUsc";

const db = createClient(NEW_URL, NEW_KEY);

async function main() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error("Usage: node scripts/apply-migration.mjs <path-to-sql-file>");
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, "utf-8");
  console.log(`Applying migration: ${sqlFile}`);
  console.log(`SQL length: ${sql.length} chars`);

  // Execute each statement separately
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    console.log(`  Executing: ${stmt.substring(0, 80)}...`);
    const { error } = await db.rpc("exec_sql", { sql_text: stmt + ";" }).maybeSingle();
    if (error) {
      // Try via REST SQL endpoint instead
      const res = await fetch(`${NEW_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": NEW_KEY,
          "Authorization": `Bearer ${NEW_KEY}`,
        },
        body: JSON.stringify({ sql_text: stmt + ";" }),
      });
      if (!res.ok) {
        console.log(`  ⚠️ RPC not available, trying direct column check...`);
      }
    }
  }

  // Verify columns exist
  const { data, error } = await db
    .from("documents")
    .select("payment_received, payment_received_amount, payment_received_date")
    .limit(1);

  if (error) {
    console.log(`\n⚠️ Migration may need to be applied manually.`);
    console.log(`Go to Supabase Dashboard → SQL Editor and run:\n`);
    console.log(sql);
  } else {
    console.log(`\n✅ Migration verified — payment tracking columns exist`);
  }
}

main().catch(console.error);
