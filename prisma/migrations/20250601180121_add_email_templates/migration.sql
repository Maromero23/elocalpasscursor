-- CreateTable
CREATE TABLE "welcome_email_templates" (
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

-- CreateTable
CREATE TABLE "rebuy_email_templates" (
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
