"use client";

import React, { useId, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Info,
  Layers,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { CelestialSpark, CreativeSpaceMark } from "@/components/landing/CreativeSpaceBrand";
import {
  formatServicePrice,
  type ProfileServiceItem,
} from "@/data/mockProfiles";
import {
  getStoredBookings,
  saveStoredBookings,
  isSlotHeldInNegotiation,
  type UnifiedBookingItem,
} from "@/lib/bookingStore";

export type BookingSubStep = "schedule" | "requirements" | "review" | "confirmed";

export interface BookingTimeSlotOption {
  id: string;
  title: string;
  timeRange: string;
  description: string;
  formatTag: string;
}

export const BOOKING_TIME_SLOTS: BookingTimeSlotOption[] = [
  {
    id: "slot-morning",
    title: "Morning Studio Kickoff",
    timeRange: "10:00 AM – 11:30 AM",
    description: "Initial vision alignment, creative direction review, and reference material walkthrough.",
    formatTag: "Live Studio Call",
  },
  {
    id: "slot-afternoon",
    title: "Mid-Day Creative Sprint",
    timeRange: "2:00 PM – 3:30 PM",
    description: "Interactive composition review, aesthetic benchmarks, and technical scope exploration.",
    formatTag: "Live Workshop",
  },
  {
    id: "slot-evening",
    title: "Late Afternoon Review",
    timeRange: "4:30 PM – 6:00 PM",
    description: "End-of-day checkpoint to establish milestone checkpoints and feedback timelines.",
    formatTag: "Milestone Alignment",
  },
  {
    id: "slot-async",
    title: "Flexible Async Kickoff",
    timeRange: "Milestone Day · Asynchronous",
    description: "No live call required. Creator begins kickoff review asynchronously on the selected date.",
    formatTag: "Async Studio",
  },
];

export interface BookingFormData {
  preferredDate: string;
  timeSlotId: string;
  timezone: string;
  clientName: string;
  clientEmail: string;
  clientOrganization: string;
  clientHandle: string;
  projectTitle: string;
  projectBrief: string;
  selectedDeliverables: string[];
  customDeliverableNotes: string;
  referenceUrl: string;
  targetDeadline: string;
  additionalNotes: string;
  acceptedTerms: boolean;
}

export interface ClientBookingRequestFlowProps {
  service: ProfileServiceItem;
  providerName: string;
  providerUsername: string;
  onCancel: () => void;
  onComplete: () => void;
  onViewServiceDetails: () => void;
}

/** Helper to parse creator min notice and compute earliest selectable date */
export function calculateMinBookingDate(minNoticeText: string): {
  minDateString: string;
  minNoticeDays: number;
} {
  const now = new Date();
  let daysToAdd = 3;

  const lower = (minNoticeText || "").toLowerCase();
  if (lower.includes("14 days") || lower.includes("2 weeks")) {
    daysToAdd = 14;
  } else if (lower.includes("7 days") || lower.includes("1 week")) {
    daysToAdd = 7;
  } else if (lower.includes("72 hours") || lower.includes("3 days")) {
    daysToAdd = 3;
  } else if (lower.includes("48 hours") || lower.includes("2 days")) {
    daysToAdd = 2;
  } else if (lower.includes("24 hours") || lower.includes("1 day")) {
    daysToAdd = 1;
  }

  const target = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");

  return {
    minDateString: `${year}-${month}-${day}`,
    minNoticeDays: daysToAdd,
  };
}

/** Helper to add days to a date string */
export function addDaysToDateString(baseDateString: string, daysToAdd: number): string {
  const [y, m, d] = baseDateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysToAdd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Format date string into human friendly format e.g. "Thursday, Dec 3, 2026" */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ClientBookingRequestFlow({
  service,
  providerName,
  providerUsername,
  onCancel,
  onComplete,
  onViewServiceDetails,
}: ClientBookingRequestFlowProps) {
  const { minDateString, minNoticeDays } = useMemo(
    () => calculateMinBookingDate(service.minNotice),
    [service.minNotice]
  );

  const [step, setStep] = useState<BookingSubStep>("schedule");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [confirmationRef, setConfirmationRef] = useState<string>("");

  // Form State
  const [formData, setFormData] = useState<BookingFormData>(() => ({
    preferredDate: minDateString,
    timeSlotId: BOOKING_TIME_SLOTS[0].id,
    timezone: "Creator Studio Time (UTC+9)",
    clientName: "",
    clientEmail: "",
    clientOrganization: "",
    clientHandle: "",
    projectTitle: "",
    projectBrief: "",
    selectedDeliverables: [...service.deliverables],
    customDeliverableNotes: "",
    referenceUrl: "",
    targetDeadline: "",
    additionalNotes: "",
    acceptedTerms: false,
  }));

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const selectedSlot = useMemo(() => {
    return (
      BOOKING_TIME_SLOTS.find((s) => s.id === formData.timeSlotId) ||
      BOOKING_TIME_SLOTS[0]
    );
  }, [formData.timeSlotId]);

  const priceDisplay = formatServicePrice(service);

  // Check if selected slot on the preferred date is currently held in an active negotiation
  const isHeldInNegotiation = useMemo(() => {
    return isSlotHeldInNegotiation(
      getStoredBookings(),
      formatDisplayDate(formData.preferredDate),
      selectedSlot.title
    );
  }, [formData.preferredDate, selectedSlot.title]);

  // Field change handler
  const updateField = <K extends keyof BookingFormData>(
    field: K,
    value: BookingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Toggle deliverable checkbox
  const toggleDeliverable = (item: string) => {
    setFormData((prev) => {
      const exists = prev.selectedDeliverables.includes(item);
      const nextDeliverables = exists
        ? prev.selectedDeliverables.filter((d) => d !== item)
        : [...prev.selectedDeliverables, item];
      return { ...prev, selectedDeliverables: nextDeliverables };
    });
    if (errors.selectedDeliverables) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.selectedDeliverables;
        return next;
      });
    }
  };

  const toggleAllDeliverables = () => {
    setFormData((prev) => {
      if (prev.selectedDeliverables.length === service.deliverables.length) {
        return { ...prev, selectedDeliverables: [] };
      }
      return { ...prev, selectedDeliverables: [...service.deliverables] };
    });
  };

  // Step 1 Validation
  const validateScheduleStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.preferredDate) {
      newErrors.preferredDate = "Please select a preferred date.";
    } else if (formData.preferredDate < minDateString) {
      newErrors.preferredDate = `Please choose a date on or after ${formatDisplayDate(
        minDateString
      )} (${service.minNotice}).`;
    }
    if (!formData.timeSlotId) {
      newErrors.timeSlotId = "Please choose a preferred time slot.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateRequirementsStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientName.trim() || formData.clientName.trim().length < 2) {
      newErrors.clientName = "Please provide your full name (at least 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.clientEmail.trim() || !emailRegex.test(formData.clientEmail.trim())) {
      newErrors.clientEmail = "Please enter a valid email address.";
    }

    if (!formData.projectTitle.trim() || formData.projectTitle.trim().length < 3) {
      newErrors.projectTitle = "Please provide a project title or subject.";
    }

    if (!formData.projectBrief.trim() || formData.projectBrief.trim().length < 20) {
      newErrors.projectBrief = `Please share a creative brief with at least 20 characters (${formData.projectBrief.trim().length}/20).`;
    }

    if (
      formData.selectedDeliverables.length === 0 &&
      !formData.customDeliverableNotes.trim()
    ) {
      newErrors.selectedDeliverables =
        "Please select at least one deliverable or specify custom notes.";
    }

    if (formData.referenceUrl.trim()) {
      const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i;
      if (!urlPattern.test(formData.referenceUrl.trim())) {
        newErrors.referenceUrl = "Please provide a valid URL (e.g. https://...).";
      }
    }

    if (formData.targetDeadline && formData.preferredDate) {
      if (formData.targetDeadline < formData.preferredDate) {
        newErrors.targetDeadline =
          "Target delivery date cannot be earlier than your requested session date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 Validation
  const validateReviewStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms =
        "Please acknowledge and agree to CreativeSpace's operational booking terms.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigations
  const handleProceedFromSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateScheduleStep()) {
      setStep("requirements");
    }
  };

  const handleProceedFromRequirements = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRequirementsStep()) {
      setStep("review");
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReviewStep()) return;

    setIsSubmitting(true);
    // Simulate brief high-fidelity submission state
    await new Promise((res) => setTimeout(res, 600));

    const generatedCode = `BK-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    setConfirmationRef(generatedCode);

    // Persist new booking to unified booking store so it appears in My Requests
    try {
      const currentBookings = getStoredBookings();
      const newBooking: UnifiedBookingItem = {
        id: generatedCode,
        direction: "outgoing",
        creatorName: providerName,
        creatorHandle: providerUsername,
        creatorAvatarTone: "#3B4A44",
        clientName: formData.clientName.trim() || "Anya Sharma",
        clientHandle: formData.clientHandle.trim() || "anya_art",
        clientRole: formData.clientOrganization.trim() || "Client",
        clientInitials:
          formData.clientName.trim().slice(0, 2).toUpperCase() || "AS",
        clientAvatarTone: "#203B35",
        clientAvatarAccent: "#C8BDE0",
        clientEmail: formData.clientEmail.trim(),
        serviceId: service.id,
        serviceTitle: service.title,
        serviceCategory: service.category,
        priceAmount: service.priceAmount,
        currency: service.currency || "USD",
        deliverables: formData.selectedDeliverables,
        sessionFormat: service.sessionFormat,
        status: "Pending",
        dateRequested: "Just now",
        scheduledDate: formatDisplayDate(formData.preferredDate),
        timeSlot: `${selectedSlot.title}: ${selectedSlot.timeRange}`,
        originalDate: formatDisplayDate(formData.preferredDate),
        originalSlot: `${selectedSlot.title}: ${selectedSlot.timeRange}`,
        clientNote: formData.projectBrief.trim(),
        referenceUrl: formData.referenceUrl.trim() || undefined,
        targetDeadline: formData.targetDeadline
          ? formatDisplayDate(formData.targetDeadline)
          : undefined,
        customDeliverableNotes:
          formData.customDeliverableNotes.trim() || undefined,
        proposalStatus: "None",
        negotiationHistory: [],
        messages: [],
      };
      saveStoredBookings([newBooking, ...currentBookings]);
    } catch {
      // safe fallback
    }

    setIsSubmitting(false);
    setStep("confirmed");
  };

  const handleCopyRef = async () => {
    if (!confirmationRef) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(confirmationRef);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      }
    } catch {
      // safe fallback
    }
  };

  const handleResetForNewBooking = () => {
    setFormData({
      preferredDate: minDateString,
      timeSlotId: BOOKING_TIME_SLOTS[0].id,
      timezone: "Creator Studio Time (UTC+9)",
      clientName: "",
      clientEmail: "",
      clientOrganization: "",
      clientHandle: "",
      projectTitle: "",
      projectBrief: "",
      selectedDeliverables: [...service.deliverables],
      customDeliverableNotes: "",
      referenceUrl: "",
      targetDeadline: "",
      additionalNotes: "",
      acceptedTerms: false,
    });
    setErrors({});
    setStep("schedule");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#FAF8F3]">
      {/* Interactive Progress Stepper (Visible across schedule, requirements, review) */}
      {step !== "confirmed" && (
        <div className="border-b border-[#203B35]/10 px-5 sm:px-7 py-3.5 bg-[#FAF8F3]">
          <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setStep("schedule")}
              className={`flex items-center gap-2 text-left group focus:outline-none ${
                step === "schedule"
                  ? "text-[#203B35] font-semibold"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                  step === "schedule"
                    ? "bg-[#203B35] text-[#F6F3EB]"
                    : "bg-[#9DB5A5]/30 text-[#203B35]"
                }`}
              >
                {step !== "schedule" ? <Check className="h-3 w-3" /> : "1"}
              </span>
              <span className="hidden sm:inline text-[12.5px] tracking-tight">
                Date &amp; Time
              </span>
            </button>

            <div className="h-px flex-1 bg-[#203B35]/15 mx-1 sm:mx-2" />

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => {
                if (validateScheduleStep()) setStep("requirements");
              }}
              className={`flex items-center gap-2 text-left group focus:outline-none ${
                step === "requirements"
                  ? "text-[#203B35] font-semibold"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                  step === "requirements"
                    ? "bg-[#203B35] text-[#F6F3EB]"
                    : step === "review"
                    ? "bg-[#9DB5A5]/30 text-[#203B35]"
                    : "bg-[#203B35]/10 text-[#5D635F]"
                }`}
              >
                {step === "review" ? <Check className="h-3 w-3" /> : "2"}
              </span>
              <span className="hidden sm:inline text-[12.5px] tracking-tight">
                Project Scope &amp; Brief
              </span>
            </button>

            <div className="h-px flex-1 bg-[#203B35]/15 mx-1 sm:mx-2" />

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => {
                if (validateScheduleStep() && validateRequirementsStep()) {
                  setStep("review");
                }
              }}
              className={`flex items-center gap-2 text-left group focus:outline-none ${
                step === "review"
                  ? "text-[#203B35] font-semibold"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                  step === "review"
                    ? "bg-[#203B35] text-[#F6F3EB]"
                    : "bg-[#203B35]/10 text-[#5D635F]"
                }`}
              >
                3
              </span>
              <span className="hidden sm:inline text-[12.5px] tracking-tight">
                Review &amp; Terms
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
        {/* ====================================================================
         * STEP 1: DATE AND TIME SELECTION
         * ================================================================== */}
        {step === "schedule" && (
          <form
            id="booking-schedule-form"
            onSubmit={handleProceedFromSchedule}
            noValidate
            className="space-y-6 max-w-2xl mx-auto"
          >
            {/* Service Summary Banner */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#203B35]/12 bg-[#F6F3EB] p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                    {service.category}
                  </span>
                  <span className="text-[#5D635F]">·</span>
                  <span className="text-[12px] text-[#5D635F]">
                    with {providerName}
                  </span>
                </div>
                <h3 className="font-serif text-xl text-[#203B35] mt-0.5">
                  {service.title}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                  {service.pricingModel}
                </p>
                <p className="font-serif text-xl font-normal text-[#203B35]">
                  {priceDisplay}
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label
                  htmlFor="booking-date"
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
                >
                  1. Preferred Session or Kickoff Date
                </label>
                <span className="text-[12px] text-[#5D635F] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#9DB5A5]" />
                  <span>Lead Notice: {service.minNotice}</span>
                </span>
              </div>

              <input
                id="booking-date"
                type="date"
                min={minDateString}
                value={formData.preferredDate}
                onChange={(e) => updateField("preferredDate", e.target.value)}
                onBlur={() => markTouched("preferredDate")}
                className={`w-full h-12 rounded-xl border bg-[#F6F3EB]/90 px-4 text-[14.5px] text-[#282B2A] transition-all focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                  errors.preferredDate
                    ? "border-[#ae361c] focus:ring-[#ae361c]/30"
                    : "border-[#203B35]/20 focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                }`}
              />

              {/* Quick Date Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#5D635F]">
                  Quick Pick:
                </span>
                <button
                  type="button"
                  onClick={() => updateField("preferredDate", minDateString)}
                  className={`rounded-full px-3 py-1 text-[11.5px] border transition-colors ${
                    formData.preferredDate === minDateString
                      ? "bg-[#203B35] text-[#F6F3EB] border-[#203B35] font-medium"
                      : "border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] hover:bg-[#EFECE2]"
                  }`}
                >
                  Earliest Available ({minNoticeDays}d)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "preferredDate",
                      addDaysToDateString(minDateString, 7)
                    )
                  }
                  className="rounded-full px-3 py-1 text-[11.5px] border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "preferredDate",
                      addDaysToDateString(minDateString, 14)
                    )
                  }
                  className="rounded-full px-3 py-1 text-[11.5px] border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                >
                  +2 Weeks
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "preferredDate",
                      addDaysToDateString(minDateString, 30)
                    )
                  }
                  className="rounded-full px-3 py-1 text-[11.5px] border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                >
                  +1 Month
                </button>
              </div>

              {errors.preferredDate && (
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#ae361c]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.preferredDate}</span>
                </p>
              )}
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="block text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#203B35]">
                  2. Preferred Time Slot / Window
                </label>
                <span className="font-mono text-[11px] text-[#5D635F]">
                  Est. Session: {service.estimatedDuration}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Available time slots"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {BOOKING_TIME_SLOTS.map((slot) => {
                  const isSelected = formData.timeSlotId === slot.id;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => updateField("timeSlotId", slot.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 select-none ${
                        isSelected
                          ? "border-[#203B35] bg-[#9DB5A5]/15 shadow-sm ring-1 ring-[#203B35]"
                          : "border-[#203B35]/15 bg-[#F6F3EB]/70 hover:border-[#203B35]/35 hover:bg-[#F6F3EB]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-[#FAF8F3] border border-[#203B35]/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[#203B35] mb-1.5">
                            {slot.formatTag}
                          </span>
                          <h4 className="font-serif text-[1.1rem] leading-tight text-[#203B35]">
                            {slot.title}
                          </h4>
                          <p className="mt-1 text-[13px] font-medium text-[#203B35] tabular-nums">
                            {slot.timeRange}
                          </p>
                        </div>
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? "border-[#203B35] bg-[#203B35] text-[#F6F3EB]"
                              : "border-[#203B35]/30 bg-[#FAF8F3]"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-[#5D635F]">
                        {slot.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {errors.timeSlotId && (
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#ae361c]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.timeSlotId}</span>
                </p>
              )}
            </div>

            {/* Timezone Preference & Clarity */}
            <div className="rounded-xl border border-[#203B35]/10 bg-[#FAF8F3] p-3.5 flex items-center justify-between text-[12.5px] text-[#5D635F]">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#9DB5A5]" />
                <span>Reference Timezone</span>
              </div>
              <span className="font-mono text-[11.5px] text-[#203B35] font-medium">
                {formData.timezone}
              </span>
            </div>

            {/* Active Negotiation Hold Notice (Requirement 6 / DEC-016) */}
            {isHeldInNegotiation && (
              <div className="rounded-2xl border border-[#E5A93C]/60 bg-[#E5A93C]/20 p-4 text-xs text-[#8E5A1C] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4 text-[#8E5A1C]" />
                  <span>Slot In Active Negotiation</span>
                </div>
                <p className="text-[12px] leading-relaxed text-[#8E5A1C]/90">
                  This time slot is temporarily involved in an ongoing booking negotiation. You can still submit your request, and it will enter the creator&apos;s inquiries queue as a pending request without displacing active negotiation holds.
                </p>
              </div>
            )}

            {/* CreativeSpace Platform Booking Rule Callout (Multi-Client Slot Rule) */}
            <div className="rounded-2xl border border-[#9DB5A5]/60 bg-[#9DB5A5]/15 p-4 text-[13px] text-[#203B35] space-y-1.5">
              <div className="flex items-center gap-2 font-medium">
                <Info className="h-4 w-4 text-[#203B35]" />
                <span>CreativeSpace Multi-Client Booking Policy</span>
              </div>
              <p className="text-[12.5px] text-[#282B2A]/85 leading-relaxed">
                Multiple clients may request this calendar slot. When a creator
                evaluates and selects a client to proceed, other pending
                requests are <strong>not</strong> immediately rejected; they
                remain active until manual confirmation. Alternative times can
                also be negotiated separately if necessary.
              </p>
            </div>
          </form>
        )}

        {/* ====================================================================
         * STEP 2: PROJECT REQUIREMENTS, BRIEF & BOOKING DETAILS
         * ================================================================== */}
        {step === "requirements" && (
          <form
            id="booking-requirements-form"
            onSubmit={handleProceedFromRequirements}
            noValidate
            className="space-y-6 max-w-2xl mx-auto"
          >
            {/* Context Badge */}
            <div className="flex items-center justify-between gap-3 text-[12.5px] border-b border-[#203B35]/10 pb-3">
              <div>
                <span className="text-[#5D635F]">Booking Request for: </span>
                <strong className="font-medium text-[#203B35]">
                  {service.title}
                </strong>
              </div>
              <span className="font-mono text-[11.5px] text-[#203B35] bg-[#EFECE2] px-2.5 py-0.5 rounded-full">
                {formatDisplayDate(formData.preferredDate)}
              </span>
            </div>

            {/* Section A: Client Information */}
            <div className="space-y-3.5">
              <h4 className="font-serif text-lg text-[#203B35]">
                Your Contact Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="client-name"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
                  >
                    Your Name <span className="text-[#ae361c]">*</span>
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#9DB5A5]" />
                    <input
                      id="client-name"
                      type="text"
                      placeholder="e.g. Maya Lin"
                      value={formData.clientName}
                      onChange={(e) => updateField("clientName", e.target.value)}
                      onBlur={() => markTouched("clientName")}
                      className={`w-full h-11 rounded-xl border pl-10 pr-4 text-[14px] text-[#282B2A] transition-all bg-[#F6F3EB]/85 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                        errors.clientName
                          ? "border-[#ae361c] focus:ring-[#ae361c]/30"
                          : "border-[#203B35]/20 focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                      }`}
                    />
                  </div>
                  {errors.clientName && (
                    <p className="text-[11.5px] text-[#ae361c]">{errors.clientName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="client-email"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
                  >
                    Email Address <span className="text-[#ae361c]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#9DB5A5]" />
                    <input
                      id="client-email"
                      type="email"
                      placeholder="e.g. maya@studiored.com"
                      value={formData.clientEmail}
                      onChange={(e) => updateField("clientEmail", e.target.value)}
                      onBlur={() => markTouched("clientEmail")}
                      className={`w-full h-11 rounded-xl border pl-10 pr-4 text-[14px] text-[#282B2A] transition-all bg-[#F6F3EB]/85 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                        errors.clientEmail
                          ? "border-[#ae361c] focus:ring-[#ae361c]/30"
                          : "border-[#203B35]/20 focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                      }`}
                    />
                  </div>
                  {errors.clientEmail && (
                    <p className="text-[11.5px] text-[#ae361c]">{errors.clientEmail}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="client-organization"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D635F]"
                  >
                    Studio / Publication / Brand (Optional)
                  </label>
                  <input
                    id="client-organization"
                    type="text"
                    placeholder="e.g. Studio Red / Harper Press"
                    value={formData.clientOrganization}
                    onChange={(e) =>
                      updateField("clientOrganization", e.target.value)
                    }
                    className="w-full h-11 rounded-xl border border-[#203B35]/20 bg-[#F6F3EB]/85 px-3.5 text-[14px] text-[#282B2A] transition-all focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="client-handle"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D635F]"
                  >
                    Preferred Contact Handle (Optional)
                  </label>
                  <input
                    id="client-handle"
                    type="text"
                    placeholder="e.g. @mayalin_arch or Discord"
                    value={formData.clientHandle}
                    onChange={(e) => updateField("clientHandle", e.target.value)}
                    className="w-full h-11 rounded-xl border border-[#203B35]/20 bg-[#F6F3EB]/85 px-3.5 text-[14px] text-[#282B2A] transition-all focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/40"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Project Scope & Brief */}
            <div className="space-y-4 pt-2 border-t border-[#203B35]/10">
              <h4 className="font-serif text-lg text-[#203B35]">
                Project Scope &amp; Creative Brief
              </h4>

              <div className="space-y-1.5">
                <label
                  htmlFor="project-title"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
                >
                  Project Title / Subject <span className="text-[#ae361c]">*</span>
                </label>
                <input
                  id="project-title"
                  type="text"
                  placeholder="e.g. Editorial botanical cover illustration for autumn issue"
                  value={formData.projectTitle}
                  onChange={(e) => updateField("projectTitle", e.target.value)}
                  onBlur={() => markTouched("projectTitle")}
                  className={`w-full h-11 rounded-xl border px-3.5 text-[14px] text-[#282B2A] transition-all bg-[#F6F3EB]/85 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                    errors.projectTitle
                      ? "border-[#ae361c] focus:ring-[#ae361c]/30"
                      : "border-[#203B35]/20 focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                  }`}
                />
                {errors.projectTitle && (
                  <p className="text-[11.5px] text-[#ae361c]">{errors.projectTitle}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="project-brief"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
                  >
                    Creative Brief &amp; Objectives <span className="text-[#ae361c]">*</span>
                  </label>
                  <span
                    className={`font-mono text-[10.5px] ${
                      formData.projectBrief.trim().length >= 20
                        ? "text-[#4E9F76]"
                        : "text-[#5D635F]"
                    }`}
                  >
                    {formData.projectBrief.trim().length} / 20 min chars
                  </span>
                </div>
                <textarea
                  id="project-brief"
                  rows={4}
                  placeholder={`Describe your vision, key goals, aesthetic inspiration, and expectations for ${providerName}...`}
                  value={formData.projectBrief}
                  onChange={(e) => updateField("projectBrief", e.target.value)}
                  onBlur={() => markTouched("projectBrief")}
                  className={`w-full rounded-xl border p-3.5 text-[14px] leading-relaxed text-[#282B2A] transition-all bg-[#F6F3EB]/85 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                    errors.projectBrief
                      ? "border-[#ae361c] focus:ring-[#ae361c]/30"
                      : "border-[#203B35]/20 focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                  }`}
                />
                {errors.projectBrief && (
                  <p className="text-[11.5px] text-[#ae361c]">{errors.projectBrief}</p>
                )}
              </div>

              {/* Deliverables Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]">
                    Included Deliverables Needed
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllDeliverables}
                    className="text-[11.5px] text-[#203B35] underline hover:text-[#162A26]"
                  >
                    {formData.selectedDeliverables.length === service.deliverables.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="space-y-2 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB] p-3.5">
                  {service.deliverables.map((item) => {
                    const checked = formData.selectedDeliverables.includes(item);
                    return (
                      <label
                        key={item}
                        className="flex items-start gap-2.5 cursor-pointer text-[13px] text-[#282B2A] select-none hover:text-[#203B35]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDeliverable(item)}
                          className="mt-0.5 h-4 w-4 rounded border-[#203B35]/30 text-[#203B35] focus:ring-[#203B35]"
                        />
                        <span className={checked ? "font-medium" : "text-[#5D635F]"}>
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.selectedDeliverables && (
                  <p className="text-[11.5px] text-[#ae361c]">
                    {errors.selectedDeliverables}
                  </p>
                )}
              </div>

              {/* Custom Deliverable Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="custom-deliverables"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D635F]"
                >
                  Custom Deliverable Requests / File Specifications (Optional)
                </label>
                <input
                  id="custom-deliverables"
                  type="text"
                  placeholder="e.g. Need high-res vector source files (.ai / .svg) in addition to raster selects."
                  value={formData.customDeliverableNotes}
                  onChange={(e) =>
                    updateField("customDeliverableNotes", e.target.value)
                  }
                  className="w-full h-11 rounded-xl border border-[#203B35]/20 bg-[#F6F3EB]/85 px-3.5 text-[14px] text-[#282B2A] transition-all focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/40"
                />
              </div>

              {/* Reference Links & Target Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reference-url"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D635F]"
                  >
                    Moodboard or Reference URL (Optional)
                  </label>
                  <input
                    id="reference-url"
                    type="url"
                    placeholder="https://figma.com/... or https://are.na/..."
                    value={formData.referenceUrl}
                    onChange={(e) => updateField("referenceUrl", e.target.value)}
                    className={`w-full h-11 rounded-xl border bg-[#F6F3EB]/85 px-3.5 text-[14px] text-[#282B2A] transition-all focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                      errors.referenceUrl
                        ? "border-[#ae361c] focus:ring-[#ae361c]/30"
                        : "border-[#203B35]/20 focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                    }`}
                  />
                  {errors.referenceUrl && (
                    <p className="text-[11.5px] text-[#ae361c]">{errors.referenceUrl}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="target-deadline"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D635F]"
                  >
                    Target Handover Date (Optional)
                  </label>
                  <input
                    id="target-deadline"
                    type="date"
                    min={formData.preferredDate || minDateString}
                    value={formData.targetDeadline}
                    onChange={(e) => updateField("targetDeadline", e.target.value)}
                    className={`w-full h-11 rounded-xl border bg-[#F6F3EB]/85 px-3.5 text-[14px] text-[#282B2A] transition-all focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                      errors.targetDeadline
                        ? "border-[#ae361c] focus:ring-[#ae361c]/30"
                        : "border-[#203B35]/20 focus:border-[#203B35] focus:ring-[#9DB5A5]/40"
                    }`}
                  />
                  {errors.targetDeadline && (
                    <p className="text-[11.5px] text-[#ae361c]">{errors.targetDeadline}</p>
                  )}
                </div>
              </div>

              {/* Additional notes / constraints */}
              <div className="space-y-1.5">
                <label
                  htmlFor="additional-notes"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D635F]"
                >
                  Special Constraints or Notes (Optional)
                </label>
                <input
                  id="additional-notes"
                  type="text"
                  placeholder="e.g. Confidentiality or specific software requirements..."
                  value={formData.additionalNotes}
                  onChange={(e) => updateField("additionalNotes", e.target.value)}
                  className="w-full h-11 rounded-xl border border-[#203B35]/20 bg-[#F6F3EB]/85 px-3.5 text-[14px] text-[#282B2A] transition-all focus:bg-[#FAF8F3] focus:border-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/40"
                />
              </div>
            </div>
          </form>
        )}

        {/* ====================================================================
         * STEP 3: REVIEW & OPERATIONAL TERMS
         * ================================================================== */}
        {step === "review" && (
          <form
            id="booking-review-form"
            onSubmit={handleSubmitBooking}
            noValidate
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="border-b border-[#203B35]/10 pb-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
                Final Step
              </span>
              <h3 className="font-serif text-2xl text-[#203B35]">
                Review Booking Request
              </h3>
              <p className="text-[13px] text-[#5D635F] mt-0.5">
                Please verify your details and review CreativeSpace's booking
                rules before submitting your request.
              </p>
            </div>

            {/* Service & Pricing Card */}
            <div className="rounded-2xl border border-[#203B35]/12 bg-[#F6F3EB] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5D635F]">
                    Service &amp; Creator
                  </span>
                  <h4 className="font-serif text-xl text-[#203B35]">
                    {service.title}
                  </h4>
                  <p className="text-[12.5px] text-[#5D635F]">
                    Offered by {providerName} (@{providerUsername})
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5D635F]">
                    {service.pricingModel}
                  </span>
                  <p className="font-serif text-xl font-normal text-[#203B35]">
                    {priceDisplay}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12.5px]">
                <div>
                  <span className="block font-mono text-[10px] uppercase text-[#5D635F]">
                    Format
                  </span>
                  <span className="font-medium text-[#203B35]">
                    {service.sessionFormat}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase text-[#5D635F]">
                    Revisions
                  </span>
                  <span className="font-medium text-[#203B35]">
                    {service.revisionsIncluded}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase text-[#5D635F]">
                    Est. Duration
                  </span>
                  <span className="font-medium text-[#203B35]">
                    {service.estimatedDuration}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Summary Card */}
            <div className="rounded-2xl border border-[#203B35]/12 bg-[#F6F3EB] p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#5D635F]">
                  Requested Date &amp; Time
                </span>
                <button
                  type="button"
                  onClick={() => setStep("schedule")}
                  className="text-[12px] font-medium text-[#203B35] underline hover:text-[#162A26]"
                >
                  Edit Schedule
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div>
                  <p className="font-serif text-[1.25rem] text-[#203B35]">
                    {formatDisplayDate(formData.preferredDate)}
                  </p>
                  <p className="text-[13.5px] font-medium text-[#203B35]">
                    {selectedSlot.title} · {selectedSlot.timeRange}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex rounded-full bg-[#FAF8F3] border border-[#203B35]/10 px-2.5 py-1 font-mono text-[10.5px] text-[#5D635F]">
                    {formData.timezone}
                  </span>
                </div>
              </div>
            </div>

            {/* Client & Contact Card */}
            <div className="rounded-2xl border border-[#203B35]/12 bg-[#F6F3EB] p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#5D635F]">
                  Client Information
                </span>
                <button
                  type="button"
                  onClick={() => setStep("requirements")}
                  className="text-[12px] font-medium text-[#203B35] underline hover:text-[#162A26]"
                >
                  Edit Contact
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[13.5px]">
                <div>
                  <span className="block text-[11px] font-mono uppercase text-[#5D635F]">
                    Client Name
                  </span>
                  <span className="font-medium text-[#203B35]">
                    {formData.clientName}
                  </span>
                  {formData.clientOrganization && (
                    <span className="block text-[12px] text-[#5D635F]">
                      {formData.clientOrganization}
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-[11px] font-mono uppercase text-[#5D635F]">
                    Contact Email &amp; Handle
                  </span>
                  <span className="font-medium text-[#203B35]">
                    {formData.clientEmail}
                  </span>
                  {formData.clientHandle && (
                    <span className="block text-[12px] text-[#5D635F]">
                      {formData.clientHandle}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Project Scope Card */}
            <div className="rounded-2xl border border-[#203B35]/12 bg-[#F6F3EB] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#5D635F]">
                  Project Requirements &amp; Scope
                </span>
                <button
                  type="button"
                  onClick={() => setStep("requirements")}
                  className="text-[12px] font-medium text-[#203B35] underline hover:text-[#162A26]"
                >
                  Edit Brief
                </button>
              </div>

              <div>
                <p className="font-serif text-[1.15rem] text-[#203B35]">
                  {formData.projectTitle}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#282B2A]/90 whitespace-pre-wrap">
                  {formData.projectBrief}
                </p>
              </div>

              {formData.selectedDeliverables.length > 0 && (
                <div className="pt-2 border-t border-[#203B35]/10">
                  <span className="block font-mono text-[10px] uppercase text-[#5D635F] mb-1.5">
                    Selected Deliverables ({formData.selectedDeliverables.length})
                  </span>
                  <ul className="space-y-1">
                    {formData.selectedDeliverables.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-[12.5px] text-[#203B35]"
                      >
                        <Check className="h-3 w-3 text-[#4E9F76] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.customDeliverableNotes && (
                <div className="pt-2 border-t border-[#203B35]/10 text-[12.5px]">
                  <span className="block font-mono text-[10px] uppercase text-[#5D635F]">
                    Custom Deliverable Notes
                  </span>
                  <p className="text-[#203B35] mt-0.5">
                    {formData.customDeliverableNotes}
                  </p>
                </div>
              )}

              {(formData.referenceUrl ||
                formData.targetDeadline ||
                formData.additionalNotes) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#203B35]/10 text-[12.5px]">
                  {formData.referenceUrl && (
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-[#5D635F]">
                        Reference URL
                      </span>
                      <a
                        href={formData.referenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#203B35] underline inline-flex items-center gap-1 hover:text-[#162A26] truncate max-w-full"
                      >
                        <span className="truncate">{formData.referenceUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  )}
                  {formData.targetDeadline && (
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-[#5D635F]">
                        Target Handover Date
                      </span>
                      <span className="text-[#203B35] font-medium">
                        {formatDisplayDate(formData.targetDeadline)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Operational Booking Rules & Platform Policy Acknowledgement */}
            <div className="rounded-2xl border border-[#203B35]/15 bg-[#EFECE2]/70 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-[#203B35]">
                <ShieldCheck className="h-4 w-4 text-[#4E9F76]" />
                <h4 className="font-serif text-[1.1rem]">
                  CreativeSpace Operational Booking Principles
                </h4>
              </div>

              <div className="space-y-2 text-[12.5px] text-[#282B2A]/85 leading-relaxed">
                <p>
                  • <strong>Direct External Settlement:</strong> CreativeSpace
                  facilitates pure operational scheduling with zero platform
                  commissions. Commercial payments are arranged directly with
                  the creator outside the platform.
                </p>
                <p>
                  • <strong>Multi-Client Slot Competition:</strong> Multiple
                  clients may submit booking requests for the same time slot. A
                  creator selecting one request does not immediately reject or
                  soft-hold other pending requests; competing requests remain
                  active until manual confirmation.
                </p>
                <p>
                  • <strong>Alternative-Time Negotiation:</strong> If scheduling
                  adjustments are needed, alternative dates and times can be
                  proposed separately with a 24-hour response window.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-[#203B35]/15 select-none">
                <input
                  type="checkbox"
                  checked={formData.acceptedTerms}
                  onChange={(e) => updateField("acceptedTerms", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#203B35]/30 text-[#203B35] focus:ring-[#203B35]"
                />
                <span className="text-[13px] text-[#203B35] leading-snug">
                  I understand the operational booking workflow and agree to
                  direct external payment settlement with {providerName}.
                </span>
              </label>

              {errors.acceptedTerms && (
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#ae361c]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.acceptedTerms}</span>
                </p>
              )}
            </div>
          </form>
        )}

        {/* ====================================================================
         * STEP 4: SUBMISSION CONFIRMATION
         * ================================================================== */}
        {step === "confirmed" && (
          <div className="space-y-6 max-w-xl mx-auto py-2 text-center">
            {/* Visual Header */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB] shadow-md ring-8 ring-[#9DB5A5]/25">
              <Sparkles className="h-6 w-6 text-[#C8BDE0]" />
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#4E9F76] font-medium">
                Request Dispatched
              </span>
              <h3 className="font-serif text-3xl text-[#203B35]">
                Booking Request Submitted
              </h3>
              <p className="text-[14px] text-[#282B2A]/85 max-w-md mx-auto leading-relaxed">
                Your request has been routed to{" "}
                <strong className="font-medium text-[#203B35]">
                  {providerName}
                </strong>
                &apos;s inquiries queue as a pending request.
              </p>
            </div>

            {/* Reference Badge & Status */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-4 py-1.5">
                <span className="font-mono text-[11px] text-[#5D635F]">
                  Reference:
                </span>
                <span className="font-mono text-[12.5px] font-semibold text-[#203B35]">
                  {confirmationRef}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  aria-label="Copy booking reference"
                  className="text-[#5D635F] hover:text-[#203B35] p-0.5"
                >
                  {copiedRef ? (
                    <Check className="h-3.5 w-3.5 text-[#4E9F76]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/50 bg-[#E5A93C]/20 px-3 py-1 font-mono text-[11px] font-semibold text-[#8E5A1C]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
                <span>Pending Creator Review</span>
              </span>
            </div>

            {/* Summary Box */}
            <div className="rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] p-4 sm:p-5 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-2.5 text-[12.5px]">
                <span className="font-mono text-[10px] uppercase text-[#5D635F]">
                  Requested Service
                </span>
                <span className="font-medium text-[#203B35]">
                  {service.title}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-2.5 text-[12.5px]">
                <span className="font-mono text-[10px] uppercase text-[#5D635F]">
                  Requested Date &amp; Time
                </span>
                <span className="font-medium text-[#203B35]">
                  {formatDisplayDate(formData.preferredDate)} ({selectedSlot.title})
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-2.5 text-[12.5px]">
                <span className="font-mono text-[10px] uppercase text-[#5D635F]">
                  Base Pricing Rate
                </span>
                <span className="font-serif text-[1.1rem] text-[#203B35]">
                  {priceDisplay}
                </span>
              </div>

              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-mono text-[10px] uppercase text-[#5D635F]">
                  Client Contact
                </span>
                <span className="text-[#203B35]">
                  {formData.clientName} ({formData.clientEmail})
                </span>
              </div>
            </div>

            {/* What Happens Next Roadmap */}
            <div className="rounded-2xl border border-[#9DB5A5]/40 bg-[#FAF8F3] p-4 sm:p-5 text-left space-y-3">
              <h4 className="font-serif text-[1.1rem] text-[#203B35] flex items-center gap-2">
                <CelestialSpark className="h-3.5 w-3.5 text-[#4E9F76]" />
                <span>What Happens Next</span>
              </h4>

              <ol className="space-y-2.5 text-[12.5px] text-[#282B2A]/85">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFECE2] font-mono text-[10.5px] font-semibold text-[#203B35]">
                    1
                  </span>
                  <span>
                    <strong>Creator Review:</strong> {providerName} will review
                    your creative brief and requested date slot.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFECE2] font-mono text-[10.5px] font-semibold text-[#203B35]">
                    2
                  </span>
                  <span>
                    <strong>Multi-Client Selection:</strong> If other clients
                    requested this slot, the creator evaluates all briefs. A
                    creator selecting one client does not reject others.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFECE2] font-mono text-[10.5px] font-semibold text-[#203B35]">
                    3
                  </span>
                  <span>
                    <strong>Alternative Proposals:</strong> If the creator
                    proposes an alternative time, you have 24 hours to accept,
                    decline, or submit a counter-proposal.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFECE2] font-mono text-[10.5px] font-semibold text-[#203B35]">
                    4
                  </span>
                  <span>
                    <strong>Direct Payment:</strong> All commercial payments are
                    settled directly between you and the creator outside
                    CreativeSpace before final confirmation.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFECE2] font-mono text-[10.5px] font-semibold text-[#203B35]">
                    5
                  </span>
                  <span>
                    <strong>Scoped Messaging:</strong> Once confirmed,
                    context-bound messaging will open for your session.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Contextual Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#203B35]/10 px-5 sm:px-7 py-4 bg-[#FAF8F3]">
        {step === "schedule" && (
          <>
            <button
              type="button"
              onClick={onViewServiceDetails}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>View Service Details</span>
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="booking-schedule-form"
                className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                <span>Continue to Project Brief</span>
                <ArrowRight className="h-4 w-4 text-[#9DB5A5]" />
              </button>
            </div>
          </>
        )}

        {step === "requirements" && (
          <>
            <button
              type="button"
              onClick={() => setStep("schedule")}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Schedule</span>
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="booking-requirements-form"
                className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                <span>Continue to Review</span>
                <ArrowRight className="h-4 w-4 text-[#9DB5A5]" />
              </button>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <button
              type="button"
              onClick={() => setStep("requirements")}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Requirements</span>
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="booking-review-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-[#F6F3EB] border-t-transparent animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#9DB5A5]" />
                    <span>Submit Booking Request</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === "confirmed" && (
          <>
            <button
              type="button"
              onClick={onViewServiceDetails}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>View Service Details</span>
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={handleResetForNewBooking}
                className="rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-4 py-2 text-[13px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
              >
                Book Another Service
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="rounded-full bg-[#203B35] px-6 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
