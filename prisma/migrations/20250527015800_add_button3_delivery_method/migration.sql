-- CreateTable
CREATE TABLE "QRGlobalConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "button1AllowCustomGuestsDays" BOOLEAN NOT NULL DEFAULT false,
    "button1DefaultGuests" INTEGER NOT NULL DEFAULT 2,
    "button1DefaultDays" INTEGER NOT NULL DEFAULT 3,
    "button1MaxGuests" INTEGER NOT NULL DEFAULT 10,
    "button1MaxDays" INTEGER NOT NULL DEFAULT 30,
    "button1GuestsLocked" BOOLEAN NOT NULL DEFAULT false,
    "button1GuestsDefault" INTEGER NOT NULL DEFAULT 2,
    "button1GuestsRangeMax" INTEGER NOT NULL DEFAULT 10,
    "button1DaysLocked" BOOLEAN NOT NULL DEFAULT false,
    "button1DaysDefault" INTEGER NOT NULL DEFAULT 3,
    "button1DaysRangeMax" INTEGER NOT NULL DEFAULT 30,
    "button2PricingType" TEXT NOT NULL DEFAULT 'FIXED',
    "button2FixedPrice" REAL DEFAULT 0,
    "button2VariableBasePrice" REAL NOT NULL DEFAULT 10,
    "button2VariableGuestIncrease" REAL NOT NULL DEFAULT 5,
    "button2VariableDayIncrease" REAL NOT NULL DEFAULT 3,
    "button2VariableCommission" REAL NOT NULL DEFAULT 0,
    "button2IncludeTax" BOOLEAN NOT NULL DEFAULT false,
    "button2TaxPercentage" REAL NOT NULL DEFAULT 0,
    "button3DeliveryMethod" TEXT NOT NULL DEFAULT 'DIRECT',
    "button4LandingPageRequired" BOOLEAN NOT NULL DEFAULT true,
    "button5SendRebuyEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "landing_page_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#f97316',
    "secondaryColor" TEXT NOT NULL DEFAULT '#fb923c',
    "backgroundColor" TEXT NOT NULL DEFAULT '#fef3f2',
    "headerText" TEXT NOT NULL,
    "descriptionText" TEXT NOT NULL,
    "ctaButtonText" TEXT NOT NULL,
    "showPayPal" BOOLEAN NOT NULL DEFAULT true,
    "showContactForm" BOOLEAN NOT NULL DEFAULT true,
    "customCSS" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "landing_page_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCodeId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "guests" INTEGER NOT NULL DEFAULT 2,
    "specialRequests" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "landing_page_submissions_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
