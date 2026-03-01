"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import { logAudit } from "./audit";

export interface BankDetailsInput {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name?: string;
  upi_id?: string;
}

export interface InvoiceSettingsInput {
  company_name: string;
  company_address?: string;
  gstin?: string;
  pan?: string;
  invoice_prefix?: string;
  invoice_footer_note?: string;
  logo_file_id?: string;
}

export async function updateBankDetails(
  input: BankDetailsInput
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("mmz_settings")
      .update({
        bank_name: input.bank_name,
        account_holder_name: input.account_holder_name,
        account_number: input.account_number,
        ifsc_code: input.ifsc_code,
        branch_name: input.branch_name ?? null,
        upi_id: input.upi_id ?? null,
      })
      .eq("id", 1);

    if (error) {
      // If no row exists yet, try inserting
      const { error: insertError } = await supabase
        .from("mmz_settings")
        .upsert({
          id: 1,
          bank_name: input.bank_name,
          account_holder_name: input.account_holder_name,
          account_number: input.account_number,
          ifsc_code: input.ifsc_code,
          branch_name: input.branch_name ?? null,
          upi_id: input.upi_id ?? null,
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    await logAudit({
      action: "update",
      entity_type: "settings",
      entity_id: "bank_details",
      description: "Updated bank details",
    });

    revalidatePath("/pm/settings");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update bank details",
    };
  }
}

export async function updateInvoiceSettings(
  input: InvoiceSettingsInput
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("mmz_settings")
      .update({
        company_name: input.company_name,
        company_address: input.company_address ?? null,
        gstin: input.gstin ?? null,
        pan: input.pan ?? null,
        invoice_prefix: input.invoice_prefix ?? null,
        invoice_footer_note: input.invoice_footer_note ?? null,
        logo_file_id: input.logo_file_id ?? null,
      })
      .eq("id", 1);

    if (error) {
      const { error: insertError } = await supabase
        .from("mmz_settings")
        .upsert({
          id: 1,
          company_name: input.company_name,
          company_address: input.company_address ?? null,
          gstin: input.gstin ?? null,
          pan: input.pan ?? null,
          invoice_prefix: input.invoice_prefix ?? null,
          invoice_footer_note: input.invoice_footer_note ?? null,
          logo_file_id: input.logo_file_id ?? null,
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    await logAudit({
      action: "update",
      entity_type: "settings",
      entity_id: "invoice_settings",
      description: "Updated invoice settings",
    });

    revalidatePath("/pm/settings");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update invoice settings",
    };
  }
}

export async function addTeamMember(input: {
  email: string;
  name: string;
  role: string;
}): Promise<ActionResult> {
  try {
    if (!input.email || input.email.trim().length === 0) {
      return { success: false, error: "Email is required" };
    }
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Name is required" };
    }
    if (!input.role) {
      return { success: false, error: "Role is required" };
    }

    const supabase = createClient();

    const { error } = await supabase.from("pm_users").insert({
      email: input.email.trim(),
      name: input.name.trim(),
      role: input.role,
      // auth_user_id is not set here — it gets linked on first login
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "create",
      entity_type: "pm_user",
      entity_id: input.email,
      description: `Added team member "${input.name}" with role ${input.role}`,
    });

    revalidatePath("/pm/settings");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to add team member",
    };
  }
}

export async function updateTeamMemberRole(
  id: string,
  role: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("pm_users")
      .update({ role })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "pm_user",
      entity_id: id,
      description: `Updated team member ${id} role to ${role}`,
      changes: { role },
    });

    revalidatePath("/pm/settings");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update team member role",
    };
  }
}

export async function updateNotificationPreferences(
  preferences: {
    notification_type: string;
    in_app_enabled: boolean;
    email_enabled: boolean;
  }[]
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: pmUser } = await supabase
      .from("pm_users")
      .select("id")
      .eq("auth_user_id", user?.id)
      .single();

    if (!pmUser) {
      return { success: false, error: "Not authenticated as PM user" };
    }

    // Upsert each preference
    for (const pref of preferences) {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_type: "pm",
            user_id: pmUser.id,
            notification_type: pref.notification_type,
            in_app_enabled: pref.in_app_enabled,
            email_enabled: pref.email_enabled,
          },
          {
            onConflict: "user_type,user_id,notification_type",
          }
        );

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/pm/settings");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update notification preferences",
    };
  }
}

export async function updateCalculationSettings(
  input: { maintenance_rate_per_sqft: number }
): Promise<ActionResult> {
  try {
    if (
      input.maintenance_rate_per_sqft === undefined ||
      input.maintenance_rate_per_sqft === null ||
      input.maintenance_rate_per_sqft <= 0
    ) {
      return {
        success: false,
        error: "Maintenance rate must be a positive number",
      };
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("mmz_settings")
      .update({
        maintenance_rate_per_sqft: input.maintenance_rate_per_sqft,
      })
      .eq("id", 1);

    if (error) {
      // If no row exists yet, try upserting
      const { error: insertError } = await supabase
        .from("mmz_settings")
        .upsert({
          id: 1,
          maintenance_rate_per_sqft: input.maintenance_rate_per_sqft,
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    await logAudit({
      action: "update",
      entity_type: "settings",
      entity_id: "calculation_settings",
      description: `Updated maintenance rate per sqft to ${input.maintenance_rate_per_sqft}`,
      changes: { maintenance_rate_per_sqft: input.maintenance_rate_per_sqft },
    });

    revalidatePath("/pm/settings");
    revalidatePath("/pm/flats");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update calculation settings",
    };
  }
}

export async function deactivateTeamMember(
  id: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("pm_users")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "pm_user",
      entity_id: id,
      description: `Deactivated team member ${id}`,
      changes: { is_active: false },
    });

    revalidatePath("/pm/settings");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to deactivate team member",
    };
  }
}
