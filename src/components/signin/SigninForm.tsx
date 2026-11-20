"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const REMEMBERED_EMAIL_KEY = "creativespace_remembered_email";

export function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const justRegistered = searchParams.get("registered") === "true";

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEntering, setSuccessEntering] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Unique accessible IDs
  const emailId = useId();
  const passwordId = useId();
  const rememberMeId = useId();

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // LocalStorage access might fail in restricted iframe environments
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      // Manage Remember Me preference
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Ignore localStorage error
      }

      // NextAuth Credentials sign-in
      const res = await signIn("credentials", {
        redirect: false,
        email: trimmedEmail,
        password,
      });

      if (res?.error) {
        // Refine message to be polite and descriptive
        if (res.error.toLowerCase().includes("invalid")) {
          setErrorMessage("Invalid email or password. Please verify your credentials and try again.");
        } else {
          setErrorMessage(res.error);
        }
        setIsLoading(false);
        return;
      }

      // Successfully authenticated -> display cosmic portal entry transition
      setSuccessEntering(true);

      // Smooth redirection to requested callbackUrl or creator dashboard
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage("An unexpected error occurred during sign in. Please try again.");
      setIsLoading(false);
      setSuccessEntering(false);
    }
  };

  return (
    <>
      <div className="relative w-full max-w-[500px] rounded-3xl bg-[#FAF8F3] p-7 sm:p-9 border border-[#203B35]/12 shadow-[0_24px_64px_-16px_rgba(32,59,53,0.08),0_2px_6px_rgba(32,59,53,0.03)] text-[#282B2A] transition-all">
        {/* Subtle decorative inner corner glint */}
        <div className="pointer-events-none absolute top-4 right-4 opacity-40">
          <CelestialSpark className="h-4 w-4 text-[#9DB5A5]" />
        </div>

        {/* Success / Entering State Overlay */}
        {successEntering ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-up">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB] shadow-lg shadow-[#203B35]/20 animate-pulse-soft">
              <Sparkles className="h-7 w-7 text-[#C8BDE0]" />
              <div className="absolute inset-0 rounded-full border-2 border-[#9DB5A5] animate-ping opacity-25" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9DB5A5]">
                Cosmic Portal Open
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#203B35]">
                Welcome Back, Dreamer!
              </h3>
              <p className="text-sm text-[#282B2A]/70 max-w-xs">
                Resuming your studio drafts, collaborations, and workspace...
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 text-xs text-[#92958F] font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#203B35]" />
              <span>Entering studio workspace</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Form Header */}
            <div className="space-y-1.5 pb-6">
              <h2 className="font-serif text-[26px] sm:text-[30px] font-normal leading-tight text-[#203B35] tracking-tight">
                Sign in to CreativeSpace
              </h2>
              <p className="text-[14px] leading-relaxed text-[#282B2A]/70">
                Welcome back. Enter your credentials to access your studio.
              </p>
            </div>

            {/* Just Registered Welcoming Banner */}
            {justRegistered && !errorMessage && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#9DB5A5]/60 bg-[#9DB5A5]/15 p-3.5 text-[13px] text-[#203B35] animate-fade-up"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#203B35] mt-0.5" />
                <span className="leading-snug">
                  Your creative account has been created! Sign in to enter your studio.
                </span>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-300/80 bg-rose-50/80 p-3.5 text-[13px] text-rose-900 animate-fade-up"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-700 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* 1. Email Address Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor={emailId}
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id={emailId}
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/70 border border-[#203B35]/15 pl-10 pr-3.5 text-[14.5px] text-[#282B2A] placeholder:text-[#92958F] transition-all duration-200 focus:bg-white focus:outline-none focus:border-[#9DB5A5] focus:ring-2 focus:ring-[#9DB5A5]/40 disabled:opacity-50"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#92958F] pointer-events-none" />
                </div>
              </div>

              {/* 2. Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor={passwordId}
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/70 border border-[#203B35]/15 pl-10 pr-11 text-[14.5px] text-[#282B2A] placeholder:text-[#92958F] transition-all duration-200 focus:bg-white focus:outline-none focus:border-[#9DB5A5] focus:ring-2 focus:ring-[#9DB5A5]/40 disabled:opacity-50"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#92958F] pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#92958F] hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 rounded-md"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Understated Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1 select-none">
                <label
                  htmlFor={rememberMeId}
                  className="flex items-center gap-2.5 cursor-pointer text-[13px] text-[#282B2A]/80 hover:text-[#203B35] transition-colors"
                >
                  <input
                    id={rememberMeId}
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 shrink-0 rounded border-[#203B35]/25 text-[#203B35] focus:ring-2 focus:ring-[#9DB5A5] focus:ring-offset-1 focus:ring-offset-[#FAF8F3] accent-[#203B35] cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[13px] font-medium text-[#203B35] underline underline-offset-2 decoration-[#9DB5A5]/70 hover:decoration-[#203B35] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 rounded"
                >
                  Forgot password?
                </button>
              </div>

              {/* 4. Primary CTA: "Enter CreativeSpace" */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#203B35] px-6 text-[15px] font-medium text-[#F6F3EB] transition-all duration-200 hover:bg-[#162A26] active:scale-[0.99] disabled:opacity-60 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#9DB5A5]" />
                      <span>Entering CreativeSpace...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Enter CreativeSpace</span>
                      <ArrowRight className="h-4 w-4 text-[#9DB5A5] transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              </div>

              {/* 5. Bottom Navigation */}
              <div className="pt-3 text-center">
                <p className="text-[13px] text-[#282B2A]/70">
                  New to CreativeSpace?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-[#203B35] hover:text-[#162A26] underline underline-offset-4 decoration-[#9DB5A5] hover:decoration-[#203B35] transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={email}
      />
    </>
  );
}
