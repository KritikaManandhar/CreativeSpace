"use client";

import React, { useState } from "react";
import { Flag, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorUsername: string;
  onSuccess: () => void;
}

export function ReportCreatorModal({
  isOpen,
  onClose,
  creatorId,
  creatorUsername,
  onSuccess,
}: ReportCreatorModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "User",
          targetId: creatorId,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Could not submit report. Please try again.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error while submitting report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-md rounded-3xl bg-[#FAF8F3] border border-[#203B35]/20 shadow-2xl p-6 text-[#282B2A]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#203B35]/10">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <Flag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif text-[#203B35] font-bold">
              Report @{creatorUsername}
            </h3>
            <p className="text-[11px] text-[#5D635F]">
              Submit for review by CreativeSpace community moderators
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="report-creator-reason" className="block text-xs font-semibold text-[#203B35] mb-1.5">
              Reason for report
            </label>
            <textarea
              id="report-creator-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue (e.g. copyright infringement, inappropriate content, impersonation)..."
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#203B35]/20 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35]"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !reason.trim()}
              isLoading={isSubmitting}
              className="bg-rose-700 text-white hover:bg-rose-800 rounded-full text-xs"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
