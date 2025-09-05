-- CRITICAL DATABASE PERFORMANCE FIXES FOR ELOCALPASS
-- Run these in Supabase SQL Editor to fix performance bottlenecks

-- 1. QRCodeAnalytics Indexes (Most Critical)
CREATE INDEX IF NOT EXISTS idx_qr_analytics_created_at ON qr_code_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_seller_id ON qr_code_analytics(seller_id);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_location_id ON qr_code_analytics(location_id);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_distributor_id ON qr_code_analytics(distributor_id);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_is_active ON qr_code_analytics(is_active);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_expires_at ON qr_code_analytics(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_date_range ON qr_code_analytics(created_at DESC, is_active);

-- 2. Affiliate System Indexes (Critical for large datasets)
CREATE INDEX IF NOT EXISTS idx_affiliates_active ON affiliates(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliates_created_at ON affiliates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliates_city ON affiliates(city);
CREATE INDEX IF NOT EXISTS idx_affiliates_category ON affiliates(category);
CREATE INDEX IF NOT EXISTS idx_affiliates_sub_category ON affiliates(sub_category);
CREATE INDEX IF NOT EXISTS idx_affiliates_name_search ON affiliates USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_affiliates_email_search ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_num ON affiliates(affiliate_num);

-- 3. QRCode Indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_seller_id ON qr_codes(seller_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_active ON qr_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_qr_codes_customer_email ON qr_codes(customer_email);

-- 4. Order System Indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- 5. ScheduledQRCode Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_qr_scheduled_for ON scheduled_qr_codes(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_qr_is_processed ON scheduled_qr_codes(is_processed);
CREATE INDEX IF NOT EXISTS idx_scheduled_qr_seller_id ON scheduled_qr_codes(seller_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_qr_created_at ON scheduled_qr_codes(created_at DESC);

-- 6. AffiliateVisit Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_affiliate_id ON affiliate_visits(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_qr_code_id ON affiliate_visits(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_visited_at ON affiliate_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_visit_date ON affiliate_visits(visit_date);

-- 7. User/Seller Relationship Indexes
CREATE INDEX IF NOT EXISTS idx_users_location_id ON users(location_id);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- 8. Composite Indexes for Common Query Patterns
CREATE INDEX IF NOT EXISTS idx_qr_analytics_seller_date ON qr_code_analytics(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_location_date ON qr_code_analytics(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_distributor_date ON qr_code_analytics(distributor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliates_active_category ON affiliates(is_active, category, sub_category);

-- 9. Full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_affiliates_description_search ON affiliates USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_qr_analytics_customer_search ON qr_code_analytics USING gin(to_tsvector('english', customer_name || ' ' || customer_email));

ANALYZE;
