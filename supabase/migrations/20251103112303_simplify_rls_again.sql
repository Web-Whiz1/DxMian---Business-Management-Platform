DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable write access for own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for new profiles" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow new profile creation" ON users;
DROP POLICY IF EXISTS "Enable full access to authenticated users" ON users;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;

-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Enable RLS with basic policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "enable_read_for_authenticated_users"
ON users
FOR SELECT
USING (true);

-- Allow insert access for creating own profile
CREATE POLICY "enable_insert_for_own_profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow update access for own profile
CREATE POLICY "enable_update_for_own_profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT SELECT ON users TO authenticated;
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;