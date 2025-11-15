-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable write access for own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for new profiles" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow new profile creation" ON users;
DROP POLICY IF EXISTS "Enable full access to authenticated users" ON users;

-- First disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "Allow read access to authenticated users"
ON users FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to insert their own profile"
ON users FOR INSERT
WITH CHECK (
    auth.uid() = id
);

CREATE POLICY "Allow users to update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;