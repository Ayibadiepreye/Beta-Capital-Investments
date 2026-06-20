-- Simple Database Migration to Add Phone Number and Account Status
-- Run this in your PostgreSQL database

-- Add phone_number column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Add account_status column to users table with default 'approved'
-- (Default to 'approved' so existing users can still login)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'approved';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone_number', 'account_status');

-- Success message
SELECT 'Database migration completed successfully!' AS status;
