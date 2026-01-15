/**
 * Warehouse Store
 * Manages selected warehouse with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Warehouse type (from ERP login response)
export interface Warehouse {
  uuid: string;
  name: string;
  priceTypeId: string;
  isdefault: boolean;
  isSale: boolean;
}

// ERP Details type
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

// Warehouse State
interface WarehouseState {
  // Data
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  erpDetails: ErpDetails | null;

  // Computed
  hasWarehouses: boolean;
  hasSelectedWarehouse: boolean;

  // Actions
  setErpDetails: (erpDetails: ErpDetails) => void;
  setWarehouses: (warehouses: Warehouse[]) => void;
  selectWarehouse: (warehouse: Warehouse) => void;
  selectWarehouseById: (uuid: string) => void;
  selectDefaultWarehouse: () => void;
  clearWarehouse: () => void;
  clearAll: () => void;

  // Getters
  getSelectedWarehouseId: () => string | null;
  getSelectedPriceTypeId: () => string | null;
  getRouteId: () => string | null;
  getRouteName: () => string | null;
}

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set, get) => ({
      // Initial state
      warehouses: [],
      selectedWarehouse: null,
      erpDetails: null,

      // Computed (derived from state)
      get hasWarehouses() {
        return get().warehouses.length > 0;
      },
      get hasSelectedWarehouse() {
        return get().selectedWarehouse !== null;
      },

      // Actions
      setErpDetails: (erpDetails: ErpDetails) => {
        set({
          erpDetails,
          warehouses: erpDetails.warehouses || [],
        });

        // Auto-select default warehouse if none selected
        const current = get().selectedWarehouse;
        if (!current && erpDetails.warehouses?.length > 0) {
          const defaultWh = erpDetails.warehouses.find(w => w.isdefault) || erpDetails.warehouses[0];
          set({ selectedWarehouse: defaultWh });
        }
      },

      setWarehouses: (warehouses: Warehouse[]) => {
        set({ warehouses });

        // Auto-select default warehouse if none selected
        const current = get().selectedWarehouse;
        if (!current && warehouses.length > 0) {
          const defaultWh = warehouses.find(w => w.isdefault) || warehouses[0];
          set({ selectedWarehouse: defaultWh });
        }
      },

      selectWarehouse: (warehouse: Warehouse) => {
        set({ selectedWarehouse: warehouse });
      },

      selectWarehouseById: (uuid: string) => {
        const warehouse = get().warehouses.find(w => w.uuid === uuid);
        if (warehouse) {
          set({ selectedWarehouse: warehouse });
        }
      },

      selectDefaultWarehouse: () => {
        const { warehouses } = get();
        if (warehouses.length > 0) {
          const defaultWh = warehouses.find(w => w.isdefault) || warehouses[0];
          set({ selectedWarehouse: defaultWh });
        }
      },

      clearWarehouse: () => {
        set({ selectedWarehouse: null });
      },

      clearAll: () => {
        set({
          warehouses: [],
          selectedWarehouse: null,
          erpDetails: null,
        });
      },

      // Getters
      getSelectedWarehouseId: () => {
        return get().selectedWarehouse?.uuid || null;
      },

      getSelectedPriceTypeId: () => {
        return get().selectedWarehouse?.priceTypeId || null;
      },

      getRouteId: () => {
        return get().erpDetails?.routeId || null;
      },

      getRouteName: () => {
        return get().erpDetails?.routeName || null;
      },
    }),
    {
      name: 'warehouse-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        warehouses: state.warehouses,
        selectedWarehouse: state.selectedWarehouse,
        erpDetails: state.erpDetails,
      }),
    }
  )
);

// Helper: Get warehouse display info
export function getWarehouseDisplayName(warehouse: Warehouse | null): string {
  if (!warehouse) return 'Агуулах сонгоогүй';
  return warehouse.name + (warehouse.isSale ? ' (Хямдралтай)' : '');
}
