-- Migration to add unit and quantity to shopping_list_items
ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'un';
ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS quantity DECIMAL(12, 2) DEFAULT 1.0;
