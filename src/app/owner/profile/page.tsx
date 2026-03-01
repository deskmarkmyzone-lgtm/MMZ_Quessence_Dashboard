import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileContent } from "./profile-content";

export default async function OwnerProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: owner } = await supabase
    .from("owners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!owner) redirect("/access-denied");

  const ownerProfile = {
    id: owner.id,
    name: owner.name ?? "",
    email: owner.email ?? "",
    phone: owner.phone ?? "",
    address: owner.address ?? "",
    city: owner.city ?? "",
    pincode: owner.pincode ?? "",
  };

  return <ProfileContent owner={ownerProfile} />;
}
