import axios from 'axios';

// In Next.js API Routes architecture, API calls go to the same origin
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
  link: string;
  store: string;
  thumbnail?: string;
  snippet?: string;
}

export const shoppingApi = {
  createList: async (name: string, items: (string | ListItemInput)[], clientId?: string | null, responsibleId?: string | null, internalCode?: string | null) => {
    const response = await api.post('/lists', { 
      name, 
      items, 
      clientId, 
      responsibleId, 
      internalCode 
    });
    return response.data;
  },

  listQuotations: async (filters?: { status?: string, clientId?: string }) => {
    const response = await api.get('/lists', { params: filters });
    return response.data;
  },

  getQuotation: async (id: string) => {
    const response = await api.get(`/lists/${id}`);
    return response.data;
  },

  getResults: async (id: string): Promise<ListResult[]> => {
    const response = await api.get(`/lists/${id}/results`);
    return response.data;
  },

  startBatchSearch: async (listId: string, itemId?: string) => {
    const response = await api.post('/search/batch', { listId, itemId });
    return response.data;
  },

  getSearchStatus: async (jobId: string) => {
    const response = await api.get(`/search/status/${jobId}`);
    return response.data;
  },

  approveItem: async (itemId: string, isApproved: boolean, userId?: string, listId?: string) => {
    // Use the list-scoped route; listId is needed for the new URL structure
    const lid = listId || 'default';
    await api.patch(`/lists/${lid}/approve/${itemId}`, { isApproved, userId });
  },

  selectProduct: async (itemId: string, selection: ProductResult, userId?: string, listId?: string): Promise<void> => {
    const lid = listId || 'default';
    await api.post(`/lists/${lid}/select/${itemId}`, { selection, userId });
  },

  listUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (name: string, email: string, role: string = 'user') => {
    const response = await api.post('/users', { name, email, role });
    return response.data;
  },

  login: async (email: string, password?: string) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users?id=${id}`);
  },

  exportQuotation: (listId: string, format: 'excel' | 'csv' = 'excel') => {
    const url = `${API_URL}/lists/${listId}/export?format=${format}`;
    window.open(url, '_blank');
  },
};
