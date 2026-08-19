-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PAID_IN_FULL' AFTER 'CONFIRMED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "siteContactName" TEXT;
ALTER TABLE "Booking" ADD COLUMN "siteContactPhone" TEXT;
ALTER TABLE "Booking" ADD COLUMN "loadInNotes" TEXT;
ALTER TABLE "Booking" ADD COLUMN "depositOverridden" BOOLEAN NOT NULL DEFAULT false;
