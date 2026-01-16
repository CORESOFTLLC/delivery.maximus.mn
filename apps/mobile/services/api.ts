/**
 * API Service for Sales Maximus Mobile
 * 
 * 1C ERP ШУУД ХОЛБОЛТ:
 * - Base URL: http://203.21.120.60:8080/maximus_trade
 * - Auth: Basic Auth (TestAPI:jI9da0zu)
 * 
 * ҮНДСЭН ENDPOINTS:
 * - /hs/cl/Companies: Бүх харилцагчид (routeId, name, companyCode-р шүүх боломжтой)
 * - /hs/ts/Tasks: Тухайн өдрийн маршрутын харилцагчид (day, username-р шүүнэ)
 * 
 * ХУУДАСЛАЛТ:
 * - Companies API: page, pageSize параметрүүдтэй
 * - Tasks API: Хуудаслалтгүй, бүгдийг нэг дор буцаана
 */

import type { Partner } from '../types/partner';

const API_BASE_URL = 'https://cloud.maximus.mn';

// ==========================================================================
// 1C ERP ТОХИРГОО
// ==========================================================================
const ERP_BASE_URL = 'http://203.21.120.60:8080/maximus_trade';
const ERP_USERNAME = 'TestAPI';
const ERP_PASSWORD = 'jI9da0zu';

// Base64 encode for Basic Auth
const ERP_AUTH = btoa(`${ERP_USERNAME}:${ERP_PASSWORD}`);

// ==========================================================================
// ERP Company/Partner Types (1C-ээс ирэх формат)
// ==========================================================================

/**
 * ERPCompany: 1C ERP-ээс ирэх харилцагчийн мэдээлэл
 * 
 * BUSINESS RULE - coordinateRange талбар:
 * - coordinateRange = 1: GPS шалгахгүй, автоматаар "Ирсэн" гэж тооцно
 * - coordinateRange != 1: GPS зайг routeRange-тэй харьцуулж "Ирсэн/Зай хол" тодорхойлно
 */
interface ERPCompany {
  uuid: string;
  name: string;
  phone: string | null;
  email: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  address: string | null;
  w3w: string | null;
  longitude: number | null;
  latitude: number | null;
  balance: number | null;
  debtLimit: number | null;
  debtDays: number | null;
  salesLimit: number | null;
  routeId: string | null;
  routeName: string | null;
  /** coordinateRange=1 бол GPS-гүй, автоматаар ирсэн */
  coordinateRange: number | null;
  /** Харилцагчийн код (1C хайлтад ашиглагдана) */
  companyCode: string | null;
  headCompanyName: string | null;
  /** Регистрийн дугаар */
  headCompanyRegister: string | null;
}

interface ERPCompaniesResponse {
  count: number;
  results: ERPCompany[];
}

/**
 * mapERPCompany: 1C ERP Company-г App-н Partner руу хөрвүүлэх
 * 
 * BUSINESS RULE:
 * - coordinateRange null байж болно, null бол GPS шалгана
 * - null утгуудыг зөв хадгална
 */
function mapERPCompany(raw: ERPCompany): Partner {
  return {
    id: raw.uuid,
    name: raw.name,
    phone: raw.phone || null,
    email: raw.email || null,
    street1: raw.street1 || null,
    street2: raw.street2 || null,
    city: raw.city || null,
    address: raw.address || null,
    w3w: raw.w3w || null,
    erp_uuid: raw.uuid,
    longitude: raw.longitude || null,
    latitude: raw.latitude || null,
    balance: raw.balance || null,
    debtLimit: raw.debtLimit || null,
    debtDays: raw.debtDays || null,
    salesLimit: raw.salesLimit || null,
    routeId: raw.routeId || null,
    routeName: raw.routeName || null,
    // BUSINESS RULE: coordinateRange=1 бол GPS-гүй, null бол GPS шалгана
    coordinateRange: raw.coordinateRange ?? null,
    companyCode: raw.companyCode || null,
    headCompanyName: raw.headCompanyName || null,
    headCompanyRegister: raw.headCompanyRegister || null,
    image: null,
    created_at: null,
    updated_at: null,
  };
}

// ==========================================================================
// БҮХ ХАРИЛЦАГЧИД API - /hs/cl/Companies
// ==========================================================================

/**
 * getPartners: 1C ERP-ээс харилцагчдыг татах
 * 
 * ENDPOINT: /hs/cl/Companies
 * 
 * QUERY PARAMETERS:
 * - routeId: Маршрутын ID (борлуулагчийн харилцагчид)
 * - name: Нэрээр хайх (partial match)
 * - companyCode: Компанийн кодоор хайх
 * - page: Хуудас дугаар (1-ээс эхлэнэ)
 * - pageSize: Хуудас дахь тоо (default 20)
 * 
 * BUSINESS RULE - ХАЙЛТ:
 * - name параметр нь partial match хийнэ ("Баян" → "Баянзүрх ХК" олно)
 * - companyCode нь exact match хийнэ
 * - Хоёуланг нь зэрэг дуудаж, давхардлыг арилгаж нэгтгэж болно
 */
export async function getPartners(
  token: string,
  options?: {
    name?: string;
    companyCode?: string;
    routeId?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{
  success: boolean;
  data?: Partner[];
  totalRecords?: number;
  totalPages?: number;
  error?: string;
}> {
  // BUSINESS RULE: Хуудаслалт параметрүүд
  const params = new URLSearchParams({
    page: String(options?.page || 1),
    pageSize: String(options?.pageSize || 20),
  });

  // Маршрутаар шүүх (борлуулагчийн харилцагчид)
  if (options?.routeId) {
    params.append('routeId', options.routeId);
  }

  // BUSINESS RULE: Нэрээр хайх (partial match)
  if (options?.name) params.append('name', options.name);
  
  // BUSINESS RULE: Кодоор хайх (exact match)
  if (options?.companyCode) params.append('companyCode', options.companyCode);

  // 1C ERP endpoint
  const url = `${ERP_BASE_URL}/hs/cl/Companies/?${params}`;
  console.log('🔵 1C ERP API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
    });

    console.log('🔵 1C ERP Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 1C ERP Error Body:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data: ERPCompaniesResponse = await response.json();
    
    // Log first result to see available fields
    if (data.results.length > 0) {
      console.log('🔵 1C First Company Data:', JSON.stringify(data.results[0], null, 2));
    }

    return {
      success: true,
      data: data.results.map(mapERPCompany),
      totalRecords: data.count,
      totalPages: Math.ceil(data.count / (options?.pageSize || 20)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}

// ==========================================================================
// ХАРИЛЦАГЧ ДЭЛГЭРЭНГҮЙ API - /hs/cd/Companies/{id}
// ==========================================================================

/**
 * ERPPartnerDetail: 1C дэлгэрэнгүй хариу
 */
interface ERPPartnerDetail {
  commonName: string;
  name: string;
  promotionPoint: string;
  registryNumber: string;
  salesChannel: string;
  businessRegion: string;
  deliveryRegion: string;
  email: string;
  address: string;
  companyType: string;
  taxPayerType: boolean;
  deactived: boolean;
  headCompanyRegister: string;
  obcsale: boolean;
  headCompanyName: string;
  companyCode: string;
  corporate_id: string;
  coordinateRange: number | null;
  what3words: string;
  latitude: string;
  longitude: string;
  routeId: string;
  contract: {
    contractId: string;
    priceTypeId: string;
    isLoan: string;
  };
  phoneNumbers: string[];
  bankAccounts: {
    bankName: string;
    bankAccount: string;
    accountName: string;
  }[];
  promotionPointNew: {
    promotionPointID: string;
    promotionPointName: string;
    promotionPointAmount: number;
  }[];
  totalDiscountPoint: {
    totalAmount: number;
    discountList: any[];
  };
  isRight: boolean;
}

/**
 * PartnerDetail: Харилцагчийн дэлгэрэнгүй мэдээлэл (App дотор)
 */
export interface PartnerDetail {
  id: string;
  name: string;
  commonName: string;
  companyCode: string;
  corporateId: string;
  registryNumber: string;
  headCompanyName: string;
  headCompanyRegister: string;
  address: string;
  email: string;
  phone: string | null;
  phoneNumbers: string[];
  latitude: number | null;
  longitude: number | null;
  what3words: string;
  coordinateRange: number | null;
  // Business info
  salesChannel: string;
  businessRegion: string;
  deliveryRegion: string;
  companyType: string;
  taxPayerType: boolean;
  isDeactivated: boolean;
  obcsale: boolean;
  routeId: string;
  // Contract
  contract: {
    contractId: string;
    priceTypeId: string;
    isLoan: string;
  } | null;
  // Bank accounts
  bankAccounts: {
    bankName: string;
    bankAccount: string;
    accountName: string;
  }[];
  // Promotion points
  promotionPoint: string;
  promotionPoints: {
    id: string;
    name: string;
    amount: number;
  }[];
  totalDiscountAmount: number;
  isRight: boolean;
}

/**
 * getPartnerDetail: Харилцагчийн дэлгэрэнгүй мэдээлэл татах
 * 
 * ENDPOINT: /hs/cd/Companies/{companyId}?routeId={routeId}
 * 
 * @param companyId - Харилцагчийн UUID
 * @param routeId - Маршрутын ID
 */
export async function getPartnerDetail(
  companyId: string,
  routeId: string
): Promise<{
  success: boolean;
  data?: PartnerDetail;
  error?: string;
}> {
  const url = `${ERP_BASE_URL}/hs/cd/Companies/${companyId}?routeId=${routeId}`;
  console.log('🔵 1C Partner Detail API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
    });

    console.log('🔵 1C Partner Detail Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 1C Partner Detail Error:', errorText);
      
      // Parse error message from 1C response
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.msg) {
          return { success: false, error: errorJson.msg };
        }
      } catch {
        // Not JSON, use default message
      }
      
      return { success: false, error: `Харилцагч олдсонгүй (${response.status})` };
    }

    const raw: ERPPartnerDetail = await response.json();
    console.log('🔵 1C Partner Detail Data:', JSON.stringify(raw, null, 2));

    // Map to PartnerDetail
    const detail: PartnerDetail = {
      id: companyId,
      name: raw.name,
      commonName: raw.commonName,
      companyCode: raw.companyCode,
      corporateId: raw.corporate_id,
      registryNumber: raw.registryNumber,
      headCompanyName: raw.headCompanyName,
      headCompanyRegister: raw.headCompanyRegister,
      address: raw.address,
      email: raw.email,
      phone: raw.phoneNumbers?.length > 0 ? raw.phoneNumbers[0] : null,
      phoneNumbers: raw.phoneNumbers || [],
      latitude: raw.latitude ? parseFloat(raw.latitude) : null,
      longitude: raw.longitude ? parseFloat(raw.longitude) : null,
      what3words: raw.what3words,
      coordinateRange: raw.coordinateRange,
      salesChannel: raw.salesChannel,
      businessRegion: raw.businessRegion,
      deliveryRegion: raw.deliveryRegion,
      companyType: raw.companyType,
      taxPayerType: raw.taxPayerType,
      isDeactivated: raw.deactived,
      obcsale: raw.obcsale,
      routeId: raw.routeId,
      contract: raw.contract || null,
      bankAccounts: raw.bankAccounts || [],
      promotionPoint: raw.promotionPoint,
      promotionPoints: (raw.promotionPointNew || []).map(p => ({
        id: p.promotionPointID,
        name: p.promotionPointName,
        amount: p.promotionPointAmount,
      })),
      totalDiscountAmount: raw.totalDiscountPoint?.totalAmount || 0,
      isRight: raw.isRight,
    };

    return { success: true, data: detail };
  } catch (error) {
    console.error('Partner Detail API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}

export async function getPartner(
  token: string,
  id: string,
  routeId?: string
): Promise<{
  success: boolean;
  data?: Partner;
  error?: string;
}> {
  // If routeId provided, fetch from API
  if (routeId) {
    const result = await getPartners(token, { routeId });
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const partner = result.data.find(p => p.id === id || p.erp_uuid === id);
    
    if (!partner) {
      return { success: false, error: 'Харилцагч олдсонгүй' };
    }

    return { success: true, data: partner };
  }
  
  // Without routeId, we return error (need to use partners from store)
  return { success: false, error: 'Харилцагч жагсаалтаас олох боломжгүй' };
}

// ==========================================================================
// МАРШРУТЫН ХАРИЛЦАГЧИД API - /hs/ts/Tasks
// ==========================================================================

/**
 * ERPTask: 1C Tasks API-ээс ирэх формат
 * 
 * BUSINESS RULE:
 * - Tasks API нь тухайн өдрийн маршрутын харилцагчдыг буцаана
 * - coordinateRange=1 бол GPS шалгахгүй, автоматаар "Ирсэн"
 * 
 * API RESPONSE FORMAT (Array directly, no wrapper):
 * [{ companyId, companyName, companyCode, companyAddress, what3words, latitude, longitude, ... }]
 */
interface ERPTask {
  companyId: string;
  companyName: string;
  companyCode: string | null;
  companyAddress: string | null;
  phone: string | null;
  what3words: string | null;
  longitude: string | null;
  latitude: string | null;
  /** coordinateRange=1 бол GPS-гүй, автоматаар ирсэн */
  coordinateRange: number | null;
  balance: number | null;
  headCompanyName: string | null;
  headCompanyRegister: string | null;
}

// Tasks API returns array directly, not wrapped in { count, results }
type ERPTasksResponse = ERPTask[];

/**
 * getTasksByDay: Тухайн гарагийн маршрутын харилцагчдыг татах
 * 
 * ENDPOINT: /hs/ts/Tasks?day={day}&username={username}
 * 
 * QUERY PARAMETERS:
 * - day: 0-4 (0=Даваа, 1=Мягмар, 2=Лхагва, 3=Пүрэв, 4=Баасан)
 * - username: Борлуулагчийн хэрэглэгчийн нэр (жишээ: 101012501)
 * 
 * BUSINESS RULE:
 * - Хуудаслалтгүй - бүх харилцагчийг нэг дор буцаана
 * - Зөвхөн ажлын өдрүүд (Да-Ба), амралтын өдөр маршрут байхгүй
 * - Борлуулагч бүрт өөр маршрут хуваарилагдсан
 */
export async function getTasksByDay(
  day: number, // 0-4 (Monday-Friday)
  username: string
): Promise<{
  success: boolean;
  data?: Partner[];
  totalRecords?: number;
  error?: string;
}> {
  // BUSINESS RULE: day=0 бол Даваа, day=4 бол Баасан
  const url = `${ERP_BASE_URL}/hs/ts/Tasks?day=${day}&username=${username}`;
  console.log('🔵 1C Tasks API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
    });

    console.log('🔵 1C Tasks Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 1C Tasks Error Body:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const rawText = await response.text();
    console.log('🔵 1C Tasks Raw Response length:', rawText.length);
    
    // Parse JSON from raw text - Tasks API returns array directly
    let data: ERPTasksResponse;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.log('🔴 1C Tasks JSON Parse Error:', parseError);
      return { success: false, error: 'JSON parse алдаа' };
    }
    
    console.log('🔵 1C Tasks Data is array:', Array.isArray(data), 'length:', data?.length);
    
    // Log first result to see available fields
    if (Array.isArray(data) && data.length > 0) {
      console.log('🔵 1C First Task Data:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('🔵 1C Tasks: No results in response');
    }

    // Map tasks to Partner type - note: API returns array directly
    const tasks = Array.isArray(data) ? data : [];
    const partners: Partner[] = tasks.map(task => ({
      id: task.companyId,
      name: task.companyName,
      phone: task.phone || null,
      email: null,
      street1: null,
      street2: null,
      city: null,
      address: task.companyAddress || null,
      w3w: task.what3words || null,
      erp_uuid: task.companyId,
      // latitude/longitude come as strings from API
      longitude: task.longitude ? parseFloat(task.longitude) : null,
      latitude: task.latitude ? parseFloat(task.latitude) : null,
      balance: task.balance || null,
      debtLimit: null,
      debtDays: null,
      salesLimit: null,
      routeId: null,
      routeName: null,
      coordinateRange: task.coordinateRange ?? null,
      companyCode: task.companyCode || null,
      headCompanyName: task.headCompanyName || null,
      headCompanyRegister: task.headCompanyRegister || null,
      image: null,
      created_at: null,
      updated_at: null,
    }));

    return {
      success: true,
      data: partners,
      totalRecords: partners.length,
    };
  } catch (error) {
    console.error('Tasks API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}

// ==========================================================================
// ЗАХИАЛГУУД API - /hs/or/Order
// ==========================================================================

/**
 * OrderProduct: Захиалгын бүтээгдэхүүн
 */
export interface OrderProduct {
  uuid: string;
  name: string;
  price: number;
  moq: number;
  autoSale: number;
  manualSale: number;
  isUnderStock: boolean;
  brand: { uuid: string; name: string };
  category: { uuid: string; name: string };
}

/**
 * Order: Захиалгын мэдээлэл
 */
export interface Order {
  uuid: string;
  date: string;
  companyId: string;
  orderCode: string;
  companyName: string;
  companyCode: string;
  warehouseName: string;
  warehouseId: string;
  totalAmount: number;
  status: string;
  delivery: string;
  loan: boolean;
  deleteMarket: boolean;
  poster: boolean;
  paymentCheck: boolean;
  totalDiscountPoint: {
    totalAmount: number;
    discountList: any[];
  };
  totalPromoPoint: {
    totalPromoAmount: number;
    PromoList: any[];
  };
  products: OrderProduct[];
}

interface OrdersResponse {
  count: number;
  results: Order[];
}

/**
 * getOrders: Захиалгуудын жагсаалт татах
 * 
 * ENDPOINT: POST /hs/or/Order
 * 
 * BODY PARAMETERS:
 * - page: Хуудас дугаар
 * - pageSize: Хуудас дахь тоо
 * - username: Борлуулагчийн код
 * - startDate: Эхлэх огноо (YYYY-MM-DD)
 * - endDate: Дуусах огноо (YYYY-MM-DD)
 * - tabName: "active" | "history"
 * - companyId: Харилцагчийн ID (optional)
 */
export async function getOrders(options: {
  page?: number;
  pageSize?: number;
  username: string;
  startDate: string;
  endDate: string;
  tabName: 'active' | 'history';
  companyId?: string;
}): Promise<{
  success: boolean;
  data?: Order[];
  totalRecords?: number;
  error?: string;
}> {
  const url = `${ERP_BASE_URL}/hs/or/Order`;
  
  const body = {
    page: options.page || 1,
    pageSize: options.pageSize || 20,
    username: options.username,
    startDate: options.startDate,
    endDate: options.endDate,
    tabName: options.tabName,
    ...(options.companyId && { companyId: options.companyId }),
  };

  console.log('🔵 Orders API URL:', url);
  console.log('🔵 Orders API Body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
      body: JSON.stringify(body),
    });

    console.log('🔵 Orders API Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 Orders API Error:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data: OrdersResponse = await response.json();
    
    console.log('🔵 Orders count:', data.count);
    if (data.results.length > 0) {
      console.log('🔵 First Order:', JSON.stringify(data.results[0], null, 2));
    }

    return {
      success: true,
      data: data.results,
      totalRecords: data.count,
    };
  } catch (error) {
    console.error('Orders API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}

// ==========================================================================
// ORDER DETAIL API
// ==========================================================================

/**
 * OrderDetailProduct: Захиалгын бүтээгдэхүүний дэлгэрэнгүй
 */
export interface OrderDetailProduct {
  uuid: string;
  name: string;
  price: number;
  moq: number;
  autoSale: number;
  manualSale: number;
  isUnderStock: boolean;
  brand: { uuid: string; name: string };
  category: { uuid: string; name: string };
  stock: { typeId: string; count: number }[];
  stockTypes: { uuid: string; name: string; pcs: number }[];
  discountPoint: { discountPointID: string; discountPointName: string; discountPointAmount: number }[];
  promotions: { uuid: string; name: string }[];
}

/**
 * OrderDetail: Захиалгын дэлгэрэнгүй мэдээлэл
 */
export interface OrderDetail {
  uuid: string;
  date: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  registryNumber: string;
  orderCode: string;
  status: string;
  delivery: string;
  totalAmount: number;
  loan: boolean;
  loanDescription: string;
  isLoanApprov: boolean;
  isLoanPerson: string;
  isLoanPersonName: string;
  isPaid: boolean;
  warehouseId: string;
  saleDocuments: { uuid: string }[];
  promotionPoint: { promotionPointID: number; promotionPointName: string; promotionPointAmount: number }[];
  products: OrderDetailProduct[];
}

/**
 * getOrderDetail: Захиалгын дэлгэрэнгүй мэдээлэл татах
 * 
 * ENDPOINT: POST /hs/od/OrderDetail
 * 
 * BODY PARAMETERS:
 * - username: Борлуулагчийн код
 * - uuid: Захиалгын UUID
 */
export async function getOrderDetail(options: {
  username: string;
  uuid: string;
}): Promise<{
  success: boolean;
  data?: OrderDetail;
  error?: string;
}> {
  const url = `${ERP_BASE_URL}/hs/od/OrderDetail`;
  
  const body = {
    username: options.username,
    uuid: options.uuid,
  };

  console.log('🔵 OrderDetail API URL:', url);
  console.log('🔵 OrderDetail API Body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
      body: JSON.stringify(body),
    });

    console.log('🔵 OrderDetail API Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 OrderDetail API Error:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data: OrderDetail = await response.json();
    
    console.log('🔵 OrderDetail:', data.orderCode, data.products?.length, 'products');

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('OrderDetail API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}

// ==========================================================================
// PRODUCTS API - Барааны жагсаалт
// ==========================================================================

/**
 * Product: Бараа бүтээгдэхүүний мэдээлэл
 * 
 * API: GET /hs/pr/Products
 * Parameters: page, pageSize, warehouseId, routeId, obcsaleid
 */
export interface Product {
  uuid: string;
  name: string;
  code: string;
  barcode: string | null;
  price: number;
  moq: number;
  stock: number;
  brand: { uuid: string; name: string } | null;
  category: { uuid: string; name: string } | null;
  unit: { uuid: string; name: string } | null;
  image: string | null;
  isActive: boolean;
}

interface ProductsResponse {
  count: number;
  results: Product[];
}

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  warehouseId: string;
  routeId: string;
  priceTypeId: string;
  companyId?: string;
  name?: string;
  article?: string;
  brands?: string[];
  categories?: string[];
  sortBy?: 'NAME' | 'ARTICLE' | 'PRICE' | 'STOCK';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * getProducts: Барааны жагсаалт татах
 * 
 * ENDPOINT: GET /hs/pr/Products
 * Parameters:
 * - page, pageSize: Хуудаслалт
 * - warehouseId: Агуулахын UUID
 * - routeId: Маршрутын UUID
 * - priceTypeId: Үнийн төрөл UUID
 * - companyId: Харилцагчийн UUID (optional)
 * - name: Барааны нэрээр хайх
 * - article: Барааны кодоор хайх
 * - brands: Брэндийн UUID (comma separated)
 * - categories: Ангиллын UUID (comma separated)
 * - sortBy: Эрэмбэлэх талбар
 * - sortOrder: Эрэмбэлэх чиглэл
 * 
 * @param params - Шүүлтүүрийн параметрүүд
 */
export async function getProducts(params: GetProductsParams): Promise<{
  success: boolean;
  data?: Product[];
  totalRecords?: number;
  error?: string;
}> {
  const {
    page = 1,
    pageSize = 20,
    warehouseId,
    routeId,
    priceTypeId,
    companyId,
    name,
    article,
    brands,
    categories,
    sortBy,
    sortOrder,
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    warehouseId,
    routeId,
    priceTypeId,
  });

  if (companyId) queryParams.append('companyId', companyId);
  if (name) queryParams.append('name', name);
  if (article) queryParams.append('article', article);
  if (brands && brands.length > 0) queryParams.append('brands', brands.join(','));
  if (categories && categories.length > 0) queryParams.append('categories', categories.join(','));
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (sortOrder) queryParams.append('sortOrder', sortOrder);

  const url = `${ERP_BASE_URL}/hs/pr/Products?${queryParams.toString()}`;
  console.log('🔵 Products API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
    });

    console.log('🔵 Products API Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 Products API Error:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data: ProductsResponse = await response.json();
    
    console.log('🔵 Products count:', data.count);
    if (data.results?.length > 0) {
      console.log('🔵 First Product:', JSON.stringify(data.results[0], null, 2));
    }

    return {
      success: true,
      data: data.results || [],
      totalRecords: data.count,
    };
  } catch (error) {
    console.error('Products API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}

// ==========================================================================
// CATEGORIES API - Ангиллын жагсаалт
// ==========================================================================

/**
 * Category: Барааны ангилал
 * 
 * API: GET /hs/ct/Categories
 * - Array буцаана (wrapper байхгүй)
 */
export interface Category {
  uuid: string;
  name: string;
}

/**
 * getCategories: Бүх ангиллуудыг татах
 * 
 * ENDPOINT: GET /hs/ct/Categories
 * 
 * RESPONSE: Array<{ uuid: string; name: string }>
 * - Хуудаслалтгүй, бүгдийг нэг дор буцаана
 */
export async function getCategories(): Promise<{
  success: boolean;
  data?: Category[];
  error?: string;
}> {
  const url = `${ERP_BASE_URL}/hs/ct/Categories`;
  console.log('🔵 Categories API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
    });

    console.log('🔵 Categories API Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 Categories API Error:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    // Categories API returns array directly
    const data: Array<{ uuid: string; name: string }> = await response.json();
    
    console.log('🔵 Categories count:', data.length);
    if (data.length > 0) {
      console.log('🔵 First Category:', JSON.stringify(data[0], null, 2));
    }

    return {
      success: true,
      data: data.map(cat => ({
        uuid: cat.uuid,
        name: cat.name,
      })),
    };
  } catch (error) {
    console.error('Categories API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}

// ==========================================================================
// BRANDS API - Брэндийн жагсаалт
// ==========================================================================

/**
 * Brand: Барааны брэнд
 * 
 * API: GET /hs/br/Brands
 * - categoryId параметрээр шүүж болно
 */
export interface Brand {
  uuid: string;
  name: string;
  categoryUID?: string;
}

/**
 * getBrands: Брэндүүдийг татах
 * 
 * ENDPOINT: GET /hs/br/Brands
 * 
 * QUERY PARAMETERS:
 * - categoryId: Ангиллаар шүүх (optional)
 * 
 * RESPONSE: Array<{ uuid: string; name: string; categoryUID?: string }>
 * - Хуудаслалтгүй, бүгдийг нэг дор буцаана
 */
export async function getBrands(categoryId?: string): Promise<{
  success: boolean;
  data?: Brand[];
  error?: string;
}> {
  const params = new URLSearchParams();
  if (categoryId) params.append('categoryId', categoryId);
  
  const url = params.toString() 
    ? `${ERP_BASE_URL}/hs/br/Brands?${params}` 
    : `${ERP_BASE_URL}/hs/br/Brands`;
    
  console.log('🔵 Brands API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${ERP_AUTH}`,
      },
    });

    console.log('🔵 Brands API Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 Brands API Error:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    // Brands API returns array directly
    const data: Array<{ uuid: string; name: string; categoryUID?: string }> = await response.json();
    
    console.log('🔵 Brands count:', data.length);
    if (data.length > 0) {
      console.log('🔵 First Brand:', JSON.stringify(data[0], null, 2));
    }

    return {
      success: true,
      data: data.map(brand => ({
        uuid: brand.uuid,
        name: brand.name,
        categoryUID: brand.categoryUID,
      })),
    };
  } catch (error) {
    console.error('Brands API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Сүлжээний алдаа',
    };
  }
}
