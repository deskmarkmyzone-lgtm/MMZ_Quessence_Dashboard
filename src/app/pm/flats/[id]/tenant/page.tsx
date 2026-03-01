import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TenantDetailContent } from "./tenant-detail-content";
import { PastTenantsSection } from "./past-tenants-section";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserPlus, History } from "lucide-react";
import Link from "next/link";

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Fetch the flat for context
  const { data: flat, error: flatError } = await supabase
    .from("flats")
    .select("flat_number")
    .eq("id", params.id)
    .single();

  if (flatError || !flat) {
    notFound();
  }

  // Fetch the active tenant for this flat
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("flat_id", params.id)
    .eq("is_active", true)
    .maybeSingle();

  // Fetch past tenants for this flat
  const { data: pastTenants } = await supabase
    .from("tenants")
    .select("*")
    .eq("flat_id", params.id)
    .eq("is_active", false)
    .order("exit_date", { ascending: false });

  // If no active tenant, show empty state
  if (!tenant) {
    return (
      <div className="w-full">
        <PageHeader
          title={`Flat ${flat.flat_number}`}
          description="No active tenant"
          backHref={`/pm/flats/${params.id}`}
        />
        <div className="bg-bg-card border border-border-primary rounded-lg p-12 text-center">
          <UserPlus className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-h3 text-text-primary mb-2">No Active Tenant</h3>
          <p className="text-body-sm text-text-secondary mb-6">
            This flat currently has no active tenant assigned.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href={`/pm/flats/${params.id}/tenant/edit`}>
              <Button className="bg-accent hover:bg-accent-light text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </Link>
            <Link href={`/pm/flats/${params.id}/tenant/edit?past=true`}>
              <Button variant="outline" className="border-border-primary text-text-secondary">
                <History className="h-4 w-4 mr-2" />
                Add Past Tenant
              </Button>
            </Link>
          </div>
        </div>

        {/* Past Tenants Section */}
        {pastTenants && pastTenants.length > 0 && (
          <PastTenantsSection pastTenants={pastTenants} flatId={params.id} />
        )}
      </div>
    );
  }

  // Build agreement file URL if tenant has one
  let agreementUrl: string | null = null;
  if (tenant.agreement_file_id) {
    // If the stored value is already a full URL (e.g. migrated data), use it directly
    agreementUrl = tenant.agreement_file_id.startsWith("http")
      ? tenant.agreement_file_id
      : supabase.storage.from("mmz-files").getPublicUrl(tenant.agreement_file_id).data.publicUrl;
  }

  return (
    <TenantDetailContent
      tenant={tenant}
      flatId={params.id}
      flatNumber={flat.flat_number}
      agreementUrl={agreementUrl}
      pastTenants={pastTenants ?? []}
    />
  );
}
