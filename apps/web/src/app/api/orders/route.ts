/**
 * Orders API Route
 * Fetches order list from ERP: POST http://203.21.120.60:8080/maximus_trade/hs/or/Order
 */

import { NextRequest, NextResponse } from 'next/server';
import type { OrderListResponse, OrderListItem } from '@/types/order';

const ERP_BASE_URL = process.env.ERP1C_BASE_URL || 'http://203.21.120.60:8080/maximus_trade';
const ERP_USERNAME = process.env.ERP1C_USERNAME || 'TestAPI';
const ERP_PASSWORD = process.env.ERP1C_PASSWORD || 'jI9da0zu';
const ERP_AUTH = Buffer.from(`${ERP_USERNAME}:${ERP_PASSWORD}`).toString('base64');

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Get date 30 days ago
function getStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDate(date);
}

// Get today's date
function getEndDate(): string {
    return formatDate(new Date());
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, page = 1, pageSize = 20, startDate, endDate } = body;

        if (!username) {
            return NextResponse.json(
                { error: 'Username (corporate_id) is required' },
                { status: 400 }
            );
        }

        // Use provided dates or default to last 30 days
        const requestBody = {
            page,
            pageSize,
            username,
            startDate: startDate || getStartDate(),
            endDate: endDate || getEndDate(),
        };

        console.log('[Orders API] Fetching orders:', requestBody);

        const response = await fetch(`${ERP_BASE_URL}/hs/or/Order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ERP_AUTH}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Orders API] Error:', response.status, errorText);
            return NextResponse.json(
                { error: `ERP request failed: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Orders API] Response:', JSON.stringify(data).slice(0, 500));

        // Transform ERP response to our format
        // ERP returns: { count, results: [...] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orders: OrderListItem[] = (data.results || data.orders || data.data || []).map((order: any) => {
            return {
                id: order.uuid || order.id || '',
                uuid: order.uuid || '',
                orderNumber: order.orderCode || order.orderNumber || order.number || '',
                date: order.date || '',
                status: order.status || (order.poster ? 'Баталгаажсан' : 'Шинэ'),
                statusCode: order.statusCode || 0,
                companyId: order.companyId || '',
                companyName: order.companyName || '',
                companyCode: order.companyCode || '',
                totalAmount: order.totalSumma || order.totalAmount || order.total || 0,
                totalItems: order.totalItems || order.itemCount || 0,
                warehouseName: order.warehouseName || '',
                warehouseId: order.warehouseId || '',
                deliveryType: order.delivery || order.deliveryType || '',
                paymentType: order.paymentType || '',
                createdAt: order.date || '',
                poster: order.poster || false,
                loan: order.loan || false,
                paymentCheck: order.paymentCheck || false,
                // Discount & Promo data
                totalDiscountPoint: order.totalDiscountPoint || null,
                totalPromoPoint: order.totalPromoPoint || null,
            };
        });

        const result: OrderListResponse = {
            orders,
            total: data.total || data.count || orders.length,
            page: data.page || page,
            pageSize: data.pageSize || pageSize,
            totalPages: Math.ceil((data.total || orders.length) / pageSize),
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Orders API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
