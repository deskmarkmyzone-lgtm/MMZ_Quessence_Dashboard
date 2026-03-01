"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, Search } from "lucide-react";
import { FileUpload } from "@/components/shared/file-upload";
import { EXPENSE_CATEGORIES } from "@/lib/utils/calculations";
import { recordExpense } from "@/lib/actions";
import { uploadFile } from "@/lib/actions/storage";
import type { ExpenseCategory, ExpenseReporter, ExpensePayer } from "@/types";

interface FlatOption {
  id: string;
  flat_number: string;
  owner: string;
}

interface ExpenseFormProps {
  flats: FlatOption[];
}

export function ExpenseForm({ flats }: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFlat, setSelectedFlat] = useState<FlatOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    category: "" as ExpenseCategory | "",
    description: "",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    vendor_name: "",
    vendor_phone: "",
    reported_by: "pm_inspection" as ExpenseReporter,
    paid_by: "pm" as ExpensePayer,
    remarks: "",
  });

  const filteredFlats = flats.filter(
    (f) =>
      f.flat_number.includes(search) ||
      f.owner.toLowerCase().includes(search.toLowerCase())
  );

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
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please add a description");
      return;
    }
    if (!form.amount) {
      toast.error("Please enter amount");
      return;
    }

    setLoading(true);
    try {
      // Upload receipt files to Supabase Storage
      const uploadedPaths: string[] = [];
      for (const file of receiptFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadResult = await uploadFile(fd, "expense", selectedFlat.id, "receipt");
        if (uploadResult.success && uploadResult.data) {
          uploadedPaths.push(uploadResult.data.path);
        }
      }

      const result = await recordExpense({
        flat_id: selectedFlat.id,
        category: form.category as ExpenseCategory,
        description: form.description,
        amount: form.amount,
        expense_date: form.expense_date,
        vendor_name: form.vendor_name || undefined,
        vendor_phone: form.vendor_phone || undefined,
        reported_by: form.reported_by,
        paid_by: form.paid_by,
        remarks: form.remarks || undefined,
        receipt_file_ids: uploadedPaths.length > 0 ? uploadedPaths : undefined,
      });

      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success("Expense recorded successfully");
      router.push("/pm/expenses");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Flat Selection */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Select Flat</h3>

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
              <div className="absolute z-10 top-full mt-1 w-full bg-bg-card border border-border-primary rounded-lg shadow-lg max-h-64 overflow-y-auto">
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
                  <p className="px-4 py-3 text-body-sm text-text-muted">No flats found</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg">
            <div>
              <span className="text-body text-text-primary font-mono font-bold">
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
              className="text-text-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Expense Details */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Expense Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary">Category *</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm({ ...form, category: v as ExpenseCategory })
              }
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-text-secondary">Amount (Rs.) *</Label>
            <Input
              id="amount"
              type="number"
              value={form.amount || ""}
              onChange={(e) =>
                setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="e.g., 3800"
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-text-secondary">Description *</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g., Geyser filament change"
            className="bg-bg-page border-border-primary"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-text-secondary">Date *</Label>
            <Input
              id="date"
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Reported By</Label>
            <Select
              value={form.reported_by}
              onValueChange={(v) =>
                setForm({ ...form, reported_by: v as ExpenseReporter })
              }
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="pm_inspection">PM Inspection</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Paid By</Label>
            <Select
              value={form.paid_by}
              onValueChange={(v) =>
                setForm({ ...form, paid_by: v as ExpensePayer })
              }
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pm">PM (to recover)</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Vendor */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Vendor Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_name" className="text-text-secondary">Vendor Name</Label>
            <Input
              id="vendor_name"
              value={form.vendor_name}
              onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
              placeholder="e.g., Ravi Electricals"
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor_phone" className="text-text-secondary">Vendor Phone</Label>
            <Input
              id="vendor_phone"
              value={form.vendor_phone}
              onChange={(e) => setForm({ ...form, vendor_phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>
      </div>

      {/* Receipt Upload */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Receipt</h3>
        <FileUpload
          accept="image/*,.pdf"
          maxFiles={5}
          compressToKB={200}
          label=""
          helperText="Upload receipt photos or PDFs · Images auto-compressed"
          onFilesChange={setReceiptFiles}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-light text-white"
        >
          {loading ? "Recording..." : "Record Expense"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/pm/expenses")}
          className="border-border-primary text-text-secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
