-- CreateTable
CREATE TABLE "WorkHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT 'user',
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrSchool" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT 'user',
    "type" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrSchool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkHistory_userId_idx" ON "WorkHistory"("userId");

-- CreateIndex
CREATE INDEX "WorkHistory_userId_owner_idx" ON "WorkHistory"("userId", "owner");

-- CreateIndex
CREATE INDEX "WorkHistory_userId_isCurrent_idx" ON "WorkHistory"("userId", "isCurrent");

-- CreateIndex
CREATE INDEX "WorkOrSchool_userId_idx" ON "WorkOrSchool"("userId");

-- CreateIndex
CREATE INDEX "WorkOrSchool_userId_owner_idx" ON "WorkOrSchool"("userId", "owner");

-- CreateIndex
CREATE INDEX "WorkOrSchool_userId_type_idx" ON "WorkOrSchool"("userId", "type");

-- CreateIndex
CREATE INDEX "WorkOrSchool_userId_isCurrent_idx" ON "WorkOrSchool"("userId", "isCurrent");

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD CONSTRAINT "WorkHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrSchool" ADD CONSTRAINT "WorkOrSchool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
