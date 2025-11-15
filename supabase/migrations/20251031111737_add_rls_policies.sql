-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy for admins/staff to read user data in their business
CREATE POLICY "Business staff can read their customers" ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE business_id = users.business_id 
      AND role IN ('BUSINESS_OWNER', 'STAFF')
    )
  );

-- Allow public read access for checking credentials during login
CREATE POLICY "Allow public read for auth" ON users
  FOR SELECT
  USING (true);

-- Enable RLS on other tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their business
CREATE POLICY "Business owners can manage their business" ON businesses
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE business_id = businesses.id 
      AND role = 'BUSINESS_OWNER'
    )
  );

-- Staff can read business data
CREATE POLICY "Staff can read business data" ON businesses
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE business_id = businesses.id 
      AND role = 'STAFF'
    )
  );

-- Public can read basic business info
CREATE POLICY "Public can read business info" ON businesses
  FOR SELECT
  USING (true);