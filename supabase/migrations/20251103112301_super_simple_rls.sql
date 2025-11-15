-- Remove all policies and start fresh
DO $$ 
BEGIN
    -- Drop all existing policies from the users table
    DROP POLICY IF EXISTS "Enable read access for all users" ON users;
    DROP POLICY IF EXISTS "Enable write access for own profile" ON users;
    DROP POLICY IF EXISTS "Enable insert for new profiles" ON users;
    DROP POLICY IF EXISTS "Users can read own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Allow new profile creation" ON users;
    DROP POLICY IF EXISTS "Enable full access to authenticated users" ON users;
END $$;

-- First disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create a super simple read policy
CREATE POLICY "Allow all reads"
ON users FOR SELECT
USING (true);

-- Enable RLS again
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant explicit permissions
GRANT SELECT ON users TO authenticated, anon;