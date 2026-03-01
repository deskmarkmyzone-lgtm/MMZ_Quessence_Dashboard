"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateOnboardingToken } from "@/lib/actions";

interface OnboardingCardProps {
  ownerId: string;
  ownerName: string;
  existingToken: string | null;
  isOnboarded: boolean;
  appUrl: string;
}

export function OnboardingCard({
  ownerId,
  ownerName,
  existingToken,
  isOnboarded,
  appUrl,
}: OnboardingCardProps) {
  const [token, setToken] = useState(existingToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const onboardingUrl = token
    ? `${appUrl}/owner/welcome?token=${token}`
    : null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateOnboardingToken(ownerId);
      if (result.success && result.data) {
        setToken(result.data.token);
        toast.success("Onboarding link generated");
      } else {
        toast.error(result.error ?? "Failed to generate link");
      }
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!onboardingUrl) return;
    try {
      await navigator.clipboard.writeText(onboardingUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (isOnboarded) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-lg p-6">
        <h3 className="text-h3 text-text-primary mb-3">Owner Portal</h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-caption font-medium text-success">
            <Check className="h-3.5 w-3.5" />
            Onboarded
          </span>
        </div>
        <p className="text-caption text-text-muted mt-2">
          {ownerName} has access to the owner portal and can view their flats, rent history, and published documents.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-6">
      <h3 className="text-h3 text-text-primary mb-3">Owner Portal Access</h3>

      {!token ? (
        <div>
          <p className="text-body-sm text-text-secondary mb-3">
            Generate a unique onboarding link for {ownerName} to access the owner portal.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-1.5 bg-accent text-white hover:bg-accent/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Generate Onboarding Link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-caption text-text-muted">
            Share this link with {ownerName}. They can sign in with Google using their registered email.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg-elevated rounded-lg px-3 py-2 text-caption text-text-secondary font-mono truncate border border-border-primary">
              {onboardingUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="gap-1.5 text-text-muted"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate Link
          </Button>
        </div>
      )}
    </div>
  );
}
