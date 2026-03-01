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
import { PAYMENT_METHODS } from "@/lib/utils/calculations";
import { recordRentPayment } from "@/lib/actions";
import { uploadFile } from "@/lib/actions/storage";
import type { PaymentMethod, PaymentStatus } from "@/types";

interface FlatOption {
  id: string;
  flat_number: string;
  inclusive_rent: number;
  base_rent: number;
  maintenance_amount: number;
  community: { name: string } | null;
  owner: { name: string } | null;
  tenant: { id: string; name: string } | null;
}

interface RentPaymentFormProps {
  flats: FlatOption[];
}

export function RentPaymentForm({ flats }: RentPaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFlat, setSelectedFlat] = useState<FlatOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_month: new Date().toISOString().slice(0, 7),
    payment_method: "" as PaymentMethod | "",
    payment_status: "full" as PaymentStatus,
    payment_reference: "",
    remarks: "",
  });

  const filteredFlats = flats.filter(
    (f) =>
      f.flat_number.includes(search) ||
      (f.tenant?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (f.owner?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectFlat = (flat: FlatOption) => {
    setSelectedFlat(flat);
    setSearch("");
    setShowDropdown(false);
    setForm({ ...form, amount: flat.inclusive_rent });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlat) {
      toast.error("Please select a flat");
      return;
    }
    if (!selectedFlat.tenant) {
      toast.error("Selected flat has no active tenant");
      return;
    }
    if (!form.payment_method) {
      toast.error("Please select payment method");
      return;
    }
    if (!form.amount) {
      toast.error("Please enter amount");
      return;
    }

    setLoading(true);
    try {
      // Upload proof files to Supabase Storage
      const uploadedPaths: string[] = [];
      for (const file of proofFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadResult = await uploadFile(fd, "rent_payment", selectedFlat.id, "proof");
        if (uploadResult.success && uploadResult.data) {
          uploadedPaths.push(uploadResult.data.path);
        }
      }

      const result = await recordRentPayment({
        flat_id: selectedFlat.id,
        tenant_id: selectedFlat.tenant.id,
        amount: form.amount,
        payment_date: form.payment_date,
        payment_month: form.payment_month,
        payment_method: form.payment_method as PaymentMethod,
        payment_status: form.payment_status,
        payment_reference: form.payment_reference || undefined,
        base_rent_portion: selectedFlat.base_rent || undefined,
        maintenance_portion: selectedFlat.maintenance_amount || undefined,
        remarks: form.remarks || undefined,
        proof_file_ids: uploadedPaths.length > 0 ? uploadedPaths : undefined,
      });

      if (result.success) {
        toast.success("Rent payment recorded successfully");
        router.push("/pm/rent");
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Flat Selection */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-4 sm:p-6 space-y-4">
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
              placeholder="Search by flat number, tenant name, or owner..."
              className="pl-9 bg-bg-page border-border-primary"
            />
            {showDropdown && search && (
              <div className="absolute z-10 top-full mt-1 w-full bg-bg-card border border-border-primary rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredFlats.map((flat) => (
                  <button
                    key={flat.id}
                    type="button"
                    onClick={() => handleSelectFlat(flat)}
                    className="w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors border-b border-border-primary last:border-0 min-h-[44px]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-body-sm text-text-primary font-mono font-semibold">
                          {flat.flat_number}
                        </span>
                        <span className="text-body-sm text-text-secondary ml-2">
                          — {flat.tenant?.name ?? "No tenant"}
                        </span>
                      </div>
                      <span className="text-body-sm text-text-primary font-medium">
                        ₹{flat.inclusive_rent.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-caption text-text-muted">{flat.owner?.name ?? "-"}</p>
                  </button>
                ))}
                {filteredFlats.length === 0 && (
                  <p className="px-4 py-3 text-body-sm text-text-muted">No flats found</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 p-3 sm:p-4 bg-bg-elevated rounded-lg">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-body text-text-primary font-mono font-bold">
                  {selectedFlat.flat_number}
                </span>
                <span className="text-body-sm text-text-secondary truncate">
                  — {selectedFlat.tenant?.name ?? "No tenant"}
                </span>
              </div>
              <p className="text-caption text-text-muted truncate">{selectedFlat.owner?.name ?? "-"}</p>
              <p className="text-caption text-accent mt-1">
                Expected: ₹{selectedFlat.inclusive_rent.toLocaleString("en-IN")}/month
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFlat(null)}
              className="text-text-muted shrink-0 h-10 w-10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Payment Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-text-secondary">
              Amount (Rs.) *
            </Label>
            <Input
              id="amount"
              type="number"
              value={form.amount || ""}
              onChange={(e) =>
                setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
              }
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-text-secondary">
              Payment Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary">Payment Month *</Label>
            <Input
              type="month"
              value={form.payment_month}
              onChange={(e) => setForm({ ...form, payment_month: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Payment Method *</Label>
            <Select
              value={form.payment_method}
              onValueChange={(v) =>
                setForm({ ...form, payment_method: v as PaymentMethod })
              }
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Payment Status</Label>
            <Select
              value={form.payment_status}
              onValueChange={(v) =>
                setForm({ ...form, payment_status: v as PaymentStatus })
              }
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Payment</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference" className="text-text-secondary">
            Transaction Reference (UTR/ID)
          </Label>
          <Input
            id="reference"
            value={form.payment_reference}
            onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
            placeholder="e.g., UTR123456789"
            className="bg-bg-page border-border-primary"
          />
        </div>
      </div>

      {/* Payment Proof */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Payment Proof</h3>
        <FileUpload
          accept="image/*"
          maxFiles={5}
          compressToKB={200}
          label=""
          helperText="Images will be auto-compressed before upload"
          onFilesChange={setProofFiles}
        />
      </div>

      {/* Remarks */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Remarks</h3>
        <Textarea
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          placeholder="Any notes about this payment..."
          className="bg-bg-page border-border-primary"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-light text-white h-11 sm:h-10"
        >
          {loading ? "Recording..." : "Record Payment"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/pm/rent")}
          className="border-border-primary text-text-secondary h-11 sm:h-10"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
