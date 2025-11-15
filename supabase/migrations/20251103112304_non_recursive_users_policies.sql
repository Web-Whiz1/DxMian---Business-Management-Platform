-- Drop any existing policies on public.users safely (uses join to pg_class/pg_namespace)
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
    RAISE NOTICE 'Dropping policy % on public.users', r.polname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users;', r.polname);
  END LOOP;
END
$$;

-- Ensure RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create minimal, non-recursive policies that only rely on auth.uid()
-- These policies DO NOT reference jwt.claims.* nor call any functions that might query the users table.

-- Allow authenticated users to SELECT their own profile by matching id
CREATE POLICY "Users can select own profile by id"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to INSERT their own profile (id must match auth.uid())
CREATE POLICY "Users can insert own profile by id"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY "Users can update own profile by id"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify resulting policies
SELECT p.polname AS policy_name,
       n.nspname  AS schema_name,
       c.relname  AS table_name,
       p.polcmd   AS command,
       pg_get_expr(p.polqual, p.polrelid)      AS using_expression,
       pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expression
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'users';

-- OPTIONAL: Find any functions or views that reference the users table (these can cause recursion if policies call them)
SELECT n.nspname AS schema_name, p.proname AS function_name, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%users%';

SELECT table_schema, table_name
FROM information_schema.view_table_usage
WHERE referenced_table_name = 'users' AND referenced_table_schema = 'public';
