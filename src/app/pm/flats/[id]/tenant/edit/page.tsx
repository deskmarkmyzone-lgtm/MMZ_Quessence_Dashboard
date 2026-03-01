import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { TenantForm } from "@/components/forms/tenant-form";

export default async function EditTenantPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { past?: string };
}) {
  const supabase = createClient();
  const isPastTenant = searchParams.past === "true";

  // Fetch the flat
  const { data: flat, error: flatError } = await supabase
    .from("flats")
    .select("flat_number")
    .eq("id", params.id)
    .single();

  if (flatError || !flat) {
    notFound();
  }

  // Only fetch existing active tenant if NOT adding a past tenant
  let tenant = null;
  if (!isPastTenant) {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("flat_id", params.id)
      .eq("is_active", true)
      .maybeSingle();
    tenant = data;
  }

  const isEditing = !!tenant;

  const title = isPastTenant
    ? "Add Past Tenant"
    : isEditing
      ? "Edit Tenant"
      : "Add Tenant";

  const description = isPastTenant
    ? `Record a past tenant for Flat ${flat.flat_number}`
    : isEditing
      ? `Editing tenant for Flat ${flat.flat_number}`
      : `Add a tenant to Flat ${flat.flat_number}`;

  return (
    <div className="w-full">
      <PageHeader title={title} description={description} backHref={`/pm/flats/${params.id}`} />
      <TenantForm
        flatId={params.id}
        tenant={tenant ?? undefined}
        isPastTenant={isPastTenant}
      />
    </div>
  );
}
