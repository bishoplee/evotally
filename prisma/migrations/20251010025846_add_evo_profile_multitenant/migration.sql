-- CreateTable
CREATE TABLE "EvoProfile" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER NOT NULL DEFAULT 0,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvoProfile_pkey" PRIMARY KEY ("userId","tenantId")
);

-- CreateIndex
CREATE INDEX "EvoProfile_tenantId_updatedAt_idx" ON "EvoProfile"("tenantId", "updatedAt");

-- AddForeignKey
ALTER TABLE "EvoProfile" ADD CONSTRAINT "EvoProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
