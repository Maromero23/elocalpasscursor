PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SELLER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "locationId" TEXT,
    "distributorId" TEXT, telephone TEXT, whatsapp TEXT, notes TEXT,
    CONSTRAINT "users_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO users VALUES('cmbfrq6480000urpli20grefr','admin@elocalpass.com','$2a$12$jTNbPOeOEkTW9yq8bG28ZOuwvTW7cG2gNK/cfwvJwxY/HK69m./ZG','Admin User','ADMIN',1,1748909779063,1748909779063,NULL,NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('cmbfrq6al0001urpl84wcmw48','seller@elocalpass.com','$2a$12$3EMS4aZExa12wSH1ubUKFOuBPwHgzRrPPjJfZGlNSKnn4uJDdfTYO','Seller User','SELLER',1,1748909779293,1748909779293,NULL,NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('user_1748909963432_nl78qg','distributor1@elocalpass.com','$2a$12$kM14fYHL/hw4eQJOdE4BcOVuzyZstAOI2uMWx8FSIpTtghpJxkkRS','Test Distributor 1','DISTRIBUTOR',1,'2025-06-03 00:19:23',1748925346356,NULL,NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('cmbfrvmy10002udli4d6vre1x','PDClocation1@gmail.com','$2a$10$3vJshUMmUqOxQ0VtBdacduBnohfZII4h6ccRoHsceZI8NoYJwj9WO','Playa del Carmen','LOCATION',1,1748910034153,1748918182163,NULL,NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('cmbfrx0450006udliikv1ng9f','seller1@gmail.com','$2a$12$25fHxC4OKSFQCVLma99WQ.mlFP6YVu/a0mSdi7W0sXyeOk297O0O2','Vendedor Uno Prueba','SELLER',1,1748910097877,1748910097877,'cmbfrvmy40004udliqcrmn0ra',NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('cmbfs440o000eudligjp30hze','Juanitocun@gmail.com','$2a$10$rZxtc/0QDoTW/MnpFnpbbeebqj9Pgr6oycgWLLODjeDAm4ZQJ8ky6','Cancun','LOCATION',1,1748910429528,1748918167904,NULL,NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('cmbfs4uwc000iudli4qsk405o','Pepitovebdedorcancun@gmail.com','$2a$12$YLboW1jFRAsG8BjfAiNY/OVv57mVV80vXtK8oXXvseVRcGtPsrlQu','Vendedro cancun 1','SELLER',1,1748910464365,1748910464365,'cmbfs440p000gudliv750gb67',NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('cmbfvdlou000113q4ysw5ni0f','riosdeagua@gmail.com','$2a$10$Ng85Qo6dUG6Yqj8PsCI2puy0z0VoaZBtL2Aa3fA2cWERCcN/1n8AG','Tulum','LOCATION',1,1748915911182,1748918131268,NULL,NULL,NULL,NULL,NULL);
INSERT INTO users VALUES('cmbfvefee000513q481ix7y6p','PanchoTulum@gmail.com','$2a$12$Gn16rqCFvO0YgjxXGJrcBO0AsNeFrpCxCRg/73rAjqYZbzqj/xMua','Pancho Pantera','SELLER',1,1748915949687,1748915949687,'cmbfvdloy000313q4k9zdxg06',NULL,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "QRConfig" (
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
    "button3DeliveryMethod" TEXT NOT NULL DEFAULT 'DIRECT',
    "button4LandingPageRequired" BOOLEAN NOT NULL DEFAULT true,
    "button5SendRebuyEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QRConfig_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "QRGlobalConfig" (
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
CREATE TABLE IF NOT EXISTS "landing_page_templates" (
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
CREATE TABLE IF NOT EXISTS "welcome_email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'Welcome to ELocalPass!',
    "logoUrl" TEXT,
    "headerText" TEXT NOT NULL DEFAULT 'Welcome to Your ELocalPass Experience!',
    "bodyText" TEXT NOT NULL DEFAULT 'Thank you for choosing ELocalPass. Your pass is ready to use.',
    "footerText" TEXT NOT NULL DEFAULT 'Enjoy your local experiences!',
    "primaryColor" TEXT NOT NULL DEFAULT '#f97316',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "buttonColor" TEXT NOT NULL DEFAULT '#f97316',
    "buttonText" TEXT NOT NULL DEFAULT 'View Your Pass',
    "customHTML" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "rebuy_email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'Your ELocalPass Expires Soon - Get Another!',
    "logoUrl" TEXT,
    "headerText" TEXT NOT NULL DEFAULT 'Don''t Let Your Local Adventure End!',
    "bodyText" TEXT NOT NULL DEFAULT 'Your ELocalPass expires in 12 hours. Get another pass to continue your local experiences.',
    "footerText" TEXT NOT NULL DEFAULT 'Thank you for choosing ELocalPass!',
    "primaryColor" TEXT NOT NULL DEFAULT '#f97316',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "buttonColor" TEXT NOT NULL DEFAULT '#f97316',
    "buttonText" TEXT NOT NULL DEFAULT 'Get Another Pass',
    "customHTML" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "landing_page_submissions" (
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
CREATE TABLE IF NOT EXISTS "qr_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 2,
    "days" INTEGER NOT NULL DEFAULT 3,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "landingUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qr_codes_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "qr_scans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCodeId" TEXT NOT NULL,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "business" TEXT,
    CONSTRAINT "qr_scans_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Distributor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "telephone" TEXT, whatsapp TEXT,
    CONSTRAINT "Distributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Distributor VALUES('dist_1748909963436_4y42g8','Test Distributor 1',1,'2025-06-03 00:19:23',1748925346361,'user_1748909963432_nl78qg','John Perez','','yuyuuryuryt','123456789',NULL);
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "distributorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "telephone" TEXT, whatsapp TEXT,
    CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Location_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Location VALUES('cmbfrvmy40004udliqcrmn0ra','Playa del Carmen',1,1748910034156,1748918182164,'dist_1748909963436_4y42g8','cmbfrvmy10002udli4d6vre1x','Pepe Barrios','PDClocation1@gmail.com','fgfsdgdfgf','4543545324',NULL);
INSERT INTO Location VALUES('cmbfs440p000gudliv750gb67','Cancun',1,1748910429529,1748918167905,'dist_1748909963436_4y42g8','cmbfs440o000eudligjp30hze','Juanita Cun','Juanitocun@gmail.com','gfgfdgdf','96687687',NULL);
INSERT INTO Location VALUES('cmbfvdloy000313q4k9zdxg06','Tulum',1,1748915911187,1748918131268,'dist_1748909963436_4y42g8','cmbfvdlou000113q4ysw5ni0f','Pancho Perex','riosdeagua@gmail.com','fgdgfdgf','12234455',NULL);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");
CREATE UNIQUE INDEX "QRConfig_sellerId_key" ON "QRConfig"("sellerId");
CREATE UNIQUE INDEX "qr_codes_code_key" ON "qr_codes"("code");
CREATE UNIQUE INDEX "Distributor_userId_key" ON "Distributor"("userId");
CREATE UNIQUE INDEX "Location_userId_key" ON "Location"("userId");
COMMIT;
