-- Migration to add unit and quantity to shopping_list_items
ALTER TABLE shopping_list_items ADD COLUMN unit VARCHAR(20) DEFAULT 'un';
ALTER TABLE shopping_list_items ADD COLUMN quantity DECIMAL(12, 2) DEFAULT 1.0;
