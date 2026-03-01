"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bell,
  IndianRupee,
  FileText,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  UserPlus,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/actions";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationsContentProps {
  notifications: Notification[];
  ownerId: string;
}

const NOTIFICATION_ICONS: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    iconBg: string;
  }
> = {
  rent_overdue: {
    icon: AlertTriangle,
    iconColor: "text-danger",
    iconBg: "bg-danger/10",
  },
  lease_expiring: {
    icon: Calendar,
    iconColor: "text-info",
    iconBg: "bg-info/10",
  },
  document_approved: {
    icon: CheckCircle2,
    iconColor: "text-success",
    iconBg: "bg-success/10",
  },
  document_rejected: {
    icon: XCircle,
    iconColor: "text-danger",
    iconBg: "bg-danger/10",
  },
  expense_recorded: {
    icon: Wrench,
    iconColor: "text-warning",
    iconBg: "bg-warning/10",
  },
  statement_published: {
    icon: FileText,
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
  },
  tenant_added: {
    icon: UserPlus,
    iconColor: "text-success",
    iconBg: "bg-success/10",
  },
  tenant_exited: {
    icon: UserPlus,
    iconColor: "text-warning",
    iconBg: "bg-warning/10",
  },
  maintenance_updated: {
    icon: Wrench,
    iconColor: "text-info",
    iconBg: "bg-info/10",
  },
};

const DEFAULT_ICON = {
  icon: Bell,
  iconColor: "text-text-muted",
  iconBg: "bg-bg-elevated",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function NotificationsContent({
  notifications: initialNotifications,
  ownerId,
}: NotificationsContentProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    const result = await markAllNotificationsAsRead("owner", ownerId);
    if (!result.success) {
      // Revert on failure
      setNotifications(initialNotifications);
    }
    router.refresh();
  };

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      )
    );
    const result = await markNotificationAsRead(id);
    if (!result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                is_read:
                  initialNotifications.find((orig) => orig.id === id)
                    ?.is_read ?? false,
              }
            : n
        )
      );
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 text-text-primary">Notifications</h2>
          <p className="text-body text-text-secondary mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="border-border-primary text-text-secondary"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const iconConfig =
            NOTIFICATION_ICONS[n.type] ?? DEFAULT_ICON;
          const Icon = iconConfig.icon;
          return (
            <button
              key={n.id}
              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
              className={cn(
                "w-full text-left flex gap-3 p-4 rounded-lg border transition-colors",
                n.is_read
                  ? "bg-bg-card border-border-primary"
                  : "bg-accent/5 border-accent/20 cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  iconConfig.iconBg
                )}
              >
                <Icon className={cn("h-4 w-4", iconConfig.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-body-sm",
                    n.is_read
                      ? "text-text-primary"
                      : "text-text-primary font-semibold"
                  )}
                >
                  {n.title}
                </p>
                <p className="text-caption text-text-secondary mt-0.5">
                  {n.message}
                </p>
              </div>
              <span className="text-caption text-text-muted shrink-0">
                {formatTimeAgo(n.created_at)}
              </span>
              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-accent shrink-0 mt-2" />
              )}
            </button>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-12 bg-bg-card border border-border-primary rounded-lg">
            <Bell className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-body-sm text-text-secondary">
              No notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
