/**
 * Partner Store
 * Zustand store for managing partners/customers state
 * 
 * ============================================================================
 * BUSINESS LOGIC DOCUMENTATION
 * ============================================================================
 * 
 * 1. МАРШРУТЫН ХАРИЛЦАГЧИД (Route Partners)
 *    - 1C ERP системээс /hs/ts/Tasks API-р татна
 *    - Гараг бүрт өөр өөр харилцагчид хуваарилагдсан байдаг
 *    - day параметр: 0=Даваа, 1=Мягмар, 2=Лхагва, 3=Пүрэв, 4=Баасан
 *    - username: Борлуулагчийн нэвтрэх нэр (user.username)
 * 
 * 2. БҮХ ХАРИЛЦАГЧИД (All Partners)
 *    - /hs/cl/Companies API-р татна
 *    - routeId-р шүүж, тухайн маршрутын бүх харилцагчийг харуулна
 *    - Хуудаслалт: 20 харилцагч/хуудас, infinite scroll
 * 
 * 3. ИРСЭН/ЗАЙ ХОЛ ТОДОРХОЙЛОХ ЛОГИК
 *    - coordinateRange = 1 үед: GPS шалгахгүй, шууд "Ирсэн" гэж тооцно
 *    - coordinateRange != 1 үед: routeRange (метрээр) дотор байвал "Ирсэн"
 *    - routeRange нь erpDetails[0].routeRange-с ирнэ (жишээ: 2000 = 2км)
 * 
 * 4. ХАЙЛТ (Search)
 *    - 1C ERP руу шууд хайлт илгээнэ (локал биш)
 *    - name болон companyCode талбараар хайна
 *    - 2+ тэмдэгт бичсэний дараа хайлт эхэлнэ
 * 
 * ============================================================================
 */
import { create } from 'zustand';
import { getPartners, getPartner, getTasksByDay } from '../services/api';
import { useAuthStore } from './auth-store';
import type { Partner, PartnerTabType } from '../types/partner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * DayOfWeek: Маршрутын өдөр
 * - 0 = Даваа (Monday)
 * - 1 = Мягмар (Tuesday)  
 * - 2 = Лхагва (Wednesday)
 * - 3 = Пүрэв (Thursday)
 * - 4 = Баасан (Friday)
 * 
 * BUSINESS RULE: Амралтын өдөр (Бямба, Ням) орвол Даваа (0) руу default хийнэ
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4;

/**
 * DAY_LABELS: Гарагуудын нэр (Монгол хэлээр)
 * - short: Товчлол (tabs дээр харуулах)
 * - full: Бүтэн нэр
 */
export const DAY_LABELS: { key: DayOfWeek; short: string; full: string }[] = [
  { key: 0, short: 'Да', full: 'Даваа' },
  { key: 1, short: 'Мя', full: 'Мягмар' },
  { key: 2, short: 'Лх', full: 'Лхагва' },
  { key: 3, short: 'Пү', full: 'Пүрэв' },
  { key: 4, short: 'Ба', full: 'Баасан' },
];

interface PartnerFilters {
  search: string;
  tab: PartnerTabType;
  day: DayOfWeek;
}

// Search results (separate from main partners list)
interface SearchState {
  searchResults: Partner[];
  isSearching: boolean;
  searchQuery: string;
}

interface PartnerState {
  // Partners
  partners: Partner[];
  selectedPartner: Partner | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  
  // Search state
  searchResults: Partner[];
  isSearching: boolean;
  searchQuery: string;
  
  // Pagination
  totalRecords: number;
  totalPages: number;
  currentPage: number;

  // Filters
  filters: PartnerFilters;

  // Current user location for distance calculation
  userLocation: { latitude: number; longitude: number } | null;

  // Actions
  fetchPartners: () => Promise<void>;
  fetchPartnersByDay: (day: DayOfWeek) => Promise<void>;
  loadMore: () => Promise<void>;
  searchPartners: (query: string) => Promise<void>;
  clearSearch: () => void;
  fetchPartner: (id: string) => Promise<void>;
  setSearch: (search: string) => void;
  setTab: (tab: PartnerTabType) => void;
  setDay: (day: DayOfWeek) => void;
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
  selectPartner: (partner: Partner | null) => void;
  refresh: () => Promise<void>;
  reset: () => void;
  
  // Computed
  getFilteredPartners: () => Partner[];
  getTabCounts: () => { all: number; visited: number; far: number };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * calculateDistance: Хоёр цэгийн хоорондох зайг тооцоолох (Haversine formula)
 * 
 * BUSINESS RULE: GPS координатаар харилцагч "Ирсэн" эсэхийг шалгахад ашиглана
 * 
 * @param lat1, lon1 - Борлуулагчийн байршил (GPS)
 * @param lat2, lon2 - Харилцагчийн байршил (1C-с ирсэн)
 * @returns Зай километрээр
 */
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * getTodayAsDay: Өнөөдрийн гарагыг DayOfWeek төрөл рүү хөрвүүлэх
 * 
 * BUSINESS RULE: 
 * - Ажлын өдрүүд (Даваа-Баасан): Тухайн өдрийн маршрут харагдана
 * - Амралтын өдрүүд (Бямба, Ням): Даваа гарагийн маршрут default харагдана
 * 
 * @returns DayOfWeek (0-4)
 */
function getTodayAsDay(): DayOfWeek {
  const jsDay = new Date().getDay(); // JavaScript: 0=Sun, 1=Mon, ..., 6=Sat
  
  // BUSINESS RULE: Амралтын өдөр (Ням=0, Бямба=6) бол Даваа (0) руу default хийнэ
  if (jsDay === 0 || jsDay === 6) return 0;
  
  // Convert: Mon(1)->0, Tue(2)->1, Wed(3)->2, Thu(4)->3, Fri(5)->4
  return (jsDay - 1) as DayOfWeek;
}

export const usePartnerStore = create<PartnerState>((set, get) => ({
  // Initial state
  partners: [],
  selectedPartner: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  
  // Search state
  searchResults: [],
  isSearching: false,
  searchQuery: '',
  
  // Pagination
  totalRecords: 0,
  totalPages: 0,
  currentPage: 1,

  filters: {
    search: '',
    tab: 'all',
    day: getTodayAsDay(), // Start with today's day
  },

  userLocation: null,

  // ==========================================================================
  // МАРШРУТЫН ХАРИЛЦАГЧИД - Tasks API
  // ==========================================================================
  
  /**
   * fetchPartnersByDay: Тухайн гарагийн маршрутын харилцагчдыг татах
   * 
   * BUSINESS RULE:
   * - 1C ERP: /hs/ts/Tasks?day={day}&username={username}
   * - Борлуулагч бүрт 5 өдрийн маршрут хуваарилагдсан
   * - day=0 бол Даваа гарагийн харилцагчид ирнэ
   * 
   * @param day - DayOfWeek (0-4)
   */
  fetchPartnersByDay: async (day: DayOfWeek) => {
    const authStore = useAuthStore.getState();
    const username = authStore.user?.username;
    
    if (!username) {
      set({ error: 'Дахин нэвтэрнэ үү (username олдсонгүй)', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null, hasMore: false });
    set(state => ({ filters: { ...state.filters, day } }));

    const { userLocation } = get();

    try {
      const result = await getTasksByDay(day, username);

      if (result.success && result.data) {
        // BUSINESS RULE: GPS байршлаар зай тооцоолох (Ирсэн/Зай хол тодорхойлоход)
        let partnersWithDistance = result.data;
        if (userLocation) {
          partnersWithDistance = result.data.map(partner => {
            if (partner.latitude && partner.longitude) {
              const distance = calculateDistance(
                userLocation.latitude, userLocation.longitude,
                partner.latitude, partner.longitude
              );
              return { ...partner, distance };
            }
            return partner;
          });
        }
        
        set({ 
          partners: partnersWithDistance, 
          totalRecords: result.totalRecords || 0,
          totalPages: 1,
          currentPage: 1,
          hasMore: false, // Tasks API хуудаслалтгүй, бүгдийг нэг дор татна
          isLoading: false 
        });
      } else {
        set({ error: result.error || 'Харилцагч татахад алдаа гарлаа', isLoading: false });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Сүлжээний алдаа', isLoading: false });
    }
  },

  // ==========================================================================
  // БҮХ ХАРИЛЦАГЧИД - Companies API
  // ==========================================================================

  /**
   * fetchPartners: Бүх харилцагчдыг татах (анхны хуудас)
   * 
   * BUSINESS RULE:
   * - 1C ERP: /hs/cl/Companies?routeId={routeId}&page={page}&pageSize=20
   * - routeId-р шүүнэ (тухайн борлуулагчийн маршрутын харилцагчид)
   * - Хуудаслалт: 20 харилцагч/хуудас
   */
  fetchPartners: async () => {
    const authStore = useAuthStore.getState();
    const routeId = authStore.erpDetails?.[0]?.routeId;
    const token = authStore.token;
    
    if (!routeId) {
      set({ error: 'Дахин нэвтэрнэ үү (routeId олдсонгүй)', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null, currentPage: 1, hasMore: true });

    const { userLocation } = get();

    try {
      const result = await getPartners(token || '', {
        routeId: routeId,
        page: 1,
        pageSize: 20,
      });

      if (result.success && result.data) {
        // Calculate distance for each partner if user location is available
        let partnersWithDistance = result.data;
        if (userLocation) {
          partnersWithDistance = result.data.map(partner => {
            if (partner.latitude && partner.longitude) {
              const distance = calculateDistance(
                userLocation.latitude, userLocation.longitude,
                partner.latitude, partner.longitude
              );
              return { ...partner, distance };
            }
            return partner;
          });
        }
        
        const totalPages = result.totalPages || 1;
        const hasMore = 1 < totalPages;
        
        set({ 
          partners: partnersWithDistance, 
          totalRecords: result.totalRecords || 0,
          totalPages: totalPages,
          currentPage: 1,
          hasMore: hasMore,
          isLoading: false 
        });
      } else {
        set({ error: result.error || 'Харилцагч татахад алдаа гарлаа', isLoading: false });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Сүлжээний алдаа', isLoading: false });
    }
  },

  /**
   * loadMore: Дараагийн хуудсыг татах (Infinite Scroll)
   * 
   * BUSINESS RULE:
   * - Хэрэглэгч жагсаалтыг доош гүйлгэхэд автоматаар дараагийн 20 харилцагчийг татна
   * - hasMore: false болтол татаж байна
   * - isLoadingMore: давхардсан дуудалтаас сэргийлнэ
   */
  loadMore: async () => {
    const { isLoadingMore, hasMore, currentPage, partners, userLocation } = get();
    
    // BUSINESS RULE: Давхар татахаас сэргийлэх (UX сайжруулалт)
    if (isLoadingMore || !hasMore) {
      return;
    }

    const authStore = useAuthStore.getState();
    const routeId = authStore.erpDetails?.[0]?.routeId;
    const token = authStore.token;
    
    if (!routeId) {
      return;
    }

    set({ isLoadingMore: true });

    // BUSINESS RULE: Хуудаслалт дараалал (page 2, 3, 4...)
    const nextPage = currentPage + 1;

    try {
      const result = await getPartners(token || '', {
        routeId: routeId,
        page: nextPage,
        pageSize: 20,
      });

      if (result.success && result.data) {
        // Calculate distance for each partner if user location is available
        let newPartners = result.data;
        if (userLocation) {
          newPartners = result.data.map(partner => {
            if (partner.latitude && partner.longitude) {
              const distance = calculateDistance(
                userLocation.latitude, userLocation.longitude,
                partner.latitude, partner.longitude
              );
              return { ...partner, distance };
            }
            return partner;
          });
        }
        
        const totalPages = result.totalPages || 1;
        const hasMoreData = nextPage < totalPages;
        
        set({ 
          partners: [...partners, ...newPartners],
          currentPage: nextPage,
          hasMore: hasMoreData,
          isLoadingMore: false 
        });
      } else {
        set({ isLoadingMore: false, hasMore: false });
      }
    } catch (error) {
      set({ isLoadingMore: false });
    }
  },

  // ==========================================================================
  // 1C ХАЙЛТ - Companies API (name, companyCode)
  // ==========================================================================

  /**
   * searchPartners: 1C ERP-ээс харилцагч хайх
   * 
   * BUSINESS RULE:
   * - name: Харилцагчийн нэрээр хайна (partial match)
   * - companyCode: Компанийн кодоор хайна (alphanumeric шалгана)
   * - 2 талбараар зэрэг хайгаад, давхардлыг арилгаж нэгтгэнэ
   * - Хамгийн багадаа 2 тэмдэгт бичсэн байх шаардлагатай
   */
  searchPartners: async (query: string) => {
    // BUSINESS RULE: Хэт богино хайлтыг хориглох (сервер ачаалал бууруулах)
    if (!query || query.length < 2) {
      set({ searchResults: [], searchQuery: '', isSearching: false });
      return;
    }

    const authStore = useAuthStore.getState();
    const routeId = authStore.erpDetails?.[0]?.routeId;
    const token = authStore.token;
    
    set({ isSearching: true, searchQuery: query });

    const { userLocation } = get();

    try {
      // BUSINESS RULE: companyCode нь тоо, үсэг, зураасаас бүрдэнэ (max 20 тэмдэгт)
      const isCodeSearch = /^[A-Za-z0-9-]+$/.test(query) && query.length <= 20;
      
      // 1. Нэрээр хайх
      const nameResult = await getPartners(token || '', {
        routeId: routeId || undefined,
        name: query,
        page: 1,
        pageSize: 50,
      });

      let results: Partner[] = nameResult.success && nameResult.data ? nameResult.data : [];

      // 2. Кодоор хайх (код шиг харагдаж байвал)
      if (isCodeSearch) {
        const codeResult = await getPartners(token || '', {
          routeId: routeId || undefined,
          companyCode: query,
          page: 1,
          pageSize: 50,
        });

        if (codeResult.success && codeResult.data) {
          // BUSINESS RULE: Давхардлыг ID-р шалгаж арилгана
          const existingIds = new Set(results.map(p => p.id));
          const newPartners = codeResult.data.filter(p => !existingIds.has(p.id));
          results = [...results, ...newPartners];
        }
      }

      // GPS зайг тооцоолох (Ирсэн/Зай хол тодорхойлоход ашиглагдана)
      if (userLocation && results.length > 0) {
        results = results.map(partner => {
          if (partner.latitude && partner.longitude) {
            const distance = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              partner.latitude, partner.longitude
            );
            return { ...partner, distance };
          }
          return partner;
        });
      }

      set({ searchResults: results, isSearching: false });
    } catch (error) {
      console.error('Search error:', error);
      set({ searchResults: [], isSearching: false });
    }
  },

  // Clear search
  clearSearch: () => {
    set({ searchResults: [], searchQuery: '', isSearching: false });
  },

  // Set search filter
  setSearch: (search: string) => {
    set((state) => ({
      filters: { ...state.filters, search },
    }));
  },

  // Fetch single partner
  fetchPartner: async (id: string) => {
    const authStore = useAuthStore.getState();
    const token = authStore.token;
    
    // First check if we already have this partner in the list
    const { partners } = get();
    const existingPartner = partners.find(p => p.id === id);
    if (existingPartner) {
      set({ selectedPartner: existingPartner });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await getPartner(token || '', id);

      if (result.success && result.data) {
        set({ selectedPartner: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Харилцагч олдсонгүй', isLoading: false });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Сүлжээний алдаа', isLoading: false });
    }
  },

  // Set tab filter
  setTab: (tab: PartnerTabType) => {
    set((state) => ({
      filters: { ...state.filters, tab },
    }));
  },

  // Set day filter and fetch partners for that day
  setDay: (day: DayOfWeek) => {
    get().fetchPartnersByDay(day);
  },

  // Set user location
  setUserLocation: (location) => {
    set({ userLocation: location });
    // Recalculate distances
    const { partners } = get();
    const partnersWithDistance = partners.map(partner => {
      if (partner.latitude && partner.longitude) {
        const distance = calculateDistance(
          location.latitude, location.longitude,
          partner.latitude, partner.longitude
        );
        return { ...partner, distance };
      }
      return partner;
    });
    set({ partners: partnersWithDistance });
  },

  // Select partner
  selectPartner: (partner: Partner | null) => {
    set({ selectedPartner: partner });
  },

  /**
   * refresh: Одоогийн гарагийн маршрутыг дахин татах
   */
  refresh: async () => {
    const { filters } = get();
    await get().fetchPartnersByDay(filters.day);
  },

  // Reset store
  reset: () => {
    set({
      partners: [],
      selectedPartner: null,
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      error: null,
      searchResults: [],
      isSearching: false,
      searchQuery: '',
      totalRecords: 0,
      totalPages: 0,
      currentPage: 1,
      filters: { search: '', tab: 'all', day: getTodayAsDay() },
    });
  },

  // ==========================================================================
  // ШҮҮЛТ БОЛОН ТОО ТООЦОО - getFilteredPartners, getTabCounts
  // ==========================================================================

  /**
   * getFilteredPartners: Харилцагчдыг tab-р шүүх
   * 
   * BUSINESS RULE - ИРСЭН/ЗАЙ ХОЛ ТОДОРХОЙЛОЛТ:
   * 
   * 1. coordinateRange = 1 бол:
   *    → Шууд "Ирсэн" гэж тооцно (GPS шалгахгүй)
   *    → Зарим харилцагчид GPS-гүй, гар утсаар захиалга өгдөг
   * 
   * 2. coordinateRange != 1 бол:
   *    → GPS зай <= routeRange бол "Ирсэн"
   *    → GPS зай > routeRange бол "Зай хол"
   *    → routeRange: 1C ERP-ээс ирнэ (ихэвчлэн 2000м = 2км)
   * 
   * TAB ШҮҮЛТҮҮД:
   * - 'all': Бүх харилцагч
   * - 'visited': Ирсэн (coordinateRange=1 ЭСВЭЛ зай <= routeRange)
   * - 'far': Зай хол (coordinateRange!=1 МӨНӨӨС ЗАЙ > routeRange)
   */
  getFilteredPartners: () => {
    const { partners, filters } = get();
    const authStore = useAuthStore.getState();
    
    // BUSINESS RULE: routeRange нь метрээр ирнэ, км руу хөрвүүлнэ
    const routeRangeKm = (parseInt(authStore.erpDetails?.[0]?.routeRange || '2000', 10)) / 1000;
    
    let filtered = partners;
    
    /**
     * isVisited: Харилцагч "Ирсэн" эсэхийг тодорхойлох
     * @param p - Partner объект
     * @returns true = Ирсэн, false = Зай хол
     * 
     * ШИЙДВЭРИЙН LOGIC:
     * - coordinateRange === 1 → true (GPS-гүй, автоматаар ирсэн)
     * - distance <= routeRangeKm → true (GPS-р ойрхон байна)
     * - Бусад → false (Зай хол)
     */
    const isVisited = (p: Partner) => {
      // BUSINESS RULE: coordinateRange=1 бол GPS шалгахгүй, шууд Ирсэн
      if (p.coordinateRange === 1) return true;
      // BUSINESS RULE: GPS зайг routeRange-тэй харьцуулах
      return p.distance !== undefined && p.distance <= routeRangeKm;
    };
    
    // Tab-р шүүх
    switch (filters.tab) {
      case 'visited':
        // Ирсэн: routeRange дотор ЭСВЭЛ coordinateRange=1
        filtered = filtered.filter(isVisited);
        break;
      case 'far':
        // Зай хол: routeRange-с хол МӨНӨӨС coordinateRange!=1
        filtered = filtered.filter(p => !isVisited(p));
        break;
    }
    
    // Локал хайлтаар шүүх (нэр, утас, хаяг)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.phone && p.phone.includes(filters.search)) ||
        (p.street1 && p.street1.toLowerCase().includes(searchLower)) ||
        (p.city && p.city.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  },

  /**
   * getTabCounts: Tab тус бүрийн харилцагчийн тоог тооцоолох
   * 
   * BUSINESS RULE:
   * - all: Нийт харилцагчийн тоо (API-с ирсэн totalRecords)
   * - visited: Ирсэн харилцагчийн тоо (coordinateRange=1 + GPS ойрхон)
   * - far: Зай хол харилцагчийн тоо (GPS холыг шүүсэн)
   */
  getTabCounts: () => {
    const { partners, totalRecords } = get();
    const authStore = useAuthStore.getState();
    // routeRange метрээр ирнэ, км руу хөрвүүлнэ
    const routeRangeKm = (parseInt(authStore.erpDetails?.[0]?.routeRange || '2000', 10)) / 1000;
    
    // isVisited: Дээрхтэй ижил логик
    const isVisited = (p: Partner) => {
      if (p.coordinateRange === 1) return true;
      return p.distance !== undefined && p.distance <= routeRangeKm;
    };
    
    const nearbyCount = partners.filter(isVisited).length;
    const farCount = partners.filter(p => !isVisited(p)).length;
    
    return {
      all: totalRecords || partners.length,
      visited: nearbyCount,
      far: farCount,
    };
  },
}));
