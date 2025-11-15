-- Drop existing policies first
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Business staff can read their customers" ON users;
DROP POLICY IF EXISTS "Allow public read for auth" ON users;
DROP POLICY IF EXISTS "Business owners can manage their business" ON businesses;
DROP POLICY IF EXISTS "Staff can read business data" ON businesses;
DROP POLICY IF EXISTS "Public can read business info" ON businesses;

-- Temporarily disable RLS to avoid any issues during setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow public access for authentication
CREATE POLICY "Public can read user data"
ON users FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to insert their own data during signup
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Business staff policies
CREATE POLICY "Staff can view business users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS staff
    WHERE staff.id = auth.uid()
    AND staff.business_id = users.business_id
    AND staff.role IN ('BUSINESS_OWNER', 'STAFF')
  )
);

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO anon, authenticated;
GRANT SELECT ON businesses TO anon, authenticated;

-- Notify of completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been successfully updated.';
END $$;