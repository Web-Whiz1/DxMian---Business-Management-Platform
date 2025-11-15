-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable write access for own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for new profiles" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow new profile creation" ON users;

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with absolute minimal policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Single policy to allow authenticated users full access
CREATE POLICY "Enable full access to authenticated users"
ON users
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);