/**
 * Delivery App Auth Store
 * JWT authentication with employee_code + system_pin
 * API: http://cloud.local.maximus.mn/api/delivery/auth
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://cloud.local.maximus.mn/api/delivery';

// Worker types
export interface Department {
  id: number;
  name: string;
}

export interface Job {
  id: number;
  name: string;
}

export interface Worker {
  id: number;
  employee_code: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  worker_type: 'driver' | 'deliverer' | 'helper' | 'other';
  worker_type_label: string;
  is_available?: boolean;
  department?: Department | null;
  job?: Job | null;
}

export interface Car {
  id: number;
  plate: string;
  brand: string;
  model: string;
}

export interface TodayStats {
  total_orders: number;
  pending: number;
  in_progress: number;
  delivered: number;
  failed: number;
  total_amount: number;
  delivered_amount: number;
}

interface AuthState {
  worker: Worker | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (employeeCode: string, systemPin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      worker: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (employeeCode: string, systemPin: string) => {
        set({ isLoading: true, error: null });

        console.log('Delivery Auth: Starting login for employee code', employeeCode);

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ 
              employee_code: employeeCode, 
              system_pin: systemPin 
            }),
          });

          const data = await response.json();
          console.log('Delivery Auth: Login response', JSON.stringify(data, null, 2));

          if (response.ok && data.success && data.data?.token) {
            console.log('Delivery Auth: Login successful, worker:', data.data.worker.name);
            set({
              worker: data.data.worker,
              token: data.data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            const errorMsg = data.message || 'Нэвтрэхэд алдаа гарлаа';
            console.log('Delivery Auth: Login failed:', errorMsg);
            set({
              isLoading: false,
              error: errorMsg,
            });
            return false;
          }
        } catch (error) {
          console.error('Delivery Auth: Network error:', error);
          set({
            isLoading: false,
            error: 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу.',
          });
          return false;
        }
      },

      logout: async () => {
        const token = get().token;
        
        // Try to invalidate token on server
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
            console.log('Logout API error (ignored):', error);
          }
        }

        set({
          worker: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      getToken: () => {
        return get().token;
      },
    }),
    {
      name: 'delivery-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        worker: state.worker, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
