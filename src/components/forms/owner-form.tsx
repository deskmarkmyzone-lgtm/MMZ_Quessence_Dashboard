"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createOwner, updateOwner } from "@/lib/actions";
import type { Owner, OwnerInput, BrokerageCalcMethod, CommunicationPref } from "@/types";

const BROKERAGE_METHODS = [
  { value: "days_of_rent", label: "Days of Rent" },
  { value: "percentage", label: "Percentage of Rent" },
  { value: "fixed_amount", label: "Fixed Amount" },
];

const COMMUNICATION_PREFS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "both", label: "Both" },
];

interface OwnerFormProps {
  owner?: Owner;
  communities?: { id: string; name: string }[];
}

export function OwnerForm({ owner, communities }: OwnerFormProps) {
  const router = useRouter();
  const isEditing = !!owner;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<OwnerInput>({
    name: owner?.name ?? "",
    email: owner?.email ?? "",
    phone: owner?.phone ?? "",
    pan_number: owner?.pan_number ?? "",
    address: owner?.address ?? "",
    city: owner?.city ?? "Hyderabad",
    pincode: owner?.pincode ?? "",
    brokerage_calc_method: owner?.brokerage_calc_method ?? "days_of_rent",
    brokerage_days: owner?.brokerage_days ?? 8,
    brokerage_percentage: owner?.brokerage_percentage ?? undefined,
    brokerage_fixed_amount: owner?.brokerage_fixed_amount ?? undefined,
    gst_applicable: owner?.gst_applicable ?? false,
    gst_number: owner?.gst_number ?? "",
    communication_pref: owner?.communication_pref ?? "both",
    family_group_name: owner?.family_group_name ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Owner name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Owner email is required");
      return;
    }

    setLoading(true);
    try {
      const result = isEditing
        ? await updateOwner(owner.id, form)
        : await createOwner(form);

      if (result.success) {
        toast.success(
          isEditing ? "Owner updated successfully" : "Owner created successfully"
        );
        router.push("/pm/owners");
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
      {/* Basic Info */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-text-secondary">
              Owner Name *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., R. Krishna Kumar"
              className="bg-bg-page border-border-primary"
              required
              aria-required="true"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-secondary">
              Email * (used for owner portal login)
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g., krishna@gmail.com"
              className="bg-bg-page border-border-primary"
              required
              aria-required="true"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-text-secondary">
              Phone
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan" className="text-text-secondary">
              PAN Number
            </Label>
            <Input
              id="pan"
              value={form.pan_number}
              onChange={(e) =>
                setForm({ ...form, pan_number: e.target.value.toUpperCase() })
              }
              placeholder="ABCDE1234F"
              maxLength={10}
              className="bg-bg-page border-border-primary uppercase"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-text-secondary">
            Address
          </Label>
          <Textarea
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full address"
            className="bg-bg-page border-border-primary"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-text-secondary">
              City
            </Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode" className="text-text-secondary">
              Pincode
            </Label>
            <Input
              id="pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              placeholder="500032"
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comm_pref" className="text-text-secondary">
            Communication Preference
          </Label>
          <Select
            value={form.communication_pref}
            onValueChange={(v) =>
              setForm({ ...form, communication_pref: v as CommunicationPref })
            }
          >
            <SelectTrigger className="bg-bg-page border-border-primary">
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              {COMMUNICATION_PREFS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Brokerage Configuration */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Brokerage Fee Configuration</h3>
        <p className="text-body-sm text-text-muted">
          Configure how brokerage is calculated when a new tenant is placed.
        </p>

        <div className="space-y-2">
          <Label htmlFor="brokerage_method" className="text-text-secondary">
            Calculation Method
          </Label>
          <Select
            value={form.brokerage_calc_method}
            onValueChange={(v) =>
              setForm({ ...form, brokerage_calc_method: v as BrokerageCalcMethod })
            }
          >
            <SelectTrigger className="bg-bg-page border-border-primary">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {BROKERAGE_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.brokerage_calc_method === "days_of_rent" && (
          <div className="space-y-2">
            <Label htmlFor="brokerage_days" className="text-text-secondary">
              Number of Days
            </Label>
            <Input
              id="brokerage_days"
              type="number"
              value={form.brokerage_days ?? 8}
              onChange={(e) =>
                setForm({
                  ...form,
                  brokerage_days: parseInt(e.target.value) || 8,
                })
              }
              min={1}
              max={30}
              className="bg-bg-page border-border-primary"
              aria-describedby="brokerage_days_hint"
            />
            <p id="brokerage_days_hint" className="text-caption text-text-muted">
              Brokerage = (Monthly Inclusive Rent / 30) x Days
            </p>
          </div>
        )}

        {form.brokerage_calc_method === "percentage" && (
          <div className="space-y-2">
            <Label htmlFor="brokerage_pct" className="text-text-secondary">
              Percentage (%)
            </Label>
            <Input
              id="brokerage_pct"
              type="number"
              value={form.brokerage_percentage ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  brokerage_percentage: parseFloat(e.target.value) || undefined,
                })
              }
              step="0.5"
              min={0}
              max={100}
              placeholder="e.g., 8.33"
              className="bg-bg-page border-border-primary"
              aria-describedby="brokerage_pct_hint"
            />
            <p id="brokerage_pct_hint" className="text-caption text-text-muted">
              Brokerage = Monthly Inclusive Rent x (Percentage / 100)
            </p>
          </div>
        )}

        {form.brokerage_calc_method === "fixed_amount" && (
          <div className="space-y-2">
            <Label htmlFor="brokerage_fixed" className="text-text-secondary">
              Fixed Amount (Rs.)
            </Label>
            <Input
              id="brokerage_fixed"
              type="number"
              value={form.brokerage_fixed_amount ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  brokerage_fixed_amount: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder="e.g., 15000"
              className="bg-bg-page border-border-primary"
            />
          </div>
        )}

        <p id="tds_hint" className="text-caption text-text-muted">
          TDS of 2% will be automatically deducted by the owner from the brokerage amount.
        </p>
      </div>

      {/* GST */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">GST Configuration</h3>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-text-primary">GST Applicable</Label>
            <p className="text-caption text-text-muted">
              Enable if GST is applicable on brokerage for this owner
            </p>
          </div>
          <Switch
            checked={form.gst_applicable}
            onCheckedChange={(checked) =>
              setForm({ ...form, gst_applicable: checked })
            }
          />
        </div>

        {form.gst_applicable && (
          <div className="space-y-2">
            <Label htmlFor="gst_number" className="text-text-secondary">
              GST Number
            </Label>
            <Input
              id="gst_number"
              value={form.gst_number}
              onChange={(e) =>
                setForm({ ...form, gst_number: e.target.value.toUpperCase() })
              }
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              className="bg-bg-page border-border-primary uppercase"
            />
          </div>
        )}
      </div>

      {/* Family Group */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Family Group</h3>
        <p className="text-body-sm text-text-muted">
          Group related owners together for combined invoicing.
        </p>

        <div className="space-y-2">
          <Label htmlFor="family_group" className="text-text-secondary">
            Family Group Name
          </Label>
          <Input
            id="family_group"
            value={form.family_group_name}
            onChange={(e) =>
              setForm({ ...form, family_group_name: e.target.value })
            }
            placeholder="e.g., Krishna Kumar Family"
            className="bg-bg-page border-border-primary"
            aria-describedby="family_group_hint"
          />
          <p id="family_group_hint" className="text-caption text-text-muted">
            Leave empty if this owner is not part of a family group.
          </p>
        </div>
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
              ? "Update Owner"
              : "Create Owner"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/pm/owners")}
          className="border-border-primary text-text-secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
