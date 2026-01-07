/**
 * Order Types - Matches ERP OrderDetail API Response
 * Used across web and mobile apps
 */

export interface ProductDiscountPoint {
    discountPointID: string;
    discountPointName: string;
    discountPointAmount: number;
}

export interface ProductStock {
    typeId: string;
    count: number;
}

export interface StockType {
    uuid: string;
    name: string;
    pcs: number;
}

export interface ProductBrand {
    uuid: string;
    name: string;
}

export interface ProductCategory {
    uuid: string;
    name: string;
}

export interface ProductPromotion {
    uuid: string;
    name: string;
}

export interface OrderDetailProduct {
    uuid: string;
    name: string;
    price: number;
    productCode?: string;
    imgUrl?: string;
    unit?: string;
    barcode?: string;
    cbm?: number;
    boxCount?: number;
    expiryDate?: string;
    stock: ProductStock[];
    stockTypes: StockType[];
    discountPoint: ProductDiscountPoint[];
    brand: ProductBrand;
    category: ProductCategory;
    moq: number;
    autoSale: number;
    manualSale: number;
    isUnderStock: boolean;
    promotions: ProductPromotion[];
}

export interface PromotionPointItem {
    promotionPointID: number;
    promotionPointName: string;
    promotionPointAmount: number;
}

export interface OrderDetail {
    uuid: string;
    date: string;
    orderCode: string;
    status: string;
    companyId: string;
    companyName: string;
    companyCode: string;
    warehouseId: string;
    totalAmount: number;
    loan: boolean;
    loanDescription: string;
    isPaid: boolean;
    delivery: string;
    registryNumber: string;
    description?: string;
    products: OrderDetailProduct[];
    promotionPoint: PromotionPointItem[];
    saleDocuments: unknown[];
}

// Order list item (for orders list page)
export interface OrderListItem {
    uuid: string;
    orderCode: string;
    date: string;
    status: string;
    companyName: string;
    totalAmount: number;
    productCount: number;
}

// Order create request
export interface OrderCreateRequest {
    username: string;
    companyId: string;
    warehouseId: string;
    products: Array<{
        uuid: string;
        count: number;
        typeId: string;
    }>;
    latitude?: string;
    longitude?: string;
    latitudeFinish?: string;
    longitudeFinish?: string;
    loan?: boolean;
    loanDescription?: string;
    paymentcheck: boolean;
}

// Order create response
export interface OrderCreateResponse {
    uuid: string;
    datetime: string;
    orderCode?: string;
}

// Print template options
export interface PrintTemplateOptions {
    /** Company logo URL */
    logoUrl?: string;
    /** Company name for header */
    companyName?: string;
    /** Company address */
    companyAddress?: string;
    /** Company phone */
    companyPhone?: string;
    /** Show product images */
    showImages?: boolean;
    /** Show discounts section */
    showDiscounts?: boolean;
    /** Show promotions section */
    showPromotions?: boolean;
    /** Language: 'mn' or 'en' */
    language?: 'mn' | 'en';
    /** Print date format */
    dateFormat?: 'full' | 'short';
}
