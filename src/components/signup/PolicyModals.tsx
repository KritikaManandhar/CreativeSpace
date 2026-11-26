"use client";

import React, { useEffect } from "react";
import { X, ShieldCheck, ScrollText } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

export interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

export function PolicyModal({ isOpen, onClose, type }: PolicyModalProps) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
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
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTerms = type === "terms";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
    >
      {/* Soft atmospheric backdrop */}
      <div
        className="fixed inset-0 bg-[#203B35]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(32,59,53,0.2)] text-[#282B2A] transition-all z-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#203B35]/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9DB5A5]/20 text-[#203B35]">
              {isTerms ? (
                <ScrollText className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5D635F]">
                <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
                <span>CreativeSpace Governance</span>
              </div>
              <h2
                id="policy-modal-title"
                className="font-serif text-2xl font-normal text-[#203B35] tracking-tight"
              >
                {isTerms ? "Terms of Service" : "Privacy Policy"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-5 text-[14px] leading-[1.7] text-[#282B2A]/85">
          {isTerms ? (
            <>
              <p className="font-medium text-[#203B35]">
                Welcome to CreativeSpace. By registering an account or participating in our
                community, you agree to these Terms of Service.
              </p>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  1. Creator Ownership & Intellectual Property
                </h3>
                <p>
                  You retain full ownership, copyrights, and intellectual rights to all artwork,
                  designs, photography, writing, and creative projects you upload to CreativeSpace.
                  We never claim ownership over your original works.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  2. Community Integrity & Conduct
                </h3>
                <p>
                  CreativeSpace is built on mutual respect, constructive feedback, and artistic
                  growth. Plagiarism, harassment, hate speech, or unauthorized redistribution of
                  another creator&apos;s work is strictly prohibited and grounds for immediate account
                  suspension.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  3. Version History & Collaboration
                </h3>
                <p>
                  When inviting collaborators to project drafts, you control their permissions
                  (view, review, edit). Versions published to the public showcase become visible to
                  the wider community according to your privacy settings.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  4. Account Security
                </h3>
                <p>
                  You are responsible for maintaining the confidentiality of your login credentials
                  and ensuring that your account details remain accurate and updated.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-[#203B35]">
                At CreativeSpace, your privacy and artistic autonomy are sacred. This Privacy Policy
                explains how we handle your personal information.
              </p>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  1. Information We Collect
                </h3>
                <p>
                  We collect your full name, email address, chosen handle, and encrypted password
                  during registration to establish your creator account and portfolio studio.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  2. How We Use Your Data
                </h3>
                <p>
                  Your information is solely used to authenticate your access, display your creator
                  portfolio, deliver notifications regarding collaborative drafts, and facilitate
                  peer reviews. We never sell your personal data or creative work to third parties.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  3. Project & Asset Privacy
                </h3>
                <p>
                  Work-in-progress drafts and internal feedback threads remain strictly private to you
                  and your invited collaborators until you explicitly choose to publish them to the
                  public feed or portfolio.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-[#203B35] text-[15px]">
                  4. Data Rights & Export
                </h3>
                <p>
                  You may export your creative portfolio, download all associated assets, or request
                  full deletion of your account and data at any time from your studio settings.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#203B35]/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#203B35] px-6 py-2 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
