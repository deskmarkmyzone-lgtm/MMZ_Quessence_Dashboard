"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4">
      <div className="max-w-md w-full rounded-lg border border-border-primary bg-bg-card p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-danger" />
        <h2 className="mt-4 text-h2 text-text-primary">
          Something went wrong
        </h2>
        <p className="mt-2 text-body-sm text-text-secondary line-clamp-3">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="default" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-md border border-border-primary text-text-secondary hover:text-text-primary text-body-sm font-medium transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
