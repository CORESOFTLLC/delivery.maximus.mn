/**
 * Order API Route - Step 1: Create Order
 * POST /api/order/create
 */

import { NextRequest, NextResponse } from 'next/server';

const ERP_BASE_URL = process.env.ERP_BASE_URL || 'http://203.21.120.60:8080';
const ERP_ORDER_PATH = '/maximus_trade/hs/direct/Order';
const ERP_USERNAME = process.env.ERP_USERNAME || 'TestAPI';
const ERP_PASSWORD = process.env.ERP_PASSWORD || 'jI9da0zu';
const MOBILE_VERSION = '2.2.2';

export interface CreateOrderBody {
  // Partner info
  companyId: string;
  contractId: string;

  // User info
  username: string;
  imei: string;

  // Warehouse & pricing
  warehouseId: string;
  priceTypeId: string;
  customerPriceTypeId: string;

  // Order details
  paymentType: number;
  cashAmount?: number | null;
  deliveryType: number;
  deliveryDatetime: string;
  deliveryAdditionalInfo?: string;
  description?: string;

  // Products
  orderProducts: Array<{
    productId: string;
    stock: Array<{ typeId: string; count: number }>;
    priceType: string;
    sale: number;
    promotions: string[];
  }>;

  // Location
  latitude: number;
  longitude: number;

  // Options
  useDiscount: boolean;
  isSale: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderBody = await request.json();

    // Validate required fields
    if (!body.companyId || !body.contractId) {
      return NextResponse.json(
        { success: false, error: 'Харилцагчийн мэдээлэл дутуу байна' },
        { status: 400 }
      );
    }

    if (!body.warehouseId || !body.priceTypeId) {
      return NextResponse.json(
        { success: false, error: 'Агуулахын мэдээлэл дутуу байна' },
        { status: 400 }
      );
    }

    if (!body.orderProducts || body.orderProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Бараа сонгоогүй байна' },
        { status: 400 }
      );
    }

    // Current datetime
    const now = new Date();
    const datetime = now.toISOString().slice(0, 19).replace('T', ' ');

    // Build Step 1 request
    const orderRequest = {
      uuid: '', // Empty for new order
      username: body.username,
      imei: body.imei,
      companyId: body.companyId,
      contractId: body.contractId,
      paymentType: body.paymentType,
      cashAmount: body.cashAmount ?? null,
      warehouseId: body.warehouseId,
      deliveryType: body.deliveryType,
      deliveryDatetime: body.deliveryDatetime || datetime,
      deliveryAdditionalInfo: body.deliveryAdditionalInfo || '',
      description: body.description || '',
      orderProducts: body.orderProducts,
      priceTypeId: body.priceTypeId,
      paymentcheck: false, // Step 1 = false
      latitude: body.latitude,
      longitude: body.longitude,
      useDiscount: body.useDiscount,
      customerPriceTypeId: body.customerPriceTypeId,
      deliveryDate: null,
      isSale: body.isSale,
      start_date: datetime,
      end_date: datetime,
      mobileVersion: MOBILE_VERSION,
    };

    console.log('[Order API] Step 1 - Creating order:', {
      companyId: body.companyId,
      warehouseId: body.warehouseId,
      productCount: body.orderProducts.length,
    });

    console.log('[Order API] Full request payload:', JSON.stringify(orderRequest, null, 2));

    // Send to ERP
    const authHeader = 'Basic ' + Buffer.from(`${ERP_USERNAME}:${ERP_PASSWORD}`).toString('base64');

    const response = await fetch(`${ERP_BASE_URL}${ERP_ORDER_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(orderRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Order API] ERP error:', response.status, errorText);
      console.error('[Order API] Request that caused error:', JSON.stringify(orderRequest, null, 2));
      return NextResponse.json(
        { success: false, error: `ERP алдаа: ${response.status}`, details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();

    console.log('[Order API] Step 1 response:', result);

    // Check for UUID in response
    if (result.uuid) {
      return NextResponse.json({
        success: true,
        uuid: result.uuid,
        message: 'Захиалга үүслээ',
      });
    } else if (result.error || result.message?.toLowerCase().includes('error')) {
      return NextResponse.json({
        success: false,
        error: result.error || result.message || 'Захиалга үүсгэхэд алдаа гарлаа',
      });
    }

    // If response has uuid field even in different structure
    return NextResponse.json({
      success: true,
      uuid: result.uuid || result.id || result.orderId,
      message: result.message || 'Захиалга үүслээ',
      raw: result,
    });

  } catch (error) {
    console.error('[Order API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Алдаа гарлаа' },
      { status: 500 }
    );
  }
}
