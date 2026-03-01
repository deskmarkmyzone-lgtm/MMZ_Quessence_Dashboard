import { createClient } from "@/lib/supabase/server";
import { ImportContent } from "./import-content";

export default async function ImportPage() {
  const supabase = createClient();

  // Fetch communities and owners for flat imports
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const { data: owners } = await supabase
    .from("owners")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return <ImportContent communities={communities ?? []} owners={owners ?? []} />;
}
