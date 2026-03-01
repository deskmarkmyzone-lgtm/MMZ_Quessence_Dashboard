import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Building2, MapPin, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const COMMUNITY_TYPE_LABELS: Record<string, string> = {
  gated_community: "Gated Community",
  apartment_complex: "Apartment Complex",
  villa_project: "Villa Project",
  other: "Other",
};

export default async function CommunitiesPage() {
  const supabase = createClient();

  // Get communities
  const { data: communities } = await supabase
    .from("communities")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Get flat stats per community
  const { data: flats } = await supabase
    .from("flats")
    .select("id, community_id, status, owner_id")
    .eq("is_active", true);

  // Compute stats per community
  const statsMap = new Map<string, { managed: number; occupied: number; vacant: number; owners: Set<string> }>();
  for (const flat of flats ?? []) {
    if (!statsMap.has(flat.community_id)) {
      statsMap.set(flat.community_id, { managed: 0, occupied: 0, vacant: 0, owners: new Set() });
    }
    const s = statsMap.get(flat.community_id)!;
    s.managed++;
    if (flat.status === "occupied") s.occupied++;
    if (flat.status === "vacant") s.vacant++;
    s.owners.add(flat.owner_id);
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Communities"
        description="Manage your property communities"
        actionLabel="Add Community"
        actionHref="/pm/communities/new/edit"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(communities ?? []).map((community) => {
          const stats = statsMap.get(community.id) ?? { managed: 0, occupied: 0, vacant: 0, owners: new Set() };
          return (
            <Link key={community.id} href={`/pm/communities/${community.id}`}>
              <div className="bg-bg-card border border-border-primary rounded-lg p-5 hover:border-accent/50 hover:shadow-card-hover transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-accent/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-body text-text-primary font-semibold group-hover:text-accent transition-colors">
                        {community.name}
                      </h3>
                      <div className="flex items-center gap-1 text-caption text-text-muted">
                        <MapPin className="h-3 w-3" />
                        {community.city}, {community.state}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-caption text-text-secondary bg-bg-elevated px-2 py-0.5 rounded">
                    {COMMUNITY_TYPE_LABELS[community.community_type ?? ""] ?? "Other"}
                  </span>
                  <StatusBadge status={community.is_active ? "active" : "inactive"} />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border-primary">
                  <StatItem icon={Users} label="Owners" value={stats.owners.size} />
                  <StatItem icon={Building2} label="Flats" value={stats.managed} />
                  <StatItem label="Occupied" value={stats.occupied} color="text-success" />
                  <StatItem label="Vacant" value={stats.vacant} color="text-danger" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(!communities || communities.length === 0) && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-h3 text-text-primary mb-1">No communities yet</h3>
          <p className="text-body-sm text-text-secondary">Add your first community to get started.</p>
        </div>
      )}
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-body font-semibold ${color ?? "text-text-primary"}`}>
        {value}
      </div>
      <div className="text-[10px] text-text-muted flex items-center justify-center gap-0.5">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </div>
    </div>
  );
}
