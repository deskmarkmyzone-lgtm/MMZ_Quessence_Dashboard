"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Verify the current user owns this record
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("owners")
      .update({
        onboarding_completed: true,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", ownerId)
      .eq("auth_user_id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/owner");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to complete onboarding",
    };
  }
}
