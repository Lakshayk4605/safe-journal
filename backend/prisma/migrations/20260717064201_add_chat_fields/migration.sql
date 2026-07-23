-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moodTimeline" TEXT[],
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "tags" TEXT[];

-- RenameIndex
ALTER INDEX "user_date_unique" RENAME TO "mood_entries_userId_date_key";
