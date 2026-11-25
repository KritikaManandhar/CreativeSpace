"use client";

import React from "react";
import { AlertTriangle, Trash2, X, AlertCircle } from "lucide-react";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  isBusy?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  isBusy = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#162A26]/70 backdrop-blur-sm transition-opacity"
        onClick={!isBusy ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#FAF8F3] border border-[#203B35]/20 p-6 sm:p-7 shadow-2xl z-10 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#92958F] hover:text-[#203B35] hover:bg-[#EFECE2] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Content */}
        <div className="flex items-start gap-4 pt-1">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-rose-100 text-rose-700 ring-4 ring-rose-50"
                : "bg-amber-100 text-amber-800 ring-4 ring-amber-50"
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1.5 pr-4">
            <h3
              id="confirm-modal-title"
              className="text-base sm:text-lg font-serif italic text-[#203B35] font-semibold"
            >
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#5D635F] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[#203B35]/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-4 py-2 rounded-full border border-[#203B35]/20 bg-white text-xs font-semibold text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 ${
              isDanger
                ? "bg-rose-700 hover:bg-rose-800 ring-2 ring-rose-700/20"
                : "bg-[#203B35] hover:bg-[#162A26] ring-2 ring-[#203B35]/20"
            }`}
          >
            {isBusy ? (
              <>
                <span className="animate-spin text-xs">···</span>
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
