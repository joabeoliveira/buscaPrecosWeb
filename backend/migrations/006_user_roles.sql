-- Add role and password to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'; -- admin, helper, auditor
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update existing user (Joabe) if exists
UPDATE users SET role = 'admin' WHERE email = 'joabe@exemplo.com';
