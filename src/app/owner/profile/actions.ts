"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export async function updateOwnerProfile(
  ownerId: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Verify the current user owns this profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: owner } = await supabase
      .from("owners")
      .select("id")
      .eq("id", ownerId)
      .eq("auth_user_id", user.id)
      .single();

    if (!owner) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("owners")
      .update({
        name: input.name.trim(),
        phone: input.phone.trim() || null,
        address: input.address.trim() || null,
        city: input.city.trim() || null,
        pincode: input.pincode.trim() || null,
      })
      .eq("id", ownerId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/owner");
    revalidatePath("/owner/profile");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}
