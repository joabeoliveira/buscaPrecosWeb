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
  category_id?: string | null;
  category_name?: string | null;
  sku_grade?: string | null;
  target_price?: number | null;
}

export interface Supplier {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  free_shipping: boolean;
  min_free_shipping: number | null;
  score: number;
  avg_delivery_days: number | null;
  notes: string | null;
}

export interface ListResult {
  id: string;
  shopping_list_id: string;
  original_query: string;
  unit: string;
  quantity: number;
  category_id?: string | null;
  category_name?: string | null;
  sku_grade?: string | null;
  target_price?: number | null;
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
  source?: string;
  thumbnail?: string;
  snippet?: string;
  description?: string | null;
}

export interface ItemCategory {
  id: string;
  client_id: string;
  name: string;
  active: boolean;
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

  startBatchSearch: async (listId: string, itemId?: string, providers?: string[], supplierId?: string) => {
    const response = await api.post('/search/batch', { listId, itemId, providers, supplierId });
    return response.data;
  },

  searchDirectOnSupplier: async (itemId: string, supplierId: string, listId: string, query: string) => {
    const response = await api.post('/suppliers/search', { itemId, supplierId, listId, query });
    return response.data;
  },

  getSearchStatus: async (jobId: string) => {
    const response = await api.get(`/search/status/${jobId}`);
    return response.data;
  },

  approveItem: async (itemId: string, isApproved: boolean, listId?: string) => {
    // Use the list-scoped route; listId is needed for the new URL structure
    const lid = listId || 'default';
    await api.patch(`/lists/${lid}/approve/${itemId}`, { isApproved });
  },

  selectProduct: async (itemId: string, selection: ProductResult, listId?: string): Promise<void> => {
    const lid = listId || 'default';
    await api.post(`/lists/${lid}/select/${itemId}`, {
      selection: {
        ...selection,
        source: selection.source || selection.store,
      }
    });
  },

  listUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (name: string, email: string, role: string = 'user', clientId?: string | null) => {
    const response = await api.post('/users', { name, email, role, client_id: clientId || null });
    return response.data;
  },

  login: async (email: string, password?: string) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users?id=${id}`);
  },

  exportQuotation: async (listId: string, format: 'excel' | 'csv' = 'excel') => {
    const response = await api.get(`/lists/${listId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `cotacao_${listId.substring(0, 8)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  sendQuotationToN8n: async (listId: string, data: any) => {
    const response = await api.post('/n8n/send-quotation', {
      quotation_id: listId,
      ...data
    });
    return response.data;
  },

  listClients: async () => {
    const response = await api.get('/clients');
    return response.data;
  },

  createClient: async (data: { name: string; document?: string; email?: string; phone?: string; trade_name?: string; active?: boolean; metadata?: Record<string, unknown> }) => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  listClientCategories: async (clientId: string): Promise<ItemCategory[]> => {
    const response = await api.get(`/clients/${clientId}/categories`);
    return response.data;
  },

  createClientCategory: async (clientId: string, name: string): Promise<ItemCategory> => {
    const response = await api.post(`/clients/${clientId}/categories`, { name });
    return response.data;
  },

  listSuppliers: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  createSupplier: async (data: Omit<Supplier, 'id'>) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  deleteSupplier: async (id: string) => {
    await api.delete(`/suppliers/${id}`);
  },
};
