-- Add description to shopping_list_items
ALTER TABLE shopping_list_items 
ADD COLUMN IF NOT EXISTS description TEXT;
