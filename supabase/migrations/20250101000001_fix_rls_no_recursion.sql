-- Fix RLS policies for users table - NO RECURSION VERSION
-- This migration fixes the infinite recursion issue

-- Drop ALL existing policies to start fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.polname
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.polname);
  END LOOP;
END
$$;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to SELECT their own profile
-- This is the most important policy for login to work
-- NO RECURSION - only checks auth.uid() which doesn't query the table
CREATE POLICY "Users can select own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow authenticated users to INSERT their own profile during signup
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow authenticated users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- NOTE: Business owners viewing staff is removed to prevent recursion
-- If needed later, implement via a database function with SECURITY DEFINER

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies (should show 3 policies, no recursion)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

