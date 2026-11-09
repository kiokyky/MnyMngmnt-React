import type {
  AuthResponse,
  Category,
  DashboardSummaryResponse,
  HoldingMarginView,
  Pocket,
  PortfolioOverviewResponse,
  Transaction,
  TransactionSummaryResponse,
  User,
  AssetTransaction,
  PocketType,
  CategoryType,
  TransactionType,
  AssetType,
} from '../types/api';

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://3.25.135.58.sslip.io/api/v1';

const STORAGE_TOKEN_KEY = 'mny_mngmnt_token';
const STORAGE_API_URL_KEY = 'mny_mngmnt_api_url';

export function getApiBaseUrl(): string {
  return localStorage.getItem(STORAGE_API_URL_KEY) || DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  const cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned) {
    localStorage.removeItem(STORAGE_API_URL_KEY);
  } else {
    localStorage.setItem(STORAGE_API_URL_KEY, cleaned);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP Error ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string; base_currency?: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<User>('/users/me'),

  // Dashboard
  getDashboard: (month?: string) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request<DashboardSummaryResponse>(`/dashboard${query}`);
  },

  // Pockets
  listPockets: async (): Promise<Pocket[]> => {
    const res = await request<{ data: Pocket[] }>('/pockets');
    return res.data || [];
  },

  createPocket: async (payload: {
    name: string;
    type: PocketType;
    currency: string;
    initial_balance: number;
  }): Promise<Pocket> => {
    const res = await request<{ data: Pocket }>('/pockets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updatePocket: async (
    id: string,
    payload: { name: string; type: PocketType; currency: string }
  ): Promise<Pocket> => {
    const res = await request<{ data: Pocket }>(`/pockets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deletePocket: (id: string) =>
    request<{ message: string }>(`/pockets/${id}`, {
      method: 'DELETE',
    }),

  // Categories
  listCategories: async (type?: CategoryType): Promise<Category[]> => {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    const res = await request<{ data: Category[] }>(`/categories${query}`);
    return res.data || [];
  },

  createCategory: async (payload: {
    name: string;
    type: CategoryType;
    icon?: string;
    color?: string;
  }): Promise<Category> => {
    const res = await request<{ data: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateCategory: async (
    id: string,
    payload: { name: string; icon?: string; color?: string }
  ): Promise<Category> => {
    const res = await request<{ data: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),

  // Transactions
  listTransactions: (filters?: {
    pocket_id?: string;
    category_id?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.pocket_id) params.set('pocket_id', filters.pocket_id);
    if (filters?.category_id) params.set('category_id', filters.category_id);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);
    const qs = params.toString();
    return request<TransactionSummaryResponse>(`/transactions${qs ? `?${qs}` : ''}`);
  },

  createTransaction: async (payload: {
    pocket_id: string;
    related_pocket_id?: string | null;
    category_id?: string | null;
    type: TransactionType;
    amount: number;
    description?: string;
    transaction_date?: string;
  }): Promise<Transaction> => {
    const res = await request<{ data: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteTransaction: (id: string) =>
    request<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  // Portfolio (Valas & Investment)
  listHoldings: (assetType?: string) => {
    const qs = assetType ? `?asset_type=${encodeURIComponent(assetType)}` : '';
    return request<PortfolioOverviewResponse>(`/portfolio/holdings${qs}`);
  },

  createHolding: async (payload: {
    pocket_id?: string | null;
    create_pocket?: boolean;
    asset_type: AssetType;
    symbol: string;
    name: string;
    current_rate_idr?: number;
  }): Promise<HoldingMarginView> => {
    const res = await request<{ data: HoldingMarginView }>('/portfolio/holdings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  getHoldingDetail: (id: string, currentRate?: number) => {
    const qs = currentRate && currentRate > 0 ? `?current_rate=${currentRate}` : '';
    return request<{ summary: HoldingMarginView; history: AssetTransaction[] }>(
      `/portfolio/holdings/${id}${qs}`
    );
  },

  buyHolding: (
    id: string,
    payload: {
      source_pocket_id?: string | null;
      category_id?: string | null;
      units: number;
      rate_idr: number;
      fee_idr?: number;
      notes?: string;
      transaction_date?: string;
    }
  ) =>
    request<{ message: string; summary: HoldingMarginView; transaction: AssetTransaction }>(
      `/portfolio/holdings/${id}/buy`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  sellHolding: (
    id: string,
    payload: {
      target_pocket_id?: string | null;
      category_id?: string | null;
      units: number;
      rate_idr: number;
      fee_idr?: number;
      notes?: string;
      transaction_date?: string;
    }
  ) =>
    request<{ message: string; summary: HoldingMarginView; transaction: AssetTransaction }>(
      `/portfolio/holdings/${id}/sell`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  updateHoldingRate: (id: string, current_rate_idr: number) =>
    request<{ message: string; summary: HoldingMarginView }>(`/portfolio/holdings/${id}/rate`, {
      method: 'PATCH',
      body: JSON.stringify({ current_rate_idr }),
    }),

  updateAssetTransaction: (
    holdingId: string,
    txId: string,
    payload: {
      units: number;
      rate_idr: number;
      fee_idr?: number;
      notes?: string;
      transaction_date?: string;
    }
  ) =>
    request<{ message: string; summary: HoldingMarginView; transaction: AssetTransaction }>(
      `/portfolio/holdings/${holdingId}/transactions/${txId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    ),

  deleteAssetTransaction: (holdingId: string, txId: string) =>
    request<{ message: string; summary: HoldingMarginView }>(
      `/portfolio/holdings/${holdingId}/transactions/${txId}`,
      {
        method: 'DELETE',
      }
    ),
};
