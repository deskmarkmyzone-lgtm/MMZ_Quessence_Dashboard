"use client";

import { History, User, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PastTenant {
  id: string;
  name: string;
  tenant_type: string;
  lease_start_date: string | null;
  lease_end_date: string | null;
  exit_date: string | null;
  exit_reason: string | null;
  monthly_rent: number;
  monthly_maintenance: number | null;
  monthly_inclusive_rent: number | null;
}

interface PastTenantsSectionProps {
  pastTenants: PastTenant[];
  flatId: string;
}

export function PastTenantsSection({ pastTenants, flatId }: PastTenantsSectionProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-text-muted" />
          <h3 className="text-h3 text-text-primary">Past Tenants</h3>
          <span className="text-caption text-text-muted">({pastTenants.length})</span>
        </div>
        <Link href={`/pm/flats/${flatId}/tenant/edit?past=true`}>
          <Button variant="outline" size="sm" className="border-border-primary text-text-secondary">
            <History className="h-4 w-4 mr-1" />
            Add Past Tenant
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {pastTenants.map((tenant) => {
          const inclusiveRent = tenant.monthly_inclusive_rent ?? (tenant.monthly_rent + (tenant.monthly_maintenance ?? 0));

          return (
            <div
              key={tenant.id}
              className="bg-bg-card border border-border-primary rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-bg-elevated flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-body-sm text-text-primary font-medium">{tenant.name}</p>
                    <p className="text-caption text-text-secondary capitalize">{tenant.tenant_type}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="inline-flex items-center gap-1 text-caption text-text-muted">
                        <Calendar className="h-3 w-3" />
                        {formatDate(tenant.lease_start_date)} - {formatDate(tenant.lease_end_date)}
                      </span>
                      {tenant.exit_date && (
                        <span className="inline-flex items-center gap-1 text-caption text-text-muted">
                          <LogOut className="h-3 w-3" />
                          Exited: {formatDate(tenant.exit_date)}
                        </span>
                      )}
                    </div>
                    {tenant.exit_reason && (
                      <p className="text-caption text-text-muted mt-1">
                        Reason: {tenant.exit_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-caption text-text-muted">Rent</p>
                  <p className="text-body-sm text-text-primary font-medium">
                    ₹{inclusiveRent.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
