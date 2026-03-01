"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Building2, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { ExportButtons } from "@/components/shared/export-buttons";
import { exportToExcel } from "@/lib/excel/export";

export interface OwnerListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  brokerage_calc_method: "days_of_rent" | "percentage" | "fixed_amount";
  brokerage_days: number;
  brokerage_percentage: number | null;
  onboarding_completed: boolean;
  flat_count: number;
  occupied: number;
  vacant: number;
  total_rent: number;
  community_names: string[];
}

interface OwnersContentProps {
  owners: OwnerListItem[];
  communities: { id: string; name: string }[];
}

export function OwnersContent({ owners, communities }: OwnersContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [onboardingFilter, setOnboardingFilter] = useState(searchParams.get("onboarding") || "all");
  const [vacancyFilter, setVacancyFilter] = useState(searchParams.get("vacancy") || "all");
  const [communityFilter, setCommunityFilter] = useState(searchParams.get("community") || "all");
  const [showFilters, setShowFilters] = useState(false);

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/owners?${params.toString()}`, { scroll: false });
  };

  const filteredOwners = owners.filter((o) => {
    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchesOnboarding =
      onboardingFilter === "all" ||
      (onboardingFilter === "completed" && o.onboarding_completed) ||
      (onboardingFilter === "pending" && !o.onboarding_completed);
    const matchesVacancy =
      vacancyFilter === "all" ||
      (vacancyFilter === "has_vacant" && o.vacant > 0) ||
      (vacancyFilter === "fully_occupied" && o.vacant === 0);
    const matchesCommunity =
      communityFilter === "all" || o.community_names.includes(communityFilter);
    return matchesSearch && matchesOnboarding && matchesVacancy && matchesCommunity;
  });

  const activeFilterCount = [onboardingFilter, vacancyFilter, communityFilter].filter(f => f !== "all").length;
  const totalFlats = filteredOwners.reduce((s, o) => s + o.flat_count, 0);
  const totalRent = filteredOwners.reduce((s, o) => s + o.total_rent, 0);

  const clearAllFilters = () => {
    setOnboardingFilter("all");
    setVacancyFilter("all");
    setCommunityFilter("all");
    setSearch("");
    router.replace("/pm/owners", { scroll: false });
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Owners"
        description={`${filteredOwners.length} owners · ${totalFlats} flats · ₹${totalRent.toLocaleString("en-IN")}/mo total rent`}
        actionLabel="Add Owner"
        actionHref="/pm/owners/new/edit"
      />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateURL({ q: e.target.value }); }}
            placeholder="Search by name or email..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-accent text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <ExportButtons
          onExportExcel={() => {
            exportToExcel(filteredOwners, [
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "flat_count", label: "Flats", format: (v) => v as number },
              { key: "occupied", label: "Occupied", format: (v) => v as number },
              { key: "vacant", label: "Vacant", format: (v) => v as number },
              { key: "total_rent", label: "Total Rent/Mo", format: (v) => v as number },
              { key: "brokerage_calc_method", label: "Brokerage Method" },
            ], { filename: "owners", sheetName: "Owners" });
          }}
        />
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-body-sm text-text-primary font-medium">Advanced Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-caption text-accent hover:underline">Clear all</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="text-caption text-text-muted mb-1 block">Onboarding Status</label>
              <Select value={onboardingFilter} onValueChange={(v) => { setOnboardingFilter(v); updateURL({ onboarding: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Onboarded</SelectItem>
                  <SelectItem value="pending">Pending Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Vacancy</label>
              <Select value={vacancyFilter} onValueChange={(v) => { setVacancyFilter(v); updateURL({ vacancy: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="has_vacant">Has Vacant Flats</SelectItem>
                  <SelectItem value="fully_occupied">Fully Occupied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {onboardingFilter !== "all" && (
            <FilterChip
              label={onboardingFilter === "completed" ? "Onboarded" : "Pending Onboarding"}
              onRemove={() => { setOnboardingFilter("all"); updateURL({ onboarding: "all" }); }}
            />
          )}
          {vacancyFilter !== "all" && (
            <FilterChip
              label={vacancyFilter === "has_vacant" ? "Has Vacant" : "Fully Occupied"}
              onRemove={() => { setVacancyFilter("all"); updateURL({ vacancy: "all" }); }}
            />
          )}
          {communityFilter !== "all" && (
            <FilterChip
              label={`Community: ${communityFilter}`}
              onRemove={() => { setCommunityFilter("all"); updateURL({ community: "all" }); }}
            />
          )}
        </div>
      )}

      {(search || activeFilterCount > 0) && (
        <p className="text-caption text-text-muted mb-3">
          Showing {filteredOwners.length} of {owners.length} owners
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOwners.map((owner) => (
          <Link key={owner.id} href={`/pm/owners/${owner.id}`}>
            <div className="bg-bg-card border border-border-primary rounded-lg p-5 hover:border-accent/50 hover:shadow-card-hover transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">
                      {owner.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-body text-text-primary font-semibold group-hover:text-accent transition-colors">
                      {owner.name}
                    </h3>
                    <div className="flex items-center gap-1 text-caption text-text-muted">
                      <Mail className="h-3 w-3" />
                      {owner.email}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={owner.onboarding_completed ? "active" : "pending"} />
                <span className="text-caption text-text-muted">
                  {owner.brokerage_calc_method === "days_of_rent"
                    ? `${owner.brokerage_days} days brokerage`
                    : owner.brokerage_calc_method === "percentage"
                      ? `${owner.brokerage_percentage}% brokerage`
                      : "Fixed brokerage"}
                </span>
              </div>

              <div className="text-caption text-text-secondary mb-3">
                ₹{owner.total_rent.toLocaleString("en-IN")}/mo total rent
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-primary">
                <StatItem icon={Building2} label="Flats" value={owner.flat_count} />
                <StatItem label="Occupied" value={owner.occupied} color="text-success" />
                <StatItem label="Vacant" value={owner.vacant} color={owner.vacant > 0 ? "text-danger" : "text-success"} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredOwners.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body text-text-muted">No owners match your filters.</p>
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
