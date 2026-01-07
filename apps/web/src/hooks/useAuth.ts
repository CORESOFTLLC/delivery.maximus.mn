'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout, getToken, getUser, getClient, getErpDetails, getAllErpDetails, LoginCredentials, AuthResponse, AuthClient, AuthUser } from '@/lib/auth';
import { useWarehouseStore } from '@/stores/warehouse-store';
import { useCartStore } from '@/stores/cart-store';

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [client, setClient] = useState<AuthClient | null>(null);

  const { setErpDetails, clearAll: clearWarehouse } = useWarehouseStore();
  const { clearCart, clearSelectedPartner } = useCartStore();

  useEffect(() => {
    // Check auth status on mount
    const token = getToken();
    const savedUser = getUser();
    const savedClient = getClient();
    const erpDetails = getErpDetails();

    setIsAuthenticated(!!token);
    setUser(savedUser);
    setClient(savedClient);

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

      // Set client info
      if (response.client) {
        setClient(response.client);
        // Also set user for backward compatibility
        setUser({
          id: response.client.id,
          name: response.client.name,
          corporate_id: response.client.corporate_id,
          company_code: response.client.company_code,
          is_active: response.client.is_active,
        });
      }

      // Save ERP details to warehouse store (use first item from array)
      if (response.erp_details && response.erp_details.length > 0) {
        setErpDetails(response.erp_details[0]);
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
      setClient(null);

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
    client,
    login,
    logout,
    setError,
  };
}
