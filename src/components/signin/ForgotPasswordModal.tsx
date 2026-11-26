"use client";

import React, { useEffect, useId, useState } from "react";
import { X, KeyRound, CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { PasswordResetRequestSchema } from "@/lib/validations/auth";

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultEmail = "",
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setError(null);
      setIsSubmitted(false);
    }
  }, [isOpen, defaultEmail]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    if (isSubmitting) return;
    setIsSubmitted(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    const parsed = PasswordResetRequestSchema.safeParse({ email: trimmed });
    if (!parsed.success) {
      setError(
        trimmed.length === 0
          ? "Please enter your email address."
          : parsed.error.issues[0]?.message || "Please enter a valid email address."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        if (res.status === 422 || res.status === 400) {
          setError("Please enter a valid email address.");
        } else {
          setError(
            "Unable to process password recovery right now. Please try again shortly."
          );
        }
        setIsSubmitting(false);
        return;
      }

      setEmail(parsed.data.email);
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch {
      setError("Unable to reach the recovery service right now. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-modal-title"
    >
      {/* Soft atmospheric backdrop */}
      <div
        className="fixed inset-0 bg-[#203B35]/40 backdrop-blur-sm transition-opacity"
        onClick={handleResetAndClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-[22px] sm:rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-8 text-[#282B2A] shadow-[0_25px_60px_-15px_rgba(32,59,53,0.2)] transition-all">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#203B35]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9DB5A5]/20 text-[#203B35]">
              <KeyRound className="h-5 w-5 text-[#203B35]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5D635F]">
                <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
                <span>Password Recovery</span>
              </div>
              <h2
                id="forgot-password-modal-title"
                className="mt-0.5 font-serif text-xl sm:text-2xl font-normal leading-tight text-[#203B35] tracking-tight"
              >
                Reset your password
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            disabled={isSubmitting}
            className="rounded-full p-1.5 text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="pt-5">
          {isSubmitted ? (
            <div className="space-y-4 py-1 animate-fade-up">
              <div className="flex items-start gap-3 rounded-xl border border-[#9DB5A5]/50 bg-[#9DB5A5]/15 p-4 text-[#203B35]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#203B35] mt-0.5" />
                <div className="text-[13.5px] leading-relaxed">
                  <p className="font-semibold text-[#203B35]">Recovery instructions sent</p>
                  <p className="mt-1 text-[#282B2A]/80">
                    If an account is associated with{" "}
                    <span className="font-medium text-[#203B35] break-all">{email}</span>, you
                    will receive an email with steps to safely reset your studio password.
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-[#5D635F]">
                Didn&apos;t receive it? Check your spam folder or verify the address above.
              </p>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-[#203B35] text-sm font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-[13.5px] leading-relaxed text-[#282B2A]/78">
                Enter your account email below. We&apos;ll send instructions to help you regain
                access to your CreativeSpace studio.
              </p>

              {error && (
                <div
                  id={errorId}
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-[#D98272]/70 bg-[#FDF4F2] p-3 text-[13px] text-[#8B2B19]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#B8422C] mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor={inputId}
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35]"
                >
                  Account Email
                </label>
                <input
                  id={inputId}
                  name="recoveryEmail"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  className={`w-full h-11 sm:h-12 rounded-xl bg-[#F6F3EB]/75 border px-3.5 text-[14.5px] text-[#282B2A] placeholder:text-[#5D635F]/75 transition-all duration-200 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    error
                      ? "border-[#B8422C]/70 focus:border-[#B8422C] focus:ring-[#B8422C]/20"
                      : "border-[#203B35]/15 focus:border-[#203B35]/55 focus:ring-[#9DB5A5]/45"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={isSubmitting}
                  className="rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5D635F] hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#203B35] px-5 text-sm font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-all disabled:opacity-60 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#9DB5A5]" />
                      <span>Sending...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Send Recovery Link</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#9DB5A5] transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
