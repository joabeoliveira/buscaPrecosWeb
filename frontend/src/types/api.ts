// ============================================================================
// API Types - Request/Response types for the Next.js API routes
// ============================================================================

export interface ListItemInput {
  query: string;
  unit?: string;
  quantity?: number;
}

export interface ListResult {
  id: string;
  shopping_list_id: string;
  original_query: string;
  unit: string;
  quantity: number;
  best_price: number | null;
  best_store: string | null;
  best_product_title: string | null;
  best_product_link: string | null;
  thumbnail_url?: string;
  status: 'pending' | 'processing' | 'found' | 'not_found' | 'error';
  is_approved: boolean;
  searched_at: string | null;
  raw_response?: any;
}

export interface ProductResult {
  title: string;
  price: number;
  source: string;
  link: string | null;
  thumbnail: string | null;
  description: string | null;
}

export interface PriceResult {
  status: 'found' | 'not_found' | 'error' | 'pending';
  results: ProductResult[];
  searchedAt: Date;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: any;
  requestId?: string;
}
