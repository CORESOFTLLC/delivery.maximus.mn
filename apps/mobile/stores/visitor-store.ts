/**
 * Visitor Store - Зочилсон баримтын төлөв удирдах
 * 
 * БИЗНЕС ЛОГИК:
 * - Тухайн өдөр харилцагч дээр зочилсон эсэхийг шалгах
 * - Зочилсон бол isRight: true -> зайнаас захиалга үүсгэж болно
 * - Шинэ өдөр эхлэхэд reset хийх
 */

import { create } from 'zustand';
import { getVisitors, createVisitor, CreateVisitorRequest, Visitor } from '../services/api';

interface VisitedPartner {
    partnerId: string;
    visitedAt: string; // ISO date string
    visitorUuid?: string;
}

interface VisitorState {
    // State
    visitors: Visitor[];
    visitedToday: Map<string, VisitedPartner>; // partnerId -> VisitedPartner
    isLoading: boolean;
    isCreating: boolean;
    error: string | null;
    lastFetchDate: string | null;

    // Actions
    fetchVisitors: (routeId: string, page?: number) => Promise<void>;
    markAsVisited: (data: CreateVisitorRequest) => Promise<{ success: boolean; error?: string }>;
    isPartnerVisitedToday: (partnerId: string) => boolean;
    resetIfNewDay: () => void;
    clearError: () => void;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useVisitorStore = create<VisitorState>((set, get) => ({
    // Initial State
    visitors: [],
    visitedToday: new Map(),
    isLoading: false,
    isCreating: false,
    error: null,
    lastFetchDate: null,

    /**
     * Зочилсон жагсаалт татах
     */
    fetchVisitors: async (routeId: string, page: number = 1) => {
        set({ isLoading: true, error: null });

        try {
            const result = await getVisitors(routeId, page);

            if (result.success && result.data) {
                const visitors = result.data;
                const today = getTodayDate();

                // Build visitedToday map from today's visitors
                const visitedToday = new Map<string, VisitedPartner>();

                visitors.forEach(visitor => {
                    // Check if visitor was created today
                    const visitorDate = visitor.date || visitor.createdAt || '';

                    // Skip if no date
                    if (!visitorDate) return;

                    let isToday = false;
                    try {
                        isToday = visitorDate.startsWith(today) ||
                            new Date(visitorDate).toISOString().split('T')[0] === today;
                    } catch {
                        // Invalid date format, skip
                        isToday = false;
                    }

                    if (isToday) {
                        visitedToday.set(visitor.customerId, {
                            partnerId: visitor.customerId,
                            visitedAt: visitorDate,
                            visitorUuid: visitor.uuid,
                        });
                    }
                });

                console.log(`✅ Loaded ${visitors.length} visitors, ${visitedToday.size} visited today`);

                set({
                    visitors,
                    visitedToday,
                    lastFetchDate: today,
                    isLoading: false
                });
            } else {
                set({
                    error: result.error || 'Failed to fetch visitors',
                    isLoading: false
                });
            }
        } catch (error) {
            console.error('fetchVisitors error:', error);
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                isLoading: false
            });
        }
    },

    /**
     * Харилцагчийг зочилсон гэж тэмдэглэх
     */
    markAsVisited: async (data: CreateVisitorRequest) => {
        set({ isCreating: true, error: null });

        try {
            const result = await createVisitor(data);

            if (result.success) {
                const today = getTodayDate();
                const visitedToday = new Map(get().visitedToday);

                visitedToday.set(data.customerId, {
                    partnerId: data.customerId,
                    visitedAt: new Date().toISOString(),
                    visitorUuid: result.data?.uuid,
                });

                // Also add to visitors list
                const visitors = [...get().visitors];
                if (result.data) {
                    visitors.unshift(result.data);
                }

                console.log(`✅ Marked partner ${data.customerId} as visited`);

                set({
                    visitedToday,
                    visitors,
                    isCreating: false
                });

                return { success: true };
            } else {
                set({
                    error: result.error || 'Failed to create visitor',
                    isCreating: false
                });
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('markAsVisited error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({
                error: errorMessage,
                isCreating: false
            });
            return { success: false, error: errorMessage };
        }
    },

    /**
     * Тухайн өдөр харилцагч дээр зочилсон эсэхийг шалгах
     */
    isPartnerVisitedToday: (partnerId: string) => {
        // Check if new day, reset if needed
        const today = getTodayDate();
        const lastFetchDate = get().lastFetchDate;

        if (lastFetchDate && lastFetchDate !== today) {
            // New day, clear visited today
            set({ visitedToday: new Map(), lastFetchDate: today });
            return false;
        }

        return get().visitedToday.has(partnerId);
    },

    /**
     * Шинэ өдөр эхэлсэн бол reset хийх
     */
    resetIfNewDay: () => {
        const today = getTodayDate();
        const lastFetchDate = get().lastFetchDate;

        if (lastFetchDate && lastFetchDate !== today) {
            console.log('🔄 New day detected, resetting visited today');
            set({
                visitedToday: new Map(),
                lastFetchDate: today
            });
        }
    },

    /**
     * Алдаа цэвэрлэх
     */
    clearError: () => set({ error: null }),
}));
