/**
 * Auth Store
 * Mobile authentication state management with Zustand
 * Uses same API as web: https://cloud.maximus.mn/api/salesapp/auth/login
 */

import { create } from 'zustand';

const API_BASE_URL = 'https://cloud.maximus.mn/api/salesapp';

// Types matching actual API response
export interface SalesAppUser {
  id: number;
  name: string;
  username: string;
  account_type: string;
  sub_type: string;
  is_active: boolean;
}

export interface ErpDetails {
  routeId: string;
  appLastVersion: string;
  routeName: string;
  routeIMEI: string;
  routeRange: string;
  routeBussinesRegion: string;
  warehouses: Array<{
    uuid: string;
    name: string;
    priceTypeId: string;
    isdefault: boolean;
    isSale: boolean;
  }>;
  imeiCode: Array<{
    routeIMEI: string;
  }>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  salesapp: SalesAppUser;
  erp_details: ErpDetails[];
}

interface AuthState {
  user: SalesAppUser | null;
  erpDetails: ErpDetails[] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  erpDetails: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    console.log('Auth Store: Starting login for', username);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Auth Store: Login response', JSON.stringify(data, null, 2));

      if (response.ok && data.access_token) {
        console.log('Auth Store: Login successful, user:', data.salesapp.name);
        set({
          user: data.salesapp,
          erpDetails: data.erp_details,
          token: data.access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        console.log('Auth Store: Login failed', data.message || data.error);
        // Mongolian error messages
        let errorMessage = data.message || data.error || 'Нэвтрэхэд алдаа гарлаа';
        
        // Translate common errors to Mongolian
        if (response.status === 401 || errorMessage.toLowerCase().includes('credentials')) {
          errorMessage = 'Нэр эсвэл нууц үг буруу байна';
        } else if (response.status === 422) {
          errorMessage = 'Мэдээлэл дутуу байна';
        }

        set({
          isLoading: false,
          error: errorMessage,
        });
        return false;
      }
    } catch (error) {
      console.log('Auth Store: Network error', error);
      set({
        isLoading: false,
        error: 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу',
      });
      return false;
    }
  },

  logout: () => {
    set({
      user: null,
      erpDetails: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
