import { NextRequest, NextResponse } from 'next/server';
import { generateOrderPrintTemplate, generateOrderReceiptTemplate } from '@sales/shared/services';
import type { OrderDetail, PrintTemplateOptions } from '@sales/shared/types';

const ERP_API_BASE = 'http://203.21.120.60:8080/maximus_trade';
const ERP_USERNAME = 'TestAPI';
const ERP_PASSWORD = 'jI9da0zu';

/**
 * GET /api/order/print?uuid=xxx&username=xxx&format=full|receipt&lang=mn|en
 * Returns HTML print template for an order
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const uuid = searchParams.get('uuid');
        const username = searchParams.get('username');
        const format = searchParams.get('format') || 'full'; // 'full' or 'receipt'
        const lang = (searchParams.get('lang') || 'mn') as 'mn' | 'en';

        if (!uuid || !username) {
            return NextResponse.json(
                { error: 'uuid and username are required' },
                { status: 400 }
            );
        }

        // Fetch order detail from ERP
        const authHeader = 'Basic ' + Buffer.from(`${ERP_USERNAME}:${ERP_PASSWORD}`).toString('base64');

        const erpResponse = await fetch(`${ERP_API_BASE}/hs/od/OrderDetail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ username, uuid }),
        });

        if (!erpResponse.ok) {
            const errorText = await erpResponse.text();
            return NextResponse.json(
                { error: 'ERP API error', details: errorText },
                { status: erpResponse.status }
            );
        }

        const order: OrderDetail = await erpResponse.json();

        // Get base URL for absolute logo path
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Template options
        const options: PrintTemplateOptions = {
            logoUrl: `${baseUrl}/logos/maximus-logo.svg`,
            companyName: 'MAXIMUS',
            companyAddress: 'Улаанбаатар хот',
            companyPhone: '7700-1234',
            showDiscounts: true,
            showPromotions: true,
            language: lang,
            dateFormat: 'full',
        };

        // Generate template based on format
        let html: string;
        if (format === 'receipt') {
            html = generateOrderReceiptTemplate(order, options);
        } else {
            html = generateOrderPrintTemplate(order, options);
        }

        // Return HTML
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });
    } catch (error) {
        console.error('Print template error:', error);
        return NextResponse.json(
            { error: 'Failed to generate print template', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * POST /api/order/print
 * Body: { order: OrderDetail, format?: 'full'|'receipt', options?: PrintTemplateOptions }
 * Returns HTML print template for provided order data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { order, format = 'full', options = {} } = body;

        if (!order) {
            return NextResponse.json(
                { error: 'order data is required' },
                { status: 400 }
            );
        }

        // Get base URL for absolute logo path
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const templateOptions: PrintTemplateOptions = {
            logoUrl: `${baseUrl}/logos/maximus-logo.svg`,
            companyName: 'MAXIMUS',
            companyAddress: 'Улаанбаатар хот',
            companyPhone: '7700-1234',
            showDiscounts: true,
            showPromotions: true,
            language: 'mn',
            dateFormat: 'full',
            ...options,
        };

        let html: string;
        if (format === 'receipt') {
            html = generateOrderReceiptTemplate(order, templateOptions);
        } else {
            html = generateOrderPrintTemplate(order, templateOptions);
        }

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });
    } catch (error) {
        console.error('Print template error:', error);
        return NextResponse.json(
            { error: 'Failed to generate print template', details: String(error) },
            { status: 500 }
        );
    }
}
