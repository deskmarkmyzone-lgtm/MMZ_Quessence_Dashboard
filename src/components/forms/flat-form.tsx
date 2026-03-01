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
import type { Flat, FlatInput, FlatStatus } from "@/types";
import { BHK_OPTIONS } from "@/lib/utils/calculations";
import { createFlat, updateFlat } from "@/lib/actions";

const FLAT_STATUSES = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "under_maintenance", label: "Under Maintenance" },
];

const DEFAULT_MAINTENANCE_RATE_PER_SQFT = 3.68;

interface FlatFormProps {
  flat?: Flat;
  communities?: { id: string; name: string }[];
  owners?: { id: string; name: string }[];
  maintenanceRate?: number;
}

export function FlatForm({ flat, communities = [], owners = [], maintenanceRate }: FlatFormProps) {
  const router = useRouter();
  const effectiveRate = maintenanceRate ?? DEFAULT_MAINTENANCE_RATE_PER_SQFT;
  const isEditing = !!flat;
  const [loading, setLoading] = useState(false);
  const [maintenanceManuallySet, setMaintenanceManuallySet] = useState(false);
  const [form, setForm] = useState<FlatInput>({
    community_id: flat?.community_id ?? "",
    owner_id: flat?.owner_id ?? "",
    flat_number: flat?.flat_number ?? "",
    bhk_type: flat?.bhk_type ?? "",
    carpet_area_sft: flat?.carpet_area_sft ?? undefined,
    base_rent: flat?.base_rent ?? 0,
    maintenance_amount: flat?.maintenance_amount ?? 0,
    rent_due_day: flat?.rent_due_day ?? 1,
    status: flat?.status ?? "vacant",
    notes: flat?.notes ?? "",
  });

  const inclusiveRent = (form.base_rent || 0) + (form.maintenance_amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.flat_number.trim()) {
      toast.error("Flat number is required");
      return;
    }
    if (!form.community_id) {
      toast.error("Please select a community");
      return;
    }
    if (!form.owner_id) {
      toast.error("Please select an owner");
      return;
    }
    if (!form.bhk_type) {
      toast.error("Please select BHK type");
      return;
    }

    setLoading(true);
    try {
      const result = isEditing
        ? await updateFlat(flat!.id, form)
        : await createFlat(form);

      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success(
        isEditing ? "Flat updated successfully" : "Flat created successfully"
      );
      router.push("/pm/flats");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic Info */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4 overflow-visible">
        <h3 className="text-h3 text-text-primary">Flat Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="community" className="text-text-secondary">
              Community *
            </Label>
            <Select
              value={form.community_id}
              onValueChange={(v) => setForm({ ...form, community_id: v })}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner" className="text-text-secondary">
              Owner *
            </Label>
            <Select
              value={form.owner_id}
              onValueChange={(v) => setForm({ ...form, owner_id: v })}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flat_number" className="text-text-secondary">
              Flat Number *
            </Label>
            <Input
              id="flat_number"
              value={form.flat_number}
              onChange={(e) => setForm({ ...form, flat_number: e.target.value })}
              placeholder="e.g., 3154"
              className="bg-bg-page border-border-primary font-mono"
              required
              aria-required="true"
              aria-describedby="flat_number_hint"
            />
            <p id="flat_number_hint" className="text-caption text-text-muted">
              Format: XYZN (Tower-Floor-Unit)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bhk" className="text-text-secondary">
              BHK Type *
            </Label>
            <Select
              value={form.bhk_type}
              onValueChange={(v) => setForm({ ...form, bhk_type: v })}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select BHK" />
              </SelectTrigger>
              <SelectContent>
                {BHK_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area" className="text-text-secondary">
              Carpet Area (sqft)
            </Label>
            <Input
              id="area"
              type="number"
              value={form.carpet_area_sft ?? ""}
              onChange={(e) => {
                const area = e.target.value ? parseFloat(e.target.value) : undefined;
                const updates: Partial<FlatInput> = { carpet_area_sft: area };
                // Auto-calculate maintenance if not manually overridden
                if (!maintenanceManuallySet && area) {
                  updates.maintenance_amount = Math.round(area * effectiveRate);
                }
                setForm({ ...form, ...updates });
              }}
              placeholder="e.g., 1283"
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-text-secondary">
            Status
          </Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as FlatStatus })}
          >
            <SelectTrigger className="bg-bg-page border-border-primary">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {FLAT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rent Details */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Rent Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_rent" className="text-text-secondary">
              Base Rent (Rs.)
            </Label>
            <Input
              id="base_rent"
              type="number"
              value={form.base_rent || ""}
              onChange={(e) =>
                setForm({ ...form, base_rent: parseFloat(e.target.value) || 0 })
              }
              placeholder="e.g., 49748"
              className="bg-bg-page border-border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance" className="text-text-secondary">
              Maintenance (Rs.)
            </Label>
            <Input
              id="maintenance"
              type="number"
              value={form.maintenance_amount || ""}
              onChange={(e) => {
                setMaintenanceManuallySet(true);
                setForm({
                  ...form,
                  maintenance_amount: parseFloat(e.target.value) || 0,
                });
              }}
              placeholder="e.g., 6252"
              className="bg-bg-page border-border-primary"
              aria-describedby="maintenance_hint"
            />
            <p id="maintenance_hint" className="text-caption text-text-muted">
              Auto-calculated at ₹{effectiveRate}/sqft
              {form.carpet_area_sft && !maintenanceManuallySet && (
                <span className="text-accent"> = ₹{Math.round(form.carpet_area_sft * effectiveRate).toLocaleString("en-IN")}</span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-text-secondary">Inclusive Rent</Label>
            <div className="h-9 px-3 flex items-center bg-bg-elevated border border-border-primary rounded-md">
              <span className="text-body text-text-primary font-semibold">
                ₹{inclusiveRent.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-caption text-text-muted">Auto-calculated</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_day" className="text-text-secondary">
            Rent Due Day
          </Label>
          <Input
            id="due_day"
            type="number"
            value={form.rent_due_day ?? 1}
            onChange={(e) =>
              setForm({
                ...form,
                rent_due_day: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
              })
            }
            min={1}
            max={28}
            className="bg-bg-page border-border-primary w-24"
            aria-describedby="due_day_hint"
          />
          <p id="due_day_hint" className="text-caption text-text-muted">
            Day of month when rent is due (1-28)
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Internal Notes</h3>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Add any internal notes about this flat..."
          className="bg-bg-page border-border-primary"
          rows={3}
          aria-label="Internal notes"
          aria-describedby="notes_hint"
        />
        <p id="notes_hint" className="text-caption text-text-muted">
          These notes are only visible to the PM team.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-light text-white"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Flat"
              : "Create Flat"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/pm/flats")}
          className="border-border-primary text-text-secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
