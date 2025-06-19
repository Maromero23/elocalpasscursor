-- AlterTable
ALTER TABLE "qr_codes" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "qr_codes" ADD COLUMN "customerName" TEXT;

-- CreateTable
CREATE TABLE "customer_access_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_access_tokens_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_access_tokens_token_key" ON "customer_access_tokens"("token");
