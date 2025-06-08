-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_seller_landing_page_urls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "seller_landing_page_urls_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_seller_landing_page_urls" ("clickCount", "createdAt", "description", "id", "isActive", "name", "sellerId", "updatedAt", "url") SELECT "clickCount", "createdAt", "description", "id", "isActive", "name", "sellerId", "updatedAt", "url" FROM "seller_landing_page_urls";
DROP TABLE "seller_landing_page_urls";
ALTER TABLE "new_seller_landing_page_urls" RENAME TO "seller_landing_page_urls";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
