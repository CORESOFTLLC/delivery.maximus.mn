'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout, getToken, getUser, getErpDetails, LoginCredentials, AuthResponse } from '@/lib/auth';
import { useWarehouseStore } from '@/stores/warehouse-store';
import { useCartStore } from '@/stores/cart-store';

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  
  const { setErpDetails, clearAll: clearWarehouse } = useWarehouseStore();
  const { clearCart, clearSelectedPartner } = useCartStore();

  useEffect(() => {
    // Check auth status on mount
    const token = getToken();
    const savedUser = getUser();
    const erpDetails = getErpDetails();
    
    setIsAuthenticated(!!token);
    setUser(savedUser);
    
    // Restore ERP details to warehouse store
    if (erpDetails) {
      setErpDetails(erpDetails);
    }
  }, [setErpDetails]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiLogin(credentials);
      setIsAuthenticated(true);
      if (response.user) {
        setUser(response.user);
      }
      
      // Save ERP details to warehouse store
      if (response.erp_details) {
        setErpDetails(response.erp_details);
      }
      
      router.push('/dashboard');
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [router, setErpDetails]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setIsAuthenticated(false);
      setUser(null);
      
      // Clear warehouse and cart on logout
      clearWarehouse();
      clearCart();
      clearSelectedPartner();
      
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, clearWarehouse, clearCart, clearSelectedPartner]);

  return {
    isLoading,
    error,
    isAuthenticated,
    user,
    login,
    logout,
    setError,
  };
}
