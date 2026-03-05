"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import type {
  TenantType,
  OccupationType,
  TenantGender,
} from "@/types";
import { logAudit } from "./audit";
import { createNotification } from "./notifications";

export interface TenantInput {
  flat_id: string;
  name: string;
  phone?: string;
  email?: string;
  tenant_type: TenantType;
  occupation_type?: OccupationType;
  company_name?: string;
  business_name?: string;
  family_member_count?: number;
  bachelor_occupant_count?: number;
  bachelor_gender?: TenantGender;
  bachelor_gender_breakdown?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  security_deposit?: number;
  monthly_rent: number;
  monthly_maintenance?: number;
  monthly_inclusive_rent?: number;
  rent_due_day?: number;
  is_active?: boolean;
  exit_date?: string;
  exit_reason?: string;
}

export async function createTenant(
  input: TenantInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.flat_id) {
      return { success: false, error: "Flat is required" };
    }
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Tenant name is required" };
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: pmUser } = await supabase
      .from("pm_users")
      .select("id")
      .eq("auth_user_id", user?.id)
      .single();

    const inclusiveRent =
      input.monthly_inclusive_rent ??
      (input.monthly_rent ?? 0) + (input.monthly_maintenance ?? 0);

    const isActive = input.is_active !== false; // default true

    const { data, error } = await supabase
      .from("tenants")
      .insert({
        flat_id: input.flat_id,
        name: input.name.trim(),
        phone: input.phone ?? null,
        email: input.email ?? null,
        tenant_type: input.tenant_type,
        occupation_type: input.occupation_type ?? null,
        company_name: input.company_name ?? null,
        business_name: input.business_name ?? null,
        family_member_count: input.family_member_count ?? null,
        bachelor_occupant_count: input.bachelor_occupant_count ?? null,
        bachelor_gender: input.bachelor_gender ?? null,
        bachelor_gender_breakdown: input.bachelor_gender_breakdown ?? null,
        lease_start_date: input.lease_start_date ?? null,
        lease_end_date: input.lease_end_date ?? null,
        security_deposit: input.security_deposit ?? null,
        monthly_rent: input.monthly_rent,
        monthly_maintenance: input.monthly_maintenance ?? null,
        monthly_inclusive_rent: inclusiveRent,
        rent_due_day: input.rent_due_day ?? 1,
        is_active: isActive,
        exit_date: input.exit_date ?? null,
        exit_reason: input.exit_reason ?? null,
        created_by: pmUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Only update flat status to occupied for active tenants
    if (isActive) {
      const { error: flatError } = await supabase
        .from("flats")
        .update({ status: "occupied" })
        .eq("id", input.flat_id);

      if (flatError) {
        console.error("Failed to update flat status:", flatError.message);
      }
    }

    await logAudit({
      action: "create",
      entity_type: "tenant",
      entity_id: data.id,
      description: `Created tenant "${input.name}" for flat ${input.flat_id}`,
    });

    // Notify the flat's owner about the new tenant
    const { data: flat } = await supabase
      .from("flats")
      .select("flat_number, owner_id")
      .eq("id", input.flat_id)
      .single();

    if (flat?.owner_id) {
      const flatLabel = flat.flat_number ?? input.flat_id;
      await createNotification({
        recipient_type: "owner",
        recipient_id: flat.owner_id,
        notification_type: "tenant_added",
        title: "New Tenant Added",
        message: `New tenant ${input.name} added to Flat ${flatLabel}`,
        entity_type: "tenant",
        entity_id: data.id,
      }).catch(() => {}); // Non-blocking
    }

    revalidatePath("/pm/tenants");
    revalidatePath("/pm/flats");
    revalidatePath(`/pm/flats/${input.flat_id}`);

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create tenant",
    };
  }
}

export async function updateTenant(
  id: string,
  input: Partial<TenantInput>
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.tenant_type !== undefined)
      updateData.tenant_type = input.tenant_type;
    if (input.occupation_type !== undefined)
      updateData.occupation_type = input.occupation_type;
    if (input.company_name !== undefined)
      updateData.company_name = input.company_name;
    if (input.business_name !== undefined)
      updateData.business_name = input.business_name;
    if (input.family_member_count !== undefined)
      updateData.family_member_count = input.family_member_count;
    if (input.bachelor_occupant_count !== undefined)
      updateData.bachelor_occupant_count = input.bachelor_occupant_count;
    if (input.bachelor_gender !== undefined)
      updateData.bachelor_gender = input.bachelor_gender;
    if (input.bachelor_gender_breakdown !== undefined)
      updateData.bachelor_gender_breakdown = input.bachelor_gender_breakdown;
    if (input.lease_start_date !== undefined)
      updateData.lease_start_date = input.lease_start_date;
    if (input.lease_end_date !== undefined)
      updateData.lease_end_date = input.lease_end_date;
    if (input.security_deposit !== undefined)
      updateData.security_deposit = input.security_deposit;
    if (input.monthly_rent !== undefined)
      updateData.monthly_rent = input.monthly_rent;
    if (input.monthly_maintenance !== undefined)
      updateData.monthly_maintenance = input.monthly_maintenance;
    if (input.monthly_inclusive_rent !== undefined)
      updateData.monthly_inclusive_rent = input.monthly_inclusive_rent;
    if (input.rent_due_day !== undefined)
      updateData.rent_due_day = input.rent_due_day;

    const { error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "tenant",
      entity_id: id,
      description: `Updated tenant ${id}`,
      changes: updateData as Record<string, unknown>,
    });

    revalidatePath("/pm/tenants");
    revalidatePath("/pm/flats");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update tenant",
    };
  }
}

export async function exitTenant(
  tenantId: string,
  input: { exit_date: string; exit_reason?: string }
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    // Get the tenant's flat_id before deactivating
    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("flat_id, name")
      .eq("id", tenantId)
      .single();

    if (fetchError || !tenant) {
      return { success: false, error: "Tenant not found" };
    }

    // Deactivate the tenant
    const { error: tenantError } = await supabase
      .from("tenants")
      .update({
        is_active: false,
        exit_date: input.exit_date,
        exit_reason: input.exit_reason ?? null,
      })
      .eq("id", tenantId);

    if (tenantError) {
      return { success: false, error: tenantError.message };
    }

    // Set flat back to vacant
    const { error: flatError } = await supabase
      .from("flats")
      .update({ status: "vacant" })
      .eq("id", tenant.flat_id);

    if (flatError) {
      console.error("Failed to update flat status:", flatError.message);
    }

    await logAudit({
      action: "update",
      entity_type: "tenant",
      entity_id: tenantId,
      description: `Exited tenant "${tenant.name}" from flat ${tenant.flat_id}`,
      changes: {
        is_active: false,
        exit_date: input.exit_date,
        exit_reason: input.exit_reason ?? null,
      },
    });

    // Notify the flat's owner about the tenant exit
    const { data: flat } = await supabase
      .from("flats")
      .select("flat_number, owner_id")
      .eq("id", tenant.flat_id)
      .single();

    if (flat?.owner_id) {
      const flatLabel = flat.flat_number ?? tenant.flat_id;
      await createNotification({
        recipient_type: "owner",
        recipient_id: flat.owner_id,
        notification_type: "tenant_exited",
        title: "Tenant Exited",
        message: `Tenant ${tenant.name} has exited Flat ${flatLabel}`,
        entity_type: "tenant",
        entity_id: tenantId,
      }).catch(() => {}); // Non-blocking
    }

    revalidatePath("/pm/tenants");
    revalidatePath("/pm/flats");
    revalidatePath(`/pm/flats/${tenant.flat_id}`);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to exit tenant",
    };
  }
}

export async function reactivateTenant(tenantId: string): Promise<ActionResult> {
  try {
    // Role check: only admin/super_admin can undo tenant exits
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: pmUser } = await supabase
        .from("pm_users")
        .select("role")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();
      if (pmUser && pmUser.role === "manager") {
        return { success: false, error: "Only admins and super admins can undo tenant exits. Please contact your admin." };
      }
    }

    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("flat_id, name")
      .eq("id", tenantId)
      .single();

    if (fetchError || !tenant) {
      return { success: false, error: "Tenant not found" };
    }

    // Reactivate the tenant
    const { error: tenantError } = await supabase
      .from("tenants")
      .update({
        is_active: true,
        exit_date: null,
        exit_reason: null,
      })
      .eq("id", tenantId);

    if (tenantError) {
      return { success: false, error: tenantError.message };
    }

    // Set flat back to occupied
    const { error: flatError } = await supabase
      .from("flats")
      .update({ status: "occupied" })
      .eq("id", tenant.flat_id);

    if (flatError) {
      console.error("Failed to update flat status:", flatError.message);
    }

    await logAudit({
      action: "update",
      entity_type: "tenant",
      entity_id: tenantId,
      description: `Reactivated tenant "${tenant.name}" for flat ${tenant.flat_id}`,
      changes: { is_active: true, exit_date: null, exit_reason: null },
    });

    revalidatePath("/pm/tenants");
    revalidatePath("/pm/flats");
    revalidatePath(`/pm/flats/${tenant.flat_id}`);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reactivate tenant",
    };
  }
}
