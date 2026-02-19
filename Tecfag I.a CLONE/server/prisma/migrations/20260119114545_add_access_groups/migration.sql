-- CreateTable
CREATE TABLE "AccessGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canViewChat" BOOLEAN NOT NULL DEFAULT true,
    "canViewMindMap" BOOLEAN NOT NULL DEFAULT true,
    "canViewCatalog" BOOLEAN NOT NULL DEFAULT true,
    "canViewUsers" BOOLEAN NOT NULL DEFAULT false,
    "canViewMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "canViewDocuments" BOOLEAN NOT NULL DEFAULT false,
    "canViewSettings" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "jobTitle" TEXT,
    "department" TEXT,
    "technicalLevel" TEXT,
    "communicationStyle" TEXT,
    "accessGroupId" TEXT,
    CONSTRAINT "User_accessGroupId_fkey" FOREIGN KEY ("accessGroupId") REFERENCES "AccessGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("communicationStyle", "createdAt", "department", "email", "id", "jobTitle", "lastActive", "mustChangePassword", "name", "password", "role", "technicalLevel", "updatedAt") SELECT "communicationStyle", "createdAt", "department", "email", "id", "jobTitle", "lastActive", "mustChangePassword", "name", "password", "role", "technicalLevel", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AccessGroup_name_key" ON "AccessGroup"("name");
