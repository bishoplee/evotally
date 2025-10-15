-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "llm_model" TEXT,
ADD COLUMN     "llm_raw" JSONB,
ADD COLUMN     "llm_usage" JSONB;
