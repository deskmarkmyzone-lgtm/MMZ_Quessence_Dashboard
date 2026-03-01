import { notFound } from "next/navigation";
import {
  MapPin, Phone, Mail, Users, Edit, ArrowLeft,
  IndianRupee, FileText, Calendar, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { getOwnerById } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "./onboarding-card";
import type { Owner } from "@/types";

export default async function OwnerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let owner: Owner;
  try {
    const data = await getOwnerById(params.id);
    if (!data) notFound();
    owner = data;
  } catch {
    notFound();
  }

  // Fetch flats for this owner with community and tenant info
  const supabase = createClient();
  const { data: flats } = await supabase
    .from("flats")
    .select("*, community:communities(name), tenant:tenants(name, tenant_type)")
    .eq("owner_id", params.id)
    .eq("is_active", true)
    .eq("tenant.is_active", true);

  const ownerFlats = (flats ?? []).map((flat) => ({
    id: flat.id,
    flat_number: flat.flat_number,
    bhk_type: flat.bhk_type,
    status: flat.status as "occupied" | "vacant" | "under_maintenance",
    tenant: Array.isArray(flat.tenant) ? flat.tenant[0]?.name ?? null : flat.tenant?.name ?? null,
    rent: flat.inclusive_rent ?? flat.base_rent ?? 0,
    community_name: Array.isArray(flat.community) ? flat.community[0]?.name ?? null : flat.community?.name ?? null,
  }));

  // Fetch recent documents for this owner
  const { data: recentDocs } = await supabase
    .from("documents")
    .select("id, document_type, document_number, status, grand_total, created_at")
    .eq("owner_id", params.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const totalRent = ownerFlats.reduce((sum, f) => sum + f.rent, 0);
  const occupiedCount = ownerFlats.filter((f) => f.status === "occupied").length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pm/owners">
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-h2 text-text-primary">{owner.name}</h2>
            <StatusBadge status={owner.onboarding_completed ? "active" : "pending"} />
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            {owner.email} &middot; {owner.phone}
          </p>
        </div>
        <Link href={`/pm/owners/${params.id}/edit`}>
          <Button className="bg-accent hover:bg-accent-light text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Owner
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Owner Details */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Owner Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={Mail} label="Email" value={owner.email} />
              <InfoRow icon={Phone} label="Phone" value={owner.phone ?? "Not specified"} />
              <InfoRow icon={MapPin} label="Address" value={owner.address ?? "Not specified"} />
              <InfoRow icon={FileText} label="PAN" value={owner.pan_number ?? "Not specified"} />
              <InfoRow
                icon={IndianRupee}
                label="Brokerage"
                value={
                  owner.brokerage_calc_method === "days_of_rent"
                    ? `${owner.brokerage_days} days of rent`
                    : owner.brokerage_calc_method === "percentage"
                      ? `${owner.brokerage_percentage}% of rent`
                      : owner.brokerage_fixed_amount
                        ? `Rs. ${owner.brokerage_fixed_amount.toLocaleString("en-IN")} fixed`
                        : "Not configured"
                }
              />
              <InfoRow icon={Shield} label="GST" value={owner.gst_applicable ? `Yes (${owner.gst_number})` : "Not applicable"} />
              <InfoRow icon={Users} label="Family Group" value={owner.family_group_name ?? "Individual"} />
              <InfoRow icon={Calendar} label="Communication" value={owner.communication_pref === "both" ? "WhatsApp & Email" : owner.communication_pref} />
            </div>
          </div>

          {/* Flats */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h3 text-text-primary">Flats ({ownerFlats.length})</h3>
              <Link href="/pm/flats">
                <Button variant="outline" size="sm" className="border-border-primary text-text-secondary">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-2">
              {ownerFlats.map((flat) => (
                <Link key={flat.id} href={`/pm/flats/${flat.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-bg-elevated flex items-center justify-center">
                        <span className="text-caption text-text-primary font-mono font-semibold">
                          {flat.flat_number}
                        </span>
                      </div>
                      <div>
                        <span className="text-body-sm text-text-primary">
                          Flat {flat.flat_number}
                        </span>
                        <span className="text-caption text-text-muted ml-2">
                          {flat.bhk_type} BHK
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {flat.tenant && (
                        <span className="text-caption text-text-secondary">
                          {flat.tenant}
                        </span>
                      )}
                      <span className="text-body-sm text-text-primary font-medium">
                        ₹{flat.rent.toLocaleString("en-IN")}
                      </span>
                      <StatusBadge status={flat.status} />
                    </div>
                  </div>
                </Link>
              ))}
              {ownerFlats.length === 0 && (
                <p className="text-body-sm text-text-muted py-4 text-center">
                  No flats assigned to this owner yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Portfolio Summary</h3>
            <div className="space-y-4">
              <StatRow label="Total Flats" value={ownerFlats.length.toString()} />
              <StatRow label="Occupied" value={occupiedCount.toString()} color="text-success" />
              <StatRow label="Vacant" value={(ownerFlats.length - occupiedCount).toString()} color="text-danger" />
              <div className="pt-2 border-t border-border-primary">
                <StatRow
                  label="Monthly Rent"
                  value={`₹${totalRent.toLocaleString("en-IN")}`}
                  color="text-accent"
                />
              </div>
            </div>
          </div>

          {/* Owner Onboarding */}
          <OnboardingCard
            ownerId={params.id}
            ownerName={owner.name}
            existingToken={owner.onboarding_token ?? null}
            isOnboarded={owner.onboarding_completed ?? false}
            appUrl={appUrl}
          />

          {/* Recent Documents */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h3 text-text-primary">Recent Documents</h3>
              <Link href={`/pm/documents?owner=${params.id}`}>
                <Button variant="ghost" size="sm" className="text-caption text-text-muted">
                  View All
                </Button>
              </Link>
            </div>
            {recentDocs && recentDocs.length > 0 ? (
              <div className="space-y-2">
                {recentDocs.map((d) => (
                  <Link key={d.id} href={`/pm/documents/${d.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-hover transition-colors">
                      <div>
                        <p className="text-caption text-text-primary font-medium">
                          {d.document_number ?? "Draft"}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {d.document_type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={d.status === "pending_approval" ? "pending" : d.status} />
                        {d.grand_total != null && (
                          <p className="text-caption text-text-secondary mt-0.5">
                            ₹{d.grand_total.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-text-muted">
                No documents generated yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-text-muted mt-0.5" />
      <div>
        <p className="text-caption text-text-muted">{label}</p>
        <p className="text-body text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <span className={`text-body font-semibold ${color ?? "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
