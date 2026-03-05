"use client";

import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Eye,
  SlidersHorizontal,
  X,
  Copy,
  Trash2,
  Pencil,
  AlertTriangle,
  GitCompare,
  SendHorizontal,
} from "lucide-react";
import Link from "next/link";
import { ExportButtons } from "@/components/shared/export-buttons";
import { exportToExcel } from "@/lib/excel/export";
import { deleteDocument, renameDocument, submitForApproval } from "@/lib/actions";
import { toast } from "sonner";
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
  owner_id: string;
  owner_name: string;
  period_label: string;
  grand_total: number | null;
  status: DocumentStatus;
  payment_received: boolean;
  line_items: unknown[];
  created_at: string;
  created_at_raw: string;
  published_at: string | null;
}

interface DocumentsContentProps {
  documents: DocumentRow[];
}

function getDuplicateKey(doc: DocumentRow): string {
  return `${doc.document_type}::${doc.owner_id}::${doc.period_label}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeDiffs(a: any[], b: any[]): { field: string; valueA: string; valueB: string }[] {
  const diffs: { field: string; valueA: string; valueB: string }[] = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (!itemA && itemB) {
      diffs.push({ field: `Line item #${i + 1}`, valueA: "(missing)", valueB: JSON.stringify(itemB) });
    } else if (itemA && !itemB) {
      diffs.push({ field: `Line item #${i + 1}`, valueA: JSON.stringify(itemA), valueB: "(missing)" });
    } else if (itemA && itemB) {
      const allKeys = Array.from(new Set([...Object.keys(itemA), ...Object.keys(itemB)]));
      for (const key of allKeys) {
        const va = JSON.stringify(itemA[key] ?? "");
        const vb = JSON.stringify(itemB[key] ?? "");
        if (va !== vb) {
          diffs.push({
            field: `Item #${i + 1} → ${key}`,
            valueA: String(itemA[key] ?? "-"),
            valueB: String(itemB[key] ?? "-"),
          });
        }
      }
    }
  }
  return diffs;
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

  // Dialogs
  const [renameDoc, setRenameDoc] = useState<DocumentRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteDoc, setDeleteDoc] = useState<DocumentRow | null>(null);
  const [compareDocs, setCompareDocs] = useState<[DocumentRow, DocumentRow] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Duplicate detection
  const duplicateMap = useMemo(() => {
    const groups = new Map<string, DocumentRow[]>();
    for (const doc of documents) {
      const key = getDuplicateKey(doc);
      const group = groups.get(key) || [];
      group.push(doc);
      groups.set(key, group);
    }
    // Only keep groups with 2+ documents
    const dupes = new Map<string, DocumentRow[]>();
    groups.forEach((group, key) => {
      if (group.length >= 2) {
        dupes.set(key, group.sort((a, b) => a.created_at_raw.localeCompare(b.created_at_raw)));
      }
    });
    return dupes;
  }, [documents]);

  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    duplicateMap.forEach((group) => {
      group.forEach((doc) => ids.add(doc.id));
    });
    return ids;
  }, [duplicateMap]);

  const duplicateGroupCount = duplicateMap.size;

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
      d.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      d.period_label.toLowerCase().includes(search.toLowerCase());
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

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setActionLoading(true);
    const result = await deleteDocument(deleteDoc.id);
    setActionLoading(false);
    if (result.success) {
      toast.success("Document deleted");
      setDeleteDoc(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete document");
    }
  };

  const handleRename = async () => {
    if (!renameDoc) return;
    setActionLoading(true);
    const result = await renameDocument(renameDoc.id, renameValue);
    setActionLoading(false);
    if (result.success) {
      toast.success("Document renamed");
      setRenameDoc(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to rename document");
    }
  };

  const handleCompareDelete = async (docId: string) => {
    setActionLoading(true);
    const result = await deleteDocument(docId);
    setActionLoading(false);
    if (result.success) {
      toast.success("Document deleted");
      setCompareDocs(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete document");
    }
  };

  const handleSubmitForApproval = async (docId: string) => {
    setActionLoading(true);
    const result = await submitForApproval(docId);
    setActionLoading(false);
    if (result.success) {
      toast.success("Document submitted for approval");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to submit for approval");
    }
  };

  const getDuplicatesForDoc = (doc: DocumentRow): DocumentRow[] => {
    const key = getDuplicateKey(doc);
    return (duplicateMap.get(key) ?? []).filter((d) => d.id !== doc.id);
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Documents"
        description={`${documents.length} documents · ${publishedCount} published · ${pendingCount} pending approval · ${draftCount} drafts`}
        actionLabel="Generate Document"
        actionHref="/pm/documents/generate"
      />

      {/* Duplicate warning banner */}
      {duplicateGroupCount > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm text-text-primary font-medium">
              {duplicateGroupCount} duplicate document group{duplicateGroupCount > 1 ? "s" : ""} detected
            </p>
            <p className="text-caption text-text-secondary mt-0.5">
              Documents with the same type, owner, and period are flagged. Use the compare button to review differences.
            </p>
          </div>
        </div>
      )}

      {/* Primary Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateURL({ q: e.target.value }); }}
            placeholder="Search by document number, owner, or period..."
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
            {filteredDocs.map((doc) => {
              const isDuplicate = duplicateIds.has(doc.id);
              const dupePartners = isDuplicate ? getDuplicatesForDoc(doc) : [];
              return (
                <tr
                  key={doc.id}
                  className={`border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors ${
                    isDuplicate ? "bg-warning/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isDuplicate && (
                        <Copy className="h-3.5 w-3.5 text-warning shrink-0" aria-label="Duplicate document" />
                      )}
                      <span className="text-body-sm text-text-primary font-mono font-semibold">
                        {doc.document_number}
                      </span>
                    </div>
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
                    <div className="flex items-center justify-end gap-0.5">
                      <Link href={`/pm/documents/${doc.id}`} aria-label="View document">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </Link>
                      {isDuplicate && dupePartners.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-warning hover:text-warning"
                          aria-label="Compare duplicates"
                          onClick={() => setCompareDocs([doc, dupePartners[0]])}
                        >
                          <GitCompare className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                      {(doc.status === "draft" || doc.status === "approved") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-accent/70 hover:text-accent hover:bg-accent/10"
                          aria-label="Send for approval"
                          disabled={actionLoading}
                          onClick={() => handleSubmitForApproval(doc.id)}
                        >
                          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-muted hover:text-text-primary"
                        aria-label="Rename document"
                        onClick={() => { setRenameDoc(doc); setRenameValue(doc.period_label); }}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      {doc.status !== "published" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-muted hover:text-danger"
                          aria-label="Delete document"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      {doc.status === "published" && (
                        <Button variant="ghost" size="icon" aria-label="Download document" className="h-8 w-8 text-text-muted hover:text-text-primary">
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {/* Rename Dialog */}
      <Dialog open={!!renameDoc} onOpenChange={(open) => !open && setRenameDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Update the period label for {renameDoc?.document_number}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-caption text-text-muted mb-1.5 block">Period Label</label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="e.g., Jan 2026 - Mar 2026"
              className="bg-bg-page border-border-primary"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleRename} disabled={actionLoading || !renameValue.trim()}>
              {actionLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <Trash2 className="h-5 w-5" />
              Delete Document
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-body-sm text-text-primary">
              Are you sure you want to delete <strong>{deleteDoc?.document_number}</strong>?
            </p>
            <div className="mt-3 bg-bg-elevated rounded-lg p-3 text-caption text-text-secondary space-y-1">
              <p>Type: {deleteDoc ? DOC_TYPE_LABELS[deleteDoc.document_type] : ""}</p>
              <p>Owner: {deleteDoc?.owner_name}</p>
              <p>Period: {deleteDoc?.period_label}</p>
              {deleteDoc?.grand_total && <p>Amount: ₹{deleteDoc.grand_total.toLocaleString("en-IN")}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)} disabled={actionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={!!compareDocs} onOpenChange={(open) => !open && setCompareDocs(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-warning" />
              Compare Duplicate Documents
            </DialogTitle>
            <DialogDescription>
              Review differences and choose which to keep.
            </DialogDescription>
          </DialogHeader>
          {compareDocs && (
            <CompareView
              docA={compareDocs[0]}
              docB={compareDocs[1]}
              onDelete={handleCompareDelete}
              actionLoading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompareView({
  docA,
  docB,
  onDelete,
  actionLoading,
}: {
  docA: DocumentRow;
  docB: DocumentRow;
  onDelete: (id: string) => Promise<void>;
  actionLoading: boolean;
}) {
  const diffs = useMemo(
    () => computeDiffs(docA.line_items as Record<string, unknown>[], docB.line_items as Record<string, unknown>[]),
    [docA.line_items, docB.line_items]
  );

  const isIdentical = diffs.length === 0 && docA.grand_total === docB.grand_total;

  return (
    <div className="space-y-4">
      {isIdentical && (
        <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3">
          <p className="text-body-sm text-success font-medium">
            These documents are identical. You can safely delete one.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[docA, docB].map((doc, idx) => (
          <div key={doc.id} className="border border-border-primary rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-caption font-medium text-text-muted">
                {idx === 0 ? "Document A (Older)" : "Document B (Newer)"}
              </span>
              <StatusBadge status={DOC_STATUS_MAP[doc.status]} />
            </div>
            <p className="text-body-sm font-mono font-semibold text-text-primary">{doc.document_number}</p>
            <div className="text-caption text-text-secondary space-y-0.5">
              <p>Type: {DOC_TYPE_LABELS[doc.document_type]}</p>
              <p>Owner: {doc.owner_name}</p>
              <p>Period: {doc.period_label}</p>
              <p>Amount: {doc.grand_total ? `₹${doc.grand_total.toLocaleString("en-IN")}` : "-"}</p>
              <p>Created: {doc.created_at}</p>
              <p>Items: {doc.line_items.length}</p>
            </div>
            {doc.status !== "published" && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2"
                onClick={() => onDelete(doc.id)}
                disabled={actionLoading}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {actionLoading ? "Deleting..." : `Delete ${idx === 0 ? "Older" : "Newer"}`}
              </Button>
            )}
            {doc.status === "published" && (
              <p className="text-caption text-text-muted italic mt-2">Published documents cannot be deleted.</p>
            )}
          </div>
        ))}
      </div>

      {diffs.length > 0 && (
        <div>
          <h4 className="text-body-sm font-medium text-text-primary mb-2">
            Differences ({diffs.length})
          </h4>
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <table className="w-full text-caption">
              <thead>
                <tr className="bg-bg-elevated border-b border-border-primary">
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Field</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Document A</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Document B</th>
                </tr>
              </thead>
              <tbody>
                {diffs.slice(0, 20).map((diff, i) => (
                  <tr key={i} className="border-b border-border-primary last:border-0">
                    <td className="px-3 py-2 text-text-secondary font-mono">{diff.field}</td>
                    <td className="px-3 py-2 text-text-primary bg-danger/5">{diff.valueA}</td>
                    <td className="px-3 py-2 text-text-primary bg-success/5">{diff.valueB}</td>
                  </tr>
                ))}
                {diffs.length > 20 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-text-muted text-center">
                      ...and {diffs.length - 20} more differences
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
