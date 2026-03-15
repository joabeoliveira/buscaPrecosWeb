import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateListResponse {
  id: string;
  name: string;
  itemsCount: number;
  status: string;
}

export interface SearchJobResponse {
  jobId: string;
  listId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  processed_items: number;
  total_items: number;
  error_message?: string;
}

export interface ListResult {
  id: string;
  shopping_list_id: string;
  original_query: string;
  normalized_query: string;
  status: 'found' | 'not_found' | 'error' | 'pending';
  best_price: number | null;
  best_store: string | null;
  best_product_title: string | null;
  best_product_link: string | null;
  thumbnail_url: string | null;
  description: string | null;
  is_approved: boolean;
  raw_response: any; // Contains the array of found products
  searched_at: string | null;
}

export interface ProductResult {
  title: string;
  price: number;
  source: string;
  link: string | null;
  thumbnail: string | null;
  description: string | null;
}

// ─── CATMAT types ─────────────────────────────────────────────────────────────

export interface CatmatItem {
  codigo: string;
  descricao: string;
  unidade?: string | null;
}

export interface CatmatMatchResult {
  input: string;
  bestMatch: CatmatItem | null;
  candidates: CatmatItem[];
  confidence: 'high' | 'medium' | 'low';
  justification?: string;
}

// ─── API clients ──────────────────────────────────────────────────────────────

export const shoppingApi = {
  createList: async (name: string, items: string[]): Promise<CreateListResponse> => {
    const response = await api.post('/lists', { name, items });
    return response.data;
  },

  getList: async (id: string) => {
    const response = await api.get(`/lists/${id}`);
    return response.data;
  },

  startSearch: async (listId: string, itemId?: string): Promise<{ jobId: string }> => {
    const response = await api.post('/search/batch', { listId, itemId });
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<SearchJobResponse> => {
    const response = await api.get(`/search/status/${jobId}`);
    return response.data;
  },

  getResults: async (listId: string): Promise<ListResult[]> => {
    const response = await api.get(`/lists/${listId}/results`);
    return response.data;
  },

  approveItem: async (itemId: string, approved: boolean): Promise<void> => {
    await api.patch(`/items/${itemId}/approve`, { approved });
  },

  selectProduct: async (itemId: string, product: ProductResult): Promise<void> => {
    await api.post(`/items/${itemId}/select`, product);
  },
};

export const catmatApi = {
  /** Identifica o CATMAT mais adequado para uma única descrição. */
  match: async (description: string): Promise<CatmatMatchResult> => {
    const response = await api.post('/catmat/match', { description });
    return response.data;
  },

  /** Identifica o CATMAT mais adequado para múltiplas descrições em lote. */
  batchMatch: async (descriptions: string[]): Promise<{ results: CatmatMatchResult[] }> => {
    const response = await api.post('/catmat/batch-match', { descriptions });
    return response.data;
  },
};

export default api;
