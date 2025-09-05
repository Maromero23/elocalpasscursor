-- SAFE DATABASE INDEXES FOR ELOCALPASS
-- These indexes ONLY improve performance, they don't change any existing functionality
-- Run these ONE BY ONE in Supabase SQL Editor to be extra safe

-- 1. MOST CRITICAL: QRCodeAnalytics (your biggest performance issue)
CREATE INDEX IF NOT EXISTS idx_qr_analytics_created_at ON qr_code_analytics(created_at DESC);

-- 2. Affiliates performance (your second biggest issue)  
CREATE INDEX IF NOT EXISTS idx_affiliates_active ON affiliates(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliates_created_at ON affiliates(created_at DESC);

-- 3. Basic relationship indexes
CREATE INDEX IF NOT EXISTS idx_qr_analytics_seller_id ON qr_code_analytics(seller_id);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_location_id ON qr_code_analytics(location_id);

-- 4. Orders performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Run ANALYZE after adding indexes to update query planner statistics
ANALYZE;
