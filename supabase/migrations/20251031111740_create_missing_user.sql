-- Make password_hash nullable to support Supabase Auth
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Check and create user if not exists
DO $$
DECLARE
    v_user_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = '94a9dd58-3679-4428-9dbe-e41a812f53d5'
    ) INTO v_user_exists;

    IF NOT v_user_exists THEN
        INSERT INTO users (
            id,
            email,
            first_name,
            last_name,
            role,
            email_verified,
            created_at,
            updated_at
        ) VALUES (
            '94a9dd58-3679-4428-9dbe-e41a812f53d5',
            'andreidamian13@yahoo.com',
            'Andrei',
            'Damian',
            'BUSINESS_OWNER',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'User created successfully';
    ELSE
        RAISE NOTICE 'User already exists';
    END IF;
END $$;