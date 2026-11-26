"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  User,
  X,
} from "lucide-react";
import type { DashboardBookingItem, BookingStatus } from "@/data/mockDashboard";

interface BookingsSectionProps {
  bookings: DashboardBookingItem[];
  onAcceptBooking: (bookingId: string) => void;
  onDeclineBooking: (bookingId: string) => void;
  onSelectBooking: (booking: DashboardBookingItem) => void;
}

export function BookingsSection({
  bookings,
  onAcceptBooking,
  onDeclineBooking,
  onSelectBooking,
}: BookingsSectionProps) {
  const [filter, setFilter] = useState<"pending" | "confirmed" | "completed" | "all">("pending");

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === "Pending").length,
    [bookings]
  );
  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === "Confirmed").length,
    [bookings]
  );
  const completedCount = useMemo(
    () => bookings.filter((b) => b.status === "Completed").length,
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    if (filter === "pending") return bookings.filter((b) => b.status === "Pending");
    if (filter === "confirmed") return bookings.filter((b) => b.status === "Confirmed");
    if (filter === "completed") return bookings.filter((b) => b.status === "Completed");
    return bookings;
  }, [bookings, filter]);

  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/50 bg-[#E5A93C]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#8E5A1C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
            Needs Response
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ae361c]/30 bg-[#e85d3f]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#ae361c]">
            Declined
          </span>
        );
    }
  };

  return (
    <section id="bookings" aria-label="Bookings" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#203B35]/10 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#203B35]">
              Bookings & Inquiries
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#EFECE2] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#203B35]">
              {bookings.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#5D635F]">
            Client booking requests, upcoming sessions, and their live statuses.
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/40 px-3 py-1 text-xs font-semibold text-[#8E5A1C] self-start sm:self-auto">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{pendingCount} request{pendingCount > 1 ? "s" : ""} awaiting response</span>
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "pending"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <span>Incoming Requests</span>
          <span
            className={`font-mono text-[10px] rounded-full px-1.5 py-0.2 ${
              pendingCount > 0
                ? "bg-[#E5A93C] text-black font-semibold"
                : "bg-black/10 text-inherit"
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("confirmed")}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "confirmed"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <span>Upcoming Confirmed</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {confirmedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "completed"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <span>Completed</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {completedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "all"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <span>All Bookings</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {bookings.length}
          </span>
        </button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#203B35]/20 bg-[#FAF8F3] p-10 text-center">
          <p className="text-sm text-[#5D635F]">
            No bookings found in this view.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((booking) => {
            const isPending = booking.status === "Pending";

            return (
              <div
                key={booking.id}
                className={`group rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
                  isPending
                    ? "border-[#E5A93C]/40 bg-[#FAF8F3] hover:border-[#E5A93C]/80 hover:shadow-md"
                    : "border-[#203B35]/12 bg-[#FAF8F3] hover:border-[#203B35]/30 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Client info & Service requested */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Client Avatar / Initials */}
                    <div
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden font-serif text-sm font-semibold text-[#FAF8F3] shadow-sm"
                      style={{ backgroundColor: booking.clientAvatarTone }}
                    >
                      {booking.clientAvatarUrl ? (
                        <Image
                          src={booking.clientAvatarUrl}
                          alt={booking.clientName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        booking.clientInitials
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-base sm:text-lg font-medium text-[#203B35]">
                          {booking.clientName}
                        </h3>
                        <span className="text-xs text-[#5D635F]">
                          @{booking.clientHandle}
                        </span>
                        <span className="text-xs text-[#203B35]/40">•</span>
                        <span className="text-xs text-[#5D635F]">
                          {booking.clientRole}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#203B35]/90 font-medium">
                        <span className="underline decoration-[#9DB5A5]/60 underline-offset-2">
                          {booking.serviceTitle}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[#5D635F]">
                          {booking.serviceCategory}
                        </span>
                        <span>•</span>
                        <span className="font-serif font-semibold text-[#203B35]">
                          ${booking.priceAmount} {booking.currency}
                        </span>
                      </div>

                      {/* Brief excerpt */}
                      <p className="pt-1 text-xs text-[#5D635F] line-clamp-2 leading-relaxed">
                        &ldquo;{booking.clientNote}&rdquo;
                      </p>

                      {/* Date & format info */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 text-[11.5px] text-[#5D635F]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#203B35]/70" />
                          <span>{booking.scheduledDate}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#203B35]/70" />
                          <span>{booking.timeSlot}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#203B35]/08">
                    <div className="shrink-0">{renderStatusBadge(booking.status)}</div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onAcceptBooking(booking.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeclineBooking(booking.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-2 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#ae361c] transition-colors"
                          >
                            <span>Decline</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectBooking(booking)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-2 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                          >
                            <span>View Brief</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectBooking(booking)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs font-medium text-[#203B35] hover:bg-[#203B35] hover:text-[#FAF8F3] hover:border-[#203B35] transition-all"
                          >
                            <span>Details</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectBooking(booking)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2] px-3.5 py-2 text-xs font-medium text-[#203B35] hover:bg-[#FAF8F3] transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Message</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
