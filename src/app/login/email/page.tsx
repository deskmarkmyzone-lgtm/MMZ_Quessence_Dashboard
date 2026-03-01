"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EmailLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    // Check role and redirect
    router.push("/auth/role-check");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    // After sign up, try to sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      // If email confirmation is required
      if (signInError.message.includes("Email not confirmed")) {
        setError(
          "Account created! Please check your email to confirm, then sign in."
        );
      } else {
        setError(signInError.message);
      }
      return;
    }

    router.push("/auth/role-check");
  };

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-[200px] h-[60px]">
              <Image
                src="/logo-dark.svg"
                alt="Mark My Zone"
                fill
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/logo-light.svg"
                alt="Mark My Zone"
                fill
                className="object-contain hidden dark:block"
                priority
              />
            </div>
          </div>

          {/* Form card */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-5 shadow-card">
            {/* Mode tabs */}
            <div className="flex border-b border-border-primary">
              <button
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                className={`flex-1 pb-3 text-body font-medium transition-colors ${
                  mode === "signin"
                    ? "text-accent border-b-2 border-accent"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`flex-1 pb-3 text-body font-medium transition-colors ${
                  mode === "signup"
                    ? "text-accent border-b-2 border-accent"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-h3 text-text-primary">
                {mode === "signin"
                  ? "Sign in with Email"
                  : "Create an Account"}
              </h2>
              <p className="text-body-sm text-text-secondary">
                {mode === "signin"
                  ? "Enter your email and password to sign in."
                  : "Enter your email and create a password."}
              </p>
            </div>

            <form
              onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-secondary">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-bg-page border-border-primary focus:border-accent focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-text-secondary">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-bg-page border-border-primary focus:border-accent focus:ring-accent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-text-secondary"
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-bg-page border-border-primary focus:border-accent focus:ring-accent"
                  />
                </div>
              )}

              {error && <p role="alert" className="text-body-sm text-danger">{error}</p>}

              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full h-11 bg-accent hover:bg-accent-light text-white"
              >
                {loading
                  ? mode === "signin"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
              </Button>
            </form>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-body-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
