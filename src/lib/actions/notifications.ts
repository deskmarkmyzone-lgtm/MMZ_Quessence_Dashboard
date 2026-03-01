"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";

export interface NotificationInput {
  recipient_type: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
}

export async function createNotification(
  input: NotificationInput
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from("notifications").insert({
      recipient_type: input.recipient_type,
      recipient_id: input.recipient_id,
      notification_type: input.notification_type,
      title: input.title,
      message: input.message,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to create notification",
    };
  }
}

export async function markNotificationAsRead(
  id: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/pm");
    revalidatePath("/owner");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read",
    };
  }
}

export async function markAllNotificationsAsRead(
  recipientType: string,
  recipientId: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_type", recipientType)
      .eq("recipient_id", recipientId)
      .eq("is_read", false);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/pm");
    revalidatePath("/owner");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read",
    };
  }
}
