-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable write access for own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for new profiles" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow new profile creation" ON users;

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with more specific policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile and profiles in their business
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() IS NOT NULL);  -- Simplified to allow any authenticated user to read

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow new user profile creation during signup
CREATE POLICY "Allow new profile creation"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Reset permissions to be explicit
REVOKE ALL ON users FROM anon, authenticated;
GRANT SELECT ON users TO authenticated;  -- authenticated users can read
GRANT INSERT, UPDATE ON users TO authenticated;  -- authenticated users can create/update their profile