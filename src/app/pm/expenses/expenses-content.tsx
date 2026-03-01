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
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ExportButtons } from "@/components/shared/export-buttons";
import { exportToExcel } from "@/lib/excel/export";

type RecoveryStatus = "pending" | "included_in_statement" | "recovered";

const RECOVERY_BADGE: Record<RecoveryStatus, "unpaid" | "pending" | "paid"> = {
  pending: "unpaid",
  included_in_statement: "pending",
  recovered: "paid",
};

interface Expense {
  id: string;
  flat_number: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor: string;
  paid_by: string;
  recovery: RecoveryStatus;
}

export function ExpensesContent({ expenses }: { expenses: Expense[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [recoveryFilter, setRecoveryFilter] = useState(searchParams.get("recovery") || "all");
  const [paidByFilter, setPaidByFilter] = useState(searchParams.get("paid_by") || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");
  const [showFilters, setShowFilters] = useState(false);

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") params.set(key, value);
      else params.delete(key);
    });
    router.replace(`/pm/expenses?${params.toString()}`, { scroll: false });
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      !search ||
      e.flat_number.includes(search) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.vendor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || e.category.toLowerCase().replace(" ", "_") === categoryFilter;
    const matchesRecovery = recoveryFilter === "all" || e.recovery === recoveryFilter;
    const matchesPaidBy = paidByFilter === "all" || e.paid_by === paidByFilter;
    const matchesDateFrom = !dateFrom || e.date >= dateFrom;
    const matchesDateTo = !dateTo || e.date <= dateTo;
    return matchesSearch && matchesCategory && matchesRecovery && matchesPaidBy && matchesDateFrom && matchesDateTo;
  });

  const activeFilterCount = [categoryFilter, recoveryFilter, paidByFilter].filter(f => f !== "all").length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.recovery === "pending").reduce((sum, e) => sum + e.amount, 0);

  const clearAllFilters = () => {
    setCategoryFilter("all");
    setRecoveryFilter("all");
    setPaidByFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    router.replace("/pm/expenses", { scroll: false });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Expenses"
        description={`${expenses.length} expenses · ₹${totalAmount.toLocaleString("en-IN")} total · ₹${pendingAmount.toLocaleString("en-IN")} pending recovery`}
        actionLabel="Record Expense"
        actionHref="/pm/expenses/record"
      />

      {/* Primary Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateURL({ q: e.target.value }); }}
            placeholder="Search flats, descriptions, vendors..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); updateURL({ category: v }); }}>
          <SelectTrigger className="w-[160px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="deep_cleaning">Deep Cleaning</SelectItem>
            <SelectItem value="paint">Paint</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="ac">AC</SelectItem>
            <SelectItem value="geyser">Geyser</SelectItem>
            <SelectItem value="carpentry">Carpentry</SelectItem>
            <SelectItem value="pest_control">Pest Control</SelectItem>
            <SelectItem value="chimney">Chimney</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
            exportToExcel(filteredExpenses, [
              { key: "flat_number", label: "Flat" },
              { key: "category", label: "Category" },
              { key: "description", label: "Description" },
              { key: "amount", label: "Amount", format: (v) => v as number },
              { key: "date", label: "Date" },
              { key: "vendor", label: "Vendor" },
              { key: "paid_by", label: "Paid By" },
              { key: "recovery", label: "Recovery Status" },
            ], { filename: "expenses", sheetName: "Expenses" });
          }}
        />
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-caption text-text-muted font-medium">Advanced Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-caption text-accent hover:underline">Clear all</button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-caption text-text-muted mb-1 block">Recovery Status</label>
              <Select value={recoveryFilter} onValueChange={(v) => { setRecoveryFilter(v); updateURL({ recovery: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="included_in_statement">In Statement</SelectItem>
                  <SelectItem value="recovered">Recovered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Paid By</label>
              <Select value={paidByFilter} onValueChange={(v) => { setPaidByFilter(v); updateURL({ paid_by: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); updateURL({ date_from: e.target.value }); }}
                className="bg-bg-page border-border-primary h-9"
              />
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); updateURL({ date_to: e.target.value }); }}
                className="bg-bg-page border-border-primary h-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categoryFilter !== "all" && (
            <FilterChip label={`Category: ${categoryFilter}`} onRemove={() => { setCategoryFilter("all"); updateURL({ category: "all" }); }} />
          )}
          {recoveryFilter !== "all" && (
            <FilterChip label={`Recovery: ${recoveryFilter}`} onRemove={() => { setRecoveryFilter("all"); updateURL({ recovery: "all" }); }} />
          )}
          {paidByFilter !== "all" && (
            <FilterChip label={`Paid by: ${paidByFilter}`} onRemove={() => { setPaidByFilter("all"); updateURL({ paid_by: "all" }); }} />
          )}
          {dateFrom && (
            <FilterChip label={`From: ${formatDate(dateFrom)}`} onRemove={() => { setDateFrom(""); updateURL({ date_from: "" }); }} />
          )}
          {dateTo && (
            <FilterChip label={`To: ${formatDate(dateTo)}`} onRemove={() => { setDateTo(""); updateURL({ date_to: "" }); }} />
          )}
        </div>
      )}

      {(search || activeFilterCount > 0) && (
        <p className="text-caption text-text-muted mb-3">
          Showing {filteredExpenses.length} of {expenses.length} expenses
          {filteredExpenses.length > 0 && ` · ₹${filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}`}
        </p>
      )}

      {/* Expenses Table */}
      <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Flat</th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Category</th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Description</th>
                <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Amount</th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Date</th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Vendor</th>
                <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Paid By</th>
                <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Recovery</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-body-sm text-text-primary font-mono font-semibold">{expense.flat_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">{expense.category}</span>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-primary">{expense.description}</td>
                  <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">
                    ₹{expense.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">{formatDate(expense.date)}</td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">{expense.vendor}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-caption text-text-secondary">{expense.paid_by}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={RECOVERY_BADGE[expense.recovery]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredExpenses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body text-text-muted">No expenses match your filters.</p>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-accent text-body-sm hover:underline mt-2">Clear all filters</button>
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
