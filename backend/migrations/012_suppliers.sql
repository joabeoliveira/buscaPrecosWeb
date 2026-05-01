-- Migration: Suppliers (Parceiros) Module
-- Stores information about partner suppliers for web scraping via n8n

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    free_shipping BOOLEAN DEFAULT FALSE,
    min_free_shipping DECIMAL(10,2),
    score INTEGER DEFAULT 5 CHECK (score BETWEEN 1 AND 10),
    avg_delivery_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for active suppliers lookup
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
