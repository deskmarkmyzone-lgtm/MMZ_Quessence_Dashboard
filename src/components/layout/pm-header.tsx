"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState, useRef } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlobalSearch } from "@/components/shared/global-search";
import { Bell, Search, Menu, Building2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { NotificationItem } from "@/app/pm/pm-layout-client";

const pageTitles: Record<string, string> = {
  "/pm": "Dashboard",
  "/pm/communities": "Communities",
  "/pm/owners": "Owners",
  "/pm/flats": "Flats",
  "/pm/rent": "Rent Payments",
  "/pm/expenses": "Expenses",
  "/pm/maintenance": "Maintenance",
  "/pm/documents": "Documents",
  "/pm/approvals": "Approvals",
  "/pm/analytics": "Analytics",
  "/pm/audit": "Audit Log",
  "/pm/settings": "Settings",
  "/pm/notifications": "Notifications",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [route, title] of Object.entries(pageTitles)) {
    if (route !== "/pm" && pathname.startsWith(route)) return title;
  }
  return "Dashboard";
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getNotificationIcon(type: string) {
  if (type?.includes("overdue") || type?.includes("rent")) return <Clock className="h-3.5 w-3.5 text-danger shrink-0" />;
  if (type?.includes("lease")) return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />;
  return <Bell className="h-3.5 w-3.5 text-accent shrink-0" />;
}

interface PMHeaderProps {
  onMenuClick?: () => void;
  communities?: { id: string; name: string }[];
  unreadCount?: number;
  notifications?: NotificationItem[];
}

export function PMHeader({ onMenuClick, communities = [], unreadCount = 0, notifications = [] }: PMHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = getPageTitle(pathname);

  const selectedCommunity = searchParams.get("community") ?? "all";

  const [showDropdown, setShowDropdown] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setShowDropdown(false), 200);
  };

  const handleCommunityChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("community");
      } else {
        params.set("community", value);
      }
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    },
    [pathname, router, searchParams]
  );

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <GlobalSearch />
      <header role="banner" aria-label="Page header" className="h-14 md:h-16 bg-bg-card border-b border-border-primary flex items-center justify-between px-4 md:px-6">
        {/* Left side: Hamburger (mobile) + Page title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            className="md:hidden h-10 w-10 text-text-secondary hover:text-text-primary shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <h1 className="text-body md:text-h3 text-text-primary font-semibold truncate">{title}</h1>

          {/* Community filter — only shown with 2+ communities, hidden on mobile */}
          {communities.length >= 2 && (
            <Select value={selectedCommunity} onValueChange={handleCommunityChange}>
              <SelectTrigger className="hidden md:flex h-8 w-[200px] bg-bg-page border-border-primary text-body-sm text-text-secondary gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <SelectValue placeholder="All Communities" />
              </SelectTrigger>
              <SelectContent className="bg-bg-card border-border-primary">
                <SelectItem value="all" className="text-body-sm">
                  All Communities
                </SelectItem>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-body-sm">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Right side: Search trigger, theme, notifications, avatar */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Search trigger — opens Cmd+K dialog */}
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 h-9 w-[260px] px-3 bg-bg-page border-border-primary text-text-muted text-body-sm hover:text-text-secondary hover:border-accent/50 justify-start"
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="pointer-events-none h-5 select-none rounded border border-border-primary bg-bg-elevated px-1.5 font-mono text-[10px] font-medium text-text-muted">
              ⌘K
            </kbd>
          </Button>

          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="md:hidden h-10 w-10 text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Button>

          <ThemeToggle />

          {/* Notifications — hover dropdown + click navigates */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link href="/pm/notifications" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-text-secondary hover:text-text-primary hover:bg-bg-hover relative"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" aria-hidden="true" />
                )}
              </Button>
            </Link>

            {/* Hover dropdown */}
            {showDropdown && notifications.length > 0 && (
              <div
                className="absolute right-0 top-full mt-1 w-[340px] bg-bg-card border border-border-primary rounded-lg shadow-card-hover z-50 overflow-hidden"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
                  <h3 className="text-body-sm text-text-primary font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold text-white bg-danger px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href="/pm/notifications"
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-bg-hover transition-colors border-b border-border-subtle last:border-0 ${
                        !n.isRead ? "bg-accent/5" : ""
                      }`}
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="mt-0.5">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-body-sm truncate ${!n.isRead ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                          {n.title}
                        </p>
                        <p className="text-caption text-text-muted truncate mt-0.5">{n.message}</p>
                        <p className="text-[11px] text-text-muted mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-accent rounded-full mt-1.5 shrink-0" />
                      )}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/pm/notifications"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-border-primary text-accent text-caption font-medium hover:bg-bg-hover transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  View all notifications <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="User menu"
                className="h-10 w-10 rounded-full p-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-white text-caption">
                    PM
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-bg-card border-border-primary"
            >
              <DropdownMenuItem className="text-text-secondary text-body-sm cursor-default">
                Property Manager
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-primary" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-danger cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
