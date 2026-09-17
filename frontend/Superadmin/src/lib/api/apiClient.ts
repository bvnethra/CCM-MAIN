import { supabase } from '../auth/supabaseClient';
import { createJwtForRole } from '../auth/demoTokens';

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = (rawApiUrl && !rawApiUrl.includes('localhost') && !rawApiUrl.includes('calibration-commercial.com'))
  ? rawApiUrl
  : (import.meta.env.DEV ? 'http://localhost:3000' : '');

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch (err) {
    // ignore supabase auth errors
  }
  let localToken = localStorage.getItem('ccm_auth_token');
  if (!localToken) {
    try {
      localToken = await createJwtForRole('ADMIN', 'admin@calibration.demo');
      localStorage.setItem('ccm_auth_token', localToken);
    } catch (e) {
      // fallback
    }
  }
  return localToken;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': '00000000-0000-0000-0000-000000000001',
    'x-organization-id': '00000000-0000-0000-0000-000000000001',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    throw new ApiError(netErr?.message || 'Network fetch error', 'NETWORK_ERROR', 0);
  }

  let responseData: any;
  try {
    responseData = await response.json();
  } catch (err) {
    responseData = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.warn('API returned 401 Unauthorized. Auto-refreshing demo token...');
      try {
        const newToken = await createJwtForRole('ADMIN', 'admin@calibration.demo');
        localStorage.setItem('ccm_auth_token', newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, { ...options, headers });
        if (retryRes.ok) {
          return (await retryRes.json()) as ApiResponse<T>;
        }
      } catch (retryErr) {
        // proceed to throw original error
      }
    }
    const errCode = responseData?.error?.code || `HTTP_${response.status}`;
    const errMessage = responseData?.error?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errMessage, errCode, response.status, responseData?.error?.details);
  }

  return responseData as ApiResponse<T>;
}

export const apiClient = {
  get: <T = any>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>) => {
    let queryStr = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const str = searchParams.toString();
      if (str) queryStr = `?${str}`;
    }
    return request<T>(`${endpoint}${queryStr}`, { method: 'GET', headers });
  },

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    return request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    return request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    return request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  del: <T = any>(endpoint: string, headers?: Record<string, string>) => {
    return request<T>(endpoint, { method: 'DELETE', headers });
  }
};
