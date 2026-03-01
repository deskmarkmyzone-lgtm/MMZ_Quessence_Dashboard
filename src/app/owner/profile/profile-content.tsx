"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { updateOwnerProfile } from "./actions";

interface OwnerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

interface ProfileContentProps {
  owner: OwnerProfile;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileContent({ owner }: ProfileContentProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: owner.name,
    email: owner.email,
    phone: owner.phone,
    address: owner.address,
    city: owner.city,
    pincode: owner.pincode,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateOwnerProfile(owner.id, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
      });
      if (result.success) {
        toast.success("Profile updated successfully");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-h2 text-text-primary">Profile</h2>
        <p className="text-body text-text-secondary mt-1">
          Manage your account details
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-accent text-white text-h3">
            {getInitials(form.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-body text-text-primary font-semibold">
            {form.name}
          </p>
          <p className="text-body-sm text-text-secondary">{form.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Personal Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary">Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Email</Label>
            <Input
              value={form.email}
              disabled
              className="bg-bg-elevated border-border-primary text-text-muted"
            />
            <p className="text-caption text-text-muted">
              Email cannot be changed (used for login)
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Address</h3>

        <div className="space-y-2">
          <Label className="text-text-secondary">Address</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="bg-bg-page border-border-primary"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary">City</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Pincode</Label>
            <Input
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-accent hover:bg-accent-light text-white"
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
