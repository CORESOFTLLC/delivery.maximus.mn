/**
 * Warehouse Store
 * Агуулах сонголтыг удирдах Zustand store
 * 
 * ============================================================================
 * БИЗНЕС ЛОГИК
 * ============================================================================
 * 
 * 1. АГУУЛАХ СОНГОЛТ
 *    - Login үед erpDetails.warehouses-с агуулахуудын жагсаалт ирнэ
 *    - isdefault = true агуулах автоматаар сонгогдоно
 *    - Хэрэглэгч агуулах солих боломжтой
 * 
 * 2. ҮНЭ ӨӨРЧЛӨЛТ
 *    - Агуулах бүр өөр priceTypeId-тэй → өөр үнэтэй
 *    - isSale = true агуулах сонгоход бүх барааны үнэ 50% хямдарна
 *    - Агуулах солиход products дахин татна (үнэ, үлдэгдэл шинэчлэгдэнэ)
 * 
 * 3. САГСТАЙ ХАРИЛЦАА
 *    - Агуулах солиход сагс цэвэрлэгдэнэ (items = [])
 *    - Анхааруулга харуулна: "Агуулах солиход сагсны бараа устана"
 * 
 * 4. PERSIST
 *    - AsyncStorage-д хадгалагдана
 *    - App дахин нээхэд сонгосон агуулах хэвээр байна
 * 
 * 5. isSale ХЯМДРАЛ (50%)
 *    - isSale = true агуулах = хямдралтай үнээр борлуулна
 *    - Барааны жагсаалтад үндсэн үнэ + хямдралтай үнэ харагдана
 *    - Сагсанд нэмэхэд хямдралтай үнээр нэмнэ
 *    - Агуулах сонголтод "-50%" badge харагдана
 * 
 * ============================================================================
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Warehouse: Агуулахын мэдээлэл (ERP-с ирдэг)
 * 
 * БИЗНЕС ЛОГИК:
 * - priceTypeId → Энэ агуулахын үнийн төрөл (үнэ тооцоход ашиглана)
 * - isdefault → Үндсэн агуулах эсэх
 * - isSale → Хямдралтай үнээр борлуулах эсэх (true = 50% хямдрал)
 */
export interface Warehouse {
  uuid: string;
  name: string;
  priceTypeId: string;
  isdefault: boolean;
  isSale: boolean;
}

/**
 * ErpDetails: Нэвтрэх үед ERP-с ирдэг мэдээлэл
 */
export interface ErpDetails {
  routeId: string;
  appLastVersion?: string;
  routeName: string;
  routeIMEI: string;
  routeRange: string;
  routeBussinesRegion: string | null;
  warehouses: Warehouse[];
  imeiCode?: Array<{ routeIMEI: string }>;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface WarehouseState {
  // Data
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  erpDetails: ErpDetails | null;

  // Actions
  setErpDetails: (erpDetails: ErpDetails) => void;
  setWarehouses: (warehouses: Warehouse[]) => void;
  selectWarehouse: (warehouse: Warehouse) => boolean; // returns true if changed
  selectWarehouseById: (uuid: string) => boolean;
  selectDefaultWarehouse: () => void;
  clearWarehouse: () => void;
  clearAll: () => void;

  // Getters
  getSelectedWarehouseId: () => string | null;
  getSelectedPriceTypeId: () => string | null;
  getRouteId: () => string | null;
  getRouteName: () => string | null;
  getRouteRange: () => number;
  
  // Computed
  hasWarehouses: boolean;
  hasSelectedWarehouse: boolean;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set, get) => ({
      // Initial state
      warehouses: [],
      selectedWarehouse: null,
      erpDetails: null,
      hasWarehouses: false,
      hasSelectedWarehouse: false,

      /**
       * setErpDetails: Login үед ERP details хадгалах
       * 
       * БИЗНЕС ЛОГИК:
       * - warehouses жагсаалт хадгална
       * - Хэрэв агуулах сонгоогүй бол default агуулах автоматаар сонгоно
       */
      setErpDetails: (erpDetails: ErpDetails) => {
        const warehouses = erpDetails.warehouses || [];
        
        set({
          erpDetails,
          warehouses,
          hasWarehouses: warehouses.length > 0,
        });

        // Auto-select default warehouse if none selected
        const current = get().selectedWarehouse;
        if (!current && warehouses.length > 0) {
          const defaultWh = warehouses.find(w => w.isdefault) || warehouses[0];
          set({ 
            selectedWarehouse: defaultWh,
            hasSelectedWarehouse: true,
          });
        }
      },

      /**
       * setWarehouses: Агуулахуудын жагсаалт тохируулах
       */
      setWarehouses: (warehouses: Warehouse[]) => {
        set({ 
          warehouses,
          hasWarehouses: warehouses.length > 0,
        });

        // Auto-select default warehouse if none selected
        const current = get().selectedWarehouse;
        if (!current && warehouses.length > 0) {
          const defaultWh = warehouses.find(w => w.isdefault) || warehouses[0];
          set({ 
            selectedWarehouse: defaultWh,
            hasSelectedWarehouse: true,
          });
        }
      },

      /**
       * selectWarehouse: Агуулах сонгох
       * 
       * БИЗНЕС ЛОГИК:
       * - Өөр агуулах сонгоход true буцаана (сагс цэвэрлэх шаардлагатай)
       * - Ижил агуулах сонгоход false буцаана
       * 
       * @returns boolean - агуулах өөрчлөгдсөн эсэх
       */
      selectWarehouse: (warehouse: Warehouse): boolean => {
        const current = get().selectedWarehouse;
        const isChanged = current?.uuid !== warehouse.uuid;
        
        set({ 
          selectedWarehouse: warehouse,
          hasSelectedWarehouse: true,
        });
        
        return isChanged;
      },

      /**
       * selectWarehouseById: UUID-р агуулах сонгох
       */
      selectWarehouseById: (uuid: string): boolean => {
        const warehouse = get().warehouses.find(w => w.uuid === uuid);
        if (warehouse) {
          return get().selectWarehouse(warehouse);
        }
        return false;
      },

      /**
       * selectDefaultWarehouse: Default агуулах сонгох
       */
      selectDefaultWarehouse: () => {
        const { warehouses } = get();
        if (warehouses.length > 0) {
          const defaultWh = warehouses.find(w => w.isdefault) || warehouses[0];
          set({ 
            selectedWarehouse: defaultWh,
            hasSelectedWarehouse: true,
          });
        }
      },

      /**
       * clearWarehouse: Агуулах сонголт цэвэрлэх
       */
      clearWarehouse: () => {
        set({ 
          selectedWarehouse: null,
          hasSelectedWarehouse: false,
        });
      },

      /**
       * clearAll: Бүх мэдээлэл цэвэрлэх (logout үед)
       */
      clearAll: () => {
        set({
          warehouses: [],
          selectedWarehouse: null,
          erpDetails: null,
          hasWarehouses: false,
          hasSelectedWarehouse: false,
        });
      },

      // ========================================================================
      // GETTERS
      // ========================================================================

      getSelectedWarehouseId: () => {
        return get().selectedWarehouse?.uuid || null;
      },

      /**
       * getSelectedPriceTypeId: Сонгосон агуулахын үнийн төрөл
       * 
       * БИЗНЕС ЛОГИК:
       * - Products API руу энэ priceTypeId илгээнэ
       * - Үнэ энэ төрлөөр тооцоологдоно
       */
      getSelectedPriceTypeId: () => {
        return get().selectedWarehouse?.priceTypeId || null;
      },

      getRouteId: () => {
        return get().erpDetails?.routeId || null;
      },

      getRouteName: () => {
        return get().erpDetails?.routeName || null;
      },

      /**
       * getRouteRange: Маршрутын радиус (метрээр)
       * 
       * БИЗНЕС ЛОГИК:
       * - Partner-н coordinateRange != 1 үед энэ радиус дотор байвал "Ирсэн"
       * - Default: 2000 метр = 2 км
       */
      getRouteRange: () => {
        const range = get().erpDetails?.routeRange;
        return range ? parseInt(range, 10) : 2000;
      },
    }),
    {
      name: 'warehouse-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedWarehouse: state.selectedWarehouse,
        warehouses: state.warehouses,
        erpDetails: state.erpDetails,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasWarehouses = state.warehouses.length > 0;
          state.hasSelectedWarehouse = !!state.selectedWarehouse;
        }
      },
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectWarehouse = (state: WarehouseState) => state.selectedWarehouse;
export const selectWarehouses = (state: WarehouseState) => state.warehouses;
export const selectPriceTypeId = (state: WarehouseState) => state.selectedWarehouse?.priceTypeId;
