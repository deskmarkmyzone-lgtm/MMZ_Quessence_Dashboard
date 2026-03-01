"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { FlatCard } from "@/components/flat/flat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePersistedView } from "@/lib/hooks/use-persisted-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { ExportButtons } from "@/components/shared/export-buttons";
import { exportToExcel } from "@/lib/excel/export";

interface FlatItem {
  id: string;
  flat_number: string;
  bhk_type: string;
  carpet_area_sft: number | null;
  base_rent: number;
  maintenance_amount: number;
  inclusive_rent: number;
  status: "occupied" | "vacant" | "under_maintenance";
  tenant_name: string | null;
  tenant_type: string | null;
  owner_name: string;
  community_name: string;
  rent_due_day: number;
}

interface FlatsContentProps {
  flats: FlatItem[];
  communities: { id: string; name: string }[];
  owners: { id: string; name: string }[];
}

export function FlatsContent({ flats, communities, owners }: FlatsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = usePersistedView(
    "flats",
    (searchParams.get("view") as "card" | "list") || "card"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [bhkFilter, setBhkFilter] = useState(searchParams.get("bhk") || "all");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("owner") || "all");
  const [communityFilter, setCommunityFilter] = useState(searchParams.get("community") || "all");
  const [tenantTypeFilter, setTenantTypeFilter] = useState(searchParams.get("type") || "all");
  const [rentMin, setRentMin] = useState(searchParams.get("rent_min") || "");
  const [rentMax, setRentMax] = useState(searchParams.get("rent_max") || "");
  const [showFilters, setShowFilters] = useState(false);

  const BHK_OPTIONS = Array.from(new Set(flats.map((f) => f.bhk_type))).sort();

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/flats?${params.toString()}`, { scroll: false });
  };

  const filteredFlats = flats.filter((flat) => {
    const matchesSearch =
      !search ||
      flat.flat_number.includes(search) ||
      flat.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
      flat.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || flat.status === statusFilter;
    const matchesBhk = bhkFilter === "all" || flat.bhk_type === bhkFilter;
    const matchesOwner = ownerFilter === "all" || flat.owner_name === ownerFilter;
    const matchesCommunity = communityFilter === "all" || flat.community_name === communityFilter;
    const matchesTenantType = tenantTypeFilter === "all" || flat.tenant_type === tenantTypeFilter;
    const matchesRentMin = !rentMin || flat.inclusive_rent >= Number(rentMin);
    const matchesRentMax = !rentMax || flat.inclusive_rent <= Number(rentMax);
    return matchesSearch && matchesStatus && matchesBhk && matchesOwner && matchesCommunity && matchesTenantType && matchesRentMin && matchesRentMax;
  });

  const activeFilterCount = [statusFilter, bhkFilter, ownerFilter, communityFilter, tenantTypeFilter].filter(
    (f) => f !== "all"
  ).length + (rentMin ? 1 : 0) + (rentMax ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter("all");
    setBhkFilter("all");
    setOwnerFilter("all");
    setCommunityFilter("all");
    setTenantTypeFilter("all");
    setRentMin("");
    setRentMax("");
    setSearch("");
    router.replace("/pm/flats", { scroll: false });
  };

  const occupied = flats.filter((f) => f.status === "occupied").length;
  const vacant = flats.filter((f) => f.status === "vacant").length;

  return (
    <div className="w-full">
      <PageHeader
        title="Flats"
        description={`${flats.length} flats · ${occupied} occupied · ${vacant} vacant`}
        actionLabel="Add Flat"
        actionHref="/pm/flats/new/edit"
      />

      {/* Primary Filters Bar */}
      <div className="space-y-3 mb-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateURL({ q: e.target.value });
            }}
            placeholder="Search flats, tenants, owners..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              updateURL({ status: v });
            }}
          >
            <SelectTrigger className="w-[140px] bg-bg-card border-border-primary">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="under_maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-1.5 ${showFilters || activeFilterCount > 0 ? "border-accent text-accent" : ""}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <ExportButtons
            onExportExcel={() => {
              exportToExcel(filteredFlats, [
                { key: "flat_number", label: "Flat No" },
                { key: "bhk_type", label: "BHK" },
                { key: "carpet_area_sft", label: "Area (SFT)", format: (v) => v as number },
                { key: "tenant_name", label: "Tenant", format: (v) => (v as string) ?? "Vacant" },
                { key: "owner_name", label: "Owner" },
                { key: "base_rent", label: "Base Rent", format: (v) => v as number },
                { key: "maintenance_amount", label: "Maintenance", format: (v) => v as number },
                { key: "inclusive_rent", label: "Inclusive Rent", format: (v) => v as number },
                { key: "status", label: "Status" },
              ], { filename: "flats", sheetName: "Flats" });
            }}
          />
          <div className="flex items-center gap-1 bg-bg-card border border-border-primary rounded-md p-0.5 ml-auto">
            <button
              type="button"
              className={`h-7 w-7 inline-flex items-center justify-center rounded transition-colors ${
                viewMode === "card"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
              onClick={() => {
                setViewMode("card");
                updateURL({ view: "card" });
              }}
              aria-label="Grid view"
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
              onClick={() => {
                setViewMode("list");
                updateURL({ view: "list" });
              }}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-caption text-text-muted font-medium">Advanced Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-caption text-accent hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-caption text-text-muted mb-1 block">BHK Type</label>
              <Select value={bhkFilter} onValueChange={(v) => { setBhkFilter(v); updateURL({ bhk: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All BHK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All BHK</SelectItem>
                  {BHK_OPTIONS.map((bhk) => (
                    <SelectItem key={bhk} value={bhk}>{bhk} BHK</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Owner</label>
              <Select value={ownerFilter} onValueChange={(v) => { setOwnerFilter(v); updateURL({ owner: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.name}>{owner.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Community</label>
              <Select value={communityFilter} onValueChange={(v) => { setCommunityFilter(v); updateURL({ community: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Communities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Tenant Type</label>
              <Select value={tenantTypeFilter} onValueChange={(v) => { setTenantTypeFilter(v); updateURL({ type: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="bachelor">Bachelor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Min Rent (₹)</label>
              <Input
                type="number"
                value={rentMin}
                onChange={(e) => { setRentMin(e.target.value); updateURL({ rent_min: e.target.value }); }}
                placeholder="0"
                className="bg-bg-page border-border-primary h-9"
              />
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Max Rent (₹)</label>
              <Input
                type="number"
                value={rentMax}
                onChange={(e) => { setRentMax(e.target.value); updateURL({ rent_max: e.target.value }); }}
                placeholder="No limit"
                className="bg-bg-page border-border-primary h-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilter !== "all" && (
            <FilterChip label={`Status: ${statusFilter}`} onRemove={() => { setStatusFilter("all"); updateURL({ status: "all" }); }} />
          )}
          {bhkFilter !== "all" && (
            <FilterChip label={`BHK: ${bhkFilter}`} onRemove={() => { setBhkFilter("all"); updateURL({ bhk: "all" }); }} />
          )}
          {ownerFilter !== "all" && (
            <FilterChip label={`Owner: ${ownerFilter}`} onRemove={() => { setOwnerFilter("all"); updateURL({ owner: "all" }); }} />
          )}
          {communityFilter !== "all" && (
            <FilterChip label={`Community: ${communityFilter}`} onRemove={() => { setCommunityFilter("all"); updateURL({ community: "all" }); }} />
          )}
          {tenantTypeFilter !== "all" && (
            <FilterChip label={`Type: ${tenantTypeFilter}`} onRemove={() => { setTenantTypeFilter("all"); updateURL({ type: "all" }); }} />
          )}
          {rentMin && (
            <FilterChip label={`Min ₹${Number(rentMin).toLocaleString("en-IN")}`} onRemove={() => { setRentMin(""); updateURL({ rent_min: "" }); }} />
          )}
          {rentMax && (
            <FilterChip label={`Max ₹${Number(rentMax).toLocaleString("en-IN")}`} onRemove={() => { setRentMax(""); updateURL({ rent_max: "" }); }} />
          )}
        </div>
      )}

      {(search || activeFilterCount > 0) && (
        <p className="text-caption text-text-muted mb-3">
          Showing {filteredFlats.length} of {flats.length} flats
        </p>
      )}

      {/* Content */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFlats.map((flat) => (
            <FlatCard key={flat.id} flat={flat} />
          ))}
        </div>
      ) : (
        <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Flat</th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">BHK</th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Tenant</th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Owner</th>
                <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Rent</th>
                <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlats.map((flat) => (
                <Link key={flat.id} href={`/pm/flats/${flat.id}`} className="contents">
                  <tr className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <span className="text-body-sm text-text-primary font-mono font-semibold">{flat.flat_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-body-sm text-text-secondary">{flat.bhk_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-body-sm text-text-primary">{flat.tenant_name ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-body-sm text-text-secondary">{flat.owner_name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-body-sm text-text-primary font-medium">₹{flat.inclusive_rent.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={flat.status} />
                    </td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredFlats.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body text-text-muted">No flats match your filters.</p>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-accent text-body-sm hover:underline mt-2">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-caption px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:bg-accent/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
