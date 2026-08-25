-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('DELIVERY', 'SELF_PICKUP');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "slot",
ADD COLUMN     "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'SELF_PICKUP',
ADD COLUMN     "pickupAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "returnedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "slot",
ADD COLUMN     "pickupAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "Slot";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

