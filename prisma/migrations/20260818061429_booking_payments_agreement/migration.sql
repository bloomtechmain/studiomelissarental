-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "agreementOverridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreementSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreementSignedAt" TIMESTAMP(3),
ADD COLUMN     "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "insuranceOnFile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rentalFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "securityDeposit" DECIMAL(10,2) NOT NULL DEFAULT 0;
