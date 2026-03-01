import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TenantExitContent } from "./tenant-exit-content";

async function TenantExitLoader({ flatId }: { flatId: string }) {
  const supabase = createClient();

  // Fetch flat info
  const { data: flatData, error: flatError } = await supabase
    .from("flats")
    .select("id, flat_number, owner_id")
    .eq("id", flatId)
    .single();

  if (flatError || !flatData) {
    notFound();
  }

  // Fetch active tenant for this flat
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, phone, lease_start_date, lease_end_date, security_deposit, monthly_rent, monthly_inclusive_rent")
    .eq("flat_id", flatId)
    .eq("is_active", true)
    .single();

  if (tenantError || !tenantData) {
    notFound();
  }

  // Fetch owner name for PDF
  const { data: ownerData } = await supabase
    .from("owners")
    .select("name")
    .eq("id", flatData.owner_id)
    .single();

  return (
    <TenantExitContent
      tenant={{
        id: tenantData.id,
        name: tenantData.name,
        lease_start_date: tenantData.lease_start_date,
        lease_end_date: tenantData.lease_end_date,
        security_deposit: tenantData.security_deposit ?? 0,
        monthly_rent: tenantData.monthly_rent,
        monthly_inclusive_rent: tenantData.monthly_inclusive_rent,
      }}
      flat={{
        id: flatData.id,
        flat_number: flatData.flat_number,
        owner_id: flatData.owner_id,
        owner_name: ownerData?.name ?? "Owner",
      }}
    />
  );
}

export default async function TenantExitPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-bg-elevated rounded animate-pulse mb-6" />
          <div className="h-4 w-64 bg-bg-elevated rounded animate-pulse mb-8" />
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <div className="h-6 w-40 bg-bg-elevated rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-bg-elevated rounded animate-pulse" />
              <div className="h-12 bg-bg-elevated rounded animate-pulse" />
              <div className="h-12 bg-bg-elevated rounded animate-pulse" />
              <div className="h-12 bg-bg-elevated rounded animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <TenantExitLoader flatId={params.id} />
    </Suspense>
  );
}
