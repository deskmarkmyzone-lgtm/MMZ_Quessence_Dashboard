"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  IndianRupee,
  Wrench,
  HardHat,
  FileText,
  CheckSquare,
  BarChart3,
  AlertTriangle,
  Bell,
  Shield,
  Upload,
  Settings,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

const navItems = [
  { label: "Dashboard", href: "/pm", icon: LayoutDashboard },
  { label: "Communities", href: "/pm/communities", icon: Building2 },
  { label: "Owners", href: "/pm/owners", icon: Users },
  { label: "Flats", href: "/pm/flats", icon: Home },
  { label: "Rent", href: "/pm/rent", icon: IndianRupee },
  { label: "Expenses", href: "/pm/expenses", icon: Wrench },
  { label: "Maintenance", href: "/pm/maintenance", icon: HardHat },
  { label: "Documents", href: "/pm/documents", icon: FileText },
  { label: "Approvals", href: "/pm/approvals", icon: CheckSquare },
  { label: "Analytics", href: "/pm/analytics", icon: BarChart3 },
  { label: "Predictions", href: "/pm/predictive-maintenance", icon: AlertTriangle },
  { label: "Reports", href: "/pm/reports", icon: FileSpreadsheet },
  { label: "Notifications", href: "/pm/notifications", icon: Bell },
  { label: "Audit Log", href: "/pm/audit", icon: Shield },
  { label: "Import", href: "/pm/import", icon: Upload },
  { label: "Settings", href: "/pm/settings", icon: Settings },
];

export function PMSidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  // Hydrate sidebar state from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("mmz-sidebar-expanded");
    if (stored !== null) {
      setExpanded(stored === "true");
    }
  }, []);

  // Persist sidebar expanded state to localStorage
  useEffect(() => {
    localStorage.setItem("mmz-sidebar-expanded", String(expanded));
  }, [expanded]);

  const isActive = (href: string) => {
    if (href === "/pm") return pathname === "/pm";
    return pathname.startsWith(href);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main sidebar"
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh bg-bg-sidebar flex flex-col transition-all duration-300 ease-in-out border-r border-border-sidebar",
          // Desktop: slim sidebar with hover expand
          "hidden md:flex",
          expanded ? "w-[260px]" : "w-[64px]",
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <SidebarContent expanded={expanded} setExpanded={setExpanded} isActive={isActive} />
      </aside>

      {/* Mobile sidebar (slide-in drawer) */}
      <aside
        aria-label="Mobile navigation"
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-[280px] bg-bg-sidebar flex flex-col transition-transform duration-300 ease-in-out border-r border-border-sidebar md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onMobileClose}
            aria-label="Close navigation menu"
            className="h-10 w-10 flex items-center justify-center text-text-sidebar hover:text-text-sidebar-hover rounded-md hover:bg-bg-sidebar-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent expanded={true} setExpanded={() => {}} isActive={isActive} onItemClick={onMobileClose} />
      </aside>
    </TooltipProvider>
  );
}

function SidebarContent({
  expanded,
  setExpanded,
  isActive,
  onItemClick,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isActive: (href: string) => boolean;
  onItemClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className={cn("h-16 flex items-center px-4 border-b border-border-sidebar", expanded ? "justify-start" : "justify-center")}>
        {expanded ? (
          <div className="relative w-[140px] h-[36px]">
            <Image
              src="/logo-dark.svg"
              alt="MMZ"
              fill
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/logo-light.svg"
              alt="MMZ"
              fill
              className="object-contain hidden dark:block"
              priority
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 px-2" role="list">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                onClick={onItemClick}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-body-sm transition-all duration-200 min-h-[44px]",
                  active
                    ? "bg-bg-sidebar-active text-accent"
                    : "text-text-sidebar hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {expanded && (
                  <span className="truncate animate-fade-in">
                    {item.label}
                  </span>
                )}
                {active && !expanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
                )}
              </Link>
            );

            return (
              <li key={item.href} className="relative">
                {expanded ? (
                  linkContent
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-bg-elevated text-text-primary border-border-primary"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="p-2 border-t border-border-sidebar hidden md:block">
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className="w-full flex items-center justify-center py-2 min-h-[44px] text-text-sidebar-muted hover:text-text-sidebar transition-colors"
        >
          {expanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </>
  );
}
