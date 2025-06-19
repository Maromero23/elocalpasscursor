-- ELocalPass Database Schema for Supabase PostgreSQL
-- Generated from Prisma schema for easy setup

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom function for generating cuid-like IDs (optional, can use uuid_generate_v4() instead)
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
    RETURN 'c' || encode(gen_random_bytes(12), 'base64')::text;
END;
$$ LANGUAGE plpgsql;

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    telephone TEXT,
    whatsapp TEXT,
    notes TEXT,
    role TEXT DEFAULT 'SELLER',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "locationId" TEXT,
    "distributorId" TEXT,
    "configurationId" TEXT,
    "configurationName" TEXT,
    "savedConfigId" TEXT
);

-- Accounts table (NextAuth)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, "providerAccountId")
);

-- Sessions table (NextAuth)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Verification tokens table (NextAuth)
CREATE TABLE verificationtokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(identifier, token)
);

-- Distributors table
CREATE TABLE "Distributor" (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    name TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "userId" TEXT UNIQUE NOT NULL,
    "contactPerson" TEXT,
    email TEXT,
    notes TEXT,
    telephone TEXT,
    whatsapp TEXT
);

-- Locations table
CREATE TABLE "Location" (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    name TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "distributorId" TEXT NOT NULL,
    "userId" TEXT UNIQUE NOT NULL,
    "contactPerson" TEXT,
    email TEXT,
    notes TEXT,
    telephone TEXT,
    whatsapp TEXT
);

-- Saved QR Configurations table
CREATE TABLE saved_qr_configurations (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    name TEXT NOT NULL,
    description TEXT,
    config TEXT NOT NULL,
    "emailTemplates" TEXT,
    "landingPageConfig" TEXT,
    "selectedUrlIds" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Codes table
CREATE TABLE qr_codes (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    code TEXT UNIQUE NOT NULL,
    "sellerId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    guests INTEGER DEFAULT 2,
    days INTEGER DEFAULT 3,
    cost DECIMAL DEFAULT 0.0,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "landingUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Config table
CREATE TABLE "QRConfig" (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "sellerId" TEXT UNIQUE NOT NULL,
    "sendMethod" TEXT DEFAULT 'URL',
    "landingPageRequired" BOOLEAN DEFAULT true,
    "allowCustomGuestsDays" BOOLEAN DEFAULT false,
    "defaultGuests" INTEGER DEFAULT 2,
    "defaultDays" INTEGER DEFAULT 3,
    "pricingType" TEXT DEFAULT 'FIXED',
    "fixedPrice" DECIMAL,
    "sendRebuyEmail" BOOLEAN DEFAULT false,
    "button1GuestsLocked" BOOLEAN DEFAULT false,
    "button1GuestsDefault" INTEGER DEFAULT 2,
    "button1GuestsRangeMax" INTEGER DEFAULT 10,
    "button1DaysLocked" BOOLEAN DEFAULT false,
    "button1DaysDefault" INTEGER DEFAULT 3,
    "button1DaysRangeMax" INTEGER DEFAULT 30,
    "button2PricingType" TEXT DEFAULT 'FIXED',
    "button2FixedPrice" DECIMAL DEFAULT 0,
    "button2VariableBasePrice" DECIMAL DEFAULT 10,
    "button2VariableGuestIncrease" DECIMAL DEFAULT 5,
    "button2VariableDayIncrease" DECIMAL DEFAULT 3,
    "button2VariableCommission" DECIMAL DEFAULT 0,
    "button2IncludeTax" BOOLEAN DEFAULT false,
    "button2TaxPercentage" DECIMAL DEFAULT 0,
    "button3DeliveryMethod" TEXT,
    "button4LandingPageRequired" BOOLEAN,
    "button5SendRebuyEmail" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Global Config table
CREATE TABLE "QRGlobalConfig" (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "button1AllowCustomGuestsDays" BOOLEAN DEFAULT false,
    "button1DefaultGuests" INTEGER DEFAULT 2,
    "button1DefaultDays" INTEGER DEFAULT 3,
    "button1MaxGuests" INTEGER DEFAULT 10,
    "button1MaxDays" INTEGER DEFAULT 30,
    "button1GuestsLocked" BOOLEAN DEFAULT false,
    "button1GuestsDefault" INTEGER DEFAULT 2,
    "button1GuestsRangeMax" INTEGER DEFAULT 10,
    "button1DaysLocked" BOOLEAN DEFAULT false,
    "button1DaysDefault" INTEGER DEFAULT 3,
    "button1DaysRangeMax" INTEGER DEFAULT 30,
    "button2PricingType" TEXT DEFAULT 'FIXED',
    "button2FixedPrice" DECIMAL DEFAULT 0,
    "button2VariableBasePrice" DECIMAL DEFAULT 10,
    "button2VariableGuestIncrease" DECIMAL DEFAULT 5,
    "button2VariableDayIncrease" DECIMAL DEFAULT 3,
    "button2VariableCommission" DECIMAL DEFAULT 0,
    "button2IncludeTax" BOOLEAN DEFAULT false,
    "button2TaxPercentage" DECIMAL DEFAULT 0,
    "button3DeliveryMethod" TEXT,
    "button4LandingPageRequired" BOOLEAN,
    "button5SendRebuyEmail" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing Page Templates table
CREATE TABLE landing_page_templates (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    name TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#f97316',
    "secondaryColor" TEXT DEFAULT '#fb923c',
    "backgroundColor" TEXT DEFAULT '#fef3f2',
    "headerText" TEXT NOT NULL,
    "descriptionText" TEXT NOT NULL,
    "ctaButtonText" TEXT NOT NULL,
    "showPayPal" BOOLEAN DEFAULT true,
    "showContactForm" BOOLEAN DEFAULT true,
    "customCSS" TEXT,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Welcome Email Templates table
CREATE TABLE welcome_email_templates (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    name TEXT NOT NULL,
    subject TEXT DEFAULT 'Welcome to ELocalPass!',
    "logoUrl" TEXT,
    "headerText" TEXT DEFAULT 'Welcome to Your ELocalPass Experience!',
    "bodyText" TEXT DEFAULT 'Thank you for choosing ELocalPass. Your pass is ready to use.',
    "footerText" TEXT DEFAULT 'Enjoy your local experiences!',
    "primaryColor" TEXT DEFAULT '#f97316',
    "backgroundColor" TEXT DEFAULT '#ffffff',
    "buttonColor" TEXT DEFAULT '#f97316',
    "buttonText" TEXT DEFAULT 'View Your Pass',
    "customHTML" TEXT,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rebuy Email Templates table
CREATE TABLE rebuy_email_templates (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    name TEXT NOT NULL,
    subject TEXT DEFAULT 'Your ELocalPass Expires Soon - Get Another!',
    "logoUrl" TEXT,
    "headerText" TEXT DEFAULT 'Don''t Let Your Local Adventure End!',
    "bodyText" TEXT DEFAULT 'Your ELocalPass expires in 12 hours. Get another pass to continue your local experiences.',
    "footerText" TEXT DEFAULT 'Thank you for choosing ELocalPass!',
    "primaryColor" TEXT DEFAULT '#f97316',
    "backgroundColor" TEXT DEFAULT '#ffffff',
    "buttonColor" TEXT DEFAULT '#f97316',
    "buttonText" TEXT DEFAULT 'Get Another Pass',
    "customHTML" TEXT,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller Landing Page URLs table
CREATE TABLE seller_landing_page_urls (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "sellerId" TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "clickCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing Page Submissions table
CREATE TABLE landing_page_submissions (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "qrCodeId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    guests INTEGER DEFAULT 2,
    "specialRequests" TEXT,
    "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Scans table
CREATE TABLE qr_scans (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "qrCodeId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location TEXT,
    business TEXT
);

-- Customer Access Tokens table
CREATE TABLE customer_access_tokens (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    token TEXT UNIQUE NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "usedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Code Usage table
CREATE TABLE qr_code_usage (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "qrCodeId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "affiliateName" TEXT,
    "affiliateType" TEXT,
    "discountType" TEXT,
    "discountValue" TEXT,
    "usedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- QR Code Activations table
CREATE TABLE qr_code_activations (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "qrCodeId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    guests INTEGER NOT NULL,
    days INTEGER NOT NULL,
    cost DECIMAL NOT NULL,
    "activatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "sellerId" TEXT
);

-- QR Code Analytics table
CREATE TABLE qr_code_analytics (
    id TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "qrCodeId" TEXT UNIQUE NOT NULL,
    "qrCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    guests INTEGER NOT NULL,
    days INTEGER NOT NULL,
    cost DECIMAL NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "deliveryMethod" TEXT NOT NULL,
    language TEXT DEFAULT 'en',
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
    "fixedPrice" DECIMAL,
    "variableBasePrice" DECIMAL,
    "variableGuestIncrease" DECIMAL,
    "variableDayIncrease" DECIMAL,
    "variableCommission" DECIMAL,
    "includeTax" BOOLEAN DEFAULT false,
    "taxPercentage" DECIMAL,
    "baseAmount" DECIMAL DEFAULT 0,
    "guestAmount" DECIMAL DEFAULT 0,
    "dayAmount" DECIMAL DEFAULT 0,
    "commissionAmount" DECIMAL DEFAULT 0,
    "taxAmount" DECIMAL DEFAULT 0,
    "totalAmount" DECIMAL DEFAULT 0,
    "landingUrl" TEXT,
    "magicLinkUrl" TEXT,
    "welcomeEmailSent" BOOLEAN DEFAULT false,
    "rebuyEmailScheduled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Foreign Key Constraints
ALTER TABLE accounts ADD CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "Distributor" ADD CONSTRAINT "Distributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"(id) ON DELETE CASCADE;
ALTER TABLE users ADD CONSTRAINT users_locationId_fkey FOREIGN KEY ("locationId") REFERENCES "Location"(id);
ALTER TABLE users ADD CONSTRAINT users_savedConfigId_fkey FOREIGN KEY ("savedConfigId") REFERENCES saved_qr_configurations(id);
ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_sellerId_fkey FOREIGN KEY ("sellerId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "QRConfig" ADD CONSTRAINT "QRConfig_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE seller_landing_page_urls ADD CONSTRAINT seller_landing_page_urls_sellerId_fkey FOREIGN KEY ("sellerId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE landing_page_submissions ADD CONSTRAINT landing_page_submissions_qrCodeId_fkey FOREIGN KEY ("qrCodeId") REFERENCES qr_codes(id) ON DELETE CASCADE;
ALTER TABLE qr_scans ADD CONSTRAINT qr_scans_qrCodeId_fkey FOREIGN KEY ("qrCodeId") REFERENCES qr_codes(id) ON DELETE CASCADE;
ALTER TABLE customer_access_tokens ADD CONSTRAINT customer_access_tokens_qrCodeId_fkey FOREIGN KEY ("qrCodeId") REFERENCES qr_codes(id) ON DELETE CASCADE;
ALTER TABLE qr_code_usage ADD CONSTRAINT qr_code_usage_qrCodeId_fkey FOREIGN KEY ("qrCodeId") REFERENCES qr_codes(id) ON DELETE CASCADE;
ALTER TABLE qr_code_activations ADD CONSTRAINT qr_code_activations_qrCodeId_fkey FOREIGN KEY ("qrCodeId") REFERENCES qr_codes(id) ON DELETE CASCADE;
ALTER TABLE qr_code_analytics ADD CONSTRAINT qr_code_analytics_qrCodeId_fkey FOREIGN KEY ("qrCodeId") REFERENCES qr_codes(id) ON DELETE CASCADE;
ALTER TABLE qr_code_analytics ADD CONSTRAINT qr_code_analytics_sellerId_fkey FOREIGN KEY ("sellerId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE qr_code_analytics ADD CONSTRAINT qr_code_analytics_locationId_fkey FOREIGN KEY ("locationId") REFERENCES "Location"(id) ON DELETE SET NULL;
ALTER TABLE qr_code_analytics ADD CONSTRAINT qr_code_analytics_distributorId_fkey FOREIGN KEY ("distributorId") REFERENCES "Distributor"(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_locationId ON users("locationId");
CREATE INDEX idx_users_savedConfigId ON users("savedConfigId");
CREATE INDEX idx_qr_codes_sellerId ON qr_codes("sellerId");
CREATE INDEX idx_qr_codes_customerEmail ON qr_codes("customerEmail");
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_createdAt ON qr_codes("createdAt");
CREATE INDEX idx_customer_access_tokens_token ON customer_access_tokens(token);
CREATE INDEX idx_customer_access_tokens_customerEmail ON customer_access_tokens("customerEmail");
CREATE INDEX idx_qr_code_analytics_sellerId ON qr_code_analytics("sellerId");
CREATE INDEX idx_qr_code_analytics_locationId ON qr_code_analytics("locationId");
CREATE INDEX idx_qr_code_analytics_distributorId ON qr_code_analytics("distributorId");
CREATE INDEX idx_qr_code_analytics_createdAt ON qr_code_analytics("createdAt");

-- Create function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributor_updated_at BEFORE UPDATE ON "Distributor" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_location_updated_at BEFORE UPDATE ON "Location" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_qr_configurations_updated_at BEFORE UPDATE ON saved_qr_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_config_updated_at BEFORE UPDATE ON "QRConfig" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_global_config_updated_at BEFORE UPDATE ON "QRGlobalConfig" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landing_page_templates_updated_at BEFORE UPDATE ON landing_page_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_welcome_email_templates_updated_at BEFORE UPDATE ON welcome_email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rebuy_email_templates_updated_at BEFORE UPDATE ON rebuy_email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_landing_page_urls_updated_at BEFORE UPDATE ON seller_landing_page_urls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_code_analytics_updated_at BEFORE UPDATE ON qr_code_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
    'admin-' || generate_cuid(),
    'admin@elocalpass.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin User',
    'ADMIN',
    true,
    NOW(),
    NOW()
);

-- Success message
SELECT 'ELocalPass database schema created successfully! 🎉' as message; 