-- Add thumbnail and approval status to shopping_list_items
ALTER TABLE shopping_list_items 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
