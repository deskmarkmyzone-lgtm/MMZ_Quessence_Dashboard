"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Building2, IndianRupee, FileText, Clock, Wrench, CheckCircle2, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistedView } from "@/lib/hooks/use-persisted-view";

interface OwnerFlat {
  id: string;
  flat_number: string;
  community: string;
  bhk: string;
  sqft: number;
  status: "occupied" | "vacant" | "under_maintenance";
  tenant_type: "family" | "bachelor" | null;
  tenant_name: string | null;
  rent: number;
  rent_status: "paid" | "unpaid";
  rent_month: string;
}

interface ActivityItem {
  id: string;
  message: string;
  date: string;
  type: "rent" | "expense" | "document";
}

interface DashboardContentProps {
  ownerName: string;
  flats: OwnerFlat[];
  recentActivity: ActivityItem[];
  unreadNotificationCount: number;
}

const ACTIVITY_CONFIG = {
  rent: { icon: IndianRupee, color: "text-success", bg: "bg-success/10" },
  expense: { icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
  document: { icon: FileText, color: "text-accent", bg: "bg-accent/10" },
};

export function DashboardContent({
  ownerName,
  flats,
  recentActivity,
}: DashboardContentProps) {
  const totalRent = flats.reduce((s, f) => s + f.rent, 0);
  const paidFlats = flats.filter((f) => f.rent_status === "paid").length;
  const unpaidFlats = flats.filter((f) => f.rent_status === "unpaid").length;
  const [viewMode, setViewMode] = usePersistedView("owner-dashboard", "card");

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-h2 text-text-primary">Hello, {ownerName}</h2>
        <p className="text-body text-text-secondary mt-1">
          {flats.length} properties · {paidFlats} paid ·{" "}
          {unpaidFlats > 0
            ? `${unpaidFlats} unpaid`
            : "all up to date"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-bg-card border border-border-primary rounded-lg p-4">
          <Building2 className="h-5 w-5 text-text-muted mb-2" />
          <p className="text-h3 text-text-primary font-bold">{flats.length}</p>
          <p className="text-caption text-text-muted">Total Flats</p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-lg p-4">
          <IndianRupee className="h-5 w-5 text-text-muted mb-2" />
          <p className="text-h3 text-text-primary font-bold">
            {totalRent >= 1000 ? `₹${(totalRent / 1000).toFixed(0)}K` : `₹${totalRent}`}
          </p>
          <p className="text-caption text-text-muted">Monthly Rent</p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-lg p-4">
          <CheckCircle2 className="h-5 w-5 text-success mb-2" />
          <p className="text-h3 text-success font-bold">{paidFlats}</p>
          <p className="text-caption text-text-muted">Paid</p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-lg p-4">
          <Clock className="h-5 w-5 text-danger mb-2" />
          <p className="text-h3 text-danger font-bold">{unpaidFlats}</p>
          <p className="text-caption text-text-muted">Unpaid</p>
        </div>
      </div>

      {/* Property Cards / Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-h3 text-text-primary">Your Properties</h3>
          <div className="flex items-center gap-1 bg-bg-card border border-border-primary rounded-md p-0.5">
            <button
              type="button"
              className={`h-7 w-7 inline-flex items-center justify-center rounded transition-colors ${
                viewMode === "card"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
              onClick={() => setViewMode("card")}
              aria-label="Card view"
              aria-pressed={viewMode === "card"}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`h-7 w-7 inline-flex items-center justify-center rounded transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flats.map((flat) => (
              <Link
                key={flat.id}
                href={`/owner/flats/${flat.id}`}
                className="bg-bg-card border border-border-primary rounded-lg p-5 hover:border-accent/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body text-text-primary font-mono font-bold">
                        {flat.flat_number}
                      </span>
                      <StatusBadge status={flat.status} />
                      {flat.tenant_type && <StatusBadge status={flat.tenant_type} />}
                    </div>
                    <p className="text-caption text-text-secondary mt-1 truncate">
                      {flat.community}
                    </p>
                  </div>
                  <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-muted shrink-0 whitespace-nowrap">
                    {flat.bhk} · {flat.sqft.toLocaleString("en-IN")} sqft
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-border-primary">
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-text-muted">Tenant</p>
                    <p className="text-body-sm text-text-primary truncate">
                      {flat.tenant_name ?? "Vacant"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-caption text-text-muted">
                      Rent · {flat.rent_month}
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-body-sm text-text-primary font-medium">
                        ₹{flat.rent.toLocaleString("en-IN")}
                      </span>
                      <StatusBadge status={flat.rent_status} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Flat</th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Community</th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Tenant</th>
                  <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Rent</th>
                  <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Status</th>
                  <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {flats.map((flat) => (
                  <Link key={flat.id} href={`/owner/flats/${flat.id}`} className="contents">
                    <tr className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-body-sm text-text-primary font-mono font-semibold">
                            {flat.flat_number}
                          </span>
                          <span className="text-caption text-text-muted ml-2">{flat.bhk}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-text-secondary truncate max-w-[160px]">
                        {flat.community}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm text-text-primary">
                            {flat.tenant_name ?? "Vacant"}
                          </span>
                          {flat.tenant_type && <StatusBadge status={flat.tenant_type} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">
                        ₹{flat.rent.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={flat.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={flat.rent_status} />
                      </td>
                    </tr>
                  </Link>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h3 className="text-h3 text-text-primary mb-3">Recent Activity</h3>
          <div className="bg-bg-card border border-border-primary rounded-lg divide-y divide-border-primary">
            {recentActivity.map((activity) => {
              const config = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.rent;
              const Icon = config.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-4"
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-text-primary truncate">
                      {activity.message}
                    </p>
                  </div>
                  <span className="text-caption text-text-muted shrink-0">
                    {activity.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
