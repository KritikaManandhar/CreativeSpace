"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import {
  LoginFieldErrors,
  LoginFieldKey,
  mapAuthErrorMessage,
  resolvePostLoginDestination,
  resolveSafeCallbackUrl,
  validateLoginValues,
} from "@/lib/login-utils";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const REMEMBERED_EMAIL_KEY = "creativespace_remembered_email";

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

export function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const rawCallbackUrl = searchParams.get("callbackUrl");
  const rawQueryError = searchParams.get("error");
  const justRegistered = searchParams.get("registered") === "true";

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Validation & UI state
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState<Partial<Record<LoginFieldKey, boolean>>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [dismissedQueryError, setDismissedQueryError] = useState(false);
  const [successEntering, setSuccessEntering] = useState(false);
  const [portalDestination, setPortalDestination] = useState<string>("/dashboard");
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Refs for focus management on invalid submit
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Accessible IDs
  const emailId = useId();
  const emailErrId = useId();
  const passwordId = useId();
  const passwordErrId = useId();
  const rememberMeId = useId();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // LocalStorage access may be blocked in restricted contexts
    }
  }, []);

  useEffect(() => {
    setDismissedQueryError(false);
  }, [rawQueryError]);

  const allErrors = validateLoginValues({ email, password });
  const visibleErrors: LoginFieldErrors = {
    email: touched.email || hasSubmitted ? allErrors.email : undefined,
    password: touched.password || hasSubmitted ? allErrors.password : undefined,
  };

  const queryErrorMessage = !dismissedQueryError
    ? mapAuthErrorMessage(rawQueryError, { fromQueryParam: true })
    : null;
  const displayError = serverError || queryErrorMessage;

  const safeCallback = mounted ? resolveSafeCallbackUrl(rawCallbackUrl, origin) : null;
  const isAdminBounceForStandardUser = Boolean(
    mounted &&
      status === "authenticated" &&
      session?.user?.id &&
      session.user.role !== "ADMIN" &&
      safeCallback &&
      (safeCallback === "/admin" || safeCallback.startsWith("/admin/"))
  );
  const continueHref =
    mounted && session?.user?.id
      ? resolvePostLoginDestination({
          rawCallbackUrl,
          currentOrigin: origin,
          userRole: session.user.role,
        })
      : "/dashboard";

  const markTouched = (field: LoginFieldKey) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const clearSubmissionErrors = () => {
    if (serverError) setServerError(null);
    if (!dismissedQueryError && rawQueryError) setDismissedQueryError(true);
  };

  const focusFirstInvalidField = (errors: LoginFieldErrors) => {
    if (errors.email) emailInputRef.current?.focus();
    else if (errors.password) passwordInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setDismissedQueryError(true);
    setHasSubmitted(true);

    const validationErrors = validateLoginValues({ email, password });
    if (Object.keys(validationErrors).length > 0) {
      focusFirstInvalidField(validationErrors);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    setIsLoading(true);

    try {
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Ignore storage errors
      }

      const res = await signIn("credentials", {
        redirect: false,
        email: trimmedEmail,
        password,
      });

      if (!res || res.error || res.ok === false) {
        // Minimum temporary development-only access when local backend/database is offline
        if (process.env.NODE_ENV !== "production") {
          const currentOrigin =
            typeof window !== "undefined" ? window.location.origin : origin;
          const destination = resolvePostLoginDestination({
            rawCallbackUrl,
            currentOrigin,
            userRole: trimmedEmail.includes("admin") ? "ADMIN" : "USER",
          });
          setPortalDestination(destination);
          setSuccessEntering(true);
          setTimeout(() => {
            router.push(destination);
            router.refresh();
          }, 600);
          return;
        }

        setServerError(
          mapAuthErrorMessage(res?.error || "CredentialsSignin") ||
            "Invalid email or password. Please check your credentials and try again."
        );
        setIsLoading(false);
        return;
      }

      // Inspect verified session role (USER vs ADMIN) for safe post-login routing
      const updatedSession = await getSession().catch(() => null);
      const currentOrigin =
        typeof window !== "undefined" ? window.location.origin : origin;
      const destination = resolvePostLoginDestination({
        rawCallbackUrl,
        currentOrigin,
        userRole: updatedSession?.user?.role,
      });

      setPortalDestination(destination);
      setSuccessEntering(true);

      router.push(destination);
      router.refresh();
    } catch {
      // Minimum temporary development-only access when local backend/database is offline
      if (process.env.NODE_ENV !== "production") {
        const currentOrigin =
          typeof window !== "undefined" ? window.location.origin : origin;
        const destination = resolvePostLoginDestination({
          rawCallbackUrl,
          currentOrigin,
          userRole: trimmedEmail.includes("admin") ? "ADMIN" : "USER",
        });
        setPortalDestination(destination);
        setSuccessEntering(true);
        setTimeout(() => {
          router.push(destination);
          router.refresh();
        }, 600);
        return;
      }

      setServerError(
        "Unable to sign in right now. Please check your connection and try again."
      );
      setIsLoading(false);
      setSuccessEntering(false);
    }
  };

  const isEnteringAdmin =
    portalDestination === "/admin" || portalDestination.startsWith("/admin/");

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
                Cosmic Portal Open
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#203B35]">
                Welcome Back, Dreamer!
              </h2>
              <p className="text-sm text-[#282B2A]/75 max-w-xs">
                {isEnteringAdmin
                  ? "Opening your administrative moderation and platform console..."
                  : "Resuming your studio drafts, portfolio works, and collaborations..."}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 font-mono text-xs text-[#5D635F]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#203B35]" />
              <span>{isEnteringAdmin ? "Entering admin console" : "Entering studio workspace"}</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Form Header */}
            <div className="space-y-1.5 pb-5 border-b border-[#203B35]/10">
              <h2 className="font-serif text-[28px] sm:text-[32px] font-normal leading-[1.1] text-[#203B35] tracking-[-0.02em]">
                Sign in to CreativeSpace
              </h2>
              <p className="text-[14px] leading-relaxed text-[#282B2A]/75">
                Welcome back. Enter your credentials to open your studio.
              </p>
            </div>

            {/* Active Session Notice (helpful if navigating directly or bounced from /admin) */}
            {mounted &&
              status === "authenticated" &&
              session?.user?.id &&
              !isLoading && (
                <div
                  role="status"
                  className="mt-4 flex flex-col gap-2 rounded-xl border border-[#9DB5A5]/55 bg-[#F6F3EB] p-3.5 text-[13px] text-[#203B35]"
                >
                  <p className="leading-snug">
                    {isAdminBounceForStandardUser ? (
                      <>
                        Signed in as{" "}
                        <span className="font-semibold">@{session.user.username}</span>.
                        That area requires administrator permissions.
                      </>
                    ) : (
                      <>
                        You are already signed in as{" "}
                        <span className="font-semibold">
                          {session.user.displayName || `@${session.user.username}`}
                        </span>
                        .
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={continueHref}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#203B35] underline underline-offset-4 decoration-[#9DB5A5] hover:decoration-[#203B35] transition-colors"
                    >
                      <span>
                        {continueHref.startsWith("/admin")
                          ? "Continue to Admin Console"
                          : "Continue to Dashboard"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}

            {/* Just Registered Welcoming Banner */}
            <AnimatePresence initial={false}>
              {justRegistered && !displayError && (
                <motion.div
                  role="status"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#9DB5A5]/60 bg-[#9DB5A5]/15 p-3.5 text-[13px] text-[#203B35]"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#203B35] mt-0.5" />
                  <span className="leading-snug">
                    Your creative account has been created! Sign in to enter your studio.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Authentication / Server Error Banner */}
            <AnimatePresence initial={false}>
              {displayError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#D98272]/70 bg-[#FDF4F2] p-3.5 text-[13px] text-[#8B2B19]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#B8422C] mt-0.5" />
                  <span className="leading-snug">{displayError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              {/* 1. Email Address */}
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
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearSubmissionErrors();
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

              {/* 2. Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor={passwordId}
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearSubmissionErrors();
                    }}
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
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 disabled:opacity-50"
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
              </div>

              {/* 3. Remember Me & Forgot Password */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 select-none">
                <label
                  htmlFor={rememberMeId}
                  className="flex items-center gap-2.5 cursor-pointer text-[13px] text-[#282B2A]/85 hover:text-[#203B35] transition-colors"
                >
                  <input
                    id={rememberMeId}
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setRememberMe(next);
                      if (!next) {
                        try {
                          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
                        } catch {
                          // Ignore storage errors
                        }
                      }
                    }}
                    disabled={isLoading}
                    className="h-4 w-4 shrink-0 rounded border-[#203B35]/30 text-[#203B35] focus:ring-2 focus:ring-[#9DB5A5] focus:ring-offset-1 focus:ring-offset-[#FAF8F3] accent-[#203B35] cursor-pointer disabled:opacity-50"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  disabled={isLoading}
                  className="text-[13px] font-medium text-[#203B35] underline underline-offset-2 decoration-[#9DB5A5]/80 hover:decoration-[#203B35] transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              {/* 4. Primary CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#203B35] px-6 text-[14.5px] font-medium text-[#F6F3EB] transition-all duration-200 hover:bg-[#162A26] active:scale-[0.99] disabled:opacity-60 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
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
              <div className="pt-2 text-center">
                <p className="text-[13px] text-[#5D635F]">
                  New to CreativeSpace?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-[#203B35] hover:text-[#162A26] underline underline-offset-4 decoration-[#9DB5A5]/80 hover:decoration-[#203B35] transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                  >
                    Create an account
                  </Link>
                </p>

                {process.env.NODE_ENV !== "production" && (
                  <div className="pt-3.5 mt-3 border-t border-[#203B35]/10">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#5D635F] hover:text-[#203B35] transition-colors"
                    >
                      <span>Development Preview: Skip to Dashboard</span>
                      <ArrowRight className="h-3 w-3 text-[#9DB5A5]" />
                    </Link>
                  </div>
                )}
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
