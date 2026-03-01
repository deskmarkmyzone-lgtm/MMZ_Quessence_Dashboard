"use client";

import { Building2, User, IndianRupee } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";

interface FlatCardProps {
  flat: {
    id: string;
    flat_number: string;
    bhk_type: string;
    carpet_area_sft?: number | null;
    base_rent: number;
    maintenance_amount: number;
    inclusive_rent: number;
    status: "occupied" | "vacant" | "under_maintenance";
    tenant_name?: string | null;
    tenant_type?: string | null;
    owner_name?: string;
    community_name?: string;
    rent_due_day?: number;
  };
}

export function FlatCard({ flat }: FlatCardProps) {
  const tower = flat.flat_number.length === 4 ? flat.flat_number[0] : null;
  const floor = flat.flat_number.length === 4 ? flat.flat_number.slice(1, 3) : null;

  return (
    <Link href={`/pm/flats/${flat.id}`}>
      <div className="bg-bg-card border border-border-primary rounded-lg p-4 hover:border-accent/50 hover:shadow-card-hover transition-all cursor-pointer group h-full">
        {/* Top Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-md bg-bg-elevated flex flex-col items-center justify-center">
              <span className="text-body text-text-primary font-mono font-bold leading-none">
                {flat.flat_number}
              </span>
              {tower && (
                <span className="text-[9px] text-text-muted mt-0.5">
                  T{tower} F{floor}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-body text-text-primary font-semibold group-hover:text-accent transition-colors">
                Flat {flat.flat_number}
              </h3>
              <span className="text-caption text-text-secondary">
                {flat.bhk_type} BHK
                {flat.carpet_area_sft ? ` · ${flat.carpet_area_sft} sqft` : ""}
              </span>
            </div>
          </div>
          <StatusBadge status={flat.status} />
        </div>

        {/* Tenant Info */}
        <div className="mb-3">
          {flat.status === "occupied" && flat.tenant_name ? (
            <div className="flex items-center gap-2 text-body-sm">
              <User className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-text-primary">{flat.tenant_name}</span>
              {flat.tenant_type && (
                <StatusBadge status={flat.tenant_type === "bachelor" ? "bachelor" : "family"} />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-body-sm text-text-muted">
              <User className="h-3.5 w-3.5" />
              <span>No tenant</span>
            </div>
          )}
        </div>

        {/* Rent Info */}
        <div className="pt-3 border-t border-border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-caption text-text-muted">
              <IndianRupee className="h-3 w-3" />
              Rent
            </div>
            <span className="text-body text-text-primary font-semibold">
              ₹{flat.inclusive_rent.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-text-muted">
              Base: ₹{flat.base_rent.toLocaleString("en-IN")} + Maint: ₹{flat.maintenance_amount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Owner */}
        {flat.owner_name && (
          <div className="mt-2 pt-2 border-t border-border-primary">
            <div className="flex items-center gap-1 text-caption text-text-muted">
              <Building2 className="h-3 w-3" />
              {flat.owner_name}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
