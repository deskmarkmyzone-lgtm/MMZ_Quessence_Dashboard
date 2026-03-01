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
import { createCommunity, updateCommunity } from "@/lib/actions";
import type { Community, CommunityInput } from "@/types";

const COMMUNITY_TYPES = [
  { value: "gated_community", label: "Gated Community" },
  { value: "apartment_complex", label: "Apartment Complex" },
  { value: "villa_project", label: "Villa Project" },
  { value: "other", label: "Other" },
];

interface CommunityFormProps {
  community?: Community;
}

export function CommunityForm({ community }: CommunityFormProps) {
  const router = useRouter();
  const isEditing = !!community;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CommunityInput>({
    name: community?.name ?? "",
    address: community?.address ?? "",
    city: community?.city ?? "Hyderabad",
    state: community?.state ?? "Telangana",
    pincode: community?.pincode ?? "",
    total_units: community?.total_units ?? undefined,
    community_type: community?.community_type ?? "",
    contact_person_name: community?.contact_person_name ?? "",
    contact_person_phone: community?.contact_person_phone ?? "",
    contact_person_email: community?.contact_person_email ?? "",
    association_name: community?.association_name ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Community name is required");
      return;
    }

    setLoading(true);
    try {
      const result = isEditing
        ? await updateCommunity(community.id, form)
        : await createCommunity(form);

      if (result.success) {
        toast.success(
          isEditing ? "Community updated successfully" : "Community created successfully"
        );
        router.push("/pm/communities");
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
              Community Name *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Prestige High Fields"
              className="bg-bg-page border-border-primary"
              required
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-text-secondary">
              Community Type
            </Label>
            <Select
              value={form.community_type}
              onValueChange={(v) => setForm({ ...form, community_type: v })}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {COMMUNITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Label htmlFor="state" className="text-text-secondary">
              State
            </Label>
            <Input
              id="state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total_units" className="text-text-secondary">
              Total Units
            </Label>
            <Input
              id="total_units"
              type="number"
              value={form.total_units ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  total_units: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="e.g., 2500"
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="association" className="text-text-secondary">
              Association Name
            </Label>
            <Input
              id="association"
              value={form.association_name}
              onChange={(e) =>
                setForm({ ...form, association_name: e.target.value })
              }
              placeholder="e.g., PHF Owners Association"
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>
      </div>

      {/* Contact Person */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Contact Person</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_name" className="text-text-secondary">
              Name
            </Label>
            <Input
              id="contact_name"
              value={form.contact_person_name}
              onChange={(e) =>
                setForm({ ...form, contact_person_name: e.target.value })
              }
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone" className="text-text-secondary">
              Phone
            </Label>
            <Input
              id="contact_phone"
              value={form.contact_person_phone}
              onChange={(e) =>
                setForm({ ...form, contact_person_phone: e.target.value })
              }
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="text-text-secondary">
              Email
            </Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_person_email}
              onChange={(e) =>
                setForm({ ...form, contact_person_email: e.target.value })
              }
              className="bg-bg-page border-border-primary"
            />
          </div>
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
              ? "Update Community"
              : "Create Community"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/pm/communities")}
          className="border-border-primary text-text-secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
