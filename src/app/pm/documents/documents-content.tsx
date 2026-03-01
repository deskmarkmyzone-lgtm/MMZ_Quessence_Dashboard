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
import { Search, Download, Eye, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { ExportButtons } from "@/components/shared/export-buttons";
import { exportToExcel } from "@/lib/excel/export";
import type { DocumentType, DocumentStatus } from "@/types";

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  brokerage_invoice: "Brokerage Invoice",
  expenses_bill: "Expenses Bill",
  maintenance_tracker: "Maintenance Tracker",
  rental_credit_report: "Rental Credit Report",
  flat_annexure: "Flat Annexure",
};

const DOC_STATUS_MAP: Record<DocumentStatus, "draft" | "pending" | "approved" | "published" | "rejected"> = {
  draft: "draft",
  pending_approval: "pending",
  approved: "approved",
  published: "published",
  rejected: "rejected",
};

interface DocumentRow {
  id: string;
  document_type: DocumentType;
  document_number: string;
  owner_name: string;
  period_label: string;
  grand_total: number | null;
  status: DocumentStatus;
  payment_received: boolean;
  created_at: string;
  published_at: string | null;
}

interface DocumentsContentProps {
  documents: DocumentRow[];
}

export function DocumentsContent({ documents }: DocumentsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("owner") || "all");
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get("payment") || "all");
  const [showFilters, setShowFilters] = useState(false);

  const ownerOptions = Array.from(
    new Set(documents.map((d) => d.owner_name).filter((n) => n !== "-"))
  ).sort();

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/documents?${params.toString()}`, { scroll: false });
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      !search ||
      d.document_number.toLowerCase().includes(search.toLowerCase()) ||
      d.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || d.document_type === typeFilter;
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesOwner = ownerFilter === "all" || d.owner_name === ownerFilter;
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && d.payment_received) ||
      (paymentFilter === "pending" && d.status === "published" && !d.payment_received);
    return matchesSearch && matchesType && matchesStatus && matchesOwner && matchesPayment;
  });

  const publishedCount = documents.filter(d => d.status === "published").length;
  const pendingCount = documents.filter(d => d.status === "pending_approval").length;
  const draftCount = documents.filter(d => d.status === "draft").length;

  const activeFilterCount = [typeFilter, statusFilter, ownerFilter, paymentFilter].filter(
    (f) => f !== "all"
  ).length;

  const clearAllFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setOwnerFilter("all");
    setPaymentFilter("all");
    setSearch("");
    router.replace("/pm/documents", { scroll: false });
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Documents"
        description={`${documents.length} documents · ${publishedCount} published · ${pendingCount} pending approval · ${draftCount} drafts`}
        actionLabel="Generate Document"
        actionHref="/pm/documents/generate"
      />

      {/* Primary Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateURL({ q: e.target.value }); }}
            placeholder="Search by document number or owner..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); updateURL({ type: v }); }}>
          <SelectTrigger className="w-[180px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="brokerage_invoice">Brokerage Invoice</SelectItem>
            <SelectItem value="expenses_bill">Expenses Bill</SelectItem>
            <SelectItem value="maintenance_tracker">Maintenance Tracker</SelectItem>
            <SelectItem value="rental_credit_report">Rental Credit Report</SelectItem>
            <SelectItem value="flat_annexure">Flat Annexure</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); updateURL({ status: v }); }}>
          <SelectTrigger className="w-[160px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
            exportToExcel(filteredDocs, [
              { key: "document_number", label: "Document #" },
              { key: "document_type", label: "Type", format: (v) => DOC_TYPE_LABELS[v as DocumentType] },
              { key: "owner_name", label: "Owner" },
              { key: "period_label", label: "Period" },
              { key: "grand_total", label: "Amount", format: (v) => (v as number) ?? 0 },
              { key: "status", label: "Status" },
              { key: "created_at", label: "Created" },
            ], { filename: "documents", sheetName: "Documents" });
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
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-caption text-text-muted mb-1 block">Owner</label>
              <Select value={ownerFilter} onValueChange={(v) => { setOwnerFilter(v); updateURL({ owner: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {ownerOptions.map((owner) => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-muted mb-1 block">Payment Status</label>
              <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); updateURL({ payment: v }); }}>
                <SelectTrigger className="bg-bg-page border-border-primary h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {typeFilter !== "all" && (
            <FilterChip label={`Type: ${DOC_TYPE_LABELS[typeFilter as DocumentType] ?? typeFilter}`} onRemove={() => { setTypeFilter("all"); updateURL({ type: "all" }); }} />
          )}
          {statusFilter !== "all" && (
            <FilterChip label={`Status: ${statusFilter}`} onRemove={() => { setStatusFilter("all"); updateURL({ status: "all" }); }} />
          )}
          {ownerFilter !== "all" && (
            <FilterChip label={`Owner: ${ownerFilter}`} onRemove={() => { setOwnerFilter("all"); updateURL({ owner: "all" }); }} />
          )}
          {paymentFilter !== "all" && (
            <FilterChip label={`Payment: ${paymentFilter}`} onRemove={() => { setPaymentFilter("all"); updateURL({ payment: "all" }); }} />
          )}
          <button onClick={clearAllFilters} className="text-caption text-accent hover:underline ml-1">
            Clear all
          </button>
        </div>
      )}

      {(search || activeFilterCount > 0) && (
        <p className="text-caption text-text-muted mb-3">
          Showing {filteredDocs.length} of {documents.length} documents
        </p>
      )}

      {/* Documents Table */}
      <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Document #</th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Type</th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Owner</th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Period</th>
              <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Amount</th>
              <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Status</th>
              <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Payment</th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Created</th>
              <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3">
                  <span className="text-body-sm text-text-primary font-mono font-semibold">
                    {doc.document_number}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">
                    {DOC_TYPE_LABELS[doc.document_type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-body-sm text-text-primary">
                  {doc.owner_name}
                </td>
                <td className="px-4 py-3 text-body-sm text-text-secondary">
                  {doc.period_label}
                </td>
                <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">
                  {doc.grand_total ? `₹${doc.grand_total.toLocaleString("en-IN")}` : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={DOC_STATUS_MAP[doc.status]} />
                </td>
                <td className="px-4 py-3 text-center">
                  {doc.status === "published" ? (
                    doc.payment_received ? (
                      <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-caption font-medium text-success">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-caption font-medium text-warning">
                        Pending
                      </span>
                    )
                  ) : (
                    <span className="text-caption text-text-muted">&mdash;</span>
                  )}
                </td>
                <td className="px-4 py-3 text-body-sm text-text-secondary">
                  {doc.created_at}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/pm/documents/${doc.id}`} aria-label="View document">
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-text-muted hover:text-text-primary">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    {doc.status === "published" && (
                      <Button variant="ghost" size="icon" aria-label="Download document" className="h-10 w-10 text-text-muted hover:text-text-primary">
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body text-text-muted">No documents match your filters.</p>
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
