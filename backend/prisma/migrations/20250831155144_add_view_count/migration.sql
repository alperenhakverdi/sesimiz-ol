-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_stories" ("authorId", "content", "createdAt", "id", "title", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "title", "updatedAt" FROM "stories";
DROP TABLE "stories";
ALTER TABLE "new_stories" RENAME TO "stories";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
