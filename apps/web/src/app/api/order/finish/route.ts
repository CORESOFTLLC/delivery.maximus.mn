/**
 * Order API Route - Step 2: Finish Order
 * POST /api/order/finish
 */

import { NextRequest, NextResponse } from 'next/server';

const ERP_BASE_URL = process.env.ERP_BASE_URL || 'http://203.21.120.60:8080';
const ERP_ORDER_PATH = '/maximus_trade/hs/direct/Order';
const ERP_USERNAME = process.env.ERP_USERNAME || 'TestAPI';
const ERP_PASSWORD = process.env.ERP_PASSWORD || 'jI9da0zu';
const MOBILE_VERSION = '2.2.2';

export interface FinishOrderBody {
  // UUID from Step 1
  uuid: string;

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

  // Location (finish)
  latitudeFinish: number;
  longitudeFinish: number;

  // Options
  useDiscount: boolean;
  isSale: boolean;

  // Loan/Credit
  loan?: boolean;
  loanDescription?: string;

  // Original start datetime
  start_date: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FinishOrderBody = await request.json();

    // Validate required fields
    if (!body.uuid) {
      return NextResponse.json(
        { success: false, error: 'Захиалгын UUID байхгүй байна' },
        { status: 400 }
      );
    }

    if (!body.companyId || !body.contractId) {
      return NextResponse.json(
        { success: false, error: 'Харилцагчийн мэдээлэл дутуу байна' },
        { status: 400 }
      );
    }

    // Current datetime for end_date
    const now = new Date();
    const endDatetime = now.toISOString().slice(0, 19).replace('T', ' ');

    // Build Step 2 (Finish) request
    const finishRequest = {
      uuid: body.uuid, // UUID from Step 1
      finishStep: true, // Important: marks as finish step
      username: body.username,
      imei: body.imei,
      companyId: body.companyId,
      contractId: body.contractId,
      paymentType: body.paymentType,
      cashAmount: body.cashAmount ?? null,
      warehouseId: body.warehouseId,
      deliveryType: body.deliveryType,
      deliveryDatetime: body.deliveryDatetime,
      deliveryAdditionalInfo: body.deliveryAdditionalInfo || '',
      description: body.description || '',
      orderProducts: body.orderProducts,
      priceTypeId: body.priceTypeId,
      customerPriceTypeId: body.customerPriceTypeId,
      deliveryDate: null,
      isSale: body.isSale,
      start_date: body.start_date,
      end_date: endDatetime,
      // Finish-specific fields
      latitudeFinish: body.latitudeFinish,
      longitudeFinish: body.longitudeFinish,
      paymentcheck: true, // Step 2 = true
      useDiscount: body.useDiscount,
      loan: body.loan || false,
      loanDescription: body.loanDescription || '',
      mobileVersion: MOBILE_VERSION,
    };

    console.log('[Order API] Step 2 - Finishing order:', {
      uuid: body.uuid,
      companyId: body.companyId,
      loan: body.loan,
    });

    // Send to ERP
    const authHeader = 'Basic ' + Buffer.from(`${ERP_USERNAME}:${ERP_PASSWORD}`).toString('base64');

    const response = await fetch(`${ERP_BASE_URL}${ERP_ORDER_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(finishRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Order API] ERP error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `ERP алдаа: ${response.status}` },
        { status: 500 }
      );
    }

    const result = await response.json();

    console.log('[Order API] Step 2 response:', result);

    // Check for success
    if (result.success === true || result.status === 'success' || result.uuid) {
      return NextResponse.json({
        success: true,
        uuid: body.uuid,
        orderId: result.orderId || result.orderNumber || result.uuid,
        orderNumber: result.orderNumber,
        message: result.message || 'Захиалга амжилттай илгээгдлээ',
      });
    } else if (result.error || result.success === false) {
      return NextResponse.json({
        success: false,
        error: result.error || result.message || 'Захиалга дуусгахад алдаа гарлаа',
      });
    }

    // Default success if no error indicators
    return NextResponse.json({
      success: true,
      uuid: body.uuid,
      message: 'Захиалга амжилттай илгээгдлээ',
      raw: result,
    });

  } catch (error) {
    console.error('[Order API] Finish error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Алдаа гарлаа' },
      { status: 500 }
    );
  }
}
