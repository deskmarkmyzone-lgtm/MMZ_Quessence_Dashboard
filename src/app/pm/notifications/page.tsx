import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { NotificationsContent } from "./notifications-content";

export default async function NotificationsPage() {
  const supabase = createClient();

  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_type", "pm")
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (notificationsData ?? []).map((n: any) => ({
    id: n.id,
    type: n.notification_type,
    title: n.title,
    message: n.message,
    created_at: n.created_at,
    is_read: n.is_read,
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
      <NotificationsContent notifications={notifications} />
    </Suspense>
  );
}
