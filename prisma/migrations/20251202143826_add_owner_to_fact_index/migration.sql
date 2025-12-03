/*
  Warnings:

  - A unique constraint covering the columns `[userId,owner,type,text]` on the table `Fact` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Fact_userId_importance_idx";

-- DropIndex
DROP INDEX "public"."Fact_userId_type_idx";

-- DropIndex
DROP INDEX "public"."Fact_userId_type_text_key";

-- CreateIndex
CREATE UNIQUE INDEX "Fact_userId_owner_type_text_key" ON "Fact"("userId", "owner", "type", "text");
