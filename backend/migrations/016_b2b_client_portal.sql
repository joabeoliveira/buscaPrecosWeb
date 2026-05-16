-- B2B Client Portal incremental schema.
-- This migration assumes clients and shopping_lists.client_id already exist.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE clients ADD COLUMN IF NOT EXISTS trade_name VARCHAR(150);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_document_unique
ON clients (document)
WHERE document IS NOT NULL AND document <> '';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
    ALTER TABLE users ADD CONSTRAINT check_user_role
    CHECK (role IN ('super_admin', 'admin', 'helper', 'auditor', 'user', 'client_admin', 'client_buyer'));
END $$;

CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_item_categories_client_id
ON item_categories(client_id);

ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL;

ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS sku_grade VARCHAR(100);

ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_items_category_id
ON shopping_list_items(category_id);

ALTER TABLE shopping_lists
ADD COLUMN IF NOT EXISTS client_notified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE shopping_lists
ADD COLUMN IF NOT EXISTS notification_status VARCHAR(30) DEFAULT 'pending';
