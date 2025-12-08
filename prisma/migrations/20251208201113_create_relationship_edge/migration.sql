-- CreateTable
CREATE TABLE "RelationshipEdge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT 'user',
    "from_type" TEXT NOT NULL,
    "from_owner" TEXT NOT NULL,
    "from_name" TEXT,
    "from_relation" TEXT,
    "to_type" TEXT NOT NULL,
    "to_owner" TEXT NOT NULL,
    "to_name" TEXT,
    "to_relation" TEXT,
    "relation_type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "relationship_status" TEXT NOT NULL DEFAULT 'current',
    "strength" INTEGER NOT NULL DEFAULT 5,
    "tags" TEXT[],
    "description" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelationshipEdge_userId_idx" ON "RelationshipEdge"("userId");

-- CreateIndex
CREATE INDEX "RelationshipEdge_userId_relation_type_idx" ON "RelationshipEdge"("userId", "relation_type");

-- CreateIndex
CREATE INDEX "RelationshipEdge_userId_relationship_status_idx" ON "RelationshipEdge"("userId", "relationship_status");

-- AddForeignKey
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "RelationshipEdge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
