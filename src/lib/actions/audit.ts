"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuditAction } from "@/types";

export async function logAudit(params: {
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  description: string;
  changes?: Record<string, unknown>;
}) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let actorName = "System";
    let actorRole = "system";
    let actorId: string | null = null;

    if (user) {
      const { data: pmUser } = await supabase
        .from("pm_users")
        .select("id, name, role")
        .eq("auth_user_id", user.id)
        .single();

      if (pmUser) {
        actorName = pmUser.name;
        actorRole = pmUser.role;
        actorId = pmUser.id;
      }
    }

    await supabase.from("audit_log").insert({
      actor_type: "pm",
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      description: params.description,
      changes: params.changes ?? null,
    });
  } catch {
    // Audit logging should not break the main operation
    console.error("Failed to log audit entry");
  }
}
