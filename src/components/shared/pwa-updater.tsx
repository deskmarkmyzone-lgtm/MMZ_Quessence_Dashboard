"use client";

import { useEffect } from "react";

/**
 * Listens for service worker updates and auto-reloads the page
 * when a new version is deployed. This ensures installed PWAs
 * pick up code/UI changes without manual intervention.
 */
export function PWAUpdater() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // When a new service worker is found, it installs in the background.
      // Listen for it becoming active and reload to use the new version.
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "activated" &&
            navigator.serviceWorker.controller
          ) {
            // New version activated — reload to pick up changes
            window.location.reload();
          }
        });
      });

      // Also check for updates every 5 minutes while the app is open
      const interval = setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    };

    handleUpdate();
  }, []);

  return null;
}
