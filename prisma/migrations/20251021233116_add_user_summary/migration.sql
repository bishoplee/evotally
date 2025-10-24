/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,text]` on the table `Fact` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Fact_userId_idx";

-- AlterTable
ALTER TABLE "Fact" ADD COLUMN     "importance" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "last_accessed_at" TIMESTAMP(3),
ADD COLUMN     "source_turn_id" TEXT;

-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "consolidated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Fact_userId_importance_idx" ON "Fact"("userId", "importance");

-- CreateIndex
CREATE INDEX "Fact_userId_type_idx" ON "Fact"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Fact_userId_type_text_key" ON "Fact"("userId", "type", "text");
