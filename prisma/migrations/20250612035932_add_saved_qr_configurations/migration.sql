-- CreateTable
CREATE TABLE "saved_qr_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" TEXT NOT NULL,
    "emailTemplates" TEXT,
    "landingPageConfig" TEXT,
    "selectedUrlIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "telephone" TEXT,
    "whatsapp" TEXT,
    "notes" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SELLER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "locationId" TEXT,
    "distributorId" TEXT,
    "configurationId" TEXT,
    "configurationName" TEXT,
    "savedConfigId" TEXT,
    CONSTRAINT "users_savedConfigId_fkey" FOREIGN KEY ("savedConfigId") REFERENCES "saved_qr_configurations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("configurationId", "configurationName", "createdAt", "distributorId", "email", "id", "isActive", "locationId", "name", "notes", "password", "role", "telephone", "updatedAt", "whatsapp") SELECT "configurationId", "configurationName", "createdAt", "distributorId", "email", "id", "isActive", "locationId", "name", "notes", "password", "role", "telephone", "updatedAt", "whatsapp" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
