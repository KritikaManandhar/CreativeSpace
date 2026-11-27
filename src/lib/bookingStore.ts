"use client";

import {
  INITIAL_DASHBOARD_BOOKINGS,
  type DashboardBookingItem,
} from "@/data/mockDashboard";

export type BookingStatus =
  | "Pending"
  | "Selected"
  | "Confirmed"
  | "Completed"
  | "Declined";

export type BookingProposalStatus =
  | "None"
  | "ProposedByCreator"
  | "ProposedByClient"
  | "Accepted"
  | "Declined"
  | "Expired";

export interface BookingNegotiationEntry {
  id: string;
  actor: "creator" | "client";
  actorName: string;
  actorHandle: string;
  action: "proposed" | "counter_proposed" | "accepted" | "declined" | "expired";
  proposedDate: string;
  proposedSlot: string;
  note?: string;
  timestamp: string;
  expiresAt: string; // ISO string 24h
}

export interface BookingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle: string;
  senderRole: "creator" | "client";
  content: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "qr_code" | "file";
  attachmentCaption?: string;
}

export interface UnifiedBookingItem {
  id: string;
  direction: "incoming" | "outgoing";
  // Provider / Creator Info
  creatorName: string;
  creatorHandle: string;
  creatorRole?: string;
  creatorAvatarUrl?: string | null;
  creatorAvatarTone?: string;
  // Client Info
  clientName: string;
  clientHandle: string;
  clientRole: string;
  clientInitials: string;
  clientAvatarTone: string;
  clientAvatarAccent: string;
  clientAvatarUrl?: string | null;
  clientEmail?: string;
  // Service Info
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  priceAmount: number;
  currency: string;
  deliverables: string[];
  sessionFormat: string;
  // Canonical Booking Status & Scheduled Slots
  status: BookingStatus;
  dateRequested: string;
  scheduledDate: string; // Active slot date (S1 or accepted S2)
  timeSlot: string; // Active slot time window
  originalDate: string; // Original S1 date
  originalSlot: string; // Original S1 slot
  clientNote: string;
  referenceUrl?: string;
  targetDeadline?: string;
  customDeliverableNotes?: string;
  // Alternative-Time Negotiation
  proposalStatus: BookingProposalStatus;
  proposedAlternativeDate?: string; // Active S2 date
  proposedAlternativeSlot?: string; // Active S2 slot
  proposalExpiresAt?: string; // ISO timestamp
  negotiationHistory: BookingNegotiationEntry[];
  // Single 48-Hour Informational Reminder
  selectedAt?: string;
  has48HourReminder?: boolean;
  // Scoped Contextual Messaging
  messages: BookingMessage[];
}

const STORAGE_KEY = "creativespace_unified_bookings_v3";

/**
 * Initial curated set of bookings representing both Incoming (services Anya provides)
 * and Outgoing (services Anya requested from Kenji and Elena),
 * including slot competition and an active alternative proposal with countdown.
 */
export const SEED_UNIFIED_BOOKINGS: UnifiedBookingItem[] = [
  // 1. Incoming Booking (Slot Competition 1 of 2): David Miller requested Nov 30, 2:00 PM
  {
    id: "bkg-101",
    direction: "incoming",
    creatorName: "Anya Sharma",
    creatorHandle: "anya_art",
    creatorRole: "Botanical Illustrator & Visual Artist",
    creatorAvatarTone: "#203B35",
    clientName: "David Miller",
    clientHandle: "david_client",
    clientRole: "Creative Director, Horizon Press",
    clientInitials: "DM",
    clientAvatarTone: "#203B35",
    clientAvatarAccent: "#C8BDE0",
    clientAvatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    clientEmail: "david@horizonpress.pub",
    serviceId: "srv-anya-botanical-cover",
    serviceTitle: "Editorial Botanical Cover Series",
    serviceCategory: "Illustration",
    status: "Selected",
    dateRequested: "2 hours ago",
    scheduledDate: "Nov 30, 2026",
    timeSlot: "Kickoff Call: 2:00 PM – 3:30 PM (UTC+9)",
    originalDate: "Nov 30, 2026",
    originalSlot: "Kickoff Call: 2:00 PM – 3:30 PM (UTC+9)",
    priceAmount: 450,
    currency: "USD",
    clientNote:
      "We are curating the Winter issue of Horizon Quarterly centered around natural sanctuaries and urban flora. We loved your Nocturne Flora study and want 1 primary gouache cover + 2 chapter vignettes.",
    deliverables: [
      "3 rough composition thumbnails for direction selection",
      "Color palette & gouache texture proof",
      "High-resolution 600 DPI TIFF & Print-ready PDF",
      "Commercial or editorial usage license summary",
    ],
    sessionFormat: "Async milestone reviews + 1 kickoff call",
    proposalStatus: "None",
    negotiationHistory: [],
    selectedAt: "2026-11-26T18:30:00Z",
    has48HourReminder: true, // Selected for ~48h, triggers informational notice
    messages: [
      {
        id: "msg-101-1",
        senderId: "u-anya",
        senderName: "Anya Sharma",
        senderHandle: "anya_art",
        senderRole: "creator",
        content:
          "Hi David! I'm delighted to proceed with your botanical cover series for Horizon Quarterly. To reserve the Nov 30 kickoff slot, please settle the $450 deposit externally via our studio payment link or the QR code below. Let me know once sent!",
        timestamp: "1 hour ago",
        attachmentUrl:
          "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Fsharma.studio%2Fpay%2Fcover-winter",
        attachmentType: "qr_code",
        attachmentCaption: "Anya Sharma Atelier · Direct Settlement QR",
      },
      {
        id: "msg-101-2",
        senderId: "david_client",
        senderName: "David Miller",
        senderHandle: "david_client",
        senderRole: "client",
        content:
          "Thanks Anya! Received the QR code. Transferring the payment now via our corporate account.",
        timestamp: "30 minutes ago",
      },
    ],
  },

  // 2. Incoming Booking (Slot Competition 2 of 2): Liam O'Connor also requested Nov 30, 2:00 PM
  {
    id: "bkg-101-competing",
    direction: "incoming",
    creatorName: "Anya Sharma",
    creatorHandle: "anya_art",
    creatorRole: "Botanical Illustrator & Visual Artist",
    creatorAvatarTone: "#203B35",
    clientName: "Liam O'Connor",
    clientHandle: "liam_design",
    clientRole: "Art Director, Canopy Journal",
    clientInitials: "LO",
    clientAvatarTone: "#3A4741",
    clientAvatarAccent: "#9DB5A5",
    clientEmail: "liam@canopyjournal.org",
    serviceId: "srv-anya-botanical-cover",
    serviceTitle: "Editorial Botanical Cover Series",
    serviceCategory: "Illustration",
    status: "Pending", // Competing request remains pending even though David is selected!
    dateRequested: "5 hours ago",
    scheduledDate: "Nov 30, 2026",
    timeSlot: "Kickoff Call: 2:00 PM – 3:30 PM (UTC+9)",
    originalDate: "Nov 30, 2026",
    originalSlot: "Kickoff Call: 2:00 PM – 3:30 PM (UTC+9)",
    priceAmount: 450,
    currency: "USD",
    clientNote:
      "Requesting a cover illustration for our annual ecology issue. Competing for this slot; happy to negotiate another time if already held.",
    deliverables: [
      "3 rough composition thumbnails for direction selection",
      "High-resolution 600 DPI TIFF & Print-ready PDF",
    ],
    sessionFormat: "Async milestone reviews + 1 kickoff call",
    proposalStatus: "None",
    negotiationHistory: [],
    messages: [],
  },

  // 3. Incoming Booking with Active Negotiation: Maya Lin requested Dec 3, creator proposed alternative
  {
    id: "bkg-102",
    direction: "incoming",
    creatorName: "Anya Sharma",
    creatorHandle: "anya_art",
    creatorRole: "Botanical Illustrator & Visual Artist",
    creatorAvatarTone: "#203B35",
    clientName: "Maya Lin",
    clientHandle: "maya_design",
    clientRole: "Brand Design Lead, Studio Koto",
    clientInitials: "ML",
    clientAvatarTone: "#3A4741",
    clientAvatarAccent: "#9DB5A5",
    clientEmail: "maya@studiokoto.co",
    serviceId: "srv-anya-critique-session",
    serviceTitle: "1-on-1 Studio Critique & Portfolio Review",
    serviceCategory: "Mentorship",
    status: "Pending",
    dateRequested: "Yesterday",
    scheduledDate: "Dec 03, 2026",
    timeSlot: "Late Afternoon Review: 4:30 PM – 6:00 PM (UTC+9)",
    originalDate: "Dec 03, 2026",
    originalSlot: "Late Afternoon Review: 4:30 PM – 6:00 PM (UTC+9)",
    priceAmount: 150,
    currency: "USD",
    clientNote:
      "Looking for candid feedback on an upcoming editorial monograph series. Specifically wanting to audit layout balance and gouache print reproductions.",
    deliverables: [
      "60-minute recorded video critique & deep dive",
      "Annotated Figma or PDF review sheet with balance notes",
    ],
    sessionFormat: "60-minute video session via studio link",
    proposalStatus: "ProposedByCreator",
    proposedAlternativeDate: "Dec 05, 2026",
    proposedAlternativeSlot: "Morning Studio Kickoff: 10:00 AM – 11:30 AM (UTC+9)",
    proposalExpiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // ~18 hours left
    negotiationHistory: [
      {
        id: "neg-1",
        actor: "creator",
        actorName: "Anya Sharma",
        actorHandle: "anya_art",
        action: "proposed",
        proposedDate: "Dec 05, 2026",
        proposedSlot: "Morning Studio Kickoff: 10:00 AM – 11:30 AM (UTC+9)",
        note: "Dec 3 afternoon has studio studio printing commitments. Could we shift to Saturday Dec 5 morning?",
        timestamp: "6 hours ago",
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      },
    ],
    messages: [],
  },

  // 4. Incoming Booking: Confirmed session with Kenji Sato + Scoped Active Chat
  {
    id: "bkg-103",
    direction: "incoming",
    creatorName: "Anya Sharma",
    creatorHandle: "anya_art",
    creatorRole: "Botanical Illustrator & Visual Artist",
    creatorAvatarTone: "#203B35",
    clientName: "Kenji Sato",
    clientHandle: "kenji_film",
    clientRole: "Architectural Photographer",
    clientInitials: "KS",
    clientAvatarTone: "#3B4A44",
    clientAvatarAccent: "#9DB5A5",
    clientEmail: "kenji@satophoto.jp",
    serviceId: "srv-anya-botanical-spot",
    serviceTitle: "Custom Botanical Spot Illustration Set",
    serviceCategory: "Illustration",
    status: "Confirmed",
    dateRequested: "3 days ago",
    scheduledDate: "Dec 08, 2026",
    timeSlot: "Milestone Delivery Date",
    originalDate: "Dec 08, 2026",
    originalSlot: "Milestone Delivery Date",
    priceAmount: 650,
    currency: "USD",
    clientNote:
      "Collaborative spot artwork needed for my upcoming Kyoto Travertine photo book dividers. Five small Japanese moss & stone ink drawings.",
    deliverables: [
      "5 custom gouache / ink botanical spot plates",
      "Transparent PNG assets & vectorized SVG linework",
      "Printed contact sheet specimen proof",
    ],
    sessionFormat: "Weekly async drop & shared workspace",
    proposalStatus: "None",
    negotiationHistory: [],
    messages: [
      {
        id: "msg-1",
        senderId: "u-kenji",
        senderName: "Kenji Sato",
        senderHandle: "kenji_film",
        senderRole: "client",
        content:
          "Hi Anya, excited to confirm! I've uploaded the contact sheet of stone plates to our shared review folder.",
        timestamp: "Yesterday at 11:20 AM",
      },
      {
        id: "msg-2",
        senderId: "u-anya",
        senderName: "Anya Sharma",
        senderHandle: "anya_art",
        senderRole: "creator",
        content:
          "Wonderful Kenji! The travertine textures are stunning. I am starting initial thumbnail washes today.",
        timestamp: "Yesterday at 2:45 PM",
      },
    ],
  },

  // 5. Incoming Booking: Completed session with Julian Vance + Read-Only Message Archive
  {
    id: "bkg-105",
    direction: "incoming",
    creatorName: "Anya Sharma",
    creatorHandle: "anya_art",
    creatorRole: "Botanical Illustrator & Visual Artist",
    creatorAvatarTone: "#203B35",
    clientName: "Julian Vance",
    clientHandle: "julian_vance",
    clientRole: "Author & Essayist",
    clientInitials: "JV",
    clientAvatarTone: "#4A5952",
    clientAvatarAccent: "#EFECE2",
    clientEmail: "julian@vance.ink",
    serviceId: "srv-anya-critique-session",
    serviceTitle: "1-on-1 Studio Critique & Portfolio Review",
    serviceCategory: "Mentorship",
    status: "Completed",
    dateRequested: "Nov 10, 2026",
    scheduledDate: "Nov 16, 2026",
    timeSlot: "Completed",
    originalDate: "Nov 16, 2026",
    originalSlot: "Completed",
    priceAmount: 150,
    currency: "USD",
    clientNote:
      "Review of botanical zine cover draft and layout pacing. Thank you for the insightful feedback on contrast and paper texture!",
    deliverables: [
      "60-minute recorded video critique",
      "Annotated layout critique notes",
    ],
    sessionFormat: "60-minute video session",
    proposalStatus: "None",
    negotiationHistory: [],
    messages: [
      {
        id: "msg-101",
        senderId: "u-julian",
        senderName: "Julian Vance",
        senderHandle: "julian_vance",
        senderRole: "client",
        content: "Thank you for the wonderful session today, Anya! The annotations were super helpful.",
        timestamp: "Nov 16, 2026 at 5:15 PM",
      },
      {
        id: "msg-102",
        senderId: "u-anya",
        senderName: "Anya Sharma",
        senderHandle: "anya_art",
        senderRole: "creator",
        content: "You're very welcome Julian! Best of luck with the zine print run.",
        timestamp: "Nov 16, 2026 at 5:30 PM",
      },
    ],
  },

  // =========================================================================
  // OUTGOING BOOKINGS (Services Anya requested as a Client from other creators)
  // =========================================================================

  // 6. Outgoing Booking (Under Negotiation): Anya requested Kenji's Architectural Photo Essay
  {
    id: "bkg-out-201",
    direction: "outgoing",
    creatorName: "Kenji Sato",
    creatorHandle: "kenji_film",
    creatorRole: "Architectural Photographer",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    creatorAvatarTone: "#3B4A44",
    clientName: "Anya Sharma",
    clientHandle: "anya_art",
    clientRole: "Botanical Illustrator & Studio Lead",
    clientInitials: "AS",
    clientAvatarTone: "#203B35",
    clientAvatarAccent: "#C8BDE0",
    clientEmail: "anya@sharma.studio",
    serviceId: "srv-kenji-architectural-essay",
    serviceTitle: "Architectural Daylight Photo Essay",
    serviceCategory: "Photography",
    status: "Pending",
    dateRequested: "Yesterday",
    scheduledDate: "Dec 10, 2026",
    timeSlot: "Morning Studio Kickoff: 10:00 AM – 11:30 AM (UTC+9)",
    originalDate: "Dec 10, 2026",
    originalSlot: "Morning Studio Kickoff: 10:00 AM – 11:30 AM (UTC+9)",
    priceAmount: 950,
    currency: "USD",
    clientNote:
      "Requesting daylight photo documentation of our glasshouse conservatory studio and raw gouache work tables for our upcoming exhibition catalog.",
    deliverables: [
      "Curated contact sheet of 40+ medium-format selects",
      "16 color-graded archival TIFF & web plates",
      "Print-ready sequence PDF for press or portfolio",
    ],
    sessionFormat: "On-site architectural shoot + curated gallery delivery",
    proposalStatus: "ProposedByCreator", // Kenji proposed alternative time to Anya!
    proposedAlternativeDate: "Dec 12, 2026",
    proposedAlternativeSlot: "Mid-Day Creative Sprint: 2:00 PM – 3:30 PM (UTC+9)",
    proposalExpiresAt: new Date(Date.now() + 21 * 60 * 60 * 1000).toISOString(), // ~21 hours left
    negotiationHistory: [
      {
        id: "neg-out-1",
        actor: "creator",
        actorName: "Kenji Sato",
        actorHandle: "kenji_film",
        action: "proposed",
        proposedDate: "Dec 12, 2026",
        proposedSlot: "Mid-Day Creative Sprint: 2:00 PM – 3:30 PM (UTC+9)",
        note: "Hello Anya! Dec 10 I will be traveling back from Kyoto. Would Saturday Dec 12 afternoon work for your studio shoot?",
        timestamp: "3 hours ago",
        expiresAt: new Date(Date.now() + 21 * 60 * 60 * 1000).toISOString(),
      },
    ],
    messages: [],
  },

  // 7. Outgoing Booking (Confirmed): Anya booked Elena's Swiss Grid Identity System + Scoped Chat
  {
    id: "bkg-out-202",
    direction: "outgoing",
    creatorName: "Elena Rostova",
    creatorHandle: "elena_design",
    creatorRole: "Editorial & Identity Designer",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    creatorAvatarTone: "#203B35",
    clientName: "Anya Sharma",
    clientHandle: "anya_art",
    clientRole: "Botanical Illustrator & Studio Lead",
    clientInitials: "AS",
    clientAvatarTone: "#203B35",
    clientAvatarAccent: "#C8BDE0",
    clientEmail: "anya@sharma.studio",
    serviceId: "srv-elena-exhibition-identity",
    serviceTitle: "Exhibition Identity & Swiss Grid System",
    serviceCategory: "Graphic Design",
    status: "Confirmed",
    dateRequested: "4 days ago",
    scheduledDate: "Dec 18, 2026",
    timeSlot: "Weekly Studio Milestones + Shared Workspace",
    originalDate: "Dec 18, 2026",
    originalSlot: "Weekly Studio Milestones + Shared Workspace",
    priceAmount: 1200,
    currency: "USD",
    clientNote:
      "Need a typographic system, poster layout grid, and gallery brochure template for our 2027 Tokyo Solo Retrospective.",
    deliverables: [
      "Modular Swiss-grid identity system & type scale",
      "Key poster & digital exhibition templates",
      "Comprehensive studio identity manual (PDF)",
    ],
    sessionFormat: "Weekly studio milestones + shared workspace",
    proposalStatus: "None",
    negotiationHistory: [],
    messages: [
      {
        id: "msg-elena-1",
        senderId: "u-elena",
        senderName: "Elena Rostova",
        senderHandle: "elena_design",
        senderRole: "creator",
        content:
          "Welcome Anya! I've set up the Figma atelier grid. Looking forward to our kickoff milestone.",
        timestamp: "2 days ago at 10:00 AM",
      },
      {
        id: "msg-elena-2",
        senderId: "u-anya",
        senderName: "Anya Sharma",
        senderHandle: "anya_art",
        senderRole: "client",
        content:
          "Thank you Elena! I've linked the draft artwork catalog in the canvas.",
        timestamp: "Yesterday at 3:15 PM",
      },
    ],
  },
];

/** Read all unified bookings from storage or memory seed */
export function getStoredBookings(): UnifiedBookingItem[] {
  if (typeof window === "undefined") {
    return SEED_UNIFIED_BOOKINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_UNIFIED_BOOKINGS));
      return SEED_UNIFIED_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_UNIFIED_BOOKINGS;
  }
}

/** Save unified bookings to storage and notify listeners */
export function saveStoredBookings(bookings: UnifiedBookingItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(
      new CustomEvent("creativespace_bookings_updated", { detail: bookings })
    );
  } catch {
    // safe fallback
  }
}

/** Subscribe to unified bookings changes across components and storage */
export function subscribeToBookings(
  callback: (bookings: UnifiedBookingItem[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<UnifiedBookingItem[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getStoredBookings());
    }
  };
  window.addEventListener("creativespace_bookings_updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("creativespace_bookings_updated", handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Confirm a selected booking manually:
 * - Updates the target booking to Confirmed.
 * - Reserves the agreed time slot.
 * - Closes competing pending requests for that slot.
 * - Preserves the booking conversation history.
 */
export function confirmBookingAndCloseCompeting(
  bookings: UnifiedBookingItem[],
  bookingId: string
): { updatedBookings: UnifiedBookingItem[]; closedCount: number } {
  const target = bookings.find((b) => b.id === bookingId);
  if (!target) return { updatedBookings: bookings, closedCount: 0 };

  let closedCount = 0;
  const targetDate = target.scheduledDate;
  const targetSlotPrefix = target.timeSlot.split(":")[0].trim().toLowerCase();

  const updatedBookings = bookings.map((b) => {
    // 1. Target booking becomes Confirmed
    if (b.id === bookingId) {
      return {
        ...b,
        status: "Confirmed" as BookingStatus,
        has48HourReminder: false,
      };
    }

    // 2. Competing pending requests for the same date & slot are closed
    const isSameDate = b.scheduledDate === targetDate;
    const isSameSlot =
      b.timeSlot.toLowerCase().includes(targetSlotPrefix) ||
      targetSlotPrefix.includes(b.timeSlot.split(":")[0].trim().toLowerCase());

    if (
      b.direction === target.direction &&
      b.status === "Pending" &&
      isSameDate &&
      isSameSlot
    ) {
      closedCount += 1;
      return {
        ...b,
        status: "Declined" as BookingStatus,
        clientNote: `${b.clientNote} [Slot confirmed with another client]`,
      };
    }

    return b;
  });

  return { updatedBookings, closedCount };
}

/** Check if a specific slot on a date is involved in an active negotiation hold */
export function isSlotHeldInNegotiation(
  bookings: UnifiedBookingItem[],
  date: string,
  timeSlotKeyword: string
): boolean {
  return bookings.some((b) => {
    if (b.proposalStatus !== "ProposedByCreator" && b.proposalStatus !== "ProposedByClient") {
      return false;
    }
    // Check original S1 hold
    const isOriginalHeld =
      b.originalDate === date &&
      (b.originalSlot.toLowerCase().includes(timeSlotKeyword.toLowerCase()) ||
        timeSlotKeyword.toLowerCase().includes(b.originalSlot.toLowerCase()));

    // Check proposed alternative S2 hold
    const isAlternativeHeld =
      b.proposedAlternativeDate === date &&
      Boolean(
        b.proposedAlternativeSlot &&
          (b.proposedAlternativeSlot.toLowerCase().includes(timeSlotKeyword.toLowerCase()) ||
            timeSlotKeyword.toLowerCase().includes(b.proposedAlternativeSlot.toLowerCase()))
      );

    return isOriginalHeld || isAlternativeHeld;
  });
}
