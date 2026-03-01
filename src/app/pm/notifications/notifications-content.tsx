"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell, Calendar, FileText, Wrench, UserPlus,
  CheckCircle2, AlertTriangle, Clock, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions";

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
}

const NOTIFICATION_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; iconColor: string; iconBg: string }> = {
  rent_overdue: { icon: AlertTriangle, iconColor: "text-danger", iconBg: "bg-danger/10" },
  lease_expiring: { icon: Calendar, iconColor: "text-info", iconBg: "bg-info/10" },
  document_approved: { icon: CheckCircle2, iconColor: "text-success", iconBg: "bg-success/10" },
  document_rejected: { icon: XCircle, iconColor: "text-danger", iconBg: "bg-danger/10" },
  expense_recorded: { icon: Wrench, iconColor: "text-warning", iconBg: "bg-warning/10" },
  statement_published: { icon: FileText, iconColor: "text-accent", iconBg: "bg-accent/10" },
  tenant_added: { icon: UserPlus, iconColor: "text-success", iconBg: "bg-success/10" },
  tenant_exited: { icon: UserPlus, iconColor: "text-warning", iconBg: "bg-warning/10" },
  maintenance_updated: { icon: Wrench, iconColor: "text-info", iconBg: "bg-info/10" },
};

const DEFAULT_ICON = { icon: Bell, iconColor: "text-text-muted", iconBg: "bg-bg-elevated" };

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

export function NotificationsContent({ notifications: initialNotifications }: NotificationsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/notifications?${params.toString()}`, { scroll: false });
  };
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "all") return true;
    return n.type === filter;
  });

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    const result = await markAllNotificationsAsRead("pm", "pm");
    if (!result.success) {
      // Revert on failure
      setNotifications(initialNotifications);
    }
    router.refresh();
  };

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    const result = await markNotificationAsRead(id);
    if (!result.success) {
      // Revert on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: initialNotifications.find(orig => orig.id === id)?.is_read ?? false } : n));
    }
    router.refresh();
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notifications`}
      />

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <Select value={filter} onValueChange={(v) => {
          setFilter(v);
          updateURL({ filter: v });
        }}>
          <SelectTrigger className="w-[180px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Notifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="rent_overdue">Rent Overdue</SelectItem>
            <SelectItem value="lease_expiring">Lease Expiring</SelectItem>
            <SelectItem value="document_approved">Document Approved</SelectItem>
            <SelectItem value="expense_recorded">Expenses</SelectItem>
          </SelectContent>
        </Select>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            className="border-border-primary text-text-secondary text-body-sm"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filteredNotifications.map((notification) => {
          const iconConfig = NOTIFICATION_ICONS[notification.type] ?? DEFAULT_ICON;
          const Icon = iconConfig.icon;
          return (
            <button
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-colors",
                notification.is_read
                  ? "bg-bg-card border-border-primary hover:bg-bg-hover"
                  : "bg-accent/5 border-accent/20 hover:bg-accent/10"
              )}
            >
              <div className="flex gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconConfig.iconBg)}>
                  <Icon className={cn("h-5 w-5", iconConfig.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      "text-body-sm truncate",
                      notification.is_read ? "text-text-primary" : "text-text-primary font-semibold"
                    )}>
                      {notification.title}
                    </h4>
                    <span className="text-caption text-text-muted whitespace-nowrap shrink-0">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-caption text-text-secondary mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="h-2 w-2 rounded-full bg-accent shrink-0 mt-2" />
                )}
              </div>
            </button>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 bg-bg-card border border-border-primary rounded-lg">
            <Bell className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-body-sm text-text-secondary">No notifications to show</p>
          </div>
        )}
      </div>
    </div>
  );
}
