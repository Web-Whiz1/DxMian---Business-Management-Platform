-- Start fresh - drop all policies and disable RLS
DROP POLICY IF EXISTS "Enable full access to authenticated users" ON users;
DROP POLICY IF EXISTS "Allow public read" ON users;

-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create a fresh baseline schema for auth
CREATE OR REPLACE FUNCTION public.get_business_users(business_id_param uuid)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM users WHERE business_id = business_id_param;
$$;

-- Re-enable RLS with minimal policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic policies for user access
CREATE POLICY "Enable read access for all users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Enable write access for own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Enable insert for new profiles"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT EXECUTE ON FUNCTION public.get_business_users TO authenticated;

-- Reset the sequence if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users_id_seq') THEN
        ALTER SEQUENCE users_id_seq RESTART WITH 1;
    END IF;
END
$$;