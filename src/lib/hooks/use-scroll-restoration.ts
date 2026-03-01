"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const scrollPositions = new Map<string, number>();

/**
 * Saves and restores scroll position per route pathname.
 * Works with the main content area for list pages so users
 * return to where they left off after navigating back.
 */
export function useScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    // Restore scroll position for this route
    const saved = scrollPositions.get(pathname);
    if (saved !== undefined) {
      // Defer slightly to allow layout to complete
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      scrollPositions.set(pathname, window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      // Save final position before unmounting
      scrollPositions.set(pathname, window.scrollY);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);
}
