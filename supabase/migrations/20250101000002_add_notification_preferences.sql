-- Add notification preferences to booking_settings table
ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_confirmations boolean DEFAULT true;

