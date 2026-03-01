"use client";

import { useState, useEffect, useCallback } from "react";

type ViewMode = "list" | "card" | "grid";

/**
 * A hook that persists the view mode preference per screen in localStorage.
 *
 * Uses a two-phase approach to avoid SSR hydration mismatches:
 * 1. Always starts with the defaultMode (matches server render)
 * 2. Reads localStorage in useEffect after mount and updates if different
 *
 * @param screenName - A unique identifier for the screen (used as part of the localStorage key).
 * @param defaultMode - The default view mode to use when no persisted preference exists.
 * @returns A tuple of [viewMode, setViewMode] similar to useState.
 */
export function usePersistedView(
  screenName: string,
  defaultMode: ViewMode
): [ViewMode, (mode: ViewMode) => void] {
  const key = `mmz-view-${screenName}`;

  // Always start with defaultMode to match SSR
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored === "list" || stored === "card" || stored === "grid") {
      setViewModeState(stored);
    }
  }, [key]);

  // Persist to localStorage whenever viewMode changes
  useEffect(() => {
    localStorage.setItem(key, viewMode);
  }, [key, viewMode]);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
    },
    []
  );

  return [viewMode, setViewMode];
}
