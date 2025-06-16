-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QRConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "sendMethod" TEXT NOT NULL DEFAULT 'URL',
    "landingPageRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowCustomGuestsDays" BOOLEAN NOT NULL DEFAULT false,
    "defaultGuests" INTEGER NOT NULL DEFAULT 2,
    "defaultDays" INTEGER NOT NULL DEFAULT 3,
    "pricingType" TEXT NOT NULL DEFAULT 'FIXED',
    "fixedPrice" REAL,
    "sendRebuyEmail" BOOLEAN NOT NULL DEFAULT false,
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
    "button3DeliveryMethod" TEXT,
    "button4LandingPageRequired" BOOLEAN,
    "button5SendRebuyEmail" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QRConfig_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QRConfig" ("allowCustomGuestsDays", "button1DaysDefault", "button1DaysLocked", "button1DaysRangeMax", "button1GuestsDefault", "button1GuestsLocked", "button1GuestsRangeMax", "button2FixedPrice", "button2IncludeTax", "button2PricingType", "button2TaxPercentage", "button2VariableBasePrice", "button2VariableCommission", "button2VariableDayIncrease", "button2VariableGuestIncrease", "button3DeliveryMethod", "button4LandingPageRequired", "button5SendRebuyEmail", "createdAt", "defaultDays", "defaultGuests", "fixedPrice", "id", "landingPageRequired", "pricingType", "sellerId", "sendMethod", "sendRebuyEmail", "updatedAt") SELECT "allowCustomGuestsDays", "button1DaysDefault", "button1DaysLocked", "button1DaysRangeMax", "button1GuestsDefault", "button1GuestsLocked", "button1GuestsRangeMax", "button2FixedPrice", "button2IncludeTax", "button2PricingType", "button2TaxPercentage", "button2VariableBasePrice", "button2VariableCommission", "button2VariableDayIncrease", "button2VariableGuestIncrease", "button3DeliveryMethod", "button4LandingPageRequired", "button5SendRebuyEmail", "createdAt", "defaultDays", "defaultGuests", "fixedPrice", "id", "landingPageRequired", "pricingType", "sellerId", "sendMethod", "sendRebuyEmail", "updatedAt" FROM "QRConfig";
DROP TABLE "QRConfig";
ALTER TABLE "new_QRConfig" RENAME TO "QRConfig";
CREATE UNIQUE INDEX "QRConfig_sellerId_key" ON "QRConfig"("sellerId");
CREATE TABLE "new_QRGlobalConfig" (
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
    "button3DeliveryMethod" TEXT,
    "button4LandingPageRequired" BOOLEAN,
    "button5SendRebuyEmail" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_QRGlobalConfig" ("button1AllowCustomGuestsDays", "button1DaysDefault", "button1DaysLocked", "button1DaysRangeMax", "button1DefaultDays", "button1DefaultGuests", "button1GuestsDefault", "button1GuestsLocked", "button1GuestsRangeMax", "button1MaxDays", "button1MaxGuests", "button2FixedPrice", "button2IncludeTax", "button2PricingType", "button2TaxPercentage", "button2VariableBasePrice", "button2VariableCommission", "button2VariableDayIncrease", "button2VariableGuestIncrease", "button3DeliveryMethod", "button4LandingPageRequired", "button5SendRebuyEmail", "createdAt", "id", "updatedAt") SELECT "button1AllowCustomGuestsDays", "button1DaysDefault", "button1DaysLocked", "button1DaysRangeMax", "button1DefaultDays", "button1DefaultGuests", "button1GuestsDefault", "button1GuestsLocked", "button1GuestsRangeMax", "button1MaxDays", "button1MaxGuests", "button2FixedPrice", "button2IncludeTax", "button2PricingType", "button2TaxPercentage", "button2VariableBasePrice", "button2VariableCommission", "button2VariableDayIncrease", "button2VariableGuestIncrease", "button3DeliveryMethod", "button4LandingPageRequired", "button5SendRebuyEmail", "createdAt", "id", "updatedAt" FROM "QRGlobalConfig";
DROP TABLE "QRGlobalConfig";
ALTER TABLE "new_QRGlobalConfig" RENAME TO "QRGlobalConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
