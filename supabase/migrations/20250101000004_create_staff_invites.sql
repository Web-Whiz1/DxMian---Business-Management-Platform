-- Create staff_invites table for managing staff invitations
CREATE TABLE IF NOT EXISTS staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_invites_token ON staff_invites(token);
CREATE INDEX IF NOT EXISTS idx_staff_invites_business_id ON staff_invites(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_invites_email ON staff_invites(email);

-- Enable RLS
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can create and view invites for their business
CREATE POLICY "Business owners can manage invites"
ON staff_invites
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'BUSINESS_OWNER'
    AND users.business_id = staff_invites.business_id
  )
);

-- Policy: Anyone can read invites by token (for registration)
CREATE POLICY "Anyone can read invite by token"
ON staff_invites
FOR SELECT
TO anon, authenticated
USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON staff_invites TO authenticated;
GRANT SELECT ON staff_invites TO anon;

