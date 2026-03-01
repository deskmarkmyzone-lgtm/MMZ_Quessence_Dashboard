import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const supabase = createClient();

  // Fetch team members
  const { data: teamData } = await supabase
    .from("pm_users")
    .select("*")
    .order("created_at");

  const team = (teamData ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    joined: u.created_at
      ? new Date(u.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
      : "-",
  }));

  // Fetch MMZ settings
  const { data: settingsData } = await supabase
    .from("mmz_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const settings = settingsData ?? {
    bank_account_name: "",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_branch: "",
    pan_number: "",
    invoice_prefix: "MMZ",
    next_invoice_number: 1,
    company_name: "Mark My Zone",
    company_address: "",
    company_phone: "",
    company_email: "",
  };

  // Fetch current user's notification preferences
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: pmUser } = await supabase
    .from("pm_users")
    .select("id")
    .eq("auth_user_id", user?.id)
    .single();

  let notificationPrefs: { notification_type: string; in_app_enabled: boolean; email_enabled: boolean }[] = [];
  if (pmUser) {
    const { data: prefsData } = await supabase
      .from("notification_preferences")
      .select("notification_type, in_app_enabled, email_enabled")
      .eq("user_type", "pm")
      .eq("user_id", pmUser.id);
    notificationPrefs = prefsData ?? [];
  }

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-48 mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <SettingsContent team={team} settings={settings} notificationPrefs={notificationPrefs} />
    </Suspense>
  );
}
