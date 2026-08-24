-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "eventName" TEXT,
ADD COLUMN     "signatureCode" TEXT,
ADD COLUMN     "signatureImageUrl" TEXT,
ADD COLUMN     "signatureIp" TEXT,
ADD COLUMN     "signatureName" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3);
