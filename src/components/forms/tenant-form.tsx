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
import { createTenant, updateTenant } from "@/lib/actions";
import type { Tenant, TenantType, OccupationType } from "@/types";

interface TenantFormProps {
  tenant?: Tenant;
  flatId: string;
  isPastTenant?: boolean;
}

export function TenantForm({ tenant, flatId, isPastTenant = false }: TenantFormProps) {
  const router = useRouter();
  const isEditing = !!tenant;
  const [loading, setLoading] = useState(false);
  const [tenantType, setTenantType] = useState<TenantType>(tenant?.tenant_type ?? "family");
  const [form, setForm] = useState({
    name: tenant?.name ?? "",
    phone: tenant?.phone ?? "",
    email: tenant?.email ?? "",
    tenant_type: tenant?.tenant_type ?? "family" as TenantType,
    occupation_type: tenant?.occupation_type ?? "" as OccupationType | "",
    company_name: tenant?.company_name ?? "",
    business_name: tenant?.business_name ?? "",
    family_member_count: tenant?.family_member_count ?? undefined as number | undefined,
    bachelor_occupant_count: tenant?.bachelor_occupant_count ?? undefined as number | undefined,
    bachelor_gender_breakdown: tenant?.bachelor_gender_breakdown ?? "",
    lease_start_date: tenant?.lease_start_date ?? "",
    lease_end_date: tenant?.lease_end_date ?? "",
    security_deposit: tenant?.security_deposit ?? undefined as number | undefined,
    monthly_rent: tenant?.monthly_rent ?? 0,
    monthly_maintenance: tenant?.monthly_maintenance ?? undefined as number | undefined,
    rent_due_day: tenant?.rent_due_day ?? 1,
    exit_date: tenant?.exit_date ?? "",
    exit_reason: tenant?.exit_reason ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tenant name is required");
      return;
    }

    if (isPastTenant && !form.exit_date) {
      toast.error("Exit date is required for past tenants");
      return;
    }

    setLoading(true);
    try {
      const input = {
        flat_id: flatId,
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        tenant_type: form.tenant_type,
        occupation_type: form.occupation_type || undefined,
        company_name: form.company_name || undefined,
        business_name: form.business_name || undefined,
        family_member_count: form.family_member_count,
        bachelor_occupant_count: form.bachelor_occupant_count,
        bachelor_gender_breakdown: form.bachelor_gender_breakdown || undefined,
        lease_start_date: form.lease_start_date || undefined,
        lease_end_date: form.lease_end_date || undefined,
        security_deposit: form.security_deposit,
        monthly_rent: form.monthly_rent,
        monthly_maintenance: form.monthly_maintenance,
        rent_due_day: form.rent_due_day,
        ...(isPastTenant && {
          is_active: false,
          exit_date: form.exit_date || undefined,
          exit_reason: form.exit_reason || undefined,
        }),
      };

      const result = isEditing
        ? await updateTenant(tenant!.id, input)
        : await createTenant(input);

      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success(
        isPastTenant
          ? "Past tenant recorded successfully"
          : isEditing
            ? "Tenant updated successfully"
            : "Tenant added successfully"
      );
      router.push(`/pm/flats/${flatId}/tenant`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Past Tenant Banner */}
      {isPastTenant && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-body-sm text-amber-600 font-medium">
            Recording a past tenant. This tenant will be saved as inactive with exit details.
          </p>
        </div>
      )}

      {/* Personal Info */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-text-secondary">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="bg-bg-page border-border-primary"
              required
              aria-required="true"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-text-secondary">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-secondary">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Tenant Type *</Label>
            <Select
              value={tenantType}
              onValueChange={(v) => {
                setTenantType(v as TenantType);
                setForm({ ...form, tenant_type: v as TenantType });
              }}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Family-specific fields */}
        {tenantType === "family" && (
          <div className="space-y-2">
            <Label htmlFor="family_count" className="text-text-secondary">
              Family Members
            </Label>
            <Input
              id="family_count"
              type="number"
              value={form.family_member_count ?? ""}
              onChange={(e) =>
                setForm({ ...form, family_member_count: parseInt(e.target.value) || undefined })
              }
              placeholder="e.g., 4"
              className="bg-bg-page border-border-primary w-32"
            />
          </div>
        )}

        {/* Bachelor-specific fields */}
        {tenantType === "bachelor" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupant_count" className="text-text-secondary">
                Number of Occupants
              </Label>
              <Input
                id="occupant_count"
                type="number"
                value={form.bachelor_occupant_count ?? ""}
                onChange={(e) =>
                  setForm({ ...form, bachelor_occupant_count: parseInt(e.target.value) || undefined })
                }
                placeholder="e.g., 3"
                className="bg-bg-page border-border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender_breakdown" className="text-text-secondary">
                Gender Breakdown
              </Label>
              <Input
                id="gender_breakdown"
                value={form.bachelor_gender_breakdown}
                onChange={(e) =>
                  setForm({ ...form, bachelor_gender_breakdown: e.target.value })
                }
                placeholder="e.g., 2 boys, 1 girl"
                className="bg-bg-page border-border-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Occupation */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Occupation</h3>

        <div className="space-y-2">
          <Label className="text-text-secondary">Occupation Type</Label>
          <Select
            value={form.occupation_type}
            onValueChange={(v) =>
              setForm({ ...form, occupation_type: v as OccupationType })
            }
          >
            <SelectTrigger className="bg-bg-page border-border-primary">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="business_owner">Business Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.occupation_type === "employee" && (
          <div className="space-y-2">
            <Label htmlFor="company" className="text-text-secondary">Company Name</Label>
            <Input
              id="company"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="e.g., TCS"
              className="bg-bg-page border-border-primary"
            />
          </div>
        )}

        {form.occupation_type === "business_owner" && (
          <div className="space-y-2">
            <Label htmlFor="business" className="text-text-secondary">Business Name</Label>
            <Input
              id="business"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
        )}
      </div>

      {/* Lease Details */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Lease Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lease_start" className="text-text-secondary">Lease Start Date</Label>
            <Input
              id="lease_start"
              type="date"
              value={form.lease_start_date}
              onChange={(e) => setForm({ ...form, lease_start_date: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lease_end" className="text-text-secondary">Lease End Date</Label>
            <Input
              id="lease_end"
              type="date"
              value={form.lease_end_date}
              onChange={(e) => setForm({ ...form, lease_end_date: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deposit" className="text-text-secondary">Security Deposit (Rs.)</Label>
            <Input
              id="deposit"
              type="number"
              value={form.security_deposit ?? ""}
              onChange={(e) =>
                setForm({ ...form, security_deposit: parseFloat(e.target.value) || undefined })
              }
              placeholder="e.g., 112000"
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly_rent" className="text-text-secondary">Monthly Rent (Rs.)</Label>
            <Input
              id="monthly_rent"
              type="number"
              value={form.monthly_rent || ""}
              onChange={(e) =>
                setForm({ ...form, monthly_rent: parseFloat(e.target.value) || 0 })
              }
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_day" className="text-text-secondary">Rent Due Day</Label>
            <Input
              id="due_day"
              type="number"
              value={form.rent_due_day}
              onChange={(e) =>
                setForm({ ...form, rent_due_day: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)) })
              }
              min={1}
              max={28}
              className="bg-bg-page border-border-primary w-24"
            />
          </div>
        </div>
      </div>

      {/* Exit Details (only for past tenants) */}
      {isPastTenant && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
          <h3 className="text-h3 text-text-primary">Exit Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exit_date" className="text-text-secondary">Exit Date *</Label>
              <Input
                id="exit_date"
                type="date"
                value={form.exit_date}
                onChange={(e) => setForm({ ...form, exit_date: e.target.value })}
                className="bg-bg-page border-border-primary"
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exit_reason" className="text-text-secondary">Exit Reason</Label>
            <Textarea
              id="exit_reason"
              value={form.exit_reason}
              onChange={(e) => setForm({ ...form, exit_reason: e.target.value })}
              placeholder="e.g., Relocated to another city, Lease ended, etc."
              className="bg-bg-page border-border-primary"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-light text-white"
        >
          {loading
            ? "Saving..."
            : isPastTenant
              ? "Save Past Tenant"
              : isEditing
                ? "Update Tenant"
                : "Add Tenant"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/pm/flats/${flatId}/tenant`)}
          className="border-border-primary text-text-secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
