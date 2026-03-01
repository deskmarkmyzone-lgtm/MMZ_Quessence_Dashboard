"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/owner", icon: LayoutDashboard },
  { label: "Flats", href: "/owner/flats", icon: Home },
  { label: "Statements", href: "/owner/statements", icon: FileText },
  { label: "Profile", href: "/owner/profile", icon: User },
];

export function OwnerBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/owner") return pathname === "/owner";
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Bottom navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-border-primary md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] px-3 py-2 transition-colors",
                active ? "text-accent" : "text-text-muted"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
