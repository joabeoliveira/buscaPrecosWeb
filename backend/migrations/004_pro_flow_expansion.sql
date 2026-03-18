-- Expansion to Professional Quotation System
-- 
-- Adds roles, clients (interessados), and tracking to the system.

-- Role Support
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Ensure a few base roles
-- Role check constraint
DO $$ 
BEGIN
    ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('super_admin', 'admin', 'user'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Clients (Interessados)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20), -- CNPJ/CPF
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update shopping_lists (Cotações)
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS internal_code VARCHAR(100); -- Código da cotação/processo
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'manual'; -- manual, csv, excel

-- Tracking who analyzed/quoted
ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS analyzed_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Audit Logs Table (Optional but requested "Auditoria")
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
