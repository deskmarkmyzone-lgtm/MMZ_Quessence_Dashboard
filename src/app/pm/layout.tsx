import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PMLayoutClient } from "./pm-layout-client";

export default async function PMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify the user is a PM team member
  const { data: pmUser } = await supabase
    .from("pm_users")
    .select("id, role, is_active")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!pmUser) {
    redirect("/access-denied");
  }

  // Fetch communities, unread count, and recent notifications in parallel
  const [{ data: communities }, { count: unreadCount }, { data: recentNotifications }] = await Promise.all([
    supabase
      .from("communities")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_type", "pm")
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select("id, title, message, notification_type, is_read, created_at, entity_type, entity_id")
      .eq("recipient_type", "pm")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const notifications = (recentNotifications ?? []).map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.notification_type,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));

  return (
    <PMLayoutClient
      communities={communities ?? []}
      unreadCount={unreadCount ?? 0}
      notifications={notifications}
    >
      {children}
    </PMLayoutClient>
  );
}
