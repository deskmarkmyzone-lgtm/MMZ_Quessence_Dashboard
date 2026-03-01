import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WelcomeContent } from "./welcome-content";

export default async function OwnerWelcomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch owner record
  const { data: owner } = await supabase
    .from("owners")
    .select(
      "id, name, email, phone, address, city, pincode, onboarding_completed"
    )
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!owner) redirect("/access-denied");

  // Already onboarded? Go to dashboard
  if (owner.onboarding_completed) redirect("/owner");

  // Fetch their assigned flats
  const { data: flatsData } = await supabase
    .from("flats")
    .select(
      "id, flat_number, bhk_type, status, community:communities(name), tenants(name, is_active)"
    )
    .eq("owner_id", owner.id)
    .eq("is_active", true)
    .order("flat_number");

  const flats = (flatsData ?? []).map((f: any) => {
    const activeTenant = Array.isArray(f.tenants)
      ? f.tenants.find((t: any) => t.is_active)
      : null;
    return {
      id: f.id,
      flat_number: f.flat_number,
      bhk_type: f.bhk_type ?? "-",
      status: f.status,
      community_name: f.community?.name ?? "-",
      tenant_name: activeTenant?.name ?? null,
    };
  });

  return (
    <WelcomeContent
      owner={{
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone ?? "",
      }}
      flats={flats}
    />
  );
}
