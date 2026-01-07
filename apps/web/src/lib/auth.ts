// Auth API configuration
const API_BASE_URL = 'https://cloud.maximus.mn/api/client';

export interface LoginCredentials {
  corporate_id: string;
  password: string;
}

export interface Warehouse {
  uuid: string;
  name: string;
  priceTypeId: string;
  isdefault: boolean;
  isSale: boolean;
}

export interface ErpDetails {
  routeId: string;
  appLastVersion?: string;
  routeName: string;
  routeIMEI: string;
  routeRange: string;
  routeBussinesRegion: string | null;
  warehouses: Warehouse[];
  imeiCode?: string[];
}

// Client (Company/Partner) - шинэ бүтэц
export interface AuthClient {
  id: number;
  name: string;
  corporate_id: string;
  company_code: string;
  account_type: 'company' | 'individual';
  sub_type: 'partner' | 'customer' | 'supplier';
  is_active: boolean;
}

// Legacy AuthUser interface - backward compatibility
export interface AuthUser {
  id: number;
  name: string;
  email?: string;
  corporate_id?: string;
  company_code?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  client?: AuthClient;
  erp_details?: ErpDetails[];
}

export interface AuthError {
  message: string;
  errors?: Record<string, string[]>;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error: AuthError = await response.json().catch(() => ({
      message: 'Login failed. Please try again.',
    }));
    throw new Error(error.message || 'Authentication failed');
  }

  const data: AuthResponse = await response.json();

  // Store token, client and ERP details in localStorage
  if (typeof window !== 'undefined' && data.access_token) {
    localStorage.setItem('auth_token', data.access_token);

    // Store client info (convert to user format for backward compatibility)
    if (data.client) {
      const userCompat: AuthUser = {
        id: data.client.id,
        name: data.client.name,
        corporate_id: data.client.corporate_id,
        company_code: data.client.company_code,
        is_active: data.client.is_active,
      };
      localStorage.setItem('auth_user', JSON.stringify(userCompat));
      localStorage.setItem('auth_client', JSON.stringify(data.client));
    }

    // Store ERP details array - use first item for backward compatibility
    if (data.erp_details && data.erp_details.length > 0) {
      localStorage.setItem('erp_details', JSON.stringify(data.erp_details[0]));
      localStorage.setItem('erp_details_all', JSON.stringify(data.erp_details));
    }
  }

  return data;
}

export async function logout(): Promise<void> {
  const token = getToken();

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Clear local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_client');
    localStorage.removeItem('erp_details');
    localStorage.removeItem('erp_details_all');
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
}

export function getClient(): AuthClient | null {
  if (typeof window === 'undefined') return null;
  const client = localStorage.getItem('auth_client');
  return client ? JSON.parse(client) : null;
}

export function getErpDetails(): ErpDetails | null {
  if (typeof window === 'undefined') return null;
  const details = localStorage.getItem('erp_details');
  return details ? JSON.parse(details) : null;
}

export function getAllErpDetails(): ErpDetails[] {
  if (typeof window === 'undefined') return [];
  const details = localStorage.getItem('erp_details_all');
  return details ? JSON.parse(details) : [];
}

export function getRouteId(): string | null {
  const details = getErpDetails();
  return details?.routeId || null;
}

export function getDefaultWarehouse(): Warehouse | null {
  const details = getErpDetails();
  if (!details?.warehouses) return null;
  return details.warehouses.find(w => w.isdefault) || details.warehouses[0] || null;
}

export function getSalesWarehouse(): Warehouse | null {
  const details = getErpDetails();
  if (!details?.warehouses) return null;
  return details.warehouses.find(w => w.isSale) || null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
