"use client";

import React, { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { RegisterSchema } from "@/lib/validations/auth";
import { PolicyModal } from "./PolicyModals";

type FieldKey = "fullName" | "email" | "password" | "confirmPassword" | "terms";
type FieldErrors = Partial<Record<FieldKey, string>>;

interface FormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

/**
 * Generates a clean URL-safe username matching RegisterSchema.shape.username.
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

  const rawBase =
    cleanName.length >= 3 ? cleanName : cleanEmail.length >= 3 ? cleanEmail : "creator";
  const maxBaseLen = salt ? 28 - salt.length - 1 : 28;
  const trimmedBase = rawBase.slice(0, maxBaseLen).replace(/_+$/g, "") || "creator";
  return salt ? `${trimmedBase}_${salt}` : trimmedBase;
}

/**
 * Password strength evaluation aligned with RegisterSchema's 6-character minimum.
 */
function evaluatePassword(pwd: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
  hasMinLength: boolean;
  hasNumberOrSymbol: boolean;
  hasMixedCase: boolean;
} {
  if (!pwd) {
    return {
      score: 0,
      label: "",
      hasMinLength: false,
      hasNumberOrSymbol: false,
      hasMixedCase: false,
    };
  }

  const hasMinLength = pwd.length >= 6;
  const hasLongLength = pwd.length >= 8;
  const hasNumberOrSymbol = /[\d\W_]/.test(pwd);
  const hasMixedCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);

  let points = 0;
  if (hasMinLength) points += 1;
  if (hasLongLength && hasNumberOrSymbol) points += 1;
  if (hasMixedCase && (hasLongLength || hasNumberOrSymbol)) points += 1;

  if (points <= 1) return { score: 1, label: "Weak", hasMinLength, hasNumberOrSymbol, hasMixedCase };
  if (points === 2) return { score: 2, label: "Good", hasMinLength, hasNumberOrSymbol, hasMixedCase };
  return { score: 3, label: "Strong", hasMinLength, hasNumberOrSymbol, hasMixedCase };
}

/**
 * Validates form values by delegating core registration rules directly to
 * the shared RegisterSchema (avoiding duplicated validation logic) and
 * enforcing client-only confirm-password & terms acceptance checks.
 */
function validateSignupValues(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedName = values.fullName.trim();
  const trimmedEmail = values.email.trim().toLowerCase();

  const parsed = RegisterSchema.safeParse({
    displayName: trimmedName,
    email: trimmedEmail,
    username: deriveUsername(trimmedName, trimmedEmail),
    password: values.password,
    disciplines: [],
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const pathKey = issue.path[0];
      if (pathKey === "displayName" && !errors.fullName) {
        errors.fullName =
          trimmedName.length === 0
            ? "Please enter your full name."
            : "Full name must be at least 2 characters.";
      } else if (pathKey === "email" && !errors.email) {
        errors.email = issue.message;
      } else if (pathKey === "password" && !errors.password) {
        errors.password = issue.message;
      }
    }
  }

  if (values.confirmPassword.length === 0) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!values.agreedToTerms) {
    errors.terms = "Please agree to the Terms of Service and Privacy Policy to continue.";
  }

  return errors;
}

function InlineFieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role="status"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[12px] leading-snug text-[#9F311D]"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function SignupForm() {
  const router = useRouter();

  // Form state (unified USER registration — no client role selector)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Validation & UI state
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailConflictError, setEmailConflictError] = useState<string | null>(null);
  const [successEntering, setSuccessEntering] = useState(false);
  const [policyModalType, setPolicyModalType] = useState<"terms" | "privacy" | null>(null);

  // Refs for focus management on invalid submit
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const termsInputRef = useRef<HTMLInputElement>(null);

  // Accessible IDs
  const fullNameId = useId();
  const fullNameErrId = useId();
  const emailId = useId();
  const emailErrId = useId();
  const passwordId = useId();
  const passwordErrId = useId();
  const confirmPasswordId = useId();
  const confirmPasswordErrId = useId();
  const termsId = useId();
  const termsErrId = useId();

  const currentValues: FormValues = {
    fullName,
    email,
    password,
    confirmPassword,
    agreedToTerms,
  };

  const allErrors = validateSignupValues(currentValues);
  const visibleErrors: FieldErrors = {
    fullName: touched.fullName || hasSubmitted ? allErrors.fullName : undefined,
    email:
      emailConflictError || (touched.email || hasSubmitted ? allErrors.email : undefined),
    password: touched.password || hasSubmitted ? allErrors.password : undefined,
    confirmPassword:
      touched.confirmPassword || hasSubmitted ? allErrors.confirmPassword : undefined,
    terms: touched.terms || hasSubmitted ? allErrors.terms : undefined,
  };

  const passwordEval = evaluatePassword(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const markTouched = (field: FieldKey) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const focusFirstInvalidField = (errors: FieldErrors) => {
    if (errors.fullName) fullNameInputRef.current?.focus();
    else if (errors.email) emailInputRef.current?.focus();
    else if (errors.password) passwordInputRef.current?.focus();
    else if (errors.confirmPassword) confirmPasswordInputRef.current?.focus();
    else if (errors.terms) termsInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setEmailConflictError(null);
    setHasSubmitted(true);

    const validationErrors = validateSignupValues(currentValues);
    if (Object.keys(validationErrors).length > 0) {
      focusFirstInvalidField(validationErrors);
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    setIsLoading(true);

    try {
      let attempt = 0;
      let res: Response | null = null;
      let data: any = null;

      while (attempt < 3) {
        const salt = attempt === 0 ? "" : Math.floor(100 + Math.random() * 899).toString();
        const chosenUsername = deriveUsername(trimmedName, trimmedEmail, salt);

        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            username: chosenUsername,
            displayName: trimmedName,
            password,
            disciplines: [],
          }),
        });

        data = await res.json();

        const isUsernameCollision =
          !res.ok &&
          typeof data?.error?.message === "string" &&
          data.error.message.toLowerCase().includes("username is already taken");

        if (!isUsernameCollision) break;
        attempt += 1;
      }

      if (!res || !res.ok || !data?.success) {
        const apiMessage =
          data?.error?.message ||
          "Unable to complete registration. Please verify your details.";
        setServerError(apiMessage);
        if (apiMessage.toLowerCase().includes("email")) {
          setEmailConflictError(apiMessage);
          emailInputRef.current?.focus();
        }
        setIsLoading(false);
        return;
      }

      setSuccessEntering(true);

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
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
      setSuccessEntering(false);
    }
  };

  return (
    <>
      <div className="relative w-full max-w-[492px] rounded-[22px] bg-[#FAF8F3] p-6 sm:p-8 border border-[#203B35]/12 shadow-[0_24px_60px_-24px_rgba(32,59,53,0.16),0_2px_8px_rgba(32,59,53,0.04)] text-[#282B2A]">
        {/* Restrained corner celestial detail */}
        <div className="pointer-events-none absolute top-4 right-4 opacity-50" aria-hidden="true">
          <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
        </div>

        {successEntering ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-up">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB] shadow-lg shadow-[#203B35]/20">
              <Sparkles className="h-7 w-7 text-[#C8BDE0]" />
              <div className="absolute inset-0 rounded-full border-2 border-[#9DB5A5] animate-ping opacity-25" />
            </div>
            <div className="space-y-1.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#5D635F]">
                Cosmic Portal Opening
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#203B35]">
                Welcome to CreativeSpace
              </h2>
              <p className="text-sm text-[#282B2A]/75 max-w-xs">
                Preparing your studio, creative portfolio, and community space...
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 font-mono text-xs text-[#5D635F]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#203B35]" />
              <span>Entering CreativeSpace</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Form Header */}
            <div className="space-y-1.5 pb-5 border-b border-[#203B35]/10">
              <h2 className="font-serif text-[28px] sm:text-[32px] font-normal leading-[1.1] text-[#203B35] tracking-[-0.02em]">
                Create your account
              </h2>
              <p className="text-[14px] leading-relaxed text-[#282B2A]/75">
                Join CreativeSpace and give your creativity a place to grow.
              </p>
            </div>

            {/* Server / Submission Error Banner */}
            <AnimatePresence initial={false}>
              {serverError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#D98272]/70 bg-[#FDF4F2] p-3.5 text-[13px] text-[#8B2B19]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#B8422C] mt-0.5" />
                  <span className="leading-snug">{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              {/* 1. Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor={fullNameId}
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35]"
                >
                  Full Name
                </label>
                <input
                  ref={fullNameInputRef}
                  id={fullNameId}
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => markTouched("fullName")}
                  disabled={isLoading}
                  aria-invalid={Boolean(visibleErrors.fullName)}
                  aria-describedby={visibleErrors.fullName ? fullNameErrId : undefined}
                  className={`w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/75 border px-3.5 text-[14.5px] text-[#282B2A] placeholder:text-[#5D635F]/75 transition-all duration-200 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    visibleErrors.fullName
                      ? "border-[#B8422C]/70 focus:border-[#B8422C] focus:ring-[#B8422C]/20"
                      : "border-[#203B35]/15 focus:border-[#203B35]/55 focus:ring-[#9DB5A5]/45"
                  }`}
                />
                <InlineFieldError id={fullNameErrId} message={visibleErrors.fullName} />
              </div>

              {/* 2. Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor={emailId}
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35]"
                >
                  Email Address
                </label>
                <input
                  ref={emailInputRef}
                  id={emailId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailConflictError) setEmailConflictError(null);
                  }}
                  onBlur={() => markTouched("email")}
                  disabled={isLoading}
                  aria-invalid={Boolean(visibleErrors.email)}
                  aria-describedby={visibleErrors.email ? emailErrId : undefined}
                  className={`w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/75 border px-3.5 text-[14.5px] text-[#282B2A] placeholder:text-[#5D635F]/75 transition-all duration-200 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    visibleErrors.email
                      ? "border-[#B8422C]/70 focus:border-[#B8422C] focus:ring-[#B8422C]/20"
                      : "border-[#203B35]/15 focus:border-[#203B35]/55 focus:ring-[#9DB5A5]/45"
                  }`}
                />
                <InlineFieldError id={emailErrId} message={visibleErrors.email} />
              </div>

              {/* 3. Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={passwordId}
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35]"
                  >
                    Password
                  </label>
                  {passwordEval.label && (
                    <span
                      className={`font-mono text-[10.5px] uppercase tracking-wider font-semibold ${
                        passwordEval.score === 1
                          ? "text-[#9F311D]"
                          : passwordEval.score === 2
                          ? "text-[#4D6B59]"
                          : "text-[#203B35]"
                      }`}
                    >
                      {passwordEval.label}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched("password")}
                    disabled={isLoading}
                    aria-invalid={Boolean(visibleErrors.password)}
                    aria-describedby={visibleErrors.password ? passwordErrId : undefined}
                    className={`w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/75 border px-3.5 pr-11 text-[14.5px] text-[#282B2A] placeholder:text-[#5D635F]/75 transition-all duration-200 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 disabled:opacity-50 ${
                      visibleErrors.password
                        ? "border-[#B8422C]/70 focus:border-[#B8422C] focus:ring-[#B8422C]/20"
                        : "border-[#203B35]/15 focus:border-[#203B35]/55 focus:ring-[#9DB5A5]/45"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>

                <InlineFieldError id={passwordErrId} message={visibleErrors.password} />

                {/* Password Strength & Requirement Indicators */}
                <AnimatePresence initial={false}>
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="pt-1 space-y-1.5"
                    >
                      <div className="flex h-1.5 w-full gap-1.5 overflow-hidden rounded-full bg-[#203B35]/10">
                        <div
                          className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                            passwordEval.score === 1
                              ? "bg-[#B8422C]"
                              : passwordEval.score === 2
                              ? "bg-[#7C9A87]"
                              : "bg-[#203B35]"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                            passwordEval.score >= 2
                              ? passwordEval.score === 2
                                ? "bg-[#7C9A87]"
                                : "bg-[#203B35]"
                              : "bg-transparent"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                            passwordEval.score >= 3 ? "bg-[#203B35]" : "bg-transparent"
                          }`}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-[#5D635F]">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                              passwordEval.hasMinLength ? "bg-[#203B35]" : "bg-[#5D635F]/35"
                            }`}
                          />
                          <span className={passwordEval.hasMinLength ? "text-[#203B35]" : ""}>
                            6+ characters
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                              passwordEval.hasNumberOrSymbol ? "bg-[#203B35]" : "bg-[#5D635F]/35"
                            }`}
                          />
                          <span className={passwordEval.hasNumberOrSymbol ? "text-[#203B35]" : ""}>
                            Number or symbol
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                              passwordEval.hasMixedCase ? "bg-[#203B35]" : "bg-[#5D635F]/35"
                            }`}
                          />
                          <span className={passwordEval.hasMixedCase ? "text-[#203B35]" : ""}>
                            Mixed case
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Confirm Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={confirmPasswordId}
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35]"
                  >
                    Confirm Password
                  </label>
                  {passwordsMatch && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#203B35]">
                      <Check className="h-3 w-3 text-[#4D6B59]" />
                      Passwords match
                    </span>
                  )}
                  {passwordsMismatch && !visibleErrors.confirmPassword && (
                    <span className="text-[11px] font-medium text-[#9F311D]">
                      Does not match
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={confirmPasswordInputRef}
                    id={confirmPasswordId}
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => markTouched("confirmPassword")}
                    disabled={isLoading}
                    aria-invalid={Boolean(visibleErrors.confirmPassword || passwordsMismatch)}
                    aria-describedby={
                      visibleErrors.confirmPassword ? confirmPasswordErrId : undefined
                    }
                    className={`w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/75 border px-3.5 pr-11 text-[14.5px] text-[#282B2A] placeholder:text-[#5D635F]/75 transition-all duration-200 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 disabled:opacity-50 ${
                      visibleErrors.confirmPassword || passwordsMismatch
                        ? "border-[#B8422C]/70 focus:border-[#B8422C] focus:ring-[#B8422C]/20"
                        : passwordsMatch
                        ? "border-[#9DB5A5] focus:border-[#203B35] focus:ring-[#9DB5A5]/45"
                        : "border-[#203B35]/15 focus:border-[#203B35]/55 focus:ring-[#9DB5A5]/45"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                    aria-label={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                <InlineFieldError
                  id={confirmPasswordErrId}
                  message={visibleErrors.confirmPassword}
                />
              </div>

              {/* 5. Terms and Conditions Checkbox */}
              <div className="pt-1 space-y-1.5">
                <label
                  htmlFor={termsId}
                  className="flex items-start gap-2.5 cursor-pointer select-none text-[13px] leading-[1.5] text-[#282B2A]/85"
                >
                  <input
                    ref={termsInputRef}
                    id={termsId}
                    name="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      markTouched("terms");
                    }}
                    disabled={isLoading}
                    aria-invalid={Boolean(visibleErrors.terms)}
                    aria-describedby={visibleErrors.terms ? termsErrId : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#203B35]/30 text-[#203B35] focus:ring-2 focus:ring-[#9DB5A5] focus:ring-offset-1 focus:ring-offset-[#FAF8F3] accent-[#203B35] cursor-pointer"
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPolicyModalType("terms");
                      }}
                      className="font-medium text-[#203B35] underline underline-offset-2 decoration-[#9DB5A5]/80 hover:decoration-[#203B35] transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
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
                      className="font-medium text-[#203B35] underline underline-offset-2 decoration-[#9DB5A5]/80 hover:decoration-[#203B35] transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
                <InlineFieldError id={termsErrId} message={visibleErrors.terms} />
              </div>

              {/* 6. Primary CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#203B35] px-6 text-[14.5px] font-medium text-[#F6F3EB] transition-all duration-200 hover:bg-[#162A26] active:scale-[0.99] disabled:opacity-60 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
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
            </form>
          </div>
        )}
      </div>

      {/* Governance Modal for Terms of Service & Privacy Policy */}
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
