/**
 * Auth Store
 * Mobile authentication state management with Zustand
 */

import { create } from 'zustand';
import type { User, AuthResponse } from '@sales/shared';
import { login as authLogin } from '@sales/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    console.log('Auth Store: Starting login for', email);

    try {
      const result = await authLogin({ email, password });
      console.log('Auth Store: Login result', JSON.stringify(result, null, 2));

      if (result.success && result.data) {
        console.log('Auth Store: Login successful, user:', result.data.user.name);
        set({
          user: result.data.user,
          token: result.data.access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        console.log('Auth Store: Login failed', result.error);
        // Mongolian error messages
        let errorMessage = result.error || 'Нэвтрэхэд алдаа гарлаа';
        
        // Translate common errors to Mongolian
        if (result.error?.includes('credentials') || result.error?.includes('401')) {
          errorMessage = 'Нэр эсвэл нууц үг буруу байна';
        } else if (result.error?.includes('network') || result.error?.includes('fetch')) {
          errorMessage = 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу';
        }

        set({
          isLoading: false,
          error: errorMessage,
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: 'Сүлжээний алдаа. Дахин оролдоно уу',
      });
      return false;
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
