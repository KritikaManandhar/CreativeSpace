"use client";

import React, { useState, useEffect } from "react";
import { X, KeyRound, Mail, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

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

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    // Simulate recovery email dispatch with authentic studio feedback
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setError(null);
    onClose();
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
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(32,59,53,0.2)] text-[#282B2A] transition-all z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#203B35]/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9DB5A5]/25 text-[#203B35]">
              <KeyRound className="h-5 w-5 text-[#203B35]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9DB5A5]">
                <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
                <span>Password Recovery</span>
              </div>
              <h2
                id="forgot-password-modal-title"
                className="font-serif text-xl sm:text-2xl font-normal text-[#203B35] leading-tight mt-0.5"
              >
                Reset your password
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-[#92958F] hover:bg-[#203B35]/5 hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="pt-5">
          {isSubmitted ? (
            <div className="space-y-4 py-2 animate-fade-up">
              <div className="flex items-start gap-3 rounded-xl bg-[#9DB5A5]/15 border border-[#9DB5A5]/40 p-4 text-[#203B35]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#203B35] mt-0.5" />
                <div className="text-[13.5px] leading-relaxed">
                  <p className="font-semibold text-[#203B35]">Recovery instructions sent</p>
                  <p className="text-[#282B2A]/80 mt-1">
                    If an account is associated with{" "}
                    <span className="font-medium text-[#203B35]">{email}</span>, you will
                    receive an email with steps to safely reset your studio password.
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#92958F] text-center">
                Didn&apos;t receive it? Check your spam folder or re-verify the address.
              </p>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full flex h-11 items-center justify-center rounded-xl bg-[#203B35] text-sm font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[13.5px] leading-relaxed text-[#282B2A]/75">
                Enter your account email below. We&apos;ll send you instructions and a secure link
                to regain access to your creative workspace.
              </p>

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-xl border border-rose-300 bg-rose-50/80 text-[13px] text-rose-800"
                >
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="recovery-email-input"
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#203B35]"
                >
                  Account Email
                </label>
                <div className="relative">
                  <input
                    id="recovery-email-input"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl bg-[#F6F3EB]/70 border border-[#203B35]/15 pl-10 pr-3.5 text-[14.5px] text-[#282B2A] placeholder:text-[#92958F] transition-all focus:bg-white focus:outline-none focus:border-[#9DB5A5] focus:ring-2 focus:ring-[#9DB5A5]/40 disabled:opacity-50"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#92958F] pointer-events-none" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#92958F] hover:text-[#203B35] transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#203B35] px-5 text-sm font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-all disabled:opacity-60 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
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
