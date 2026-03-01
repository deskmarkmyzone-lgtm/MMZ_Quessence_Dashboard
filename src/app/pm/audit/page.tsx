import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AuditContent } from "./audit-content";

export default async function AuditLogPage() {
  const supabase = createClient();

  const { data: auditData } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const logs = (auditData ?? []).map((log: any) => ({
    id: log.id,
    action: log.action,
    entity_type: log.entity_type,
    actor_name: log.actor_name ?? "-",
    actor_role: log.actor_role ?? "-",
    description: log.description,
    created_at: log.created_at,
  }));

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-48 mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <AuditContent logs={logs} />
    </Suspense>
  );
}
