// ============================================================================
// Database Types - Shared between API routes and frontend
// ============================================================================

export interface ShoppingList {
  id: string;
  name: string;
  user_id: string | null;
  total_items: number;
  status: string;
  created_at: Date;
  client_id?: string | null;
  responsible_id?: string | null;
  internal_code?: string | null;
  client_name?: string | null;
  responsible_name?: string | null;
}

export interface SearchJob {
  id: string;
  shopping_list_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  processed_items: number;
  total_items: number;
  error_message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'helper' | 'auditor' | 'user';
  password_hash?: string;
  active: boolean;
  created_at: Date;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  original_query: string;
  normalized_query?: string;
  unit: string;
  quantity: number;
  best_price: number | null;
  best_store: string | null;
  best_product_title: string | null;
  best_product_link: string | null;
  thumbnail_url?: string;
  description?: string;
  status: 'pending' | 'processing' | 'found' | 'not_found' | 'error';
  is_approved: boolean;
  searched_at: string | null;
  raw_response?: any;
}
