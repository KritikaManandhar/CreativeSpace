"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
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
import {
  getStoredBookings,
  saveStoredBookings,
  subscribeToBookings,
  type BookingMessage,
  type UnifiedBookingItem,
} from "@/lib/bookingStore";

/** Global dispatcher helper to open floating messenger focused on a specific booking */
export function openBookingMessenger(bookingId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("creativespace_open_messenger", { detail: { bookingId } })
  );
}

export function BookingFloatingMessenger() {
  const { data: session } = useSession();
  const titleId = useId();

  // Current user handle fallback to Anya Sharma if not logged in
  const currentUserHandle = (
    session?.user?.username ||
    session?.user?.name?.toLowerCase().replace(/\s+/g, "_") ||
    "anya_art"
  ).toLowerCase();
  const currentUserName = session?.user?.name || "Anya Sharma";

  const [isOpen, setIsOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<UnifiedBookingItem[]>(() =>
    getStoredBookings()
  );

  // Draft state for conversation
  const [draft, setDraft] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    type: "image" | "qr_code" | "file";
    caption?: string;
  } | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");

  // Subscribe to storage changes & updates
  useEffect(() => {
    const unsub = subscribeToBookings((updated) => {
      setBookings(updated);
    });
    return unsub;
  }, []);

  // Listen to open_messenger event from anywhere in the app
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<{ bookingId?: string }>;
      setIsOpen(true);
      if (custom.detail?.bookingId) {
        setActiveBookingId(custom.detail.bookingId);
      }
    };
    window.addEventListener("creativespace_open_messenger", handleOpen);
    return () => {
      window.removeEventListener("creativespace_open_messenger", handleOpen);
    };
  }, []);

  // Filter conversations:
  // - Only bookings that reached Selected, Confirmed, or Completed
  // - Current user MUST be either creatorHandle or clientHandle
  // - Pending competing bookings are strictly excluded!
  const eligibleConversations = useMemo(() => {
    return bookings.filter((b) => {
      const isEligibleStatus =
        b.status === "Selected" ||
        b.status === "Confirmed" ||
        b.status === "Completed";
      if (!isEligibleStatus) return false;

      const isParticipant =
        b.creatorHandle.toLowerCase() === currentUserHandle ||
        b.clientHandle.toLowerCase() === currentUserHandle;

      return isParticipant;
    });
  }, [bookings, currentUserHandle]);

  // Total messages count for badge
  const unreadIndicatorCount = useMemo(() => {
    let count = 0;
    for (const b of eligibleConversations) {
      if (b.status === "Selected" || b.status === "Confirmed") {
        count += b.messages.length > 0 ? 1 : 0;
      }
    }
    // Return at least count of eligible active threads if there are active bookings
    return count > 0 ? count : eligibleConversations.length > 0 ? eligibleConversations.length : 0;
  }, [eligibleConversations]);

  // Selected active booking object
  const activeBooking = useMemo(() => {
    if (!activeBookingId) return null;
    return eligibleConversations.find((b) => b.id === activeBookingId) || null;
  }, [eligibleConversations, activeBookingId]);

  // Send message inside floating messenger
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking || (!draft.trim() && !attachment)) return;
    if (activeBooking.status === "Completed" || activeBooking.status === "Declined") return;

    const newMsg: BookingMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserHandle,
      senderName: currentUserName,
      senderHandle: currentUserHandle,
      senderRole:
        activeBooking.creatorHandle.toLowerCase() === currentUserHandle
          ? "creator"
          : "client",
      content: draft.trim() || (attachment?.caption ? `[Attachment: ${attachment.caption}]` : "[Image Attachment]"),
      timestamp: "Just now",
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      attachmentCaption: attachment?.caption,
    };

    const updated = bookings.map((b) =>
      b.id === activeBooking.id ? { ...b, messages: [...b.messages, newMsg] } : b
    );
    saveStoredBookings(updated);
    setBookings(updated);
    setDraft("");
    setAttachment(null);
    setShowAttachMenu(false);
  };

  const handleAttachPresetQR = () => {
    if (!activeBooking) return;
    setAttachment({
      url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Fsharma.studio%2Fpay%2Fcover-winter",
      type: "qr_code",
      caption: `${activeBooking.creatorName} Atelier · Direct Settlement QR`,
    });
    setShowAttachMenu(false);
  };

  const handleAttachCustomImage = () => {
    if (!customImageUrl.trim()) return;
    setAttachment({
      url: customImageUrl.trim(),
      type: "image",
      caption: "Settlement Reference Image",
    });
    setCustomImageUrl("");
    setShowAttachMenu(false);
  };

  return (
    <aside aria-label="Persistent Booking Messenger" className="fixed bottom-6 right-6 z-40 select-none">
      {/* Floating Popover Container */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="mb-3 w-[360px] sm:w-[410px] h-[550px] max-h-[85vh] rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] shadow-2xl flex flex-col overflow-hidden text-[#282B2A] animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* ========================================================= */}
          {/* VIEW A: CONVERSATION LIST (INBOX)                         */}
          {/* ========================================================= */}
          {!activeBooking ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#203B35]/10 px-5 py-4 bg-[#F6F3EB]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#203B35] text-[#FAF8F3]">
                    <MessageSquare className="h-4 w-4 text-[#9DB5A5]" />
                  </div>
                  <div>
                    <h3 id={titleId} className="font-serif text-base font-medium text-[#203B35]">
                      Booking Conversations
                    </h3>
                    <p className="text-[11px] text-[#5D635F]">
                      Selected &amp; Confirmed Milestones
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close booking messenger"
                  className="p-1.5 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Informational Guidance Notice */}
              <div className="px-5 py-2.5 bg-[#FAF8F3] border-b border-[#203B35]/08 text-[11px] text-[#5D635F] flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-[#4E9F76] shrink-0" />
                <span>Conversations are scoped exclusively to individual bookings.</span>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#203B35]/08">
                {eligibleConversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-[#5D635F]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFECE2] text-[#203B35]">
                      <MessageSquare className="h-6 w-6 text-[#9DB5A5]" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-serif text-sm text-[#203B35]">
                        No Active Conversations Yet
                      </p>
                      <p className="text-[11.5px] leading-relaxed max-w-[240px]">
                        Private messaging unlocks when a creator selects a booking request to proceed with payment and kickoff.
                      </p>
                    </div>
                  </div>
                ) : (
                  eligibleConversations.map((b) => {
                    const isIncoming =
                      b.creatorHandle.toLowerCase() === currentUserHandle;
                    const otherName = isIncoming ? b.clientName : b.creatorName;
                    const otherHandle = isIncoming ? b.clientHandle : b.creatorHandle;
                    const roleLabel = isIncoming ? "Client" : "Creator";

                    const lastMessage =
                      b.messages.length > 0
                        ? b.messages[b.messages.length - 1]
                        : null;

                    const isSelected = b.status === "Selected";
                    const isConfirmed = b.status === "Confirmed";
                    const isCompleted = b.status === "Completed";

                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveBookingId(b.id)}
                        className="w-full p-4 text-left hover:bg-[#F6F3EB] transition-colors flex items-start gap-3 group"
                      >
                        {/* Avatar */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-[#FAF8F3]"
                          style={{
                            backgroundColor: isIncoming
                              ? b.clientAvatarTone || "#203B35"
                              : b.creatorAvatarTone || "#203B35",
                          }}
                        >
                          {otherName.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-serif text-[13.5px] font-medium text-[#203B35] truncate">
                              {otherName}
                            </span>
                            <span className="font-mono text-[10px] text-[#5D635F] shrink-0">
                              {lastMessage ? lastMessage.timestamp : b.dateRequested}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[#5D635F]">
                            <span className="truncate max-w-[140px] text-[#203B35] font-medium">
                              {b.serviceTitle}
                            </span>
                            <span>·</span>
                            <span>{roleLabel}</span>
                          </div>

                          {/* Snippet */}
                          <p className="text-[11.5px] text-[#5D635F] truncate">
                            {lastMessage
                              ? lastMessage.content
                              : isSelected
                              ? "Selected · Tap to arrange external payment"
                              : "Tap to view session messages"}
                          </p>

                          {/* Status Badge */}
                          <div className="pt-0.5">
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/40 px-2 py-0.5 font-mono text-[9.5px] font-medium text-[#8E5A1C]">
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>Selected · Payment Phase</span>
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#9DB5A5]/25 border border-[#9DB5A5]/60 px-2 py-0.5 font-mono text-[9.5px] font-medium text-[#203B35]">
                                <CheckCircle2 className="h-2.5 w-2.5 text-[#4E9F76]" />
                                <span>Confirmed Session</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#EFECE2] border border-[#203B35]/10 px-2 py-0.5 font-mono text-[9.5px] text-[#5D635F]">
                                <Archive className="h-2.5 w-2.5" />
                                <span>Completed · Archived</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* VIEW B: ACTIVE CONVERSATION THREAD                        */
            /* ========================================================= */
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between border-b border-[#203B35]/10 px-4 py-3 bg-[#F6F3EB]">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBookingId(null);
                      setAttachment(null);
                      setShowAttachMenu(false);
                    }}
                    aria-label="Back to inbox"
                    className="p-1 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="min-w-0">
                    <h4 className="font-serif text-sm font-medium text-[#203B35] truncate">
                      {activeBooking.creatorHandle.toLowerCase() === currentUserHandle
                        ? activeBooking.clientName
                        : activeBooking.creatorName}
                    </h4>
                    <p className="font-mono text-[10px] text-[#5D635F] truncate">
                      {activeBooking.serviceTitle} ({activeBooking.scheduledDate})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close messenger"
                    className="p-1.5 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status Context Pill */}
              <div className="px-4 py-2 bg-[#FAF8F3] border-b border-[#203B35]/08 text-[11px] text-[#5D635F] flex items-center justify-between">
                <span>
                  {activeBooking.status === "Selected"
                    ? "Arrange external payment & creative requirements"
                    : "Confirmed milestone discussion"}
                </span>
                <span className="font-mono text-[9.5px] px-2 py-0.5 rounded-full bg-[#EFECE2] border border-[#203B35]/10 text-[#203B35] font-semibold">
                  {activeBooking.status}
                </span>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {activeBooking.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#5D635F] space-y-2">
                    <MessageSquare className="h-7 w-7 text-[#9DB5A5]" />
                    <p className="font-serif text-sm text-[#203B35]">
                      Conversation Open
                    </p>
                    <p className="text-[11px] leading-relaxed max-w-[220px]">
                      Communicate requirements and arrange payment directly with the creator.
                    </p>
                  </div>
                ) : (
                  activeBooking.messages.map((msg) => {
                    const isMine =
                      msg.senderHandle.toLowerCase() === currentUserHandle;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMine ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-0.5 text-[10px] text-[#5D635F]">
                          <span className="font-medium text-[#203B35]">
                            {isMine ? "You" : msg.senderName}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm space-y-1.5 ${
                            isMine
                              ? "bg-[#203B35] text-[#FAF8F3] rounded-tr-sm"
                              : "bg-[#F6F3EB] border border-[#203B35]/10 text-[#282B2A] rounded-tl-sm"
                          }`}
                        >
                          {msg.content && <p>{msg.content}</p>}

                          {msg.attachmentUrl && (
                            <div className={`rounded-xl overflow-hidden border p-2 space-y-1 ${
                              isMine
                                ? "bg-black/20 border-white/20"
                                : "bg-[#FAF8F3] border-[#203B35]/15"
                            }`}>
                              <div className="w-36 h-36 mx-auto rounded-lg overflow-hidden bg-white flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={msg.attachmentUrl}
                                  alt={msg.attachmentCaption || "Attachment"}
                                  className="w-full h-full object-contain p-2"
                                />
                              </div>
                              {msg.attachmentCaption && (
                                <p className={`text-[10px] font-mono text-center truncate ${
                                  isMine ? "text-[#FAF8F3]/90" : "text-[#203B35]"
                                }`}>
                                  {msg.attachmentCaption}
                                </p>
                              )}
                              {msg.attachmentType === "qr_code" && (
                                <span className={`block text-[9.5px] text-center italic ${
                                  isMine ? "text-[#FAF8F3]/75" : "text-[#5D635F]"
                                }`}>
                                  Direct Settlement QR · External Payment
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
                <div className="px-4 py-1.5 bg-[#EFECE2] border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#203B35]">
                  <div className="flex items-center gap-1.5">
                    {attachment.type === "qr_code" ? (
                      <QrCode className="h-3.5 w-3.5 text-[#8E5A1C]" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-[#203B35]" />
                    )}
                    <span className="font-medium truncate max-w-[200px] text-[11px]">
                      {attachment.caption || "Image Attached"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-[#ae361c] hover:underline text-[10.5px]"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Quick Attach Menu */}
              {showAttachMenu && (
                <div className="p-3 bg-[#FAF8F3] border-t border-[#203B35]/15 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#203B35] text-[11px]">
                      Share Payment QR or Image
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu(false)}
                      className="text-[#5D635F] hover:text-[#203B35]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleAttachPresetQR}
                      className="flex items-center gap-2 rounded-xl border border-[#203B35]/20 bg-[#F6F3EB] p-2 text-left hover:border-[#203B35] transition-colors"
                    >
                      <QrCode className="h-3.5 w-3.5 text-[#8E5A1C] shrink-0" />
                      <div>
                        <p className="font-medium text-[#203B35] text-[10.5px]">
                          Studio Payment QR
                        </p>
                        <p className="text-[9.5px] text-[#5D635F]">External deposit</p>
                      </div>
                    </button>

                    <div className="space-y-1">
                      <input
                        type="url"
                        placeholder="Image URL..."
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="w-full h-7 rounded border border-[#203B35]/20 bg-[#F6F3EB] px-2 text-[10px]"
                      />
                      <button
                        type="button"
                        disabled={!customImageUrl.trim()}
                        onClick={handleAttachCustomImage}
                        className="w-full h-5 rounded bg-[#203B35] text-[#FAF8F3] text-[9.5px] disabled:opacity-40"
                      >
                        Attach Image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              {activeBooking.status === "Completed" || activeBooking.status === "Declined" ? (
                <div className="border-t border-[#203B35]/10 p-3 bg-[#EFECE2]/90 flex items-center justify-center gap-1.5 text-[11.5px] text-[#5D635F]">
                  <Archive className="h-3.5 w-3.5 text-[#203B35]" />
                  <span>Archived in read-only mode.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-[#203B35]/10 p-2.5 bg-[#FAF8F3] flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu((prev) => !prev)}
                    title="Attach QR code or image"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      attachment || showAttachMenu
                        ? "border-[#203B35] bg-[#203B35] text-[#FAF8F3]"
                        : "border-[#203B35]/20 bg-[#F6F3EB] text-[#203B35] hover:bg-[#EFECE2]"
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                  </button>

                  <input
                    type="text"
                    placeholder="Message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="flex-1 h-8 rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-3 text-xs text-[#282B2A] focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-1 focus:ring-[#9DB5A5]/40"
                  />

                  <button
                    type="submit"
                    disabled={!draft.trim() && !attachment}
                    aria-label="Send message"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Messenger Launcher Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle booking messages"
        className="relative group flex items-center gap-2 rounded-full bg-[#203B35] px-4 py-3 text-sm font-semibold text-[#FAF8F3] shadow-2xl hover:bg-[#162A26] transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-[#FAF8F3]/20"
      >
        <div className="relative">
          <MessageSquare className="h-4 w-4 text-[#9DB5A5]" />
          {unreadIndicatorCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E5A93C] text-[9px] font-bold text-[#203B35] ring-2 ring-[#203B35]">
              {unreadIndicatorCount}
            </span>
          )}
        </div>

        <span className="hidden sm:inline font-sans text-xs tracking-wide">
          Booking Inbox
        </span>
      </button>
    </aside>
  );
}
