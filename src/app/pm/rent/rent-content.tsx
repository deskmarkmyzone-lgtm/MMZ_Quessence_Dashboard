"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid3X3, Search, SlidersHorizontal, X, Upload, LayoutGrid, List, IndianRupee, Calendar } from "lucide-react";
import Link from "next/link";
import { ExportButtons } from "@/components/shared/export-buttons";
import { exportToExcel } from "@/lib/excel/export";
import { usePersistedView } from "@/lib/hooks/use-persisted-view";

interface RentPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  payment_method: string;
  payment_status: string;
  payment_reference: string | null;
  flat: {
    id: string;
    flat_number: string;
    community: { name: string } | null;
    owner: { name: string } | null;
  } | null;
  tenant: { name: string } | null;
}

interface RentContentProps {
  payments: RentPayment[];
  owners: string[];
  months: string[];
  methods: string[];
}

// Map DB payment_status to StatusBadge status
const badgeStatus = (status: string) => {
  if (status === "full") return "paid" as const;
  if (status === "partial") return "partial" as const;
  return "unpaid" as const;
};

// Format payment method for display
const formatMethod = (method: string) => {
  const map: Record<string, string> = {
    gpay: "GPay",
    phonepe: "PhonePe",
    bank_transfer: "Bank Transfer",
    upi: "UPI",
    cash: "Cash",
    cheque: "Cheque",
    other: "Other",
  };
  return map[method] ?? method;
};

// Format payment_month (YYYY-MM) to readable (e.g. "Feb 2026")
const formatMonth = (month: string) => {
  if (!month) return "-";
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

// Format date for display
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export function RentContent({ payments, owners, months, methods }: RentContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = usePersistedView("pm-rent", "list");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("owner") || "all");
  const [monthFilter, setMonthFilter] = useState(searchParams.get("month") || "all");
  const [methodFilter, setMethodFilter] = useState(searchParams.get("method") || "all");
  const [communityFilter, setCommunityFilter] = useState(searchParams.get("community") || "all");
  const [showFilters, setShowFilters] = useState(false);

  const communityOptions = Array.from(
    new Set(payments.map((p) => p.flat?.community?.name).filter(Boolean))
  ) as string[];

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/rent?${params.toString()}`, { scroll: false });
  };

  const filteredPayments = payments.filter((p) => {
    const flatNumber = p.flat?.flat_number ?? "";
    const tenantName = p.tenant?.name ?? "";
    const ownerName = p.flat?.owner?.name ?? "";
    const matchesSearch =
      !search ||
      flatNumber.includes(search) ||
      tenantName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.payment_status === statusFilter;
    const matchesOwner = ownerFilter === "all" || ownerName === ownerFilter;
    const matchesMonth = monthFilter === "all" || p.payment_month === monthFilter;
    const matchesMethod = methodFilter === "all" || p.payment_method === methodFilter;
    const matchesCommunity = communityFilter === "all" || (p.flat?.community?.name ?? "") === communityFilter;
    return matchesSearch && matchesStatus && matchesOwner && matchesMonth && matchesMethod && matchesCommunity;
  });

  const totalCollected = filteredPayments
    .filter((p) => p.payment_status !== "unpaid")
    .reduce((sum, p) => sum + p.amount, 0);
  const paidCount = filteredPayments.filter((p) => p.payment_status === "full").length;
  const unpaidCount = filteredPayments.filter((p) => p.payment_status === "unpaid").length;
  const partialCount = filteredPayments.filter((p) => p.payment_status === "partial").length;

  const activeFilterCount = [statusFilter, ownerFilter, monthFilter, methodFilter, communityFilter].filter(
    (f) => f !== "all"
  ).length;

  const clearAllFilters = () => {
    setStatusFilter("all");
    setOwnerFilter("all");
    setMonthFilter("all");
    setMethodFilter("all");
    setCommunityFilter("all");
    setSearch("");
    router.replace("/pm/rent", { scroll: false });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-h2 text-text-primary">Rent Payments</h2>
          <p className="text-body text-text-secondary mt-1">
            {paidCount} paid · {partialCount} partial · {unpaidCount} unpaid · ₹{totalCollected.toLocaleString("en-IN")} collected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pm/rent/bulk">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1.5" />
              Bulk Import
            </Button>
          </Link>
          <Link href="/pm/rent/record">
            <Button className="bg-accent hover:bg-accent-light text-white">
              <span className="mr-1.5">+</span>
              Record Rent
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateURL({ q: e.target.value });
            }}
            placeholder="Search flats or tenants..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
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
            <SelectItem value="full">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <ExportButtons
            onExportExcel={() => {
              exportToExcel(
                filteredPayments.map((p) => ({
                  flat_number: p.flat?.flat_number ?? "-",
                  tenant: p.tenant?.name ?? "-",
                  owner: p.flat?.owner?.name ?? "-",
                  amount: p.amount,
                  date: formatDate(p.payment_date),
                  month: formatMonth(p.payment_month),
                  method: formatMethod(p.payment_method),
                  status: p.payment_status,
                })),
                [
                  { key: "flat_number", label: "Flat" },
                  { key: "tenant", label: "Tenant" },
                  { key: "owner", label: "Owner" },
                  { key: "amount", label: "Amount", format: (v) => v as number },
                  { key: "date", label: "Date" },
                  { key: "month", label: "Month" },
                  { key: "method", label: "Method" },
                  { key: "status", label: "Status" },
                ],
                { filename: "rent-payments", sheetName: "Rent Payments" }
              );
            }}
          />
          <Link href="/pm/rent/monthly">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Grid3X3 className="h-3.5 w-3.5" />
              Monthly
            </Button>
          </Link>
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
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-body-sm text-text-primary font-medium">Advanced Filters</span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-caption text-accent hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-caption text-text-muted mb-1 block">Owner</label>
              <Select
                value={ownerFilter}
                onValueChange={(v) => {
                  setOwnerFilter(v);
                  updateURL({ owner: v });
                }}
              >
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Community</label>
              <Select
                value={communityFilter}
                onValueChange={(v) => {
                  setCommunityFilter(v);
                  updateURL({ community: v });
                }}
              >
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Communities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  {communityOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Month</label>
              <Select
                value={monthFilter}
                onValueChange={(v) => {
                  setMonthFilter(v);
                  updateURL({ month: v });
                }}
              >
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Payment Method</label>
              <Select
                value={methodFilter}
                onValueChange={(v) => {
                  setMethodFilter(v);
                  updateURL({ method: v });
                }}
              >
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {methods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {formatMethod(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilter !== "all" && (
            <FilterChip
              label={`Status: ${statusFilter}`}
              onRemove={() => {
                setStatusFilter("all");
                updateURL({ status: "all" });
              }}
            />
          )}
          {ownerFilter !== "all" && (
            <FilterChip
              label={`Owner: ${ownerFilter}`}
              onRemove={() => {
                setOwnerFilter("all");
                updateURL({ owner: "all" });
              }}
            />
          )}
          {monthFilter !== "all" && (
            <FilterChip
              label={`Month: ${formatMonth(monthFilter)}`}
              onRemove={() => {
                setMonthFilter("all");
                updateURL({ month: "all" });
              }}
            />
          )}
          {methodFilter !== "all" && (
            <FilterChip
              label={`Method: ${formatMethod(methodFilter)}`}
              onRemove={() => {
                setMethodFilter("all");
                updateURL({ method: "all" });
              }}
            />
          )}
          {communityFilter !== "all" && (
            <FilterChip
              label={`Community: ${communityFilter}`}
              onRemove={() => {
                setCommunityFilter("all");
                updateURL({ community: "all" });
              }}
            />
          )}
        </div>
      )}

      {(search || activeFilterCount > 0) && (
        <p className="text-caption text-text-muted mb-3">
          Showing {filteredPayments.length} of {payments.length} payments
        </p>
      )}

      {/* Card View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-bg-card border border-border-primary rounded-lg p-5 hover:border-accent/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-body text-text-primary font-mono font-bold">
                      {payment.flat?.flat_number ?? "-"}
                    </span>
                    <StatusBadge status={badgeStatus(payment.payment_status)} />
                  </div>
                  <p className="text-caption text-text-secondary mt-1 truncate">
                    {payment.tenant?.name ?? "-"}
                  </p>
                </div>
                <span className="text-body-sm text-accent font-bold whitespace-nowrap">
                  {payment.amount > 0
                    ? `₹${payment.amount.toLocaleString("en-IN")}`
                    : "-"}
                </span>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-border-primary text-caption text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatMonth(payment.payment_month)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5" />
                  <span>{formatMethod(payment.payment_method)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 text-caption">
                <span className="text-text-muted">
                  {payment.flat?.owner?.name ?? "-"}
                </span>
                <span className="text-text-muted">
                  {formatDate(payment.payment_date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List/Table View */
        <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Flat
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Tenant
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Owner
                </th>
                <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                  Amount
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Date
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Month
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Method
                </th>
                <th className="text-center text-caption text-text-muted font-medium px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-body-sm text-text-primary font-mono font-semibold">
                      {payment.flat?.flat_number ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-primary">
                    {payment.tenant?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {payment.flat?.owner?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">
                    {payment.amount > 0
                      ? `₹${payment.amount.toLocaleString("en-IN")}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {formatMonth(payment.payment_month)}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {formatMethod(payment.payment_method)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={badgeStatus(payment.payment_status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body text-text-muted">No payments match your filters.</p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-accent text-body-sm hover:underline mt-2"
            >
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
