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
