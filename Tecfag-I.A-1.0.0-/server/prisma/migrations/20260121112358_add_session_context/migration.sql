-- CreateTable
CREATE TABLE "ChatSessionContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contextSummary" TEXT,
    "mentionedEntities" TEXT,
    "providedInfo" TEXT,
    "detectedPreferences" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatSessionContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatSessionContext_userId_key" ON "ChatSessionContext"("userId");

-- CreateIndex
CREATE INDEX "ChatSessionContext_userId_idx" ON "ChatSessionContext"("userId");
