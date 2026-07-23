-- CreateTable
CREATE TABLE "gratitude_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "item1" TEXT NOT NULL,
    "item2" TEXT NOT NULL,
    "item3" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gratitude_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gratitude_entries_userId_createdAt_idx" ON "gratitude_entries"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "gratitude_entries_userId_date_key" ON "gratitude_entries"("userId", "date");

-- AddForeignKey
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
