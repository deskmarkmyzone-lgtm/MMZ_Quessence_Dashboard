import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsContent } from "./notifications-content";

export default async function OwnerNotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: owner } = await supabase
    .from("owners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!owner) redirect("/access-denied");

  // Fetch notifications for this owner
  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_type", "owner")
    .eq("recipient_id", owner.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (notificationsData ?? []).map((n: any) => ({
    id: n.id,
    type: n.notification_type ?? "",
    title: n.title ?? "",
    message: n.message ?? "",
    created_at: n.created_at,
    is_read: n.is_read ?? false,
  }));

  return (
    <NotificationsContent
      notifications={notifications}
      ownerId={owner.id}
    />
  );
}
