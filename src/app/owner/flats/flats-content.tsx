"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePersistedView } from "@/lib/hooks/use-persisted-view";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List, Home } from "lucide-react";

interface OwnerFlat {
  id: string;
  flat_number: string;
  bhk: string;
  sqft: number;
  status: "occupied" | "vacant" | "under_maintenance";
  tenant_name: string | null;
  tenant_type: "family" | "bachelor" | null;
  rent: number;
}

interface FlatsContentProps {
  flats: OwnerFlat[];
  communityNames: string[];
}

export function FlatsContent({ flats, communityNames }: FlatsContentProps) {
  const communityLabel =
    communityNames.length === 1
      ? communityNames[0]
      : `${communityNames.length} communities`;

  const [viewMode, setViewMode] = usePersistedView("owner-flats", "card");
  const [search, setSearch] = useState("");

  const filtered = flats.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.flat_number.toLowerCase().includes(q) ||
      f.tenant_name?.toLowerCase().includes(q) ||
      f.bhk.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-text-primary">Your Properties</h2>
        <p className="text-body text-text-secondary mt-1">
          {flats.length} flats across {communityLabel}
        </p>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flats..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-bg-card border border-border-primary rounded-md p-0.5 ml-auto">
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

      {search && (
        <p className="text-caption text-text-muted">
          Showing {filtered.length} of {flats.length} flats
        </p>
      )}

      {/* Card View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((flat) => (
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
                </div>
                <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-muted shrink-0">
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
                  <p className="text-caption text-text-muted">Rent</p>
                  <p className="text-body-sm text-text-primary font-medium">
                    ₹{flat.rent.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Flat
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Type
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Tenant
                </th>
                <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                  Rent
                </th>
                <th className="text-center text-caption text-text-muted font-medium px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((flat) => (
                <tr
                  key={flat.id}
                  className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/owner/flats/${flat.id}`}
                      className="hover:text-accent transition-colors"
                    >
                      <span className="text-body-sm text-text-primary font-mono font-semibold">
                        {flat.flat_number}
                      </span>
                      <span className="text-caption text-text-muted ml-2">
                        {flat.bhk}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {flat.tenant_type ? (
                      <StatusBadge status={flat.tenant_type} />
                    ) : (
                      <span className="text-caption text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-primary">
                    {flat.tenant_name ?? "Vacant"}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">
                    ₹{flat.rent.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={flat.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-bg-card border border-border-primary rounded-lg">
          <Home className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-body-sm text-text-secondary">
            {search ? "No flats match your search" : "No properties found"}
          </p>
        </div>
      )}
    </div>
  );
}
