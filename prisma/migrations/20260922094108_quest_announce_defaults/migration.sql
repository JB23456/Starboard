-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardStars" INTEGER NOT NULL,
    "submissionType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "announcedAt" DATETIME,
    "closeAnnouncedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" DATETIME
);
INSERT INTO "new_Quest" ("active", "createdAt", "createdBy", "description", "id", "removedAt", "rewardStars", "submissionType", "title") SELECT "active", "createdAt", "createdBy", "description", "id", "removedAt", "rewardStars", "submissionType", "title" FROM "Quest";
DROP TABLE "Quest";
ALTER TABLE "new_Quest" RENAME TO "Quest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
