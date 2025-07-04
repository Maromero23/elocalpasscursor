-- CreateTable
CREATE TABLE "qr_code_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCodeId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deliveryMethod" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "sellerId" TEXT NOT NULL,
    "sellerName" TEXT,
    "sellerEmail" TEXT NOT NULL,
    "locationId" TEXT,
    "locationName" TEXT,
    "distributorId" TEXT,
    "distributorName" TEXT,
    "configurationId" TEXT NOT NULL,
    "configurationName" TEXT,
    "pricingType" TEXT NOT NULL,
    "fixedPrice" REAL,
    "variableBasePrice" REAL,
    "variableGuestIncrease" REAL,
    "variableDayIncrease" REAL,
    "variableCommission" REAL,
    "includeTax" BOOLEAN NOT NULL DEFAULT false,
    "taxPercentage" REAL,
    "baseAmount" REAL NOT NULL DEFAULT 0,
    "guestAmount" REAL NOT NULL DEFAULT 0,
    "dayAmount" REAL NOT NULL DEFAULT 0,
    "commissionAmount" REAL NOT NULL DEFAULT 0,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "landingUrl" TEXT,
    "magicLinkUrl" TEXT,
    "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "rebuyEmailScheduled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "qr_code_analytics_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qr_code_analytics_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qr_code_analytics_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "qr_code_analytics_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_code_analytics_qrCodeId_key" ON "qr_code_analytics"("qrCodeId");
