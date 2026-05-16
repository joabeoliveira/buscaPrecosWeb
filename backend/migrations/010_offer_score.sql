-- Migration: 010_offer_score.sql
ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS auto_selected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_score DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS opportunity_flags JSONB DEFAULT '[]';
