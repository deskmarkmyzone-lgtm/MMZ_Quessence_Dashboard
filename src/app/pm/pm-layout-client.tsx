"use client";

import { useState } from "react";
import { PMSidebar } from "@/components/layout/pm-sidebar";
import { PMHeader } from "@/components/layout/pm-header";
import { useScrollRestoration } from "@/lib/hooks/use-scroll-restoration";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface PMLayoutClientProps {
  children: React.ReactNode;
  communities: { id: string; name: string }[];
  unreadCount?: number;
  notifications?: NotificationItem[];
}

export function PMLayoutClient({
  children,
  communities,
  unreadCount = 0,
  notifications = [],
}: PMLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useScrollRestoration();

  return (
    <div className="min-h-screen bg-bg-page">
      {/* WCAG 2.4.1 — Skip navigation link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      <PMSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="md:ml-[64px] flex flex-col min-h-screen">
        <PMHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          communities={communities}
          unreadCount={unreadCount}
          notifications={notifications}
        />
        <main id="main-content" className="flex-1 px-4 py-4 md:px-8 md:py-6" tabIndex={-1}>
          <div className="max-w-content mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
