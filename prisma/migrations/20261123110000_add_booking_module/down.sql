-- CreativeSpace 2.0: Booking Module Reverse Migration (Rollback)
-- Migration: 20261123110000_add_booking_module (Down)
-- Author: Senior Backend Architect & PostgreSQL Database Engineer

-- ==============================================================================
-- Stage 1: Drop Triggers and Functions
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_assert_booking_cardinality_reservations ON "booking_slot_reservations";
DROP TRIGGER IF EXISTS trg_assert_booking_cardinality_bookings ON "bookings";
DROP FUNCTION IF EXISTS fn_assert_booking_cardinality();

DROP TRIGGER IF EXISTS trg_prevent_booking_history_delete ON "booking_history";
DROP TRIGGER IF EXISTS trg_prevent_booking_history_update ON "booking_history";
DROP FUNCTION IF EXISTS fn_prevent_booking_history_mutation();

DROP TRIGGER IF EXISTS trg_prevent_reservation_booking_reassignment ON "booking_slot_reservations";
DROP FUNCTION IF EXISTS fn_prevent_reservation_booking_reassignment();

DROP FUNCTION IF EXISTS fn_buffered_reservation_range(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS fn_creator_advisory_lock_key(TEXT);

-- ==============================================================================
-- Stage 2: Drop Tables in Reverse Dependency Order
-- ==============================================================================
DROP TABLE IF EXISTS "booking_outbox" CASCADE;
DROP TABLE IF EXISTS "booking_history" CASCADE;
DROP TABLE IF EXISTS "booking_slot_reservations" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "creator_date_override_windows" CASCADE;
DROP TABLE IF EXISTS "creator_date_overrides" CASCADE;
DROP TABLE IF EXISTS "creator_availability_templates" CASCADE;
DROP TABLE IF EXISTS "creator_services" CASCADE;

-- ==============================================================================
-- Stage 3: Remove Columns and Foreign Keys from Existing Tables
-- ==============================================================================
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_relatedBookingId_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_outboxEventId_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_outboxEventId_userId_key";
DROP INDEX IF EXISTS "notifications_relatedBookingId_idx";
DROP INDEX IF EXISTS "notifications_outboxEventId_idx";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "relatedBookingId";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "outboxEventId";

ALTER TABLE "users" DROP COLUMN IF EXISTS "timezone";

-- ==============================================================================
-- Stage 4: Drop Booking Enums
-- ==============================================================================
DROP TYPE IF EXISTS "DayOfWeek";
DROP TYPE IF EXISTS "BookingActor";
DROP TYPE IF EXISTS "OutboxStatus";
DROP TYPE IF EXISTS "SlotReservationStatus";
DROP TYPE IF EXISTS "SlotReservationType";
DROP TYPE IF EXISTS "BookingProposalStatus";
DROP TYPE IF EXISTS "BookingStatus";

-- Note: Enum values added to "NotificationType" cannot be safely dropped in PostgreSQL 
-- without recreating the enum type, but they are completely benign if left dormant.
