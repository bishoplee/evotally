-- CreateTable
CREATE TABLE "MemoryDebugTrace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "conversationId" TEXT,
    "inputText" TEXT NOT NULL,
    "memoryPrompt" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "longTermHits" JSONB NOT NULL,
    "shortTermTurns" JSONB,
    "workingTurns" JSONB,
    "coreFactsCount" INTEGER,
    "modelUsed" TEXT,
    "sources" JSONB,
    "usage" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryDebugTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryDebugTrace_tenantId_createdAt_idx" ON "MemoryDebugTrace"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "MemoryDebugTrace_sessionId_createdAt_idx" ON "MemoryDebugTrace"("sessionId", "createdAt");
