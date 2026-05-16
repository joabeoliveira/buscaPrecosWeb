-- Migration: 008_price_history.sql
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_id UUID NOT NULL REFERENCES canonical_products(id),
  price DECIMAL(12,2) NOT NULL,
  store TEXT NOT NULL,
  product_title TEXT,
  product_link TEXT,
  source VARCHAR(30) NOT NULL,
  shopping_list_id UUID REFERENCES shopping_lists(id),
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ph_canonical ON price_history(canonical_product_id);
CREATE INDEX IF NOT EXISTS idx_ph_captured ON price_history(captured_at);
CREATE INDEX IF NOT EXISTS idx_ph_store ON price_history(store);
