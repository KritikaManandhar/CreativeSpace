"use client";

import React, { useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { PolicyModal } from "./PolicyModals";

/**
 * Generate a clean, URL-safe creator username from Full Name and Email
 */
function deriveUsername(fullName: string, email: string, salt = ""): string {
  const cleanName = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const cleanEmail = email
    .split("@")[0]
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  let base = cleanName.length >= 3 ? cleanName : cleanEmail.length >= 3 ? cleanEmail : "creator";
  if (salt) {
    base = `${base}_${salt}`;
  }
  // Keep within 3-28 characters (schema max is 30)
  return base.slice(0, 28);
}

/**
 * Password strength calculation
 */
function evaluatePassword(pwd: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
  hasMinLength: boolean;
  hasNumberOrSymbol: boolean;
  hasMixedCase: boolean;
} {
  const hasMinLength = pwd.length >= 6;
  const hasLongLength = pwd.length >= 8;
  const hasNumberOrSymbol = /[\d\W_]/.test(pwd);
  const hasMixedCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);

  if (!pwd) {
    return {
      score: 0,
      label: "",
      hasMinLength: false,
      hasNumberOrSymbol: false,
      hasMixedCase: false,
    };
  }

  let points = 0;
  if (hasMinLength) points += 1;
  if (hasLongLength && hasNumberOrSymbol) points += 1;
  if (hasMixedCase && (hasLongLength || hasNumberOrSymbol)) points += 1;

  if (points === 1) return { score: 1, label: "Weak", hasMinLength, hasNumberOrSymbol, hasMixedCase };
  if (points === 2) return { score: 2, label: "Good", hasMinLength, hasNumberOrSymbol, hasMixedCase };
  return { score: 3, label: "Strong", hasMinLength, hasNumberOrSymbol, hasMixedCase };
}

export function SignupForm() {
  const router = useRouter();

  // Form states
  const [selectedRole, setSelectedRole] = useState<"CREATOR" | "VIEWER">("CREATOR");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEntering, setSuccessEntering] = useState(false);

  // Policy modal states
  const [policyModalType, setPolicyModalType] = useState<"terms" | "privacy" | null>(null);

  // Unique IDs for accessibility
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const termsId = useId();

  // Real-time validations
  const passwordEval = evaluatePassword(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!selectedRole || (selectedRole !== "CREATOR" && selectedRole !== "VIEWER")) {
      setErrorMessage("Please select whether you are registering as a Creator or a Viewer.");
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Initial register attempt
      let chosenUsername = deriveUsername(trimmedName, trimmedEmail);
      let res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          username: chosenUsername,
          displayName: trimmedName,
          password,
          role: selectedRole,
          disciplines: [],
        }),
      });

      let data = await res.json();

      // If username collided, seamlessly retry with a short numeric suffix
      if (!res.ok && data.error?.message?.toLowerCase().includes("username is already taken")) {
        const fallbackUsername = deriveUsername(
          trimmedName,
          trimmedEmail,
          Math.floor(100 + Math.random() * 900).toString()
        );
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            username: fallbackUsername,
            displayName: trimmedName,
            password,
            role: selectedRole,
            disciplines: [],
          }),
        });
        data = await res.json();
      }

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error?.message ||
            "Unable to complete registration. Please verify your details."
        );
        setIsLoading(false);
        return;
      }

      // 2. Successful creation -> show portal entering state
      setSuccessEntering(true);

      // 3. Automatically sign in
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: trimmedEmail,
        password,
      });

      if (loginRes?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage("An unexpected error occurred. Please try again.");
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
                {selectedRole === "CREATOR" ? "Creator Studio Opening" : "Viewer Access Granted"}
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#203B35]">
                Welcome to CreativeSpace
              </h3>
              <p className="text-sm text-[#282B2A]/70 max-w-xs">
                {selectedRole === "CREATOR"
                  ? "Preparing your studio, project drafts, and creative workspace..."
                  : "Curating inspiring creators, community exhibits, and discovery feed..."}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 text-xs text-[#92958F] font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#203B35]" />
              <span>{selectedRole === "CREATOR" ? "Entering your studio" : "Entering community"}</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Form Header */}
            <div className="space-y-1.5 pb-5">
              <h2 className="font-serif text-[26px] sm:text-[30px] font-normal leading-tight text-[#203B35] tracking-tight">
                Create your account
              </h2>
              <p className="text-[14px] leading-relaxed text-[#282B2A]/70">
                Join CreativeSpace and give your creativity a place to grow.
              </p>
            </div>

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
              {/* Role Selection Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]">
                    Select Your Role
                  </label>
                  <span className="text-[11px] font-mono text-[#9DB5A5]">
                    {selectedRole === "CREATOR" ? "Joining as Creator" : "Joining as Viewer"}
                  </span>
                </div>

                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  role="radiogroup"
                  aria-label="Account Role"
                >
                  {/* Option 1: I'm a Creator */}
                  <div
                    role="radio"
                    aria-checked={selectedRole === "CREATOR"}
                    tabIndex={0}
                    onClick={() => setSelectedRole("CREATOR")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedRole("CREATOR");
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 select-none flex flex-col justify-between ${
                      selectedRole === "CREATOR"
                        ? "border-[#203B35] bg-[#203B35]/[0.05] shadow-xs ring-1 ring-[#203B35]/25"
                        : "border-[#203B35]/15 bg-white/40 hover:border-[#9DB5A5] hover:bg-white/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs ${
                              selectedRole === "CREATOR"
                                ? "bg-[#203B35] text-[#F6F3EB]"
                                : "bg-[#203B35]/10 text-[#203B35]"
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[13.5px] font-semibold text-[#203B35]">
                            I&apos;m a Creator
                          </span>
                        </div>
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            selectedRole === "CREATOR"
                              ? "border-[#203B35] bg-[#203B35] text-white"
                              : "border-[#203B35]/30 bg-transparent"
                          }`}
                        >
                          {selectedRole === "CREATOR" && (
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11.5px] leading-[1.45] text-[#282B2A]/75">
                        Share your creativity, showcase your work, publish projects, offer services, and collaborate with other creators.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: I'm a Viewer */}
                  <div
                    role="radio"
                    aria-checked={selectedRole === "VIEWER"}
                    tabIndex={0}
                    onClick={() => setSelectedRole("VIEWER")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedRole("VIEWER");
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 select-none flex flex-col justify-between ${
                      selectedRole === "VIEWER"
                        ? "border-[#203B35] bg-[#203B35]/[0.05] shadow-xs ring-1 ring-[#203B35]/25"
                        : "border-[#203B35]/15 bg-white/40 hover:border-[#9DB5A5] hover:bg-white/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs ${
                              selectedRole === "VIEWER"
                                ? "bg-[#203B35] text-[#F6F3EB]"
                                : "bg-[#203B35]/10 text-[#203B35]"
                            }`}
                          >
                            <Compass className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[13.5px] font-semibold text-[#203B35]">
                            I&apos;m a Viewer
                          </span>
                        </div>
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            selectedRole === "VIEWER"
                              ? "border-[#203B35] bg-[#203B35] text-white"
                              : "border-[#203B35]/30 bg-transparent"
                          }`}
                        >
                          {selectedRole === "VIEWER" && (
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11.5px] leading-[1.45] text-[#282B2A]/75">
                        Discover creative work, explore creators, follow inspiring accounts, like, comment, save content, and discover or book services.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor={fullNameId}
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]"
                >
                  Full Name
                </label>
                <input
                  id={fullNameId}
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/70 border border-[#203B35]/15 px-3.5 text-[14.5px] text-[#282B2A] placeholder:text-[#92958F] transition-all duration-200 focus:bg-white focus:outline-none focus:border-[#9DB5A5] focus:ring-2 focus:ring-[#9DB5A5]/40 disabled:opacity-50"
                />
              </div>

              {/* 2. Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor={emailId}
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]"
                >
                  Email Address
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/70 border border-[#203B35]/15 px-3.5 text-[14.5px] text-[#282B2A] placeholder:text-[#92958F] transition-all duration-200 focus:bg-white focus:outline-none focus:border-[#9DB5A5] focus:ring-2 focus:ring-[#9DB5A5]/40 disabled:opacity-50"
                />
              </div>

              {/* 3. Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={passwordId}
                    className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]"
                  >
                    Password
                  </label>
                  {passwordEval.label && (
                    <span
                      className={`text-[10.5px] font-mono uppercase tracking-wider font-semibold ${
                        passwordEval.score === 1
                          ? "text-rose-600"
                          : passwordEval.score === 2
                          ? "text-[#9DB5A5]"
                          : "text-[#203B35]"
                      }`}
                    >
                      {passwordEval.label}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/70 border border-[#203B35]/15 px-3.5 pr-11 text-[14.5px] text-[#282B2A] placeholder:text-[#92958F] transition-all duration-200 focus:bg-white focus:outline-none focus:border-[#9DB5A5] focus:ring-2 focus:ring-[#9DB5A5]/40 disabled:opacity-50"
                  />
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

                {/* Password Strength Meter & Requirement Indicator */}
                {password.length > 0 && (
                  <div className="pt-1.5 space-y-1.5 animate-fade-up">
                    <div className="flex h-1.5 w-full gap-1.5 overflow-hidden rounded-full bg-[#203B35]/10">
                      <div
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passwordEval.score >= 1
                            ? passwordEval.score === 1
                              ? "bg-rose-500"
                              : "bg-[#9DB5A5]"
                            : "bg-transparent"
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passwordEval.score >= 2
                            ? passwordEval.score === 2
                              ? "bg-[#9DB5A5]"
                              : "bg-[#203B35]"
                            : "bg-transparent"
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passwordEval.score >= 3 ? "bg-[#203B35]" : "bg-transparent"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#282B2A]/70">
                      <span className="flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            passwordEval.hasMinLength ? "bg-[#203B35]" : "bg-[#92958F]/40"
                          }`}
                        />
                        At least 6 characters
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            passwordEval.hasNumberOrSymbol
                              ? "bg-[#203B35]"
                              : "bg-[#92958F]/40"
                          }`}
                        />
                        Numbers or symbols
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Confirm Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={confirmPasswordId}
                    className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]"
                  >
                    Confirm Password
                  </label>
                  {passwordsMatch && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#203B35]">
                      <Check className="h-3 w-3 text-[#9DB5A5]" />
                      Passwords match
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="text-[10.5px] font-medium text-rose-600">
                      Does not match
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id={confirmPasswordId}
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className={`w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/70 border px-3.5 pr-11 text-[14.5px] text-[#282B2A] placeholder:text-[#92958F] transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 disabled:opacity-50 ${
                      passwordsMismatch
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                        : passwordsMatch
                        ? "border-[#9DB5A5] focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                        : "border-[#203B35]/15 focus:border-[#9DB5A5] focus:ring-[#9DB5A5]/40"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#92958F] hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 rounded-md"
                    aria-label={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 5. Terms & Conditions Checkbox */}
              <div className="pt-1">
                <label
                  htmlFor={termsId}
                  className="flex items-start gap-3 cursor-pointer group select-none text-[13px] leading-[1.5] text-[#282B2A]/80"
                >
                  <input
                    id={termsId}
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    disabled={isLoading}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#203B35]/25 text-[#203B35] focus:ring-2 focus:ring-[#9DB5A5] focus:ring-offset-1 focus:ring-offset-[#FAF8F3] accent-[#203B35] cursor-pointer"
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPolicyModalType("terms");
                      }}
                      className="font-medium text-[#203B35] underline underline-offset-2 decoration-[#9DB5A5]/70 hover:decoration-[#203B35] transition-all"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPolicyModalType("privacy");
                      }}
                      className="font-medium text-[#203B35] underline underline-offset-2 decoration-[#9DB5A5]/70 hover:decoration-[#203B35] transition-all"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              {/* 6. Primary CTA: "Create Account" */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#203B35] px-6 text-[15px] font-medium text-[#F6F3EB] transition-all duration-200 hover:bg-[#162A26] active:scale-[0.99] disabled:opacity-60 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#9DB5A5]" />
                      <span>Creating your account...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4 text-[#9DB5A5] transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              </div>

              {/* 7. Existing Account Prompt */}
              <div className="pt-3 text-center">
                <p className="text-[13px] text-[#282B2A]/70">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-[#203B35] hover:text-[#162A26] underline underline-offset-4 decoration-[#9DB5A5] hover:decoration-[#203B35] transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Policy Dialog Modal */}
      {policyModalType && (
        <PolicyModal
          isOpen={!!policyModalType}
          type={policyModalType}
          onClose={() => setPolicyModalType(null)}
        />
      )}
    </>
  );
}
