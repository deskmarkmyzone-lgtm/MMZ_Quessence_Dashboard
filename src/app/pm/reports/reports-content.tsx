"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IndianRupee,
  Wrench,
  TrendingUp,
  Receipt,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToExcel } from "@/lib/excel/export";
import type { OwnerReportRow, ReportsSummary } from "./page";

interface ReportsContentProps {
  ownerRows: OwnerReportRow[];
  summary: ReportsSummary;
  owners: { id: string; name: string }[];
  selectedYear: number;
  selectedOwnerId: string;
}

function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
}

export function ReportsContent({
  ownerRows,
  summary,
  owners,
  selectedYear,
  selectedOwnerId,
}: ReportsContentProps) {
  const router = useRouter();
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const toggleExpanded = (ownerId: string) => {
    setExpandedOwners((prev) => {
      const next = new Set(prev);
      if (next.has(ownerId)) next.delete(ownerId);
      else next.add(ownerId);
      return next;
    });
  };

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams();
    params.set("year", year);
    if (selectedOwnerId !== "all") params.set("owner", selectedOwnerId);
    router.push(`/pm/reports?${params.toString()}`);
  };

  const handleOwnerChange = (owner: string) => {
    const params = new URLSearchParams();
    params.set("year", String(selectedYear));
    if (owner !== "all") params.set("owner", owner);
    router.push(`/pm/reports?${params.toString()}`);
  };

  const handleExportExcel = () => {
    const rows = ownerRows.map((r) => ({
      owner_name: r.owner_name,
      flat_count: r.flat_count,
      rent_collected: r.rent_collected,
      expense_total: r.expense_total,
      brokerage_earned: r.brokerage_earned,
      tds_deducted: r.tds_deducted,
      net: r.net,
    }));

    exportToExcel(rows, [
      { key: "owner_name", label: "Owner" },
      { key: "flat_count", label: "Flats" },
      { key: "rent_collected", label: "Rent Collected", format: (v) => Number(v) || 0 },
      { key: "expense_total", label: "Expenses", format: (v) => Number(v) || 0 },
      { key: "brokerage_earned", label: "Brokerage Earned", format: (v) => Number(v) || 0 },
      { key: "tds_deducted", label: "TDS Deducted", format: (v) => Number(v) || 0 },
      { key: "net", label: "Net Revenue", format: (v) => Number(v) || 0 },
    ], {
      filename: `MMZ_Financial_Report_${selectedYear}`,
      sheetName: `FY ${selectedYear}`,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 text-text-primary">Financial Reports</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Yearly owner tax summaries — rent collected, expenses, brokerage & TDS
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <Download className="h-4 w-4 mr-1.5" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={String(selectedYear)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[140px] bg-bg-card border-border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedOwnerId} onValueChange={handleOwnerChange}>
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

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard
          label="Total Rent Collected"
          value={formatCurrency(summary.total_rent)}
          icon={IndianRupee}
          color="text-green-500"
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(summary.total_expenses)}
          icon={Wrench}
          color="text-red-500"
        />
        <SummaryCard
          label="Brokerage Earned"
          value={formatCurrency(summary.total_brokerage)}
          icon={TrendingUp}
          color="text-accent"
        />
        <SummaryCard
          label="TDS Deducted"
          value={formatCurrency(summary.total_tds)}
          icon={Receipt}
          color="text-yellow-500"
        />
        <SummaryCard
          label="Net Revenue"
          value={formatCurrency(summary.net_revenue)}
          icon={FileText}
          color="text-blue-500"
        />
      </div>

      {/* Owner rows */}
      {ownerRows.length === 0 ? (
        <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
          <FileText className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">
            No financial data found for {selectedYear}
          </p>
        </div>
      ) : (
        <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border-primary bg-bg-elevated">
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-muted w-8" />
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-muted">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-center text-caption font-medium text-text-muted">
                    Flats
                  </th>
                  <th className="px-4 py-3 text-right text-caption font-medium text-text-muted">
                    Rent Collected
                  </th>
                  <th className="px-4 py-3 text-right text-caption font-medium text-text-muted">
                    Expenses
                  </th>
                  <th className="px-4 py-3 text-right text-caption font-medium text-text-muted">
                    Brokerage
                  </th>
                  <th className="px-4 py-3 text-right text-caption font-medium text-text-muted">
                    TDS
                  </th>
                  <th className="px-4 py-3 text-right text-caption font-medium text-text-muted">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody>
                {ownerRows.map((row) => {
                  const isExpanded = expandedOwners.has(row.owner_id);

                  return (
                    <OwnerRow
                      key={row.owner_id}
                      row={row}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpanded(row.owner_id)}
                    />
                  );
                })}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="border-t-2 border-border-primary bg-bg-elevated/50">
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-body-sm font-semibold text-text-primary">
                    Total ({ownerRows.length} owners)
                  </td>
                  <td className="px-4 py-3 text-center text-body-sm font-medium text-text-primary">
                    {ownerRows.reduce((s, r) => s + r.flat_count, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-semibold text-green-600">
                    {formatCurrency(summary.total_rent)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-semibold text-red-500">
                    {formatCurrency(summary.total_expenses)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-semibold text-accent">
                    {formatCurrency(summary.total_brokerage)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-semibold text-yellow-600">
                    {formatCurrency(summary.total_tds)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-bold text-text-primary">
                    {formatCurrency(summary.net_revenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-caption text-text-muted">{label}</span>
      </div>
      <p className={`text-h3 font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function OwnerRow({
  row,
  isExpanded,
  onToggle,
}: {
  row: OwnerReportRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-border-primary hover:bg-bg-hover/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <button className="text-text-muted hover:text-text-primary transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-4 py-3 text-body-sm font-medium text-text-primary">
          {row.owner_name}
        </td>
        <td className="px-4 py-3 text-center text-body-sm text-text-secondary">
          {row.flat_count}
        </td>
        <td className="px-4 py-3 text-right text-body-sm text-green-600 font-medium">
          {formatCurrency(row.rent_collected)}
        </td>
        <td className="px-4 py-3 text-right text-body-sm text-red-500">
          {formatCurrency(row.expense_total)}
        </td>
        <td className="px-4 py-3 text-right text-body-sm text-accent">
          {formatCurrency(row.brokerage_earned)}
        </td>
        <td className="px-4 py-3 text-right text-body-sm text-yellow-600">
          {formatCurrency(row.tds_deducted)}
        </td>
        <td className="px-4 py-3 text-right text-body-sm font-semibold text-text-primary">
          {formatCurrency(row.net)}
        </td>
      </tr>
      {/* Expanded flat breakdown */}
      {isExpanded && row.flats.length > 0 && (
        <tr>
          <td colSpan={8} className="bg-bg-elevated/30 px-4 py-0">
            <div className="py-3 pl-8">
              <p className="text-caption font-medium text-text-muted mb-2">
                Per-Flat Breakdown
              </p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] font-medium text-text-muted pb-1.5 pr-4">
                      Flat
                    </th>
                    <th className="text-right text-[11px] font-medium text-text-muted pb-1.5 pr-4">
                      Rent Collected
                    </th>
                    <th className="text-right text-[11px] font-medium text-text-muted pb-1.5">
                      Expenses
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {row.flats
                    .sort((a, b) => a.flat_number.localeCompare(b.flat_number))
                    .map((flat) => (
                      <tr key={flat.flat_id}>
                        <td className="text-body-sm text-text-primary py-1 pr-4 font-mono">
                          {flat.flat_number}
                        </td>
                        <td className="text-right text-body-sm text-green-600 py-1 pr-4">
                          {formatCurrency(flat.rent_collected)}
                        </td>
                        <td className="text-right text-body-sm text-red-500 py-1">
                          {formatCurrency(flat.expense_total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
