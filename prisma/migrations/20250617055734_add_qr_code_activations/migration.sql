-- CreateTable
CREATE TABLE "qr_code_activations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCodeId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sellerId" TEXT,
    CONSTRAINT "qr_code_activations_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
