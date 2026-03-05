"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import type { DocumentType, UserRole } from "@/types";
import { logAudit } from "./audit";
import { createNotification } from "./notifications";

/** Helper: get current PM user's id and role */
async function getCurrentPmUser(): Promise<{ id: string; role: UserRole } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("pm_users")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();
  return data as { id: string; role: UserRole } | null;
}

function canApprove(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export interface DocumentInput {
  document_type: DocumentType;
  document_number?: string;
  owner_id: string;
  family_group_id?: string;
  community_id?: string;
  period_label?: string;
  period_start?: string;
  period_end?: string;
  subtotal?: number;
  tds_amount?: number;
  gst_amount?: number;
  grand_total?: number;
  line_items?: unknown[];
  bank_details?: unknown;
}

export async function createDocument(
  input: DocumentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.owner_id) {
      return { success: false, error: "Owner is required" };
    }
    if (!input.document_type) {
      return { success: false, error: "Document type is required" };
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

    const { data, error } = await supabase
      .from("documents")
      .insert({
        document_type: input.document_type,
        document_number: input.document_number ?? null,
        owner_id: input.owner_id,
        family_group_id: input.family_group_id ?? null,
        community_id: input.community_id ?? null,
        period_label: input.period_label ?? null,
        period_start: input.period_start ?? null,
        period_end: input.period_end ?? null,
        subtotal: input.subtotal ?? null,
        tds_amount: input.tds_amount ?? null,
        gst_amount: input.gst_amount ?? null,
        grand_total: input.grand_total ?? null,
        line_items: input.line_items ?? [],
        bank_details: input.bank_details ?? null,
        status: "draft",
        created_by: pmUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "create",
      entity_type: "document",
      entity_id: data.id,
      description: `Created ${input.document_type} document for owner ${input.owner_id}`,
    });

    revalidatePath("/pm/documents");
    revalidatePath("/pm/approvals");

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create document",
    };
  }
}

export async function submitForApproval(id: string): Promise<ActionResult> {
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

    const { error } = await supabase
      .from("documents")
      .update({
        status: "pending_approval",
        submitted_by: pmUser?.id ?? null,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "document",
      entity_id: id,
      description: `Submitted document ${id} for approval`,
      changes: { status: "pending_approval" },
    });

    revalidatePath("/pm/documents");
    revalidatePath("/pm/approvals");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to submit document for approval",
    };
  }
}

export async function approveDocument(id: string): Promise<ActionResult> {
  try {
    const pmUser = await getCurrentPmUser();
    if (!pmUser) return { success: false, error: "Not authenticated" };
    if (!canApprove(pmUser.role)) {
      return { success: false, error: "Only admins and super admins can approve documents" };
    }

    const supabase = createClient();

    // Fetch document to get submitter info for notification
    const { data: doc } = await supabase
      .from("documents")
      .select("submitted_by, document_type, period_label")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("documents")
      .update({
        status: "approved",
        approved_by: pmUser.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Notify the submitter that their document was approved
    if (doc?.submitted_by && doc.submitted_by !== pmUser.id) {
      await createNotification({
        recipient_type: "pm",
        recipient_id: doc.submitted_by,
        notification_type: "document_approved",
        title: "Document Approved",
        message: `Your ${doc.document_type.replace(/_/g, " ")}${doc.period_label ? ` for ${doc.period_label}` : ""} has been approved.`,
        entity_type: "document",
        entity_id: id,
      }).catch(() => {});
    }

    await logAudit({
      action: "update",
      entity_type: "document",
      entity_id: id,
      description: `Approved document ${id}`,
      changes: { status: "approved" },
    });

    revalidatePath("/pm/documents");
    revalidatePath("/pm/approvals");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to approve document",
    };
  }
}

export async function rejectDocument(
  id: string,
  reason: string
): Promise<ActionResult> {
  try {
    const pmUser = await getCurrentPmUser();
    if (!pmUser) return { success: false, error: "Not authenticated" };
    if (!canApprove(pmUser.role)) {
      return { success: false, error: "Only admins and super admins can reject documents" };
    }

    const supabase = createClient();

    // Fetch document to get submitter info for notification
    const { data: doc } = await supabase
      .from("documents")
      .select("submitted_by, document_type, period_label")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("documents")
      .update({
        status: "rejected",
        rejection_reason: reason,
        rejected_by: pmUser.id,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Notify the submitter that their document was rejected
    if (doc?.submitted_by && doc.submitted_by !== pmUser.id) {
      await createNotification({
        recipient_type: "pm",
        recipient_id: doc.submitted_by,
        notification_type: "document_rejected",
        title: "Document Rejected",
        message: `Your ${doc.document_type.replace(/_/g, " ")}${doc.period_label ? ` for ${doc.period_label}` : ""} was rejected: ${reason}`,
        entity_type: "document",
        entity_id: id,
      }).catch(() => {});
    }

    await logAudit({
      action: "update",
      entity_type: "document",
      entity_id: id,
      description: `Rejected document ${id}: ${reason}`,
      changes: { status: "rejected", rejection_reason: reason },
    });

    revalidatePath("/pm/documents");
    revalidatePath("/pm/approvals");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to reject document",
    };
  }
}

export async function recordDocumentPayment(
  documentId: string,
  data: {
    amount: number;
    date: string;
    method: string;
    reference?: string;
  }
): Promise<ActionResult> {
  try {
    if (!documentId) {
      return { success: false, error: "Document ID is required" };
    }
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Valid payment amount is required" };
    }
    if (!data.date) {
      return { success: false, error: "Payment date is required" };
    }
    if (!data.method) {
      return { success: false, error: "Payment method is required" };
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

    // Verify document exists and is published
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, status, grand_total, payment_received")
      .eq("id", documentId)
      .single();

    if (fetchError || !doc) {
      return { success: false, error: "Document not found" };
    }

    if (doc.status !== "published") {
      return {
        success: false,
        error: "Payment can only be recorded for published documents",
      };
    }

    if (doc.payment_received) {
      return {
        success: false,
        error: "Payment has already been recorded for this document",
      };
    }

    const { error } = await supabase
      .from("documents")
      .update({
        payment_received: true,
        payment_received_amount: data.amount,
        payment_received_date: data.date,
        payment_received_method: data.method,
        payment_received_reference: data.reference ?? null,
        payment_received_by: pmUser?.id ?? null,
      })
      .eq("id", documentId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit({
      action: "update",
      entity_type: "document",
      entity_id: documentId,
      description: `Recorded payment of ${data.amount} for document ${documentId} via ${data.method}`,
      changes: {
        payment_received: true,
        payment_received_amount: data.amount,
        payment_received_date: data.date,
        payment_received_method: data.method,
        payment_received_reference: data.reference ?? null,
      },
    });

    revalidatePath("/pm/documents");
    revalidatePath(`/pm/documents/${documentId}`);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to record payment",
    };
  }
}

export async function publishDocument(id: string): Promise<ActionResult> {
  try {
    const pmUser = await getCurrentPmUser();
    if (!pmUser) return { success: false, error: "Not authenticated" };
    if (!canApprove(pmUser.role)) {
      return { success: false, error: "Only admins and super admins can publish documents" };
    }

    const supabase = createClient();

    // Get document details for the notification
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("owner_id, document_type, period_label")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return { success: false, error: "Document not found" };
    }

    const { error } = await supabase
      .from("documents")
      .update({
        status: "published",
        published_by: pmUser.id,
        published_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Create a notification for the owner
    await createNotification({
      recipient_type: "owner",
      recipient_id: doc.owner_id,
      notification_type: "statement_published",
      title: "New Document Published",
      message: `A new ${doc.document_type.replace(/_/g, " ")}${doc.period_label ? ` for ${doc.period_label}` : ""} has been published.`,
      entity_type: "document",
      entity_id: id,
    });

    await logAudit({
      action: "update",
      entity_type: "document",
      entity_id: id,
      description: `Published document ${id}`,
      changes: { status: "published" },
    });

    revalidatePath("/pm/documents");
    revalidatePath("/pm/approvals");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to publish document",
    };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    if (!id) return { success: false, error: "Document ID is required" };

    const pmUser = await getCurrentPmUser();
    if (!pmUser) return { success: false, error: "Not authenticated" };
    if (!canApprove(pmUser.role)) {
      return { success: false, error: "Only admins and super admins can delete documents" };
    }

    const supabase = createClient();

    const { data: doc } = await supabase
      .from("documents")
      .select("id, document_type, period_label, status")
      .eq("id", id)
      .single();

    if (!doc) return { success: false, error: "Document not found" };

    if (doc.status === "published") {
      return { success: false, error: "Cannot delete a published document" };
    }

    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) return { success: false, error: error.message };

    await logAudit({
      action: "delete",
      entity_type: "document",
      entity_id: id,
      description: `Deleted ${doc.document_type} document: ${doc.period_label ?? id}`,
    });

    revalidatePath("/pm/documents");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete document",
    };
  }
}

export async function renameDocument(
  id: string,
  newLabel: string
): Promise<ActionResult> {
  try {
    if (!id) return { success: false, error: "Document ID is required" };
    if (!newLabel.trim()) return { success: false, error: "Label cannot be empty" };

    const supabase = createClient();

    const { error } = await supabase
      .from("documents")
      .update({ period_label: newLabel.trim() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    await logAudit({
      action: "update",
      entity_type: "document",
      entity_id: id,
      description: `Renamed document to: ${newLabel.trim()}`,
      changes: { period_label: newLabel.trim() },
    });

    revalidatePath("/pm/documents");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to rename document",
    };
  }
}
