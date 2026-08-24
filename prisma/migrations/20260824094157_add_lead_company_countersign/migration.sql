-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "companySignatureCode" TEXT,
ADD COLUMN     "companySignedAt" TIMESTAMP(3),
ADD COLUMN     "companySignedById" TEXT;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companySignedById_fkey" FOREIGN KEY ("companySignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
