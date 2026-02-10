-- ============================================
-- Migration: Add Search Vector Trigger and RLS Policies
-- ============================================

-- 1. Add search_vector column to cars table (if not exists)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- 2. Create function to update search_vector
CREATE OR REPLACE FUNCTION update_car_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.version, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.features, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS cars_search_vector_update ON cars;
CREATE TRIGGER cars_search_vector_update
  BEFORE INSERT OR UPDATE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION update_car_search_vector();

-- 4. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS cars_search_vector_idx ON cars USING GIN(search_vector);

-- 5. Update existing rows with search_vector
UPDATE cars SET search_vector = 
  setweight(to_tsvector('portuguese', COALESCE(brand, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(model, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(version, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('portuguese', COALESCE(array_to_string(features, ' '), '')), 'D')
WHERE search_vector IS NULL;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CARS TABLE POLICIES
-- ============================================

-- Public can view ACTIVE cars
CREATE POLICY "Public can view active cars"
  ON cars FOR SELECT
  USING (status = 'ACTIVE');

-- Users can view their own cars (any status)
CREATE POLICY "Users can view own cars"
  ON cars FOR SELECT
  USING (seller_id = current_user_id());

-- Users can insert their own cars
CREATE POLICY "Users can insert own cars"
  ON cars FOR INSERT
  WITH CHECK (seller_id = current_user_id());

-- Users can update their own cars
CREATE POLICY "Users can update own cars"
  ON cars FOR UPDATE
  USING (seller_id = current_user_id());

-- Users can delete their own cars
CREATE POLICY "Users can delete own cars"
  ON cars FOR DELETE
  USING (seller_id = current_user_id());

-- Admins can do anything
CREATE POLICY "Admins can manage all cars"
  ON cars FOR ALL
  USING (is_admin());

-- ============================================
-- CAR_PHOTOS TABLE POLICIES
-- ============================================

-- Public can view photos of active cars
CREATE POLICY "Public can view photos of active cars"
  ON car_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = car_photos.car_id 
      AND cars.status = 'ACTIVE'
    )
  );

-- Users can manage photos of their own cars
CREATE POLICY "Users can manage own car photos"
  ON car_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = car_photos.car_id 
      AND cars.seller_id = current_user_id()
    )
  );

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    sender_id = current_user_id() OR 
    receiver_id = current_user_id()
  );

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = current_user_id());

-- Users can update their sent messages (mark as read, etc)
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (
    sender_id = current_user_id() OR 
    receiver_id = current_user_id()
  );

-- ============================================
-- REVIEWS TABLE POLICIES
-- ============================================

-- Public can view all reviews
CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Users can create reviews
CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (reviewer_id = current_user_id());

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (reviewer_id = current_user_id());

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (reviewer_id = current_user_id());

-- ============================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================

-- Users can view transactions they're involved in
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    buyer_id = current_user_id() OR 
    seller_id = current_user_id()
  );

-- Users can create transactions as buyers
CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (buyer_id = current_user_id());

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (
    buyer_id = current_user_id() OR 
    seller_id = current_user_id()
  );

-- ============================================
-- STORES TABLE POLICIES
-- ============================================

-- Public can view verified stores
CREATE POLICY "Public can view verified stores"
  ON stores FOR SELECT
  USING (is_verified = true);

-- Store owners can view their own stores
CREATE POLICY "Owners can view own stores"
  ON stores FOR SELECT
  USING (owner_id = current_user_id());

-- Store owners can create stores
CREATE POLICY "Owners can create stores"
  ON stores FOR INSERT
  WITH CHECK (owner_id = current_user_id());

-- Store owners can update their own stores
CREATE POLICY "Owners can update own stores"
  ON stores FOR UPDATE
  USING (owner_id = current_user_id());

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function to get current user ID from JWT
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
BEGIN
  -- This should be replaced with actual JWT parsing logic
  -- For now, return NULL (policies will deny access)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This should check user role from JWT
  -- For now, return false
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES
-- ============================================
-- To enable RLS in production:
-- 1. Update current_user_id() to parse JWT token
-- 2. Update is_admin() to check user role
-- 3. Test all policies thoroughly
-- 4. Run: SELECT * FROM pg_policies WHERE schemaname = 'public';
