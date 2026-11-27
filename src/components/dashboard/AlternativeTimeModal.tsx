"use client";

import React, { useId, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  Info,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { BOOKING_TIME_SLOTS } from "@/components/profile/ClientBookingRequestFlow";
import type { UnifiedBookingItem } from "@/lib/bookingStore";

interface AlternativeTimeModalProps {
  booking: UnifiedBookingItem | null;
  actorRole: "creator" | "client";
  isOpen: boolean;
  onClose: () => void;
  onSubmitProposal: (
    bookingId: string,
    proposedDate: string,
    proposedSlot: string,
    note?: string
  ) => void;
}

export function AlternativeTimeModal({
  booking,
  actorRole,
  isOpen,
  onClose,
  onSubmitProposal,
}: AlternativeTimeModalProps) {
  const titleId = useId();

  // Tomorrow as default minimum date
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const minDateString = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState<string>(minDateString);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    BOOKING_TIME_SLOTS[1].id
  );
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const isCounterProposal =
    booking.proposalStatus === "ProposedByCreator" ||
    booking.proposalStatus === "ProposedByClient";

  const selectedSlot =
    BOOKING_TIME_SLOTS.find((s) => s.id === selectedSlotId) ||
    BOOKING_TIME_SLOTS[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Please choose a proposed date.");
      return;
    }
    setError(null);
    const slotString = `${selectedSlot.title}: ${selectedSlot.timeRange} (UTC+9)`;
    onSubmitProposal(booking.id, date, slotString, note.trim() || undefined);
    onClose();
  };

  const recipientLabel =
    actorRole === "creator" ? booking.clientName : booking.creatorName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-[#282B2A]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#203B35]/10 pb-3.5">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
              <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
              <span>
                {isCounterProposal
                  ? "Submit Counterproposal"
                  : "Propose Alternative Slot"}
              </span>
            </div>
            <h3
              id={titleId}
              className="mt-1 font-serif text-xl sm:text-2xl text-[#203B35]"
            >
              {isCounterProposal
                ? "Propose Counter-Time"
                : "Suggest Alternative Date & Time"}
            </h3>
            <p className="mt-0.5 text-xs text-[#5D635F]">
              Propose an alternative slot to <strong>{recipientLabel}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Original Slot vs Active Proposal */}
        <div className="rounded-2xl border border-[#203B35]/12 bg-[#F6F3EB] p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[#5D635F]">
              Original Slot (S1 · Protected)
            </span>
            <span className="font-medium text-[#203B35]">
              {booking.originalDate} · {booking.originalSlot}
            </span>
          </div>

          {booking.proposedAlternativeDate && (
            <div className="flex items-center justify-between border-t border-[#203B35]/10 pt-2 text-[#8E5A1C]">
              <span className="font-mono text-[10px] uppercase">
                Current Alternative (S2 · Replaced on Submit)
              </span>
              <span className="font-medium">
                {booking.proposedAlternativeDate} ·{" "}
                {booking.proposedAlternativeSlot}
              </span>
            </div>
          )}
        </div>

        {/* Proposal Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <label
              htmlFor="alt-date-picker"
              className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
            >
              Proposed New Date
            </label>
            <input
              id="alt-date-picker"
              type="date"
              min={minDateString}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#203B35]/20 bg-[#F6F3EB]/90 px-3.5 text-sm text-[#282B2A] focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/40"
            />
          </div>

          {/* Time Slot Radio Cards */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]">
              Proposed Time Slot
            </label>
            <div className="space-y-2">
              {BOOKING_TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all select-none ${
                      isSelected
                        ? "border-[#203B35] bg-[#9DB5A5]/15 ring-1 ring-[#203B35]"
                        : "border-[#203B35]/15 bg-[#F6F3EB]/70 hover:bg-[#F6F3EB]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-serif text-sm font-medium text-[#203B35]">
                          {slot.title}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-[#5D635F]">
                          {slot.timeRange}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono rounded-full bg-[#FAF8F3] px-2 py-0.5 border border-[#203B35]/10 text-[#5D635F]">
                        {slot.formatTag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note to the other party */}
          <div className="space-y-1.5">
            <label
              htmlFor="alt-note"
              className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
            >
              Note / Explanation to {recipientLabel} (Optional)
            </label>
            <textarea
              id="alt-note"
              rows={3}
              placeholder={`Share why this time works better or propose specific scheduling preferences...`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#F6F3EB]/90 p-3 text-xs text-[#282B2A] focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/40"
            />
          </div>

          {/* Operational Negotiation Rule Notice */}
          <div className="rounded-xl border border-[#9DB5A5]/60 bg-[#9DB5A5]/15 p-3 text-[12px] text-[#203B35] space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Info className="h-3.5 w-3.5" />
              <span>Negotiation Concurrency Rules</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[#282B2A]/85">
              Submitting this proposal will immediately release any previously
              superseded alternative slot. The new proposed slot and original
              slot (S1) are held simultaneously. A strict 24-hour response
              countdown resets for {recipientLabel}.
            </p>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-[#ae361c]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#203B35]/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-medium text-[#5D635F] hover:text-[#203B35]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
            >
              <span>Send Alternative Proposal</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#9DB5A5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
