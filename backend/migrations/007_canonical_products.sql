-- Migration: 007_canonical_products.sql
CREATE TABLE IF NOT EXISTS canonical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_name TEXT NOT NULL,       -- "resma a4 500 folhas chamex"
  brand TEXT,                          -- "Chamex"
  category TEXT,                       -- "Papelaria"
  attributes JSONB DEFAULT '{}',       -- {"folhas": 500, "formato": "A4"}
  gtin VARCHAR(14),                    -- código de barras (quando disponível)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by normalized name
CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_normalized ON canonical_products(normalized_name);

-- Link existing shopping list items to the canonical product
ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS canonical_product_id UUID REFERENCES canonical_products(id);
