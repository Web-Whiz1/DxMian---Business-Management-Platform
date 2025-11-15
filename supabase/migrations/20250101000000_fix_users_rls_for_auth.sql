-- Fix RLS policies for users table to allow proper authentication flow
-- This migration ensures users can read their own profile after authentication

-- Drop existing policies (including the one we're about to create)
DROP POLICY IF EXISTS "Users can select own profile by id" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can select own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Business owners can view their staff" ON public.users;
DROP POLICY IF EXISTS "enable_read_for_authenticated_users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations during development" ON public.users;
DROP POLICY IF EXISTS "enable_insert_for_own_profile" ON public.users;
DROP POLICY IF EXISTS "enable_update_for_own_profile" ON public.users;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to SELECT their own profile
-- This is the most important policy for login to work
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

-- Policy 4: Allow business owners to view staff in their business
-- This is needed for the business owner to see staff members
CREATE POLICY "Business owners can view their staff"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users AS owner
    WHERE owner.id = auth.uid()
    AND owner.role = 'BUSINESS_OWNER'
    AND owner.business_id = public.users.business_id
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies
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
WHERE schemaname = 'public' AND tablename = 'users';

