import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // Use admin client to bypass RLS for role lookup
    const admin = createAdminClient();

    // Check if user is a PM team member (by auth_user_id or email)
    const { data: pmUser } = await admin
      .from("pm_users")
      .select("id, role, is_active")
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (pmUser) {
      // Auto-link auth_user_id if not yet linked
      await admin
        .from("pm_users")
        .update({ auth_user_id: user.id })
        .eq("id", pmUser.id)
        .is("auth_user_id", null);

      return NextResponse.redirect(`${origin}/pm`);
    }

    // Check if user is an owner (by auth_user_id or email)
    const { data: owner } = await admin
      .from("owners")
      .select("id, is_active, onboarding_completed, auth_user_id")
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (owner) {
      // Auto-link auth_user_id if not yet linked
      if (!owner.auth_user_id) {
        await admin
          .from("owners")
          .update({ auth_user_id: user.id })
          .eq("id", owner.id);
      }

      // Redirect based on onboarding status
      if (!owner.onboarding_completed) {
        return NextResponse.redirect(`${origin}/owner/welcome`);
      }
      return NextResponse.redirect(`${origin}/owner`);
    }

    // User not found in either table
    return NextResponse.redirect(`${origin}/access-denied`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
