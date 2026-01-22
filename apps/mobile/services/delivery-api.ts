/**
 * Delivery App API Service
 * REST API for delivery mobile app
 * 
 * Base URL: https://cloud.local.maximus.mn/api/delivery
 * 
 * Modules:
 * - Auth: Login, Logout, Refresh, Me
 * - Worker: Profile, Orders, Location
 * - Orders: Detail, Products, Status updates
 * - Warehouse: Product checking (Нярав/Жолооч тулгалт)
 * - Shop: Delivery completion, Payment
 * - Statuses: Reference data
 */

import { useAuthStore } from '../stores/delivery-auth-store';

const API_BASE_URL = 'http://cloud.local.maximus.mn/api/delivery';

// ==========================================================================
// TYPES
// ==========================================================================

export interface Customer {
  uuid: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  business_region: string | null;
  latitude: number | null;
  longitude: number | null;
  what3words: string | null;
}

export interface Warehouse {
  uuid: string | null;
  name: string;
}

export interface OrderCheckSummary {
  total_products: number;
  total_quantity: number;
  warehouse_checked_quantity: number;
  driver_checked_quantity: number;
  is_warehouse_fully_checked: boolean;
  is_driver_fully_checked: boolean;
}

export interface DeliveryOrder {
  uuid: string;
  sort_order: number | null;
  order_code: string;
  date: string;
  distance_km: number | null;
  customer: Customer;
  total_amount: string;
  total_amount_formatted: string;
  warehouse: Warehouse;
  delivery_status: string;
  delivery_status_label: string;
  delivery_status_color: string;
  assigned_at: string | null;
  delivered_at: string | null;
  registry_number?: string;
  payment_check?: boolean;
  total_discount_point?: boolean;
  total_discount_point_amount?: string;
  total_promo_amount?: string;
  delivery_notes?: string | null;
  check_summary?: OrderCheckSummary;
}

export interface OrderProduct {
  id: number;
  product_uuid: string;
  name: string;
  barcode: string | null;
  quantity: number;
  price: string;
  auto_sale: string;
  manual_sale: string;
  auto_discount_percent: string;
  auto_discount_description: string;
  manual_discount_percent: string;
  manual_discount_description: string;
  total_amount: string;
  canceled: boolean;
  promotions: any[];
  warehouse_checked: boolean;
  warehouse_checked_at: string | null;
  warehouse_checked_quantity: number;
  driver_checked: boolean;
  driver_checked_at: string | null;
  driver_checked_quantity: number;
  delivered_quantity: number;
  returned_quantity: number;
  delivery_notes: string | null;
}

export interface OrderSummary {
  total_items: number;
  total_amount: string;
  products_count: number;
}

export interface DeliveryStatus {
  value: string;
  label: string;
  color: string;
  icon: string;
}

export interface TodayStats {
  total_orders: number;
  pending: number;
  in_progress: number;
  delivered: number;
  failed: number;
  total_amount: number;
  delivered_amount: number;
}

export interface WorkerProfile {
  worker: {
    id: number;
    name: string;
    phone: string | null;
    avatar: string | null;
    worker_type: string;
    worker_type_label: string;
    is_available: boolean;
  };
  car: {
    id: number;
    plate: string;
    brand: string;
    model: string;
  } | null;
  today_stats: TodayStats;
}

// New types for delivery summary with package info
export interface DeliveryPackage {
  id?: number;
  name: string;
  delivery_date: string;
  formatted_date?: string;
  status?: string;
  status_label?: string;
}

export interface WarehouseSummary {
  total: number;
  pending: number;
  warehouse_checking: number;
  warehouse_checked: number;
  driver_checking: number;
}

export interface DeliveryProgressSummary {
  total: number;
  loaded: number;
  in_progress: number;
  delivered: number;
  failed: number;
  total_amount: number;
  delivered_amount: number;
}

export interface DeliverySummaryData {
  package: DeliveryPackage;
  worker: {
    id: number;
    name: string;
    worker_type: string;
    worker_type_label: string;
  };
  warehouse_summary: WarehouseSummary;
  delivery_summary: DeliveryProgressSummary;
  overall: {
    total_orders: number;
    total_amount: number;
  };
}

// Extended orders response with package info and status counts
export interface OrdersResponseData {
  date: string;
  package: DeliveryPackage | null;
  total_count: number;
  status_counts: {
    pending: number;
    assigned_to_driver: number;
    warehouse_checking: number;
    warehouse_checked: number;
    driver_checking: number;
    loaded: number;
    in_progress: number;
    delivered: number;
    failed: number;
  };
  orders: DeliveryOrder[];
}

// ==========================================================================
// API HELPERS
// ==========================================================================

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = useAuthStore.getState().token;
  
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || `HTTP Error: ${response.status}` 
      };
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return { 
      success: false, 
      message: 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу.' 
    };
  }
}

// ==========================================================================
// WORKER MODULE
// ==========================================================================

/**
 * Get worker profile and today's stats
 */
export async function getWorkerProfile(workerId?: number): Promise<{ success: boolean; data?: WorkerProfile; message?: string }> {
  const params = workerId ? `?worker_id=${workerId}` : '';
  return apiRequest<WorkerProfile>(`/worker/profile${params}`);
}

// Package list item type
export interface PackageListItem {
  id: number;
  name: string;
  delivery_date: string;
  formatted_date: string;
  status: string | null;
  status_label: string | null;
  total_orders: number;
  warehouse_pending: number;
  delivery_pending: number;
  delivered: number;
  total_amount: number;
  orders?: DeliveryOrder[];
}

export interface PackagesListData {
  total_count: number;
  packages: PackageListItem[];
}

export interface PackageOrdersData {
  package: DeliveryPackage;
  total_count: number;
  status_counts: {
    assigned_to_driver: number;
    warehouse_checking: number;
    warehouse_checked: number;
    driver_checking: number;
    loaded: number;
    in_progress: number;
    delivered: number;
    failed: number;
  };
  orders: DeliveryOrder[];
}

// Package products types (Box checking method)
export interface ProductOrderDetail {
  erp_order_uuid: string;
  order_code: string;
  customer_name: string | null;
  quantity: number;
  product_line_id: number;
  warehouse_checked: boolean;
  warehouse_checked_quantity: number;
  driver_checked: boolean;
  driver_checked_quantity: number;
}

export interface AggregatedProduct {
  product_uuid: string;
  name: string;
  barcode: string | null;
  article: string | null;
  brand: string | null;
  brand_name: string | null;
  serial_number: string | null;
  has_serial: boolean;
  unit_price: string;
  total_quantity: number;
  warehouse_checked_quantity: number;
  driver_checked_quantity: number;
  is_warehouse_fully_checked: boolean;
  is_driver_fully_checked: boolean;
  orders_count: number;
  order_details: ProductOrderDetail[];
}

export interface PackageProductsSummary {
  total_products: number;
  products_with_serial: number;
  products_without_serial: number;
  total_quantity: number;
  warehouse_checked_quantity: number;
  driver_checked_quantity: number;
  orders_count: number;
}

export interface PackageProductsData {
  package: DeliveryPackage;
  summary: PackageProductsSummary;
  products_with_serial: AggregatedProduct[];
  products_without_serial: AggregatedProduct[];
  all_products: AggregatedProduct[];
}

/**
 * Get worker's packages list (Багцуудын жагсаалт)
 */
export async function getWorkerPackages(workerId?: number): Promise<{ success: boolean; data?: PackagesListData; message?: string }> {
  const params = workerId ? `?worker_id=${workerId}` : '';
  return apiRequest<PackagesListData>(`/worker/packages${params}`);
}

/**
 * Get orders for a specific package (Тухайн багцын захиалгууд)
 * @param startLatitude User's current latitude for distance calculation
 * @param startLongitude User's current longitude for distance calculation
 */
export async function getPackageOrders(params: {
  packageId: number;
  workerId?: number;
  status?: string;
  startLatitude?: number;
  startLongitude?: number;
}): Promise<{ success: boolean; data?: PackageOrdersData; message?: string }> {
  const queryParams = new URLSearchParams();
  if (params.workerId) queryParams.append('worker_id', params.workerId.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.startLatitude) queryParams.append('start_latitude', params.startLatitude.toString());
  if (params.startLongitude) queryParams.append('start_longitude', params.startLongitude.toString());
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest<PackageOrdersData>(`/worker/packages/${params.packageId}/orders${query}`);
}

/**
 * Get consolidated products for a package (Хайрцагаар тулгах)
 * Багцын бүх захиалгуудын бараануудыг нэгтгэж буцаах
 */
export async function getPackageProducts(params: {
  packageId: number;
  workerId?: number;
  status?: string;
}): Promise<{ success: boolean; data?: PackageProductsData; message?: string }> {
  const queryParams = new URLSearchParams();
  if (params.workerId) queryParams.append('worker_id', params.workerId.toString());
  if (params.status) queryParams.append('status', params.status);
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest<PackageProductsData>(`/worker/packages/${params.packageId}/products${query}`);
}

// Route optimization response types
export interface OptimizedOrder {
  uuid: string;
  order_code: string;
  customer_name: string | null;
  sort_order: number;
  distance_km: number | null;
  no_coordinates?: boolean;
}

export interface OptimizeRouteResponse {
  package_id: number;
  total_orders: number;
  orders_with_coords: number;
  orders_without_coords: number;
  start_point: {
    latitude: number;
    longitude: number;
  };
  optimized_orders: OptimizedOrder[];
}

/**
 * Optimize delivery route based on coordinates
 * Coordinate дээр тулгуурлаж захиалгуудын дарааллыг оновчлох
 */
export async function optimizeRoute(params: {
  packageId: number;
  startLatitude?: number;
  startLongitude?: number;
}): Promise<{ success: boolean; data?: OptimizeRouteResponse; message?: string }> {
  const body: Record<string, number> = {};
  if (params.startLatitude) body.start_latitude = params.startLatitude;
  if (params.startLongitude) body.start_longitude = params.startLongitude;
  
  return apiRequest<OptimizeRouteResponse>(`/worker/packages/${params.packageId}/optimize-route`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update single order's sort position
 * Гараар дарааллын байрлал солих
 */
export async function updateOrderSortOrder(params: {
  orderUuid: string;
  newSortOrder: number;
}): Promise<{ success: boolean; data?: { order_uuid: string; old_sort_order: number; new_sort_order: number }; message?: string }> {
  return apiRequest('/worker/orders/update-sort-order', {
    method: 'POST',
    body: JSON.stringify({
      order_uuid: params.orderUuid,
      new_sort_order: params.newSortOrder,
    }),
  });
}

/**
 * Complete package checking and move to LOADED status
 * Багцын тулгалтыг дуусгаж "Ачигдсан" төлөвт шилжүүлэх
 */
export interface CompleteCheckingResponse {
  package_id: number;
  package_name: string;
  updated_orders_count: number;
  new_status: string;
  new_status_label: string;
}

export interface UncheckedOrder {
  order_code: string;
  customer_name: string;
  total_quantity: number;
  checked_quantity: number;
}

export async function completePackageChecking(params: {
  packageId: number;
  workerId?: number;
  force?: boolean;
}): Promise<{ success: boolean; data?: CompleteCheckingResponse; message?: string; unchecked_orders?: UncheckedOrder[] }> {
  const queryParams = new URLSearchParams();
  if (params.workerId) queryParams.append('worker_id', params.workerId.toString());
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return apiRequest(`/worker/packages/${params.packageId}/complete-checking${query}`, {
    method: 'POST',
    body: JSON.stringify({
      force: params.force || false,
    }),
  });
}

/**
 * Get worker's delivery orders with package info and status counts
 */
export async function getWorkerOrders(params?: {
  workerId?: number;
  date?: string;
  status?: string;
}): Promise<{ success: boolean; data?: OrdersResponseData; message?: string }> {
  const queryParams = new URLSearchParams();
  if (params?.workerId) queryParams.append('worker_id', params.workerId.toString());
  if (params?.date) queryParams.append('date', params.date);
  if (params?.status) queryParams.append('status', params.status);
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest(`/worker/orders${query}`);
}

/**
 * Get delivery summary with package info (Багцын толгой мэдээлэл + статистик)
 */
export async function getDeliverySummary(params?: {
  workerId?: number;
  date?: string;
}): Promise<{ success: boolean; data?: DeliverySummaryData; message?: string }> {
  const queryParams = new URLSearchParams();
  if (params?.workerId) queryParams.append('worker_id', params.workerId.toString());
  if (params?.date) queryParams.append('date', params.date);
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest(`/worker/delivery-summary${query}`);
}

/**
 * Update worker GPS location
 */
export async function updateWorkerLocation(data: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}): Promise<{ success: boolean; message?: string }> {
  return apiRequest('/worker/location', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================================================
// ORDERS MODULE
// ==========================================================================

/**
 * Get order detail with products
 */
export async function getOrderDetail(orderUuid: string): Promise<{ 
  success: boolean; 
  data?: { 
    order: DeliveryOrder; 
    products: OrderProduct[]; 
    summary: OrderSummary 
  }; 
  message?: string 
}> {
  return apiRequest(`/orders/${orderUuid}`);
}

/**
 * Get order products only
 */
export async function getOrderProducts(orderUuid: string): Promise<{ 
  success: boolean; 
  data?: { products: OrderProduct[]; summary: OrderSummary }; 
  message?: string 
}> {
  return apiRequest(`/orders/${orderUuid}/products`);
}

/**
 * Update order delivery status
 */
export async function updateOrderStatus(orderUuid: string, status: string, notes?: string): Promise<{ success: boolean; message?: string }> {
  return apiRequest(`/orders/${orderUuid}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, notes }),
  });
}

/**
 * Start delivery (set status to in_progress)
 */
export async function startDelivery(orderUuid: string): Promise<{ success: boolean; message?: string }> {
  return apiRequest(`/orders/${orderUuid}/start`, { method: 'POST' });
}

/**
 * Complete delivery (set status to delivered)
 */
export async function completeDelivery(orderUuid: string): Promise<{ success: boolean; message?: string }> {
  return apiRequest(`/orders/${orderUuid}/complete`, { method: 'POST' });
}

/**
 * Fail delivery with reason
 */
export async function failDelivery(orderUuid: string, reason: string): Promise<{ success: boolean; message?: string }> {
  return apiRequest(`/orders/${orderUuid}/fail`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ==========================================================================
// WAREHOUSE MODULE (Нярав/Жолооч тулгалт)
// ==========================================================================

/**
 * Toggle product check (warehouse or driver)
 */
export async function toggleProductCheck(data: {
  order_uuid: string;
  product_id: number;
  checker_type: 'warehouse' | 'driver';
  checked: boolean;
  quantity?: number;
}): Promise<{ 
  success: boolean; 
  data?: { 
    product_id: number; 
    warehouse_checked: boolean; 
    driver_checked: boolean; 
    status: 'pending' | 'checking' | 'loaded' 
  }; 
  message?: string 
}> {
  return apiRequest('/warehouse/toggle-check', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Bulk check multiple products
 */
export async function bulkToggleCheck(data: {
  order_uuid: string;
  product_ids: number[];
  checker_type: 'warehouse' | 'driver';
  checked: boolean;
}): Promise<{ success: boolean; data?: { updated_count: number }; message?: string }> {
  return apiRequest('/warehouse/bulk-check', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================================================
// SHOP MODULE (Дэлгүүр дээрх хүргэлт)
// ==========================================================================

// Return reasons list
export interface ReturnReason {
  id: number;
  name: string;
  description?: string;
}

/**
 * Get list of return reasons (Буцаалтын шалтгаанууд)
 */
export async function getReturnReasons(): Promise<{ success: boolean; data?: ReturnReason[]; message?: string }> {
  return apiRequest('/shop/return-reasons');
}

/**
 * Update product delivery details
 */
export async function updateProductDelivery(data: {
  order_uuid: string;
  product_id: number;
  delivered_quantity: number;
  returned_quantity?: number;
  return_reason_id?: number;
  delivery_notes?: string;
}): Promise<{ success: boolean; message?: string }> {
  return apiRequest('/shop/update-product', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Bulk update all products - Бүгдийг хүлээлгэх
 */
export async function bulkDeliverProducts(data: {
  order_uuid: string;
  deliver_all: boolean;
}): Promise<{ success: boolean; data?: { updated_count: number }; message?: string }> {
  return apiRequest('/shop/bulk-deliver', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Save payment information
 */
export interface PaymentData {
  order_uuid: string;
  payment_type: 'full' | 'partial' | 'unpaid' | 'credit';
  payment_method: 'cash' | 'card' | 'qpay' | 'transfer' | 'mixed';
  payment_amount: number;
  cash_amount?: number;
  card_amount?: number;
  qpay_amount?: number;
  transfer_amount?: number;
  receipt_number?: string;
  notes?: string;
}

export async function savePayment(data: PaymentData): Promise<{ success: boolean; message?: string }> {
  return apiRequest('/shop/save-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================================================
// E-BARIMT MODULE
// ==========================================================================

export type EbarimtType = 'person' | 'organization' | 'none';

export interface EbarimtData {
  order_uuid: string;
  ebarimt_type: EbarimtType;
  phone_number?: string;       // For person
  registry_number?: string;    // For organization
  company_name?: string;       // For organization
}

export interface EbarimtResponse {
  success: boolean;
  data?: {
    lottery_number?: string;
    qr_data?: string;
    bill_id?: string;
    date?: string;
  };
  message?: string;
}

/**
 * Create E-Barimt for an order
 */
export async function createEbarimt(data: EbarimtData): Promise<EbarimtResponse> {
  return apiRequest('/shop/ebarimt', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Complete order with signature and photo
 */
export interface CompleteDeliveryData {
  delivery_notes?: string;
  signature_image?: string; // base64
  delivery_photo?: string;  // base64
  ebarimt_type?: EbarimtType;
  ebarimt_phone?: string;
  ebarimt_registry?: string;
  payment_type?: string;
  payment_method?: string;
  payment_amount?: number;
}

export async function completeOrderDelivery(orderUuid: string, data: CompleteDeliveryData): Promise<{ 
  success: boolean; 
  data?: {
    order_uuid: string;
    status: string;
    delivered_at: string;
    ebarimt?: {
      lottery_number?: string;
      qr_data?: string;
    };
  };
  message?: string 
}> {
  return apiRequest(`/shop/complete-order/${orderUuid}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================================================
// REFERENCE DATA
// ==========================================================================

/**
 * Get all delivery statuses
 */
export async function getDeliveryStatuses(): Promise<{ success: boolean; data?: DeliveryStatus[]; message?: string }> {
  return apiRequest('/statuses');
}
