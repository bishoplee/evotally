-- AlterTable
ALTER TABLE "EvoProfile" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "EvoProfile_tenantId_idx" ON "EvoProfile"("tenantId");
