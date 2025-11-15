/*
  # Local Business Management Platform - Core Schema

  ## Overview
  Complete database schema for a SaaS booking and business management platform.

  ## New Tables
  
  ### 1. users
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `password_hash` (text) - bcrypt hashed
  - `first_name` (text)
  - `last_name` (text)
  - `role` (enum: BUSINESS_OWNER, STAFF, CUSTOMER)
  - `email_verified` (boolean)
  - `business_id` (uuid, nullable) - for staff/business owners
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. businesses
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique) - for public booking URLs
  - `description` (text)
  - `logo` (text) - URL to logo
  - `email` (text)
  - `phone` (text)
  - `address` (text)
  - `business_type` (enum)
  - `timezone` (text)
  - `stripe_account_id` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. services
  - Service offerings for each business
  - Includes duration, pricing, and staff assignments

  ### 4. business_hours
  - Operating hours for each day of the week

  ### 5. staff
  - Staff member profiles and service assignments

  ### 6. staff_schedules
  - Individual staff availability

  ### 7. time_offs
  - Staff time-off requests and approvals

  ### 8. customers
  - Customer profiles with booking history

  ### 9. bookings
  - Appointment bookings with status tracking

  ### 10. payments
  - Payment processing and status tracking

  ### 11. booking_settings
  - Business-specific booking configuration

  ## Security
  - RLS enabled on all tables
  - Policies enforce business-level data isolation
  - Role-based access control for different user types
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('BUSINESS_OWNER', 'STAFF', 'CUSTOMER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE business_type AS ENUM ('RESTAURANT', 'GYM', 'SALON', 'SPA', 'CLINIC', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE time_off_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Businesses table (create first as users references it)
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo text,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  business_type business_type NOT NULL,
  timezone text DEFAULT 'UTC',
  stripe_account_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  email_verified boolean DEFAULT false,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  reset_token text,
  reset_token_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration integer NOT NULL,
  price decimal(10,2) NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  staff_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Business hours table
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time text NOT NULL,
  close_time text NOT NULL,
  is_closed boolean DEFAULT false,
  UNIQUE(business_id, day_of_week)
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio text,
  photo text,
  service_ids uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff schedules table
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  is_available boolean DEFAULT true,
  UNIQUE(staff_id, day_of_week)
);

-- Time offs table
CREATE TABLE IF NOT EXISTS time_offs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reason text,
  status time_off_status DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  notes text,
  tags text[] DEFAULT '{}',
  total_spent decimal(10,2) DEFAULT 0,
  last_visit timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, email)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status booking_status DEFAULT 'PENDING',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status payment_status DEFAULT 'PENDING',
  stripe_payment_id text,
  stripe_customer_id text,
  refunded_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Booking settings table
CREATE TABLE IF NOT EXISTS booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  min_lead_time_hours integer DEFAULT 2,
  max_lead_time_days integer DEFAULT 90,
  cancellation_hours integer DEFAULT 24,
  buffer_time_minutes integer DEFAULT 0,
  deposit_percentage integer DEFAULT 0 CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
  require_payment boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(business_id, email);
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_offs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Business owners can view their staff"
  ON users FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE id IN (
        SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
      )
    )
  );

-- RLS Policies for businesses table
CREATE POLICY "Business owners can view their business"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  )
  WITH CHECK (
    id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  );

CREATE POLICY "Anyone can view businesses for booking"
  ON businesses FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "New business owners can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'BUSINESS_OWNER'));

-- RLS Policies for services table
CREATE POLICY "Business members can view their services"
  ON services FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Business owners can manage services"
  ON services FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  );

-- RLS Policies for business_hours table
CREATE POLICY "Anyone can view business hours"
  ON business_hours FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage business hours"
  ON business_hours FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  );

-- RLS Policies for staff table
CREATE POLICY "Business members can view staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Public can view active staff"
  ON staff FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Business owners can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  );

-- RLS Policies for staff_schedules table
CREATE POLICY "Business members can view staff schedules"
  ON staff_schedules FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE business_id IN (
        SELECT business_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view staff schedules"
  ON staff_schedules FOR SELECT
  TO anon
  USING (is_available = true);

CREATE POLICY "Business owners and staff can manage schedules"
  ON staff_schedules FOR ALL
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE 
        business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER')
        OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE 
        business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER')
        OR user_id = auth.uid()
    )
  );

-- RLS Policies for time_offs table
CREATE POLICY "Business members can view time offs"
  ON time_offs FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE business_id IN (
        SELECT business_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can create time off requests"
  ON time_offs FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Business owners can manage time offs"
  ON time_offs FOR ALL
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE business_id IN (
        SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
      )
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE business_id IN (
        SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
      )
    )
  );

-- RLS Policies for customers table
CREATE POLICY "Business members can view their customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Business members can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for bookings table
CREATE POLICY "Business members can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Business members can manage bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for payments table
CREATE POLICY "Business members can view their payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE business_id IN (
        SELECT business_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Business members can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE business_id IN (
        SELECT business_id FROM users WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE business_id IN (
        SELECT business_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for booking_settings table
CREATE POLICY "Business members can view their booking settings"
  ON booking_settings FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Public can view booking settings"
  ON booking_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Business owners can manage booking settings"
  ON booking_settings FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users WHERE id = auth.uid() AND role = 'BUSINESS_OWNER'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_offs_updated_at ON time_offs;
CREATE TRIGGER update_time_offs_updated_at BEFORE UPDATE ON time_offs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_settings_updated_at ON booking_settings;
CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON booking_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();