-- Fix permissions for auth flow
DROP POLICY IF EXISTS "Public can read user data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Business staff can read their customers" ON users;
DROP POLICY IF EXISTS "Allow public read for auth" ON users;

-- Allow public to check if email exists during signup
CREATE POLICY "Allow public email check"
ON users FOR SELECT
TO anon
USING (true);

-- Allow new users to create their profile during signup
CREATE POLICY "Allow users to insert their own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read their own profile
CREATE POLICY "Allow users to read own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow users to update own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow staff/owners to read users in their business
CREATE POLICY "Allow staff to read business users"
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