"use client";

import React, { useId, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  QrCode,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type { BookingMessage, UnifiedBookingItem } from "@/lib/bookingStore";

interface BookingMessagingModalProps {
  booking: UnifiedBookingItem | null;
  currentUserId?: string;
  currentUserName?: string;
  currentUserHandle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (
    bookingId: string,
    content: string,
    attachment?: {
      url: string;
      type: "image" | "qr_code" | "file";
      caption?: string;
    }
  ) => void;
}

export function BookingMessagingModal({
  booking,
  currentUserId = "u-anya",
  currentUserName = "Anya Sharma",
  currentUserHandle = "anya_art",
  isOpen,
  onClose,
  onSendMessage,
}: BookingMessagingModalProps) {
  const titleId = useId();
  const [draft, setDraft] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    type: "image" | "qr_code" | "file";
    caption?: string;
  } | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customCaption, setCustomCaption] = useState("");

  if (!isOpen || !booking) return null;

  // Lifecycle & Messaging Access Rules:
  // - Messaging becomes available when a booking reaches Selected status, not only Confirmed.
  // - Pending requests and competing clients do NOT have access.
  // - Confirmed bookings retain active messaging.
  // - Terminal states (Completed, Declined) become read-only.
  const isSelected = booking.status === "Selected";
  const isConfirmed = booking.status === "Confirmed";
  const isTerminal = booking.status === "Completed" || booking.status === "Declined";
  const isEligibleForChat = isSelected || isConfirmed || isTerminal;

  // Participant Authorization:
  // Only the selected/confirmed client and service provider can access this conversation.
  const currentHandleLower = (currentUserHandle || "").toLowerCase();
  const isProvider =
    booking.creatorHandle.toLowerCase() === currentHandleLower;
  const isSelectedOrConfirmedClient =
    booking.clientHandle.toLowerCase() === currentHandleLower;
  const isAuthorizedParticipant = isProvider || isSelectedOrConfirmedClient;

  const otherPartyName =
    booking.direction === "incoming" ? booking.clientName : booking.creatorName;
  const otherPartyHandle =
    booking.direction === "incoming" ? booking.clientHandle : booking.creatorHandle;
  const otherPartyRole =
    booking.direction === "incoming" ? "Client" : "Service Creator";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!draft.trim() && !attachment) || isTerminal || !isEligibleForChat || !isAuthorizedParticipant) return;
    onSendMessage(booking.id, draft.trim() || (attachment?.caption ? `[Attachment: ${attachment.caption}]` : "[Image Attachment]"), attachment || undefined);
    setDraft("");
    setAttachment(null);
    setShowAttachMenu(false);
  };

  const handleAttachPresetQR = () => {
    setAttachment({
      url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Fsharma.studio%2Fpay%2Fcover-winter",
      type: "qr_code",
      caption: `${booking.creatorName} Atelier · Direct Settlement QR`,
    });
    setShowAttachMenu(false);
  };

  const handleAttachCustomImage = () => {
    if (!customImageUrl.trim()) return;
    setAttachment({
      url: customImageUrl.trim(),
      type: "image",
      caption: customCaption.trim() || "Project Reference Image",
    });
    setCustomImageUrl("");
    setCustomCaption("");
    setShowAttachMenu(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative flex flex-col w-full max-w-lg h-[650px] max-h-[92vh] rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] shadow-2xl overflow-hidden text-[#282B2A]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#203B35]/10 px-5 sm:px-6 py-4 bg-[#F6F3EB]">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
              <Lock className="h-3 w-3 text-[#4E9F76]" />
              <span>Scoped Booking Communication</span>
              <span>·</span>
              <span>Ref: {booking.id}</span>
            </div>
            <h3
              id={titleId}
              className="mt-1 font-serif text-lg sm:text-xl text-[#203B35]"
            >
              {otherPartyName}{" "}
              <span className="font-sans text-xs text-[#5D635F] font-normal">
                (@{otherPartyHandle})
              </span>
            </h3>
            <p className="text-xs text-[#5D635F]">
              Regarding: <strong>{booking.serviceTitle}</strong> ({booking.scheduledDate})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close messaging"
            className="p-1.5 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Access Enforcement Guard 1: Booking Not Selected or Confirmed */}
        {!isEligibleForChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5A93C]/20 text-[#8E5A1C] border border-[#E5A93C]/40">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-serif text-lg text-[#203B35]">
                Messaging Inactive · Awaiting Selection or Confirmation
              </h4>
              <p className="text-xs text-[#5D635F] leading-relaxed">
                Private messaging becomes available once the creator selects a client request to proceed. Submitting a pending request or competing for a time slot does not grant messaging access.
              </p>
            </div>
            <div className="rounded-xl border border-[#203B35]/10 bg-[#EFECE2]/70 px-4 py-2.5 text-[11px] font-mono text-[#203B35]">
              Current Booking Status: <strong>{booking.status}</strong>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
            >
              Return to Bookings
            </button>
          </div>
        ) : !isAuthorizedParticipant ? (
          /* Access Enforcement Guard 2: Unauthorized Viewer / Competing Client */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ae361c]/15 text-[#ae361c] border border-[#ae361c]/30">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-serif text-lg text-[#203B35]">
                Access Restricted · Authorized Participants Only
              </h4>
              <p className="text-xs text-[#5D635F] leading-relaxed">
                This private conversation is strictly between the service provider (@{booking.creatorHandle}) and the selected client (@{booking.clientHandle}). Competing pending clients cannot access this thread.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Authorized Active or Terminal Thread */
          <>
            {/* Informational Scope Banner */}
            <div className="px-5 py-2.5 bg-[#EFECE2]/70 border-b border-[#203B35]/08 text-[11.5px] text-[#5D635F] flex items-center justify-between">
              <span>
                Context: {otherPartyRole} · {isSelected ? "External payment arrangement phase" : "Active session notes"}
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isTerminal
                    ? "bg-[#203B35]/10 text-[#5D635F]"
                    : isSelected
                    ? "bg-[#E5A93C]/20 text-[#8E5A1C]"
                    : "bg-[#4E9F76]/20 text-[#203B35]"
                }`}
              >
                {isTerminal
                  ? "Archived · Read-Only"
                  : isSelected
                  ? "Selected · Payment Arrangement"
                  : "Confirmed Session Chat"}
              </span>
            </div>

            {/* External Payment Disclaimer Banner */}
            {isSelected && (
              <div className="px-5 py-2 bg-[#FAF8F3] border-b border-[#203B35]/08 text-[11px] text-[#5D635F] flex items-center justify-between">
                <span>
                  Coordinate external payment (e.g. share QR code). CreativeSpace does not process or verify payments.
                </span>
              </div>
            )}

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5">
              {booking.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#5D635F] space-y-2">
                  <MessageSquare className="h-8 w-8 text-[#9DB5A5]" />
                  <p className="font-serif text-base text-[#203B35]">
                    Private Conversation Open
                  </p>
                  <p className="text-xs max-w-xs leading-relaxed">
                    Communicate with {otherPartyName} to coordinate creative requirements, share a payment QR code, or confirm external arrangements.
                  </p>
                </div>
              ) : (
                booking.messages.map((msg) => {
                  const isMine =
                    msg.senderHandle.toLowerCase() === currentHandleLower;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#5D635F]">
                        <span className="font-medium text-[#203B35]">
                          {isMine ? "You" : msg.senderName}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-sm space-y-2 ${
                          isMine
                            ? "bg-[#203B35] text-[#FAF8F3] rounded-tr-sm"
                            : "bg-[#F6F3EB] border border-[#203B35]/10 text-[#282B2A] rounded-tl-sm"
                        }`}
                      >
                        {msg.content && <p>{msg.content}</p>}

                        {/* Image / QR Code Attachment */}
                        {msg.attachmentUrl && (
                          <div className={`rounded-xl overflow-hidden border p-2 space-y-1.5 ${
                            isMine
                              ? "bg-black/20 border-white/20"
                              : "bg-[#FAF8F3] border-[#203B35]/15"
                          }`}>
                            <div className="relative w-44 h-44 mx-auto rounded-lg overflow-hidden bg-white flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={msg.attachmentUrl}
                                alt={msg.attachmentCaption || "Message attachment"}
                                className="w-full h-full object-contain p-2"
                              />
                            </div>
                            {msg.attachmentCaption && (
                              <p className={`text-[11px] font-mono text-center ${
                                isMine ? "text-[#FAF8F3]/90" : "text-[#203B35]"
                              }`}>
                                {msg.attachmentCaption}
                              </p>
                            )}
                            {msg.attachmentType === "qr_code" && (
                              <span className={`block text-[10px] text-center italic ${
                                isMine ? "text-[#FAF8F3]/75" : "text-[#5D635F]"
                              }`}>
                                External Settlement QR · Verify independently
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Attachment Preview Chip */}
            {attachment && (
              <div className="px-5 py-2 bg-[#EFECE2] border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#203B35]">
                <div className="flex items-center gap-2">
                  {attachment.type === "qr_code" ? (
                    <QrCode className="h-4 w-4 text-[#8E5A1C]" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-[#203B35]" />
                  )}
                  <span className="font-medium truncate max-w-[220px]">
                    {attachment.caption || "Image Attached"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-[#ae361c] hover:underline text-[11px]"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Quick Attachment Dropdown */}
            {showAttachMenu && !isTerminal && (
              <div className="px-5 py-3 bg-[#FAF8F3] border-t border-[#203B35]/15 space-y-2.5 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#203B35]">
                    Share Payment Instructions or Media
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(false)}
                    className="text-[#5D635F] hover:text-[#203B35]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAttachPresetQR}
                    className="flex items-center gap-2 rounded-xl border border-[#203B35]/20 bg-[#F6F3EB] p-2.5 text-left hover:border-[#203B35] transition-colors"
                  >
                    <QrCode className="h-4 w-4 text-[#8E5A1C] shrink-0" />
                    <div>
                      <p className="font-medium text-[#203B35] text-[11.5px]">
                        Studio Payment QR
                      </p>
                      <p className="text-[10px] text-[#5D635F]">
                        External deposit settlement
                      </p>
                    </div>
                  </button>

                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="Or paste image/QR URL..."
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="w-full h-8 rounded-lg border border-[#203B35]/20 bg-[#F6F3EB] px-2 text-[11px]"
                    />
                    <button
                      type="button"
                      disabled={!customImageUrl.trim()}
                      onClick={handleAttachCustomImage}
                      className="w-full h-6 rounded-lg bg-[#203B35] text-[#FAF8F3] text-[10.5px] disabled:opacity-40"
                    >
                      Attach Custom Image
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Bar or Terminal Archival Banner */}
            {isTerminal ? (
              <div className="border-t border-[#203B35]/10 p-4 bg-[#EFECE2]/90 flex items-center justify-center gap-2 text-xs text-[#5D635F]">
                <Archive className="h-4 w-4 text-[#203B35]" />
                <span>
                  This booking conversation has reached completion and is archived in read-only mode.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="border-t border-[#203B35]/10 p-3 sm:p-3.5 bg-[#FAF8F3] flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setShowAttachMenu((prev) => !prev)}
                  title="Attach QR code or image"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    attachment || showAttachMenu
                      ? "border-[#203B35] bg-[#203B35] text-[#FAF8F3]"
                      : "border-[#203B35]/20 bg-[#F6F3EB] text-[#203B35] hover:bg-[#EFECE2]"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${otherPartyName}...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 h-10 rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-4 text-xs sm:text-[13px] text-[#282B2A] focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/40"
                />

                <button
                  type="submit"
                  disabled={!draft.trim() && !attachment}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
