/**
 * ХАРИЛЦАГЧИЙН ЗАГВАР БАРАА STORE
 * 
 * Бизнес логик:
 * - Харилцагч бүрт тусдаа загвар бараа хадгалах
 * - SQLite локал баазад хадгалах
 * - Өөр харилцагч дээр өөр загвар бараанууд
 * 
 * Хэрэглээ:
 * - Partner detail → Загвар таб дээр бараа нэмэх/хасах
 * - Захиалга үүсгэхэд загвар барааг сагсанд нэмэх
 */

import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';

// Template бараа төрөл
export interface TemplateProduct {
    id: string;
    partnerId: string;
    productId: string;
    productName: string;
    productPrice: number;
    productMoq: number;
    quantity: number; // default quantity
    stockTypeId?: string;
    stockTypeName?: string;
    brandName?: string;
    categoryName?: string;
    createdAt: string;
    updatedAt: string;
}

interface TemplateStore {
    // State
    templates: TemplateProduct[];
    isLoading: boolean;
    isInitialized: boolean;

    // Database
    initDatabase: () => Promise<void>;

    // Actions
    loadTemplates: (partnerId: string) => Promise<void>;
    addToTemplate: (partnerId: string, product: Omit<TemplateProduct, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    removeFromTemplate: (partnerId: string, productId: string) => Promise<void>;
    updateQuantity: (partnerId: string, productId: string, quantity: number) => Promise<void>;
    clearTemplate: (partnerId: string) => Promise<void>;

    // Helpers
    isInTemplate: (partnerId: string, productId: string) => boolean;
    getTemplateCount: (partnerId: string) => number;
}

let db: SQLite.SQLiteDatabase | null = null;

const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('maximus_delivery.db');
    }
    return db;
};

export const useTemplateStore = create<TemplateStore>((set, get) => ({
    templates: [],
    isLoading: false,
    isInitialized: false,

    // Initialize database and create tables
    initDatabase: async () => {
        try {
            const database = await getDatabase();

            // Create templates table
            await database.execAsync(`
        CREATE TABLE IF NOT EXISTS partner_templates (
          id TEXT PRIMARY KEY,
          partner_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          product_price REAL NOT NULL,
          product_moq INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          stock_type_id TEXT,
          stock_type_name TEXT,
          brand_name TEXT,
          category_name TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(partner_id, product_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_partner_templates_partner_id 
        ON partner_templates(partner_id);
      `);

            set({ isInitialized: true });
            console.log('🔵 Template DB initialized');
        } catch (error) {
            console.error('❌ Template DB init error:', error);
        }
    },

    // Load templates for a specific partner
    loadTemplates: async (partnerId: string) => {
        set({ isLoading: true });

        try {
            const database = await getDatabase();

            const results = await database.getAllAsync<{
                id: string;
                partner_id: string;
                product_id: string;
                product_name: string;
                product_price: number;
                product_moq: number;
                quantity: number;
                stock_type_id: string | null;
                stock_type_name: string | null;
                brand_name: string | null;
                category_name: string | null;
                created_at: string;
                updated_at: string;
            }>(
                'SELECT * FROM partner_templates WHERE partner_id = ? ORDER BY created_at DESC',
                [partnerId]
            );

            const templates: TemplateProduct[] = results.map(row => ({
                id: row.id,
                partnerId: row.partner_id,
                productId: row.product_id,
                productName: row.product_name,
                productPrice: row.product_price,
                productMoq: row.product_moq,
                quantity: row.quantity,
                stockTypeId: row.stock_type_id || undefined,
                stockTypeName: row.stock_type_name || undefined,
                brandName: row.brand_name || undefined,
                categoryName: row.category_name || undefined,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));

            set({ templates, isLoading: false });
            console.log(`🔵 Loaded ${templates.length} templates for partner ${partnerId}`);
        } catch (error) {
            console.error('❌ Load templates error:', error);
            set({ isLoading: false });
        }
    },

    // Add product to template
    addToTemplate: async (partnerId, product) => {
        try {
            const database = await getDatabase();
            const now = new Date().toISOString();
            const id = `${partnerId}_${product.productId}_${Date.now()}`;

            await database.runAsync(
                `INSERT OR REPLACE INTO partner_templates 
         (id, partner_id, product_id, product_name, product_price, product_moq, 
          quantity, stock_type_id, stock_type_name, brand_name, category_name, 
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    partnerId,
                    product.productId,
                    product.productName,
                    product.productPrice,
                    product.productMoq,
                    product.quantity,
                    product.stockTypeId || null,
                    product.stockTypeName || null,
                    product.brandName || null,
                    product.categoryName || null,
                    now,
                    now,
                ]
            );

            // Reload templates
            await get().loadTemplates(partnerId);
            console.log(`🔵 Added ${product.productName} to template`);
        } catch (error) {
            console.error('❌ Add to template error:', error);
        }
    },

    // Remove product from template
    removeFromTemplate: async (partnerId, productId) => {
        try {
            const database = await getDatabase();

            await database.runAsync(
                'DELETE FROM partner_templates WHERE partner_id = ? AND product_id = ?',
                [partnerId, productId]
            );

            // Update local state
            const templates = get().templates.filter(
                t => !(t.partnerId === partnerId && t.productId === productId)
            );
            set({ templates });

            console.log(`🔵 Removed product ${productId} from template`);
        } catch (error) {
            console.error('❌ Remove from template error:', error);
        }
    },

    // Update quantity
    updateQuantity: async (partnerId, productId, quantity) => {
        try {
            const database = await getDatabase();
            const now = new Date().toISOString();

            await database.runAsync(
                'UPDATE partner_templates SET quantity = ?, updated_at = ? WHERE partner_id = ? AND product_id = ?',
                [quantity, now, partnerId, productId]
            );

            // Update local state
            const templates = get().templates.map(t =>
                t.partnerId === partnerId && t.productId === productId
                    ? { ...t, quantity, updatedAt: now }
                    : t
            );
            set({ templates });

            console.log(`🔵 Updated quantity to ${quantity}`);
        } catch (error) {
            console.error('❌ Update quantity error:', error);
        }
    },

    // Clear all templates for a partner
    clearTemplate: async (partnerId) => {
        try {
            const database = await getDatabase();

            await database.runAsync(
                'DELETE FROM partner_templates WHERE partner_id = ?',
                [partnerId]
            );

            set({ templates: [] });
            console.log(`🔵 Cleared templates for partner ${partnerId}`);
        } catch (error) {
            console.error('❌ Clear template error:', error);
        }
    },

    // Check if product is in template
    isInTemplate: (partnerId, productId) => {
        return get().templates.some(
            t => t.partnerId === partnerId && t.productId === productId
        );
    },

    // Get template count for partner
    getTemplateCount: (partnerId) => {
        return get().templates.filter(t => t.partnerId === partnerId).length;
    },
}));
