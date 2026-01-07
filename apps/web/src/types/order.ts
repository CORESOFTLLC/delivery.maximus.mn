/**
 * Order Types for 1C ERP Integration
 * 2-Step Order Process: Step 1 creates order, Step 2 finishes it
 */

// Product in order
export interface OrderProduct {
  productId: string;
  stock: Array<{
    typeId: string; // stockType uuid
    count: number;
  }>;
  priceType: string;
  sale: number; // discount percentage
  promotions: string[]; // promotion uuids
}

// Step 1: Create Order Request
export interface CreateOrderRequest {
  uuid: string; // Empty string for new order
  username: string;
  imei: string;
  companyId: string;
  contractId: string;
  paymentType: number; // 1 = cash, 2 = card, etc.
  cashAmount: number | null;
  warehouseId: string;
  deliveryType: number; // 1 = pickup, 2 = delivery
  deliveryDatetime: string; // "YYYY-MM-DD HH:mm:ss"
  deliveryAdditionalInfo: string;
  description: string;
  orderProducts: OrderProduct[];
  priceTypeId: string;
  paymentcheck: boolean;
  latitude: number;
  longitude: number;
  useDiscount: boolean;
  customerPriceTypeId: string;
  deliveryDate: string | null;
  isSale: boolean;
  start_date: string; // "YYYY-MM-DD HH:mm:ss"
  end_date: string; // "YYYY-MM-DD HH:mm:ss"
  mobileVersion: string;
}

// Step 1 Response
export interface CreateOrderResponse {
  success: boolean;
  uuid?: string; // New order UUID from ERP
  message?: string;
  error?: string;
}

// Step 2: Finish Order Request (extends Step 1 with additional fields)
export interface FinishOrderRequest extends CreateOrderRequest {
  uuid: string; // UUID from Step 1
  finishStep: true;
  latitudeFinish: number;
  longitudeFinish: number;
  paymentcheck: boolean; // true when finishing
  loan: boolean; // If paying by credit/loan
  loanDescription: string;
}

// Step 2 Response  
export interface FinishOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  message?: string;
  error?: string;
}

// Payment type mapping
export const PAYMENT_TYPES = {
  cash: 1,
  card: 2,
  transfer: 3,
  qpay: 4,
  loan: 5,
} as const;

// Delivery type mapping
export const DELIVERY_TYPES = {
  pickup: 1,
  delivery: 2,
} as const;

// Order status
export type OrderStatus = 'pending' | 'created' | 'finished' | 'failed';

// Complete order state
export interface OrderState {
  status: OrderStatus;
  uuid: string | null;
  step: 1 | 2;
  error: string | null;
}

// Order List Item (from /or/Order API)
export interface DiscountPointItem {
  discountPointNumber: string;
  discountPointDate: string;
  discountPointName: string;
  discountPointAmount: number;
}

export interface TotalDiscountPoint {
  totalAmount: number;
  discountList: DiscountPointItem[];
}

export interface PromoItem {
  name: string;
  promoName: string;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface TotalPromoPoint {
  totalPromoAmount: number;
  PromoList: PromoItem[];
}

export interface OrderListItem {
  id: string;
  uuid: string;
  orderNumber: string;
  date: string;
  status: string;
  statusCode: number;
  companyId: string;
  companyName: string;
  companyCode?: string;
  totalAmount: number;
  totalItems: number;
  warehouseName?: string;
  warehouseId?: string;
  deliveryType?: string;
  paymentType?: string;
  createdAt: string;
  poster?: boolean;
  loan?: boolean;
  paymentCheck?: boolean;
  // Discount & Promo
  totalDiscountPoint?: TotalDiscountPoint;
  totalPromoPoint?: TotalPromoPoint;
}

// Order List Request
export interface OrderListRequest {
  page: number;
  pageSize: number;
  username: string;
  startDate: string;
  endDate: string;
}

// Order List Response
export interface OrderListResponse {
  orders: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================
// ORDER DETAIL TYPES
// ==========================================

// Product Stock Type
export interface StockType {
  uuid: string;
  name: string; // PCS, PACK, BOX
  pcs: number;
}

// Product Stock
export interface ProductStock {
  typeId: string;
  count: number;
}

// Product Discount Point
export interface ProductDiscountPoint {
  discountPointID: string;
  discountPointName: string;
  discountPointAmount: number;
}

// Product Brand
export interface ProductBrand {
  uuid: string;
  name: string;
}

// Product Category
export interface ProductCategory {
  uuid: string;
  name: string;
}

// Product Promotion
export interface ProductPromotion {
  uuid: string;
  name: string;
}

// Order Detail Product
export interface OrderDetailProduct {
  uuid: string;
  name: string;
  price: number;
  stock: ProductStock[];
  stockTypes: StockType[];
  discountPoint: ProductDiscountPoint[];
  brand: ProductBrand;
  category: ProductCategory;
  promotions: ProductPromotion[];
  moq: number;
  autoSale: number;
  manualSale: number;
  isUnderStock: boolean;
}

// Order Detail Promotion Point
export interface OrderPromotionPoint {
  promotionPointID: number;
  promotionPointName: string;
  promotionPointAmount: number;
}

// Sale Document
export interface SaleDocument {
  uuid: string;
}

// Order Detail Response (from /od/OrderDetail API)
export interface OrderDetail {
  uuid: string;
  orderCode: string;
  date: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  registryNumber: string;
  warehouseId: string;
  totalAmount: number;
  status: string;
  loan: boolean;
  loanDescription: string;
  isLoanApprov: boolean;
  isLoanPerson: string;
  isLoanPersonName: string;
  isPaid: boolean;
  delivery: string;
  saleDocuments: SaleDocument[];
  promotionPoint: OrderPromotionPoint[];
  totalPromoPoint?: TotalPromoPoint;
  totalDiscountPoint?: TotalDiscountPoint;
  products: OrderDetailProduct[];
}

// Order Detail Request
export interface OrderDetailRequest {
  username: string;
  uuid: string;
}
