"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { recordMaintenance } from "@/lib/actions";

interface MaintenanceRecord {
  id: string;
  flat_number: string;
  bhk: string;
  sqft: number;
  quarter: string;
  amount: number;
  pending: number;
  total: number;
  paid: boolean;
  owner: string;
}

interface FlatOption {
  id: string;
  flat_number: string;
  owner: string;
}

// Indian Financial Year quarters (Apr–Mar)
const QUARTERS = [
  "Q4-FY25 (Jan-Mar 2025)",
  "Q1-FY26 (Apr-Jun 2025)",
  "Q2-FY26 (Jul-Sep 2025)",
  "Q3-FY26 (Oct-Dec 2025)",
  "Q4-FY26 (Jan-Mar 2026)",
  "Q1-FY27 (Apr-Jun 2026)",
  "Q2-FY27 (Jul-Sep 2026)",
  "Q3-FY27 (Oct-Dec 2026)",
];

export function MaintenanceContent({
  records,
  flats,
}: {
  records: MaintenanceRecord[];
  flats: FlatOption[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [quarterFilter, setQuarterFilter] = useState(searchParams.get("quarter") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/maintenance?${params.toString()}`, { scroll: false });
  };

  const filteredRecords = records.filter((m) => {
    const matchesSearch = !search ||
      m.flat_number.toLowerCase().includes(search.toLowerCase()) ||
      m.owner.toLowerCase().includes(search.toLowerCase());
    const matchesQuarter = quarterFilter === "all" || m.quarter === quarterFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "paid" && m.paid) ||
      (statusFilter === "unpaid" && !m.paid);
    return matchesSearch && matchesQuarter && matchesStatus;
  });

  const totalAmount = filteredRecords.reduce((sum, m) => sum + m.total, 0);
  const paidCount = filteredRecords.filter((m) => m.paid).length;
  const quarterOptions = Array.from(new Set(records.map((m) => m.quarter))).sort();

  return (
    <div className="w-full">
      <PageHeader
        title="Community Maintenance"
        description={`${filteredRecords.length} records · ₹${totalAmount.toLocaleString("en-IN")} total · ${paidCount} paid`}
        actionLabel="Record Maintenance"
        onAction={() => setDialogOpen(true)}
      />

      {/* Record Maintenance Dialog */}
      <MaintenanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        flats={flats}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateURL({ q: e.target.value });
            }}
            placeholder="Search flat or owner..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <Select value={quarterFilter} onValueChange={(v) => {
          setQuarterFilter(v);
          updateURL({ quarter: v });
        }}>
          <SelectTrigger className="w-[160px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Quarters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quarters</SelectItem>
            {quarterOptions.map((q) => (
              <SelectItem key={q} value={q}>{q}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => {
          setStatusFilter(v);
          updateURL({ status: v });
        }}>
          <SelectTrigger className="w-[140px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Maintenance Table */}
      <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Flat</th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">BHK</th>
              <th className="text-right text-caption text-text-muted font-medium px-4 py-3">SFT</th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Quarter</th>
              <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Amount</th>
              <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Pending</th>
              <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Total</th>
              <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Owner</th>
              <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((m) => (
              <tr key={m.id} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3">
                  <span className="text-body-sm text-text-primary font-mono font-semibold">{m.flat_number}</span>
                </td>
                <td className="px-4 py-3 text-body-sm text-text-secondary">{m.bhk}</td>
                <td className="px-4 py-3 text-right text-body-sm text-text-secondary">{m.sqft.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-body-sm text-text-secondary">{m.quarter}</td>
                <td className="px-4 py-3 text-right text-body-sm text-text-primary">₹{m.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right text-body-sm text-text-primary">
                  {m.pending > 0 ? `₹${m.pending.toLocaleString("en-IN")}` : "-"}
                </td>
                <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">₹{m.total.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-body-sm text-text-secondary">{m.owner}</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={m.paid ? "paid" : "unpaid"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Maintenance Form Dialog                                            */
/* ------------------------------------------------------------------ */

function MaintenanceFormDialog({
  open,
  onOpenChange,
  flats,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flats: FlatOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFlat, setSelectedFlat] = useState<FlatOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({
    quarter: "",
    period_start: "",
    period_end: "",
    maintenance_amount: 0,
    previous_pending: 0,
    is_paid: false,
    paid_date: "",
    paid_by: "",
  });

  const filteredFlats = flats.filter(
    (f) =>
      f.flat_number.toLowerCase().includes(search.toLowerCase()) ||
      f.owner.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setSelectedFlat(null);
    setSearch("");
    setShowDropdown(false);
    setForm({
      quarter: "",
      period_start: "",
      period_end: "",
      maintenance_amount: 0,
      previous_pending: 0,
      is_paid: false,
      paid_date: "",
      paid_by: "",
    });
  };

  const handleSelectFlat = (flat: FlatOption) => {
    setSelectedFlat(flat);
    setSearch("");
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFlat) {
      toast.error("Please select a flat");
      return;
    }
    if (!form.quarter) {
      toast.error("Please select a quarter");
      return;
    }
    if (!form.period_start) {
      toast.error("Please enter the period start date");
      return;
    }
    if (!form.period_end) {
      toast.error("Please enter the period end date");
      return;
    }
    if (!form.maintenance_amount || form.maintenance_amount <= 0) {
      toast.error("Please enter a valid maintenance amount");
      return;
    }

    setLoading(true);
    try {
      const result = await recordMaintenance({
        flat_id: selectedFlat.id,
        quarter: form.quarter,
        period_start: form.period_start,
        period_end: form.period_end,
        maintenance_amount: form.maintenance_amount,
        previous_pending: form.previous_pending,
        is_paid: form.is_paid,
        paid_date: form.is_paid && form.paid_date ? form.paid_date : undefined,
        paid_by: form.is_paid && form.paid_by ? form.paid_by : undefined,
      });

      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success("Maintenance record created successfully");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm();
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-bg-card border-border-primary">
        <DialogHeader>
          <DialogTitle className="text-h3 text-text-primary">
            Record Maintenance
          </DialogTitle>
          <DialogDescription className="text-body-sm text-text-secondary">
            Add a new maintenance charge for a flat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Flat Selection */}
          <div className="space-y-2">
            <Label className="text-text-secondary">Flat *</Label>
            {!selectedFlat ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by flat number or owner..."
                  className="pl-9 bg-bg-page border-border-primary"
                />
                {showDropdown && search && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-bg-card border border-border-primary rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredFlats.map((flat) => (
                      <button
                        key={flat.id}
                        type="button"
                        onClick={() => handleSelectFlat(flat)}
                        className="w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors border-b border-border-primary last:border-0"
                      >
                        <span className="text-body-sm text-text-primary font-mono font-semibold">
                          {flat.flat_number}
                        </span>
                        <span className="text-body-sm text-text-secondary ml-2">
                          — {flat.owner}
                        </span>
                      </button>
                    ))}
                    {filteredFlats.length === 0 && (
                      <p className="px-4 py-3 text-body-sm text-text-muted">
                        No flats found
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg">
                <div>
                  <span className="text-body-sm text-text-primary font-mono font-bold">
                    {selectedFlat.flat_number}
                  </span>
                  <span className="text-body-sm text-text-secondary ml-2">
                    — {selectedFlat.owner}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFlat(null)}
                  className="text-text-muted h-10 w-10"
                  aria-label="Clear flat filter"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>

          {/* Quarter */}
          <div className="space-y-2">
            <Label className="text-text-secondary">Quarter *</Label>
            <Select
              value={form.quarter}
              onValueChange={(v) => setForm({ ...form, quarter: v })}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                {QUARTERS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_start" className="text-text-secondary">
                Period Start *
              </Label>
              <Input
                id="period_start"
                type="date"
                value={form.period_start}
                onChange={(e) =>
                  setForm({ ...form, period_start: e.target.value })
                }
                className="bg-bg-page border-border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end" className="text-text-secondary">
                Period End *
              </Label>
              <Input
                id="period_end"
                type="date"
                value={form.period_end}
                onChange={(e) =>
                  setForm({ ...form, period_end: e.target.value })
                }
                className="bg-bg-page border-border-primary"
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance_amount" className="text-text-secondary">
                Maintenance Amount (Rs.) *
              </Label>
              <Input
                id="maintenance_amount"
                type="number"
                value={form.maintenance_amount || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maintenance_amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="e.g., 3500"
                className="bg-bg-page border-border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previous_pending" className="text-text-secondary">
                Previous Pending (Rs.)
              </Label>
              <Input
                id="previous_pending"
                type="number"
                value={form.previous_pending || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    previous_pending: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="bg-bg-page border-border-primary"
              />
            </div>
          </div>

          {/* Is Paid */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_paid"
              checked={form.is_paid}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  is_paid: checked === true,
                  paid_date: checked !== true ? "" : form.paid_date,
                  paid_by: checked !== true ? "" : form.paid_by,
                })
              }
            />
            <Label htmlFor="is_paid" className="text-text-secondary cursor-pointer">
              Marked as paid
            </Label>
          </div>

          {/* Paid Details (conditional) */}
          {form.is_paid && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paid_date" className="text-text-secondary">
                  Paid Date
                </Label>
                <Input
                  id="paid_date"
                  type="date"
                  value={form.paid_date}
                  onChange={(e) =>
                    setForm({ ...form, paid_date: e.target.value })
                  }
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">Paid By</Label>
                <Select
                  value={form.paid_by}
                  onValueChange={(v) => setForm({ ...form, paid_by: v })}
                >
                  <SelectTrigger className="bg-bg-page border-border-primary">
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent-light text-white"
            >
              {loading ? "Recording..." : "Record Maintenance"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="border-border-primary text-text-secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
