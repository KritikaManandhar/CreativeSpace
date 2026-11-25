"use client";

import React from "react";
import { Check, AlertCircle, X } from "lucide-react";

interface ProfileToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function ProfileToast({
  message,
  type = "success",
  onClose,
}: ProfileToastProps) {
  return (
    <aside
      aria-live="polite"
      role="status"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#203B35] text-[#F6F3EB] shadow-2xl border border-[#9DB5A5]/30 animate-fade-up max-w-md"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9DB5A5]/25 text-[#9DB5A5] shrink-0">
        {type === "error" ? (
          <AlertCircle className="h-3.5 w-3.5 text-rose-300" />
        ) : (
          <Check className="h-3.5 w-3.5 text-[#9DB5A5]" />
        )}
      </div>

      <p className="text-xs font-medium leading-relaxed flex-1">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-full text-[#9DB5A5] hover:text-[#F6F3EB] hover:bg-white/10 transition-colors"
        aria-label="Dismiss message"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
