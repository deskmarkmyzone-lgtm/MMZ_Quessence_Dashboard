import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OwnerHeader } from "@/components/layout/owner-header";
import { OwnerBottomNav } from "@/components/layout/owner-bottom-nav";

export default async function OwnerLayout({
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

  // Verify the user is an owner
  const { data: owner } = await supabase
    .from("owners")
    .select("id, name, is_active, onboarding_completed")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!owner) {
    redirect("/access-denied");
  }

  // Fetch unread notification count
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_type", "owner")
    .eq("recipient_id", owner.id)
    .eq("is_read", false);

  return (
    <div className="min-h-screen bg-bg-page">
      {/* WCAG 2.4.1 — Skip navigation link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      <OwnerHeader ownerName={owner.name ?? "Owner"} unreadCount={count ?? 0} />
      <main id="main-content" className="p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto" tabIndex={-1}>
        {children}
      </main>
      <OwnerBottomNav />
    </div>
  );
}
