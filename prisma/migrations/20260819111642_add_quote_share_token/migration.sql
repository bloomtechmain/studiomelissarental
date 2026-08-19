-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_shareToken_key" ON "Quote"("shareToken");
