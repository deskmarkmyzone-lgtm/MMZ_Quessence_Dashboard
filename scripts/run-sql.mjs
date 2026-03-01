#!/usr/bin/env node
/**
 * Run raw SQL on Supabase using the pg module via connection string
 * Falls back to management API
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const NEW_URL = "https://xzhsckwdcmkwaqmezjud.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHNja3dkY21rd2FxbWV6anVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNDYxMCwiZXhwIjoyMDg3ODgwNjEwfQ.48mqrzQzBJnLMVRdBdJfc8eHu4V5GuSUmkhMejRMUsc";

const db = createClient(NEW_URL, NEW_KEY);

async function main() {
  // Just verify the columns by trying to select them
  // If they fail, we'll know they need to be added manually

  console.log("Checking if payment_received column exists...");
  const { data, error } = await db
    .from("documents")
    .select("id, payment_received")
    .limit(1);

  if (error && error.message.includes("payment_received")) {
    console.log("❌ Column does not exist. Migration needed.");
    console.log("\nPlease go to your Supabase Dashboard:");
    console.log("  https://supabase.com/dashboard/project/xzhsckwdcmkwaqmezjud/sql");
    console.log("\nAnd run this SQL:\n");
    console.log(fs.readFileSync("supabase/migrations/010_owner_payment_tracking.sql", "utf-8"));
  } else if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("✅ payment_received column already exists!");
    console.log("Sample:", data);
  }
}

main().catch(console.error);
