import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { FlatForm } from "@/components/forms/flat-form";

export default async function EditFlatPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Fetch flat by id
  const { data: flat, error } = await supabase
    .from("flats")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !flat) {
    notFound();
  }

  // Fetch communities list
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Fetch owners list
  const { data: owners } = await supabase
    .from("owners")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Fetch maintenance rate from settings
  const { data: settings } = await supabase
    .from("mmz_settings")
    .select("maintenance_rate_per_sqft")
    .limit(1)
    .maybeSingle();

  const maintenanceRate = settings?.maintenance_rate_per_sqft ?? undefined;

  return (
    <div className="w-full">
      <PageHeader
        title="Edit Flat"
        description={`Editing Flat ${flat.flat_number}`}
        backHref={`/pm/flats/${params.id}`}
      />
      <FlatForm
        flat={flat}
        communities={communities ?? []}
        owners={owners ?? []}
        maintenanceRate={maintenanceRate}
      />
    </div>
  );
}
