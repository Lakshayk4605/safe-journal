-- CreateTable
CREATE TABLE "manifestation_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intention" TEXT NOT NULL,
    "affirmation" TEXT NOT NULL,
    "visualized" BOOLEAN NOT NULL DEFAULT false,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manifestation_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manifestation_entries_userId_createdAt_idx" ON "manifestation_entries"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "manifestation_entries_userId_date_key" ON "manifestation_entries"("userId", "date");

-- AddForeignKey
ALTER TABLE "manifestation_entries" ADD CONSTRAINT "manifestation_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
