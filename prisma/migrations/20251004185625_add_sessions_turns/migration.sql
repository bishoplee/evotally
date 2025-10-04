-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'assistant', 'tool');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenant_id" TEXT,
    "persona_tag" TEXT,
    "title" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "turn_no" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "text" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,
    "tenant_id" TEXT,
    "qdrant_point_id" TEXT,

    CONSTRAINT "Turn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolCall" (
    "id" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_userId_started_at_idx" ON "Session"("userId", "started_at");

-- CreateIndex
CREATE INDEX "Session_tenant_id_started_at_idx" ON "Session"("tenant_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_qdrant_point_id_key" ON "Turn"("qdrant_point_id");

-- CreateIndex
CREATE INDEX "Turn_sessionId_turn_no_idx" ON "Turn"("sessionId", "turn_no");

-- CreateIndex
CREATE INDEX "Turn_conversation_id_ts_idx" ON "Turn"("conversation_id", "ts");

-- CreateIndex
CREATE INDEX "Turn_ts_idx" ON "Turn"("ts");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_conversation_id_turn_no_key" ON "Turn"("conversation_id", "turn_no");

-- CreateIndex
CREATE UNIQUE INDEX "ToolCall_turnId_key" ON "ToolCall"("turnId");

-- CreateIndex
CREATE INDEX "ToolCall_name_idx" ON "ToolCall"("name");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turn" ADD CONSTRAINT "Turn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolCall" ADD CONSTRAINT "ToolCall_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "Turn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
