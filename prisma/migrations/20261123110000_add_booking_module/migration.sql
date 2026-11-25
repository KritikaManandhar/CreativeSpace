-- CreativeSpace 2.0: Booking Module Migration
-- Migration: 20261123110000_add_booking_module
-- Author: Senior Backend Architect & PostgreSQL Database Engineer

-- ==============================================================================
-- Stage 1: PostgreSQL Extensions & Search Path
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;
SET search_path TO public, extensions;

-- ==============================================================================
-- Stage 2: Create Booking Enums
-- ==============================================================================
CREATE TYPE "BookingStatus" AS ENUM (
  'PendingReview',
  'AlternativeProposed',
  'Confirmed',
  'DeclinedByCreator',
  'DeclinedAlternativeByClient',
  'Expired_RequestUnanswered',
  'Expired_AlternativeUnanswered',
  'CancelledByClient',
  'CancelledByCreator',
  'Cancelled_MutualAgreement',
  'Completed'
);

CREATE TYPE "BookingProposalStatus" AS ENUM (
  'None',
  'Proposed',
  'Accepted',
  'Declined',
  'Expired',
  'Superseded'
);

CREATE TYPE "SlotReservationType" AS ENUM (
  'PrimaryRequest',
  'ConfirmedSlot',
  'TentativeAlternative'
);

CREATE TYPE "SlotReservationStatus" AS ENUM (
  'Active',
  'Released'
);

CREATE TYPE "OutboxStatus" AS ENUM (
  'Pending',
  'Processing',
  'Processed',
  'Failed'
);

CREATE TYPE "BookingActor" AS ENUM (
  'Client',
  'Creator',
  'System',
  'Admin',
  'Mutual'
);

CREATE TYPE "DayOfWeek" AS ENUM (
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
);

-- ==============================================================================
-- Stage 3: Extend NotificationType Enum
-- ==============================================================================
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingRequested';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingConfirmed';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingRejected';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingAlternativeProposed';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingAlternativeUpdated';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingAlternativeAccepted';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingAlternativeDeclined';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingAlternativeExpired';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingCancelledByClient';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingCancelledByCreator';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingCancelledMutual';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BookingExpired';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MutualCancellationRequested';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MutualCancellationDeclined';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MutualCancellationExpired';

-- ==============================================================================
-- Stage 4: Add Columns to Existing Tables (users, notifications)
-- ==============================================================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "outboxEventId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "relatedBookingId" TEXT;

-- ==============================================================================
-- Stage 5: Create Booking Module Tables
-- ==============================================================================

-- 1. creator_services
CREATE TABLE "creator_services" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceInMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "minNoticeHours" INTEGER NOT NULL DEFAULT 24,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "creator_services_pkey" PRIMARY KEY ("id")
);

-- 2. creator_availability_templates
CREATE TABLE "creator_availability_templates" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "creator_availability_templates_pkey" PRIMARY KEY ("id")
);

-- 3. creator_date_overrides
CREATE TABLE "creator_date_overrides" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "date" DATE NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "creator_date_overrides_pkey" PRIMARY KEY ("id")
);

-- 4. creator_date_override_windows
CREATE TABLE "creator_date_override_windows" (
    "id" TEXT NOT NULL,
    "overrideId" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "creator_date_override_windows_pkey" PRIMARY KEY ("id")
);

-- 5. bookings
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agreedPriceInMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "durationMinutes" INTEGER NOT NULL,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'PendingReview',
    "proposalStatus" "BookingProposalStatus" NOT NULL DEFAULT 'None',
    "requestedStartsAt" TIMESTAMPTZ(3) NOT NULL,
    "requestedEndsAt" TIMESTAMPTZ(3) NOT NULL,
    "confirmedStartsAt" TIMESTAMPTZ(3),
    "confirmedEndsAt" TIMESTAMPTZ(3),
    "clientTimezone" TEXT NOT NULL,
    "creatorTimezone" TEXT NOT NULL,
    "alternativeStartsAt" TIMESTAMPTZ(3),
    "alternativeEndsAt" TIMESTAMPTZ(3),
    "alternativeProposalExpiresAt" TIMESTAMPTZ(3),
    "proposalCounter" INTEGER NOT NULL DEFAULT 0,
    "requestExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "cancellationReason" TEXT,
    "cancelledByActor" "BookingActor",
    "cancelledAt" TIMESTAMPTZ(3),
    "mutualCancellationRequestedBy" TEXT,
    "mutualCancellationRequestedAt" TIMESTAMPTZ(3),
    "mutualCancellationExpiresAt" TIMESTAMPTZ(3),
    "clientNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- 6. booking_slot_reservations
CREATE TABLE "booking_slot_reservations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "slotType" "SlotReservationType" NOT NULL,
    "status" "SlotReservationStatus" NOT NULL DEFAULT 'Active',
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "booking_slot_reservations_pkey" PRIMARY KEY ("id")
);

-- 7. booking_history
CREATE TABLE "booking_history" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "BookingActor" NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_history_pkey" PRIMARY KEY ("id")
);

-- 8. booking_outbox
CREATE TABLE "booking_outbox" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'Pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),
    "lastError" TEXT,
    "lockedAt" TIMESTAMPTZ(3),
    "lockedBy" TEXT,
    "leaseToken" TEXT,
    "leaseGeneration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_outbox_pkey" PRIMARY KEY ("id")
);

-- ==============================================================================
-- Stage 6: Indexes and Standard Constraints
-- ==============================================================================

-- Unique composite keys
CREATE UNIQUE INDEX "creator_services_id_creatorId_key" ON "creator_services"("id", "creatorId");
CREATE UNIQUE INDEX "bookings_id_creatorId_key" ON "bookings"("id", "creatorId");
CREATE UNIQUE INDEX "booking_outbox_idempotencyKey_key" ON "booking_outbox"("idempotencyKey");
CREATE UNIQUE INDEX "notifications_outboxEventId_userId_key" ON "notifications"("outboxEventId", "userId");

-- Service indexes
CREATE INDEX "creator_services_creatorId_isActive_idx" ON "creator_services"("creatorId", "isActive");

-- Template & Override indexes
CREATE INDEX "creator_availability_templates_creatorId_dayOfWeek_idx" ON "creator_availability_templates"("creatorId", "dayOfWeek");
CREATE INDEX "creator_availability_templates_serviceId_creatorId_dayOfWeek_idx" ON "creator_availability_templates"("serviceId", "creatorId", "dayOfWeek");
CREATE INDEX "creator_date_overrides_creatorId_date_idx" ON "creator_date_overrides"("creatorId", "date");
CREATE INDEX "creator_date_overrides_serviceId_creatorId_date_idx" ON "creator_date_overrides"("serviceId", "creatorId", "date");
CREATE INDEX "creator_date_override_windows_overrideId_idx" ON "creator_date_override_windows"("overrideId");

-- Booking indexes
CREATE INDEX "bookings_creatorId_status_requestedStartsAt_idx" ON "bookings"("creatorId", "status", "requestedStartsAt");
CREATE INDEX "bookings_clientId_status_requestedStartsAt_idx" ON "bookings"("clientId", "status", "requestedStartsAt");
CREATE INDEX "bookings_creatorId_status_confirmedStartsAt_idx" ON "bookings"("creatorId", "status", "confirmedStartsAt");
CREATE INDEX "bookings_serviceId_creatorId_status_idx" ON "bookings"("serviceId", "creatorId", "status");
CREATE INDEX "bookings_requestExpiresAt_idx" ON "bookings"("requestExpiresAt");
CREATE INDEX "bookings_alternativeProposalExpiresAt_idx" ON "bookings"("alternativeProposalExpiresAt");

-- Slot reservation indexes
CREATE INDEX "booking_slot_reservations_creatorId_status_startsAt_endsAt_idx" ON "booking_slot_reservations"("creatorId", "status", "startsAt", "endsAt");
CREATE INDEX "booking_slot_reservations_bookingId_status_idx" ON "booking_slot_reservations"("bookingId", "status");

-- History & Outbox indexes
CREATE INDEX "booking_history_bookingId_createdAt_idx" ON "booking_history"("bookingId", "createdAt");
CREATE INDEX "booking_outbox_status_availableAt_idx" ON "booking_outbox"("status", "availableAt");
CREATE INDEX "booking_outbox_bookingId_idx" ON "booking_outbox"("bookingId");

-- Notification indexes
CREATE INDEX "notifications_relatedBookingId_idx" ON "notifications"("relatedBookingId");
CREATE INDEX "notifications_outboxEventId_idx" ON "notifications"("outboxEventId");

-- Foreign Keys
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_relatedBookingId_fkey" FOREIGN KEY ("relatedBookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_outboxEventId_fkey" FOREIGN KEY ("outboxEventId") REFERENCES "booking_outbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "creator_services" ADD CONSTRAINT "creator_services_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_availability_templates" ADD CONSTRAINT "creator_availability_templates_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creator_availability_templates" ADD CONSTRAINT "creator_availability_templates_serviceId_creatorId_fkey" FOREIGN KEY ("serviceId", "creatorId") REFERENCES "creator_services"("id", "creatorId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_date_overrides" ADD CONSTRAINT "creator_date_overrides_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creator_date_overrides" ADD CONSTRAINT "creator_date_overrides_serviceId_creatorId_fkey" FOREIGN KEY ("serviceId", "creatorId") REFERENCES "creator_services"("id", "creatorId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_date_override_windows" ADD CONSTRAINT "creator_date_override_windows_overrideId_fkey" FOREIGN KEY ("overrideId") REFERENCES "creator_date_overrides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_creatorId_fkey" FOREIGN KEY ("serviceId", "creatorId") REFERENCES "creator_services"("id", "creatorId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "booking_slot_reservations" ADD CONSTRAINT "booking_slot_reservations_bookingId_creatorId_fkey" FOREIGN KEY ("bookingId", "creatorId") REFERENCES "bookings"("id", "creatorId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_slot_reservations" ADD CONSTRAINT "booking_slot_reservations_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "booking_history" ADD CONSTRAINT "booking_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_history" ADD CONSTRAINT "booking_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_outbox" ADD CONSTRAINT "booking_outbox_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ==============================================================================
-- Stage 7: Native PostgreSQL Functions & Advisory Locks
-- ==============================================================================

-- 1. Advisory lock 64-bit BigInt key generation
CREATE OR REPLACE FUNCTION fn_creator_advisory_lock_key(p_creator_id TEXT)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT hashtextextended('creator:' || p_creator_id, 0);
$$;

-- 2. Immutable bidirectional buffered reservation range for GiST exclusion
CREATE OR REPLACE FUNCTION fn_buffered_reservation_range(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_buffer_minutes integer
) RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
COST 1
AS $$
  SELECT tstzrange(
    to_timestamp(extract(epoch from p_starts_at) - (p_buffer_minutes * 60)),
    to_timestamp(extract(epoch from p_ends_at) + (p_buffer_minutes * 60)),
    '[)'
  );
$$;

-- ==============================================================================
-- Stage 8: Native PostgreSQL CHECK Constraints
-- ==============================================================================

-- 1. Service configuration integrity
ALTER TABLE "creator_services"
ADD CONSTRAINT "chk_creator_services_config"
CHECK (
  "durationMinutes" >= 5 AND "durationMinutes" <= 1440 AND
  "priceInMinorUnits" >= 0 AND
  "bufferMinutes" >= 0 AND "bufferMinutes" <= 240 AND
  "minNoticeHours" >= 0 AND "minNoticeHours" <= 720 AND
  "maxAdvanceDays" >= 1 AND "maxAdvanceDays" <= 365
);

-- 2. Availability minute-range integrity
ALTER TABLE "creator_availability_templates"
ADD CONSTRAINT "chk_cat_valid_minutes"
CHECK ("startMinute" >= 0 AND "startMinute" < 1440 AND "endMinute" > 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");

ALTER TABLE "creator_date_override_windows"
ADD CONSTRAINT "chk_cdow_valid_minutes"
CHECK ("startMinute" >= 0 AND "startMinute" < 1440 AND "endMinute" > 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");

-- 3. Self-booking prevention
ALTER TABLE "bookings"
ADD CONSTRAINT "chk_bookings_no_self_booking"
CHECK ("clientId" <> "creatorId");

-- 4. Canonical booking timestamps & lifecycle invariants
ALTER TABLE "bookings"
ADD CONSTRAINT "chk_bookings_canonical_timestamps"
CHECK (
  "requestedStartsAt" < "requestedEndsAt" AND
  "durationMinutes" > 0 AND "durationMinutes" <= 1440 AND
  "bufferMinutes" >= 0 AND "bufferMinutes" <= 240 AND
  "agreedPriceInMinorUnits" >= 0 AND
  "version" >= 1 AND
  "proposalCounter" >= 0 AND
  (
    ("confirmedStartsAt" IS NULL AND "confirmedEndsAt" IS NULL) OR
    ("confirmedStartsAt" IS NOT NULL AND "confirmedEndsAt" IS NOT NULL AND "confirmedStartsAt" < "confirmedEndsAt")
  ) AND
  (
    ("alternativeStartsAt" IS NULL AND "alternativeEndsAt" IS NULL) OR
    ("alternativeStartsAt" IS NOT NULL AND "alternativeEndsAt" IS NOT NULL AND "alternativeStartsAt" < "alternativeEndsAt")
  )
);

-- 5. Reservation timestamp integrity
ALTER TABLE "booking_slot_reservations"
ADD CONSTRAINT "chk_bsr_timestamps"
CHECK ("startsAt" < "endsAt" AND "bufferMinutes" >= 0 AND "bufferMinutes" <= 240);

-- ==============================================================================
-- Stage 9: Date Override Uniqueness Partial Indexes
-- ==============================================================================
CREATE UNIQUE INDEX "idx_unique_global_date_override"
ON "creator_date_overrides" ("creatorId", "date")
WHERE ("serviceId" IS NULL);

CREATE UNIQUE INDEX "idx_unique_service_date_override"
ON "creator_date_overrides" ("creatorId", "serviceId", "date")
WHERE ("serviceId" IS NOT NULL);

-- ==============================================================================
-- Stage 10: Availability Overlap Exclusion Constraints (int4range)
-- ==============================================================================

-- 1. Global weekly templates
ALTER TABLE "creator_availability_templates"
ADD CONSTRAINT "no_overlapping_global_weekly_windows"
EXCLUDE USING gist (
  "creatorId" WITH =,
  "dayOfWeek" WITH =,
  int4range("startMinute", "endMinute", '[)') WITH &&
)
WHERE ("serviceId" IS NULL);

-- 2. Service-specific weekly templates
ALTER TABLE "creator_availability_templates"
ADD CONSTRAINT "no_overlapping_service_weekly_windows"
EXCLUDE USING gist (
  "creatorId" WITH =,
  "serviceId" WITH =,
  "dayOfWeek" WITH =,
  int4range("startMinute", "endMinute", '[)') WITH &&
)
WHERE ("serviceId" IS NOT NULL);

-- 3. Date override windows within same override
ALTER TABLE "creator_date_override_windows"
ADD CONSTRAINT "no_overlapping_date_override_windows"
EXCLUDE USING gist (
  "overrideId" WITH =,
  int4range("startMinute", "endMinute", '[)') WITH &&
);

-- ==============================================================================
-- Stage 11: Active Reservation Exclusion & Partial Unique Indexes
-- ==============================================================================

-- Partial unique indexes enforcing at most 1 active slot per type per booking
CREATE UNIQUE INDEX "idx_unique_active_primary_request"
ON "booking_slot_reservations" ("bookingId")
WHERE ("status" = 'Active' AND "slotType" = 'PrimaryRequest');

CREATE UNIQUE INDEX "idx_unique_active_tentative_alt"
ON "booking_slot_reservations" ("bookingId")
WHERE ("status" = 'Active' AND "slotType" = 'TentativeAlternative');

CREATE UNIQUE INDEX "idx_unique_active_confirmed_slot"
ON "booking_slot_reservations" ("bookingId")
WHERE ("status" = 'Active' AND "slotType" = 'ConfirmedSlot');

-- GiST exclusion constraint on active creator reservations with bidirectional buffer
ALTER TABLE "booking_slot_reservations"
ADD CONSTRAINT "no_overlapping_active_creator_reservations"
EXCLUDE USING gist (
  "creatorId" WITH =,
  fn_buffered_reservation_range("startsAt", "endsAt", "bufferMinutes") WITH &&
)
WHERE ("status" = 'Active');

-- ==============================================================================
-- Stage 12: Immutability Triggers
-- ==============================================================================

-- 1. Reservation bookingId immutability
CREATE OR REPLACE FUNCTION fn_prevent_reservation_booking_reassignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."bookingId" <> OLD."bookingId" THEN
    RAISE EXCEPTION 'Cannot reassign booking_slot_reservations.bookingId (immutable)'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_reservation_booking_reassignment
BEFORE UPDATE OF "bookingId" ON "booking_slot_reservations"
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_reservation_booking_reassignment();

-- 2. Immutable append-only booking history
CREATE OR REPLACE FUNCTION fn_prevent_booking_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'booking_history is strictly append-only; % operations are forbidden', TG_OP
    USING ERRCODE = 'feature_not_supported';
END;
$$;

CREATE TRIGGER trg_prevent_booking_history_update
BEFORE UPDATE ON "booking_history"
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_booking_history_mutation();

CREATE TRIGGER trg_prevent_booking_history_delete
BEFORE DELETE ON "booking_history"
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_booking_history_mutation();

-- ==============================================================================
-- Stage 13: Deferred Cardinality & Synchronization Trigger
-- ==============================================================================

CREATE OR REPLACE FUNCTION fn_assert_booking_cardinality()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_id TEXT;
  v_booking RECORD;
  v_primary_count INT;
  v_tentative_count INT;
  v_confirmed_count INT;
  v_res_primary RECORD;
  v_res_tentative RECORD;
  v_res_confirmed RECORD;
BEGIN
  IF TG_TABLE_NAME = 'bookings' THEN
    v_booking_id := NEW.id;
  ELSE
    IF TG_OP = 'DELETE' THEN
      v_booking_id := OLD."bookingId";
    ELSE
      v_booking_id := NEW."bookingId";
    END IF;
  END IF;

  SELECT * INTO v_booking FROM "bookings" WHERE id = v_booking_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Count active reservations
  SELECT count(*) INTO v_primary_count
  FROM "booking_slot_reservations"
  WHERE "bookingId" = v_booking_id AND status = 'Active' AND "slotType" = 'PrimaryRequest';

  SELECT count(*) INTO v_tentative_count
  FROM "booking_slot_reservations"
  WHERE "bookingId" = v_booking_id AND status = 'Active' AND "slotType" = 'TentativeAlternative';

  SELECT count(*) INTO v_confirmed_count
  FROM "booking_slot_reservations"
  WHERE "bookingId" = v_booking_id AND status = 'Active' AND "slotType" = 'ConfirmedSlot';

  CASE v_booking.status
    WHEN 'PendingReview' THEN
      IF v_primary_count <> 1 OR v_tentative_count <> 0 OR v_confirmed_count <> 0 THEN
        RAISE EXCEPTION 'Booking % in PendingReview must have exactly 1 active PrimaryRequest and 0 tentative/confirmed reservations (found % primary, % tentative, % confirmed)',
          v_booking_id, v_primary_count, v_tentative_count, v_confirmed_count
          USING ERRCODE = 'check_violation';
      END IF;
      -- Verify timestamp match
      SELECT "startsAt", "endsAt" INTO v_res_primary
      FROM "booking_slot_reservations"
      WHERE "bookingId" = v_booking_id AND status = 'Active' AND "slotType" = 'PrimaryRequest';
      IF v_res_primary."startsAt" <> v_booking."requestedStartsAt" OR v_res_primary."endsAt" <> v_booking."requestedEndsAt" THEN
        RAISE EXCEPTION 'Booking % PrimaryRequest reservation does not match requested appointment', v_booking_id
          USING ERRCODE = 'check_violation';
      END IF;

    WHEN 'AlternativeProposed' THEN
      IF v_primary_count <> 1 OR v_tentative_count <> 1 OR v_confirmed_count <> 0 THEN
        RAISE EXCEPTION 'Booking % in AlternativeProposed must have exactly 1 active PrimaryRequest, 1 active TentativeAlternative, and 0 confirmed (found % primary, % tentative, % confirmed)',
          v_booking_id, v_primary_count, v_tentative_count, v_confirmed_count
          USING ERRCODE = 'check_violation';
      END IF;
      -- Verify PrimaryRequest timestamp match
      SELECT "startsAt", "endsAt" INTO v_res_primary
      FROM "booking_slot_reservations"
      WHERE "bookingId" = v_booking_id AND status = 'Active' AND "slotType" = 'PrimaryRequest';
      IF v_res_primary."startsAt" <> v_booking."requestedStartsAt" OR v_res_primary."endsAt" <> v_booking."requestedEndsAt" THEN
        RAISE EXCEPTION 'Booking % PrimaryRequest reservation does not match requested appointment', v_booking_id
          USING ERRCODE = 'check_violation';
      END IF;
      -- Verify TentativeAlternative timestamp match
      SELECT "startsAt", "endsAt" INTO v_res_tentative
      FROM "booking_slot_reservations"
      WHERE "bookingId" = v_booking_id AND status = 'Active' AND "slotType" = 'TentativeAlternative';
      IF v_res_tentative."startsAt" <> v_booking."alternativeStartsAt" OR v_res_tentative."endsAt" <> v_booking."alternativeEndsAt" THEN
        RAISE EXCEPTION 'Booking % TentativeAlternative reservation does not match alternative appointment', v_booking_id
          USING ERRCODE = 'check_violation';
      END IF;

    WHEN 'Confirmed' THEN
      IF v_primary_count <> 0 OR v_tentative_count <> 0 OR v_confirmed_count <> 1 THEN
        RAISE EXCEPTION 'Booking % in Confirmed must have exactly 1 active ConfirmedSlot and 0 primary/tentative (found % primary, % tentative, % confirmed)',
          v_booking_id, v_primary_count, v_tentative_count, v_confirmed_count
          USING ERRCODE = 'check_violation';
      END IF;
      IF v_booking."confirmedStartsAt" IS NULL OR v_booking."confirmedEndsAt" IS NULL THEN
        RAISE EXCEPTION 'Booking % in Confirmed must have non-null confirmedStartsAt and confirmedEndsAt', v_booking_id
          USING ERRCODE = 'check_violation';
      END IF;
      -- Verify ConfirmedSlot timestamp match
      SELECT "startsAt", "endsAt" INTO v_res_confirmed
      FROM "booking_slot_reservations"
      WHERE "bookingId" = v_booking_id AND status = 'Active' AND "slotType" = 'ConfirmedSlot';
      IF v_res_confirmed."startsAt" <> v_booking."confirmedStartsAt" OR v_res_confirmed."endsAt" <> v_booking."confirmedEndsAt" THEN
        RAISE EXCEPTION 'Booking % ConfirmedSlot reservation does not match confirmed appointment', v_booking_id
          USING ERRCODE = 'check_violation';
      END IF;

    WHEN 'Completed' THEN
      IF v_primary_count <> 0 OR v_tentative_count <> 0 OR v_confirmed_count <> 0 THEN
        RAISE EXCEPTION 'Booking % in Completed must have 0 active reservations (found % primary, % tentative, % confirmed)',
          v_booking_id, v_primary_count, v_tentative_count, v_confirmed_count
          USING ERRCODE = 'check_violation';
      END IF;
      IF v_booking."confirmedStartsAt" IS NULL OR v_booking."confirmedEndsAt" IS NULL THEN
        RAISE EXCEPTION 'Booking % in Completed must retain non-null confirmedStartsAt and confirmedEndsAt', v_booking_id
          USING ERRCODE = 'check_violation';
      END IF;

    ELSE -- Terminal cancellation, decline, and expiration statuses
      IF v_primary_count <> 0 OR v_tentative_count <> 0 OR v_confirmed_count <> 0 THEN
        RAISE EXCEPTION 'Terminal booking % in status % must have 0 active reservations (found % primary, % tentative, % confirmed)',
          v_booking_id, v_booking.status, v_primary_count, v_tentative_count, v_confirmed_count
          USING ERRCODE = 'check_violation';
      END IF;
  END CASE;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_assert_booking_cardinality_bookings
AFTER INSERT OR UPDATE ON "bookings"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION fn_assert_booking_cardinality();

CREATE CONSTRAINT TRIGGER trg_assert_booking_cardinality_reservations
AFTER INSERT OR UPDATE OR DELETE ON "booking_slot_reservations"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION fn_assert_booking_cardinality();
