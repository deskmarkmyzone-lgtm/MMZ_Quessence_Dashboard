"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface FlatInfo {
  id: string;
  flat_number: string;
  inclusive_rent: number;
  status: string;
  tenant_name: string | null;
  owner_name: string;
  owner_id: string | null;
}

interface MonthlyRentContentProps {
  flats: FlatInfo[];
  rentGrid: Record<
    string,
    Record<string, { status: string; amount: number; date?: string }>
  >;
  allMonths: string[];
  owners: { id: string; name: string }[];
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function MonthlyRentContent({
  flats,
  rentGrid,
  allMonths,
  owners,
}: MonthlyRentContentProps) {
  const [ownerFilter, setOwnerFilter] = useState("all");

  const filteredFlats = flats.filter((f) => {
    if (ownerFilter === "all") return true;
    return f.owner_id === ownerFilter;
  });

  const occupiedFlats = filteredFlats.filter((f) => f.status === "occupied");
  const totalExpected = occupiedFlats.reduce(
    (sum, f) => sum + f.inclusive_rent,
    0
  );

  return (
    <div className="w-full">
      <PageHeader
        title="Monthly Rent Grid"
        description={`${occupiedFlats.length} occupied flats · ₹${totalExpected.toLocaleString("en-IN")} expected/month`}
        backHref="/pm/rent"
      />

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <Select
          value={ownerFilter}
          onValueChange={setOwnerFilter}
        >
          <SelectTrigger className="w-[200px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3 sticky left-0 bg-bg-card z-10">
                Flat
              </th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                Tenant
              </th>
              <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                Expected
              </th>
              {allMonths.map((month) => (
                <th
                  key={month}
                  className="text-center text-caption text-text-muted font-medium px-4 py-3 whitespace-nowrap"
                >
                  {formatMonth(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredFlats.map((flat) => (
              <tr
                key={flat.id}
                className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors"
              >
                <td className="px-4 py-3 sticky left-0 bg-bg-card z-10">
                  <Link
                    href={`/pm/flats/${flat.id}`}
                    className="text-body-sm text-text-primary font-mono font-semibold hover:text-accent"
                  >
                    {flat.flat_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-body-sm text-text-secondary truncate max-w-[150px]">
                  {flat.tenant_name ?? (
                    <span className="text-text-muted italic">Vacant</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-body-sm text-text-primary">
                  ₹{flat.inclusive_rent.toLocaleString("en-IN")}
                </td>
                {allMonths.map((month) => {
                  const payment = rentGrid[flat.id]?.[month];
                  const isVacant = flat.status === "vacant";

                  if (isVacant) {
                    return (
                      <td key={month} className="px-4 py-3 text-center">
                        <span className="text-caption text-text-muted">—</span>
                      </td>
                    );
                  }

                  if (!payment) {
                    return (
                      <td key={month} className="px-4 py-3 text-center">
                        <StatusBadge status="unpaid" />
                      </td>
                    );
                  }

                  return (
                    <td key={month} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <StatusBadge status={payment.status} />
                        {payment.date && (
                          <span className="text-[10px] text-text-muted">
                            {payment.date}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredFlats.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body text-text-muted">
            No flats match the selected filter.
          </p>
        </div>
      )}
    </div>
  );
}
