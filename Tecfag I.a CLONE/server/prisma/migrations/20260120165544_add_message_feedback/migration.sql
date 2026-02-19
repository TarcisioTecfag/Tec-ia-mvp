-- CreateTable
CREATE TABLE "MessageFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "messageContent" TEXT NOT NULL,
    "queryContent" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "category" TEXT,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "model" TEXT,
    "catalogId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MessageFeedback_rating_idx" ON "MessageFeedback"("rating");

-- CreateIndex
CREATE INDEX "MessageFeedback_category_idx" ON "MessageFeedback"("category");

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_idx" ON "MessageFeedback"("userId");

-- CreateIndex
CREATE INDEX "MessageFeedback_createdAt_idx" ON "MessageFeedback"("createdAt");
