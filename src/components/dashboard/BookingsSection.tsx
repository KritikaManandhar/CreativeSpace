"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  HelpCircle,
  Info,
  Layers,
  Lock,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type {
  BookingProposalStatus,
  BookingStatus,
  UnifiedBookingItem,
} from "@/lib/bookingStore";

interface BookingsSectionProps {
  bookings: UnifiedBookingItem[];
  currentUserHandle?: string;
  onSelectBookingToProceed: (bookingId: string) => void;
  onReleaseSelection: (bookingId: string) => void;
  onDeclineBooking: (bookingId: string) => void;
  onConfirmBooking?: (bookingId: string) => void;
  onOpenBookingDetail: (booking: UnifiedBookingItem) => void;
  onOpenAlternativeModal: (booking: UnifiedBookingItem, actorRole: "creator" | "client") => void;
  onAcceptAlternative: (bookingId: string, actor: "creator" | "client") => void;
  onDeclineAlternative: (bookingId: string, actor: "creator" | "client") => void;
  onOpenMessaging: (booking: UnifiedBookingItem) => void;
}

export function BookingsSection({
  bookings,
  currentUserHandle = "anya_art",
  onSelectBookingToProceed,
  onReleaseSelection,
  onDeclineBooking,
  onConfirmBooking,
  onOpenBookingDetail,
  onOpenAlternativeModal,
  onAcceptAlternative,
  onDeclineAlternative,
  onOpenMessaging,
}: BookingsSectionProps) {
  // Top-Level Perspective Tab: Incoming Bookings vs My Requests
  const [perspectiveTab, setPerspectiveTab] = useState<"incoming" | "outgoing">(
    "incoming"
  );

  // Sub-filters for Incoming
  const [incomingFilter, setIncomingFilter] = useState<
    "all" | "pending" | "selected" | "negotiating" | "confirmed" | "completed"
  >("all");

  // Sub-filters for Outgoing (My Requests)
  const [outgoingFilter, setOutgoingFilter] = useState<
    "all" | "pending" | "action_needed" | "confirmed" | "completed"
  >("all");

  // Partition bookings
  const incomingBookings = useMemo(
    () => bookings.filter((b) => b.direction === "incoming"),
    [bookings]
  );

  const outgoingBookings = useMemo(
    () => bookings.filter((b) => b.direction === "outgoing"),
    [bookings]
  );

  // Incoming Counts
  const incomingNeedsResponseCount = useMemo(
    () =>
      incomingBookings.filter(
        (b) =>
          b.status === "Pending" ||
          b.proposalStatus === "ProposedByClient"
      ).length,
    [incomingBookings]
  );

  // Outgoing Counts
  const outgoingActionNeededCount = useMemo(
    () =>
      outgoingBookings.filter(
        (b) => b.proposalStatus === "ProposedByCreator"
      ).length,
    [outgoingBookings]
  );

  // Filtered Incoming
  const filteredIncoming = useMemo(() => {
    switch (incomingFilter) {
      case "pending":
        return incomingBookings.filter((b) => b.status === "Pending");
      case "selected":
        return incomingBookings.filter((b) => b.status === "Selected");
      case "negotiating":
        return incomingBookings.filter(
          (b) =>
            b.proposalStatus === "ProposedByCreator" ||
            b.proposalStatus === "ProposedByClient"
        );
      case "confirmed":
        return incomingBookings.filter((b) => b.status === "Confirmed");
      case "completed":
        return incomingBookings.filter((b) => b.status === "Completed");
      default:
        return incomingBookings;
    }
  }, [incomingBookings, incomingFilter]);

  // Filtered Outgoing
  const filteredOutgoing = useMemo(() => {
    switch (outgoingFilter) {
      case "pending":
        return outgoingBookings.filter(
          (b) => b.status === "Pending" && b.proposalStatus === "None"
        );
      case "action_needed":
        return outgoingBookings.filter(
          (b) => b.proposalStatus === "ProposedByCreator"
        );
      case "confirmed":
        return outgoingBookings.filter((b) => b.status === "Confirmed");
      case "completed":
        return outgoingBookings.filter((b) => b.status === "Completed");
      default:
        return outgoingBookings;
    }
  }, [outgoingBookings, outgoingFilter]);

  // Group Incoming Bookings by Date & Slot to identify Slot Competitions
  const incomingGroupedBySlot = useMemo(() => {
    const map = new Map<string, UnifiedBookingItem[]>();
    for (const b of filteredIncoming) {
      // Normalize slot key
      const key = `${b.scheduledDate}:::${b.timeSlot.split(":")[0].trim()}`;
      const list = map.get(key) || [];
      list.push(b);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredIncoming]);

  // Status Badge Renderer
  const renderStatusBadge = (
    status: BookingStatus,
    proposalStatus: BookingProposalStatus,
    isIncoming: boolean
  ) => {
    // If under active negotiation
    if (
      proposalStatus === "ProposedByCreator" ||
      proposalStatus === "ProposedByClient"
    ) {
      const isAwaitingMyAction =
        (isIncoming && proposalStatus === "ProposedByClient") ||
        (!isIncoming && proposalStatus === "ProposedByCreator");

      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            isAwaitingMyAction
              ? "border-[#E5A93C]/60 bg-[#E5A93C]/20 text-[#8E5A1C]"
              : "border-[#9DB5A5]/60 bg-[#9DB5A5]/25 text-[#203B35]"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
          <span>
            {isAwaitingMyAction ? "Alternative Proposed · Action Needed" : "Alternative Proposed · Waiting"}
          </span>
        </span>
      );
    }

    switch (status) {
      case "Selected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/25 bg-[#203B35]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#203B35]">
            <Sparkles className="h-3 w-3 text-[#203B35]" />
            Selected (Awaiting Arrangement)
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/50 bg-[#E5A93C]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#8E5A1C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
            {isIncoming ? "Needs Response" : "Awaiting Creator Review"}
          </span>
        );
      case "Confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9DB5A5]/60 bg-[#9DB5A5]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#203B35]">
            <Check className="h-3 w-3 text-[#4E9F76]" />
            Confirmed
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2] px-2.5 py-0.5 text-[11px] font-medium text-[#5D635F]">
            Completed
          </span>
        );
      case "Declined":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ae361c]/30 bg-[#ae361c]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#ae361c]">
            Declined
          </span>
        );
    }
  };

  return (
    <section id="bookings" aria-label="Bookings" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#203B35]/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#203B35]">
              Booking Management
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#EFECE2] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#203B35]">
              {bookings.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#5D635F]">
            Manage services you provide and track requests you submitted to other creators.
          </p>
        </div>

        {/* Global Urgent Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {incomingNeedsResponseCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/40 px-3 py-1 text-xs font-semibold text-[#8E5A1C]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>
                {incomingNeedsResponseCount} incoming request
                {incomingNeedsResponseCount > 1 ? "s" : ""}
              </span>
            </span>
          )}
          {outgoingActionNeededCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8BDE0]/40 border border-[#C8BDE0] px-3 py-1 text-xs font-semibold text-[#203B35]">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {outgoingActionNeededCount} proposal
                {outgoingActionNeededCount > 1 ? "s" : ""} to review
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Primary Context Switcher: Incoming Bookings vs My Requests */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EFECE2]/55 border border-[#203B35]/12 rounded-2xl p-2">
        <div
          role="tablist"
          aria-label="Booking perspective tabs"
          className="inline-flex rounded-xl bg-[#FAF8F3] border border-[#203B35]/10 p-1 w-full sm:w-auto"
        >
          {/* Tab 1: Incoming Bookings */}
          <button
            type="button"
            role="tab"
            aria-selected={perspectiveTab === "incoming"}
            onClick={() => setPerspectiveTab("incoming")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              perspectiveTab === "incoming"
                ? "bg-[#203B35] text-[#FAF8F3] shadow-sm font-semibold"
                : "text-[#5D635F] hover:text-[#203B35]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Incoming Bookings (Services I Provide)</span>
            <span
              className={`font-mono text-[10.5px] rounded-full px-2 py-0.2 ${
                perspectiveTab === "incoming"
                  ? "bg-[#FAF8F3]/25 text-[#FAF8F3]"
                  : "bg-black/10 text-[#5D635F]"
              }`}
            >
              {incomingBookings.length}
            </span>
          </button>

          {/* Tab 2: My Requests */}
          <button
            type="button"
            role="tab"
            aria-selected={perspectiveTab === "outgoing"}
            onClick={() => setPerspectiveTab("outgoing")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              perspectiveTab === "outgoing"
                ? "bg-[#203B35] text-[#FAF8F3] shadow-sm font-semibold"
                : "text-[#5D635F] hover:text-[#203B35]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>My Requests (Services I Requested)</span>
            <span
              className={`font-mono text-[10.5px] rounded-full px-2 py-0.2 ${
                perspectiveTab === "outgoing"
                  ? "bg-[#FAF8F3]/25 text-[#FAF8F3]"
                  : "bg-black/10 text-[#5D635F]"
              }`}
            >
              {outgoingBookings.length}
            </span>
          </button>
        </div>

        <p className="text-[12px] text-[#5D635F] px-2 hidden md:block">
          {perspectiveTab === "incoming"
            ? "Evaluate client requests, manage selections, and negotiate slots."
            : "Track requests you submitted to other creative talent."}
        </p>
      </div>

      {/* =====================================================================
       * PERSPECTIVE A: INCOMING BOOKINGS (CREATOR VIEW)
       * =================================================================== */}
      {perspectiveTab === "incoming" && (
        <div className="space-y-4">
          {/* Sub-Filters for Incoming */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setIncomingFilter("all")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                incomingFilter === "all"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              All Incoming ({incomingBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setIncomingFilter("pending")}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                incomingFilter === "pending"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              <span>Pending Requests</span>
              {incomingNeedsResponseCount > 0 && (
                <span className="font-mono text-[10px] bg-[#E5A93C] text-black px-1.5 py-0.2 rounded-full font-semibold">
                  {incomingNeedsResponseCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIncomingFilter("selected")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                incomingFilter === "selected"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              Selected
            </button>
            <button
              type="button"
              onClick={() => setIncomingFilter("negotiating")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                incomingFilter === "negotiating"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              Under Negotiation
            </button>
            <button
              type="button"
              onClick={() => setIncomingFilter("confirmed")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                incomingFilter === "confirmed"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              Confirmed
            </button>
            <button
              type="button"
              onClick={() => setIncomingFilter("completed")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                incomingFilter === "completed"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Bookings List with Slot Competition Grouping */}
          {filteredIncoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#203B35]/20 bg-[#FAF8F3] p-10 text-center space-y-2">
              <Layers className="h-6 w-6 text-[#9DB5A5] mx-auto" />
              <p className="font-serif text-lg text-[#203B35]">
                No incoming bookings in this view
              </p>
              <p className="text-xs text-[#5D635F]">
                New client inquiries will arrive here when visitors request your published services.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {incomingGroupedBySlot.map(([slotKey, slotBookings]) => {
                const hasCompetition = slotBookings.length > 1;
                const [datePart, slotNamePart] = slotKey.split(":::");

                return (
                  <div
                    key={slotKey}
                    className={
                      hasCompetition
                        ? "rounded-3xl border-2 border-[#E5A93C]/40 bg-[#FAF8F3] p-4 sm:p-5 space-y-3.5 shadow-sm"
                        : "space-y-3.5"
                    }
                  >
                    {/* Slot Competition Visual Header */}
                    {hasCompetition && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5A93C]/30 pb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#8E5A1C]" />
                          <span className="font-serif text-base text-[#203B35] font-medium">
                            Slot Competition: {datePart} ({slotNamePart})
                          </span>
                          <span className="font-mono text-[10.5px] rounded-full bg-[#E5A93C]/30 text-[#8E5A1C] px-2.5 py-0.5 font-semibold">
                            {slotBookings.length} Competing Inquiries
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#5D635F]">
                          Select one request to proceed with. Other requests remain pending.
                        </p>
                      </div>
                    )}

                    {/* Booking Cards in this slot */}
                    <div className="space-y-3">
                      {slotBookings.map((booking) => {
                        const isPending = booking.status === "Pending";
                        const isSelected = booking.status === "Selected";
                        const isNegotiating =
                          booking.proposalStatus === "ProposedByCreator" ||
                          booking.proposalStatus === "ProposedByClient";
                        const isConfirmed = booking.status === "Confirmed";
                        const isCompleted = booking.status === "Completed";

                        return (
                          <div
                            key={booking.id}
                            className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                              isSelected
                                ? "border-[#203B35] bg-[#9DB5A5]/10 shadow-md ring-1 ring-[#203B35]"
                                : isPending
                                ? "border-[#E5A93C]/40 bg-[#FAF8F3] hover:border-[#E5A93C]/80"
                                : "border-[#203B35]/12 bg-[#FAF8F3] hover:border-[#203B35]/30"
                            }`}
                          >
                            {/* 48-Hour Informational Reminder Banner */}
                            {isSelected && booking.has48HourReminder && (
                              <div className="mb-3.5 flex items-start gap-2.5 rounded-xl border border-[#E5A93C]/60 bg-[#E5A93C]/20 p-3 text-xs text-[#8E5A1C]">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold">
                                    48-Hour Selection Reminder
                                  </p>
                                  <p className="text-[11.5px] text-[#8E5A1C]/90 mt-0.5">
                                    48 hours have elapsed since selecting this client. Please finalize external arrangements or release the selection to evaluate other requests. (No automatic cancellation will occur).
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Alternative Proposal Active Banner */}
                            {isNegotiating && (
                              <div className="mb-3.5 flex items-start justify-between gap-3 rounded-xl border border-[#C8BDE0] bg-[#C8BDE0]/25 p-3 text-xs text-[#203B35]">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 font-semibold">
                                    <Clock className="h-3.5 w-3.5 text-[#203B35]" />
                                    <span>
                                      Alternative Time Negotiation Active
                                    </span>
                                  </div>
                                  <p className="text-[11.5px] text-[#5D635F]">
                                    Held slots: <strong>Original S1</strong> ({booking.originalDate}) &amp; <strong>Proposed S2</strong> ({booking.proposedAlternativeDate}).
                                  </p>
                                  {booking.negotiationHistory[0]?.note && (
                                    <p className="italic text-[11px] text-[#282B2A]/80">
                                      &ldquo;{booking.negotiationHistory[0].note}&rdquo;
                                    </p>
                                  )}
                                </div>
                                <span className="font-mono text-[10.5px] bg-[#FAF8F3] border border-[#203B35]/15 px-2 py-1 rounded-full shrink-0">
                                  24h Window Active
                                </span>
                              </div>
                            )}

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              {/* Left: Client info & Service */}
                              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                <div
                                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden font-serif text-sm font-semibold text-[#FAF8F3] shadow-sm"
                                  style={{
                                    backgroundColor:
                                      booking.clientAvatarTone || "#203B35",
                                  }}
                                >
                                  {booking.clientAvatarUrl ? (
                                    <Image
                                      src={booking.clientAvatarUrl}
                                      alt={booking.clientName}
                                      fill
                                      className="object-cover"
                                      sizes="44px"
                                    />
                                  ) : (
                                    booking.clientInitials
                                  )}
                                </div>

                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-serif text-base font-medium text-[#203B35] truncate">
                                      {booking.clientName}
                                    </h4>
                                    <span className="text-xs text-[#5D635F]">
                                      @{booking.clientHandle}
                                    </span>
                                    <span className="text-xs text-[#5D635F]">
                                      · {booking.clientRole}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#203B35]/90">
                                    <span className="font-medium">
                                      {booking.serviceTitle}
                                    </span>
                                    <span>·</span>
                                    <span className="font-serif font-semibold text-[#203B35]">
                                      ${booking.priceAmount} {booking.currency}
                                    </span>
                                  </div>

                                  <p className="text-xs text-[#5D635F] line-clamp-2 leading-relaxed italic pt-0.5">
                                    &ldquo;{booking.clientNote}&rdquo;
                                  </p>

                                  <div className="pt-1.5 flex flex-wrap items-center gap-3 text-[11.5px] text-[#5D635F]">
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-[#9DB5A5]" />
                                      <span>{booking.scheduledDate}</span>
                                    </span>
                                    <span>·</span>
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-[#9DB5A5]" />
                                      <span>{booking.timeSlot}</span>
                                    </span>
                                    <span>·</span>
                                    <span className="font-mono text-[10.5px]">
                                      Requested {booking.dateRequested}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Status badge & Actions */}
                              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#203B35]/10">
                                <div>
                                  {renderStatusBadge(
                                    booking.status,
                                    booking.proposalStatus,
                                    true
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* If Pending: Select, Propose Alt, Decline, View Brief */}
                                  {isPending && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onSelectBookingToProceed(booking.id)
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-3.5 py-1.5 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
                                      >
                                        <Check className="h-3 w-3 text-[#9DB5A5]" />
                                        <span>Select Client</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenAlternativeModal(booking, "creator")
                                        }
                                        className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                                      >
                                        <RotateCcw className="h-3 w-3 text-[#9DB5A5]" />
                                        <span>Alternative Time</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onDeclineBooking(booking.id)
                                        }
                                        className="rounded-full px-2.5 py-1.5 text-xs font-medium text-[#5D635F] hover:text-[#ae361c]"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {/* If Selected: Confirm Booking, Message Client, Release, Alt Time */}
                                  {isSelected && (
                                    <>
                                      {onConfirmBooking && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onConfirmBooking(booking.id)
                                          }
                                          className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-1.5 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
                                        >
                                          <Check className="h-3.5 w-3.5 text-[#9DB5A5]" />
                                          <span>Confirm Booking</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => onOpenMessaging(booking)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/25 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                                      >
                                        <MessageSquare className="h-3.5 w-3.5 text-[#203B35]" />
                                        <span>Message Client</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onReleaseSelection(booking.id)
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/25 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                                      >
                                        <RotateCcw className="h-3 w-3 text-[#5D635F]" />
                                        <span>Release</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenAlternativeModal(booking, "creator")
                                        }
                                        className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                                      >
                                        <span>Alternative Time</span>
                                      </button>
                                    </>
                                  )}

                                  {/* If Active Negotiation from Client: Accept, Decline, Counter */}
                                  {booking.proposalStatus === "ProposedByClient" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onAcceptAlternative(booking.id, "creator")
                                        }
                                        className="inline-flex items-center gap-1 rounded-full bg-[#203B35] px-3.5 py-1.5 text-xs font-semibold text-[#FAF8F3]"
                                      >
                                        <Check className="h-3 w-3 text-[#9DB5A5]" />
                                        <span>Accept Client Proposal</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenAlternativeModal(booking, "creator")
                                        }
                                        className="rounded-full border border-[#203B35]/15 px-3 py-1.5 text-xs font-medium text-[#203B35]"
                                      >
                                        Counter-Propose
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onDeclineAlternative(booking.id, "creator")
                                        }
                                        className="rounded-full px-2.5 py-1.5 text-xs text-[#ae361c]"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {/* Confirmed / Completed -> Scoped Messaging */}
                                  {(isConfirmed || isCompleted) && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenMessaging(booking)}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#FAF8F3] transition-colors"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-[#203B35]" />
                                      <span>
                                        {isCompleted ? "Archived Messages" : "Session Messages"}
                                      </span>
                                    </button>
                                  )}

                                  {/* Always available: View Brief */}
                                  <button
                                    type="button"
                                    onClick={() => onOpenBookingDetail(booking)}
                                    className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                                  >
                                    <span>View Brief</span>
                                    <ExternalLink className="h-3 w-3 text-[#5D635F]" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
       * PERSPECTIVE B: MY REQUESTS (SERVICES I REQUESTED AS CLIENT)
       * =================================================================== */}
      {perspectiveTab === "outgoing" && (
        <div className="space-y-4">
          {/* Sub-Filters for Outgoing */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setOutgoingFilter("all")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                outgoingFilter === "all"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              All Requests ({outgoingBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setOutgoingFilter("action_needed")}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                outgoingFilter === "action_needed"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              <span>Action Needed (Proposals)</span>
              {outgoingActionNeededCount > 0 && (
                <span className="font-mono text-[10px] bg-[#E5A93C] text-black px-1.5 py-0.2 rounded-full font-semibold">
                  {outgoingActionNeededCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setOutgoingFilter("pending")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                outgoingFilter === "pending"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              Awaiting Creator Review
            </button>
            <button
              type="button"
              onClick={() => setOutgoingFilter("confirmed")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                outgoingFilter === "confirmed"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              Confirmed Sessions
            </button>
            <button
              type="button"
              onClick={() => setOutgoingFilter("completed")}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                outgoingFilter === "completed"
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              Completed
            </button>
          </div>

          {filteredOutgoing.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#203B35]/20 bg-[#FAF8F3] p-10 text-center space-y-2">
              <User className="h-6 w-6 text-[#9DB5A5] mx-auto" />
              <p className="font-serif text-lg text-[#203B35]">
                No outgoing requests in this view
              </p>
              <p className="text-xs text-[#5D635F]">
                Visit other creators&apos; profiles and request bookings from their Services tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredOutgoing.map((booking) => {
                const hasCreatorProposal =
                  booking.proposalStatus === "ProposedByCreator";
                const isSelected = booking.status === "Selected";
                const isConfirmed = booking.status === "Confirmed";
                const isCompleted = booking.status === "Completed";

                return (
                  <div
                    key={booking.id}
                    className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
                      hasCreatorProposal
                        ? "border-[#E5A93C]/60 bg-[#FAF8F3] shadow-md ring-1 ring-[#E5A93C]/40"
                        : "border-[#203B35]/12 bg-[#FAF8F3] hover:border-[#203B35]/30"
                    }`}
                  >
                    {/* Alternative Proposal Banner with Live 24h Countdown */}
                    {hasCreatorProposal && (
                      <div className="mb-4 rounded-2xl border border-[#E5A93C]/50 bg-[#E5A93C]/15 p-4 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5A93C]/30 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#8E5A1C]" />
                            <h4 className="font-serif text-sm sm:text-base font-medium text-[#203B35]">
                              {booking.creatorName} proposed an alternative time
                            </h4>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F3] border border-[#E5A93C]/50 px-3 py-1 font-mono text-[11px] font-semibold text-[#8E5A1C]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
                            <span>24-Hour Response Window Active</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl border border-[#203B35]/10 bg-[#FAF8F3] p-2.5">
                            <span className="font-mono text-[9.5px] uppercase text-[#5D635F]">
                              Your Original Slot (S1 · Protected)
                            </span>
                            <p className="font-medium text-[#203B35] mt-0.5">
                              {booking.originalDate} ({booking.originalSlot})
                            </p>
                          </div>

                          <div className="rounded-xl border border-[#E5A93C]/40 bg-[#FAF8F3] p-2.5">
                            <span className="font-mono text-[9.5px] uppercase text-[#8E5A1C]">
                              Proposed Alternative (S2 · Protected)
                            </span>
                            <p className="font-medium text-[#203B35] mt-0.5">
                              {booking.proposedAlternativeDate} (
                              {booking.proposedAlternativeSlot})
                            </p>
                          </div>
                        </div>

                        {booking.negotiationHistory[0]?.note && (
                          <p className="text-xs text-[#282B2A]/90 italic bg-[#FAF8F3]/60 p-2.5 rounded-xl border border-[#203B35]/08">
                            &ldquo;{booking.negotiationHistory[0].note}&rdquo;
                          </p>
                        )}

                        {/* Proposal Actions */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onDeclineAlternative(booking.id, "client")
                            }
                            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-[#5D635F] hover:text-[#ae361c]"
                          >
                            Decline (Restore Original S1)
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onOpenAlternativeModal(booking, "client")
                            }
                            className="rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                          >
                            Counter-Propose New Time
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onAcceptAlternative(booking.id, "client")
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-1.5 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
                          >
                            <Check className="h-3 w-3 text-[#9DB5A5]" />
                            <span>Accept Proposed Time</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Creator info & Service */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div
                          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden font-serif text-sm font-semibold text-[#FAF8F3] shadow-sm"
                          style={{
                            backgroundColor:
                              booking.creatorAvatarTone || "#3B4A44",
                          }}
                        >
                          {booking.creatorAvatarUrl ? (
                            <Image
                              src={booking.creatorAvatarUrl}
                              alt={booking.creatorName}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            booking.creatorName.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-[#5D635F]">
                              Service by
                            </span>
                            <h4 className="font-serif text-base font-medium text-[#203B35] truncate">
                              {booking.creatorName}
                            </h4>
                            <span className="text-xs text-[#5D635F]">
                              @{booking.creatorHandle}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#203B35]/90">
                            <span className="font-medium underline decoration-[#9DB5A5]/60">
                              {booking.serviceTitle}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-[#5D635F]">
                              {booking.serviceCategory}
                            </span>
                            <span>·</span>
                            <span className="font-serif font-semibold text-[#203B35]">
                              ${booking.priceAmount} {booking.currency}
                            </span>
                          </div>

                          <p className="text-xs text-[#5D635F] line-clamp-2 leading-relaxed italic pt-0.5">
                            &ldquo;{booking.clientNote}&rdquo;
                          </p>

                          <div className="pt-1.5 flex flex-wrap items-center gap-3 text-[11.5px] text-[#5D635F]">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-[#9DB5A5]" />
                              <span>{booking.scheduledDate}</span>
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#9DB5A5]" />
                              <span>{booking.timeSlot}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status badge & Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#203B35]/10">
                        <div>
                          {renderStatusBadge(
                            booking.status,
                            booking.proposalStatus,
                            false
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* If Selected / Confirmed / Completed -> Scoped Messaging */}
                          {(isSelected || isConfirmed || isCompleted) && (
                            <button
                              type="button"
                              onClick={() => onOpenMessaging(booking)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#FAF8F3] transition-colors"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-[#203B35]" />
                              <span>
                                {isCompleted
                                  ? "Archived Messages"
                                  : isSelected
                                  ? "Message Creator (Payment)"
                                  : "Message Creator"}
                              </span>
                            </button>
                          )}

                          {/* Client can counter-propose if in negotiation */}
                          {!hasCreatorProposal &&
                            booking.status === "Pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenAlternativeModal(booking, "client")
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                              >
                                <RotateCcw className="h-3 w-3 text-[#9DB5A5]" />
                                <span>Propose Alternative</span>
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenBookingDetail(booking)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                          >
                            <span>View Request Brief</span>
                            <ExternalLink className="h-3 w-3 text-[#5D635F]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
