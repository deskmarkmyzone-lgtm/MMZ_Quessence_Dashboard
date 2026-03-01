import { notFound } from "next/navigation";
import { Building2, MapPin, Phone, Mail, Users, Edit, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { getCommunityWithStats } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const COMMUNITY_TYPE_LABELS: Record<string, string> = {
  gated_community: "Gated Community",
  apartment_complex: "Apartment Complex",
  villa_project: "Villa Project",
  other: "Other",
};

export default async function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let community;
  try {
    community = await getCommunityWithStats(params.id);
  } catch {
    notFound();
  }

  // Fetch recent activity: rent payments + expenses for flats in this community
  const supabase = createClient();

  const { data: flatIds } = await supabase
    .from("flats")
    .select("id")
    .eq("community_id", params.id)
    .eq("is_active", true);

  const ids = (flatIds ?? []).map((f) => f.id);

  type ActivityItem = { type: string; description: string; date: string };
  const recentActivity: ActivityItem[] = [];

  if (ids.length > 0) {
    const [{ data: recentRents }, { data: recentExpenses }] = await Promise.all([
      supabase
        .from("rent_payments")
        .select("amount, payment_date, flat_id, flats!inner(flat_number)")
        .in("flat_id", ids)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("expenses")
        .select("amount, expense_date, category, flat_id, flats!inner(flat_number)")
        .in("flat_id", ids)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    for (const r of recentRents ?? []) {
      const flatNo = (r as any).flats?.flat_number ?? "?";
      recentActivity.push({
        type: "rent",
        description: `Rent ₹${Number(r.amount).toLocaleString("en-IN")} recorded for Flat ${flatNo}`,
        date: r.payment_date,
      });
    }
    for (const e of recentExpenses ?? []) {
      const flatNo = (e as any).flats?.flat_number ?? "?";
      recentActivity.push({
        type: "expense",
        description: `${String(e.category).replace(/_/g, " ")} expense ₹${Number(e.amount).toLocaleString("en-IN")} for Flat ${flatNo}`,
        date: e.expense_date,
      });
    }
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    recentActivity.splice(8); // Keep top 8
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pm/communities">
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
            <h2 className="text-h2 text-text-primary">{community.name}</h2>
            <StatusBadge status={community.is_active ? "active" : "inactive"} />
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            {community.city}, {community.state}
          </p>
        </div>
        <Link href={`/pm/communities/${params.id}/edit`}>
          <Button className="bg-accent hover:bg-accent-light text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Community
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Community Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow
                icon={Building2}
                label="Type"
                value={COMMUNITY_TYPE_LABELS[community.community_type ?? ""] ?? "Not specified"}
              />
              <InfoRow
                icon={Users}
                label="Total Units"
                value={community.total_units?.toLocaleString("en-IN") ?? "Not specified"}
              />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={community.address ?? "Not specified"}
              />
              <InfoRow
                icon={Building2}
                label="Pincode"
                value={community.pincode ?? "Not specified"}
              />
              <InfoRow
                icon={Building2}
                label="Association"
                value={community.association_name ?? "Not specified"}
              />
            </div>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow
                icon={Users}
                label="Name"
                value={community.contact_person_name ?? "Not specified"}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={community.contact_person_phone ?? "Not specified"}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={community.contact_person_email ?? "Not specified"}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <StatRow label="Owners" value={String(community.stats.uniqueOwners)} />
              <StatRow label="Managed Flats" value={String(community.stats.totalFlats)} />
              <StatRow label="Occupied" value={String(community.stats.occupiedFlats)} />
              <StatRow label="Vacant" value={String(community.stats.vacantFlats)} />
            </div>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-body-sm text-text-muted">
                No recent activity to show.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      item.type === "rent" ? "bg-success" : "bg-warning"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-caption text-text-primary leading-snug">{item.description}</p>
                      <p className="text-caption text-text-muted mt-0.5">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <span className="text-body text-text-primary font-semibold">{value}</span>
    </div>
  );
}
