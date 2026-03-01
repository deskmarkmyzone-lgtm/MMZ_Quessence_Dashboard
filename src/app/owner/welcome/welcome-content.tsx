"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  Home,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";

interface WelcomeContentProps {
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  flats: {
    id: string;
    flat_number: string;
    bhk_type: string;
    status: string;
    community_name: string;
    tenant_name: string | null;
  }[];
}

const STEPS = ["Welcome", "Your Properties", "Get Started"];

export function WelcomeContent({ owner, flats }: WelcomeContentProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!agreed) {
      toast.error("Please accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeOnboarding(owner.id);
      if (result.success) {
        toast.success("Welcome aboard! Redirecting to your dashboard...");
        router.push("/owner");
      } else {
        toast.error(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-caption font-semibold shrink-0",
                i < step
                  ? "bg-success text-white"
                  : i === step
                    ? "bg-accent text-white"
                    : "bg-bg-elevated text-text-muted"
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-caption hidden sm:inline",
                i === step
                  ? "text-text-primary font-medium"
                  : "text-text-muted"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 rounded",
                  i < step ? "bg-success" : "bg-border-primary"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Welcome */}
      {step === 0 && (
        <div className="space-y-8">
          <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Home className="h-8 w-8 text-accent" />
            </div>

            <div className="space-y-3">
              <h1 className="text-h1 text-text-primary">
                Welcome to Mark My Zone
              </h1>
              <p className="text-h3 text-accent font-medium">
                Hi, {owner.name}!
              </p>
              <p className="text-body text-text-secondary max-w-md mx-auto">
                Your property manager has set up your account. Let&apos;s get
                you started with a quick overview of your properties and
                dashboard.
              </p>
            </div>

            <div className="pt-2 space-y-2 text-body-sm text-text-muted">
              <p>
                <span className="text-text-secondary font-medium">Email:</span>{" "}
                {owner.email}
              </p>
              {owner.phone && (
                <p>
                  <span className="text-text-secondary font-medium">
                    Phone:
                  </span>{" "}
                  {owner.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(1)}
              className="bg-accent hover:bg-accent-light text-white"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review Properties */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-h2 text-text-primary">Your Properties</h2>
                <p className="text-body-sm text-text-secondary">
                  These are the properties managed by Mark My Zone on your
                  behalf.
                </p>
              </div>
            </div>

            {flats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-body text-text-muted">
                  No properties have been assigned yet. Your property manager
                  will add them shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {flats.map((flat) => (
                  <div
                    key={flat.id}
                    className="border border-border-primary rounded-lg p-4 bg-bg-page"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-body text-text-primary font-mono font-bold">
                          {flat.flat_number}
                        </p>
                        <p className="text-body-sm text-text-secondary">
                          {flat.community_name}
                        </p>
                      </div>
                      <StatusBadge status={flat.status} />
                    </div>
                    <div className="flex items-center gap-4 text-caption text-text-muted">
                      <span>{flat.bhk_type}</span>
                      {flat.tenant_name && (
                        <>
                          <span className="text-border-primary">|</span>
                          <span>Tenant: {flat.tenant_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-caption text-text-muted">
              {flats.length} {flats.length === 1 ? "property" : "properties"}{" "}
              found
            </p>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              className="border-border-primary text-text-secondary"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              className="bg-accent hover:bg-accent-light text-white"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Accept & Complete */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="text-h2 text-text-primary">
                  You&apos;re All Set!
                </h2>
                <p className="text-body-sm text-text-secondary">
                  Just one last step before we take you to your dashboard.
                </p>
              </div>
            </div>

            <div className="bg-bg-page border border-border-primary rounded-lg p-4 space-y-3">
              <p className="text-body-sm text-text-primary font-medium">
                What you can do on your dashboard:
              </p>
              <ul className="space-y-2 text-body-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  View your property details and tenant information
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Track rent payments and monthly statements
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Review expenses and maintenance updates
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Access important documents anytime
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="agree"
                className="text-body-sm text-text-secondary cursor-pointer select-none leading-snug"
              >
                I agree to receive updates about my properties through this
                dashboard
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="border-border-primary text-text-secondary"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!agreed || isSubmitting}
              className={cn(
                "text-white",
                agreed
                  ? "bg-accent hover:bg-accent-light"
                  : "bg-accent/50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
