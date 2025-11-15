-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can create their profile once" ON "public"."users";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."users";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."users";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."users";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."users";

-- Enable RLS on the users table
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Create a very permissive policy for development
-- WARNING: Only use this temporarily for development/testing
CREATE POLICY "Allow all operations during development"
ON "public"."users"
FOR ALL
USING (true)
WITH CHECK (true);

-- After testing, replace the above policy with these proper policies:

-- -- Allow users to read their own profile
-- CREATE POLICY "Users can read own profile"
-- ON "public"."users"
-- FOR SELECT
-- USING (
--   auth.uid() = id OR 
--   auth.jwt()->>'email' = email
-- );

-- -- Allow users to update their own profile
-- CREATE POLICY "Users can update own profile"
-- ON "public"."users"
-- FOR UPDATE
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- -- Allow profile creation during signup/signin
-- CREATE POLICY "Users can create their profile once"
-- ON "public"."users"
-- FOR INSERT
-- WITH CHECK (
--   auth.uid() = id OR 
--   auth.jwt()->>'email' = email
-- );

-- List all policies to verify
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';