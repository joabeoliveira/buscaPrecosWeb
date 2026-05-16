-- Migration: 009_price_stats.sql
DROP MATERIALIZED VIEW IF EXISTS price_stats;

CREATE MATERIALIZED VIEW price_stats AS
SELECT
  canonical_product_id,
  COUNT(*) as sample_count,
  ROUND(AVG(price), 2) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price,
  ROUND(STDDEV(price), 2) as std_dev,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
  MAX(captured_at) as last_seen
FROM price_history
WHERE captured_at > NOW() - INTERVAL '90 days'
GROUP BY canonical_product_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ps_canonical ON price_stats(canonical_product_id);
