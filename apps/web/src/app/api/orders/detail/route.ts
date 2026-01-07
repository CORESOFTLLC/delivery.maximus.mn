import { NextRequest, NextResponse } from 'next/server';

const ERP_BASE_URL = process.env.ERP_BASE_URL || 'http://203.21.120.60:8080/maximus_trade';
const ERP_USERNAME = process.env.ERP_USERNAME || 'TestAPI';
const ERP_PASSWORD = process.env.ERP_PASSWORD || 'jI9da0zu';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, uuid } = body;

        if (!username || !uuid) {
            return NextResponse.json(
                { error: 'username болон uuid шаардлагатай' },
                { status: 400 }
            );
        }

        // Basic auth encoding
        const auth = Buffer.from(`${ERP_USERNAME}:${ERP_PASSWORD}`).toString('base64');

        // Call ERP OrderDetail API
        const erpResponse = await fetch(`${ERP_BASE_URL}/hs/od/OrderDetail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify({
                username,
                uuid,
            }),
        });

        if (!erpResponse.ok) {
            console.error('ERP OrderDetail error:', erpResponse.status, erpResponse.statusText);
            return NextResponse.json(
                { error: 'ERP системээс мэдээлэл татахад алдаа гарлаа' },
                { status: erpResponse.status }
            );
        }

        const erpData = await erpResponse.json();

        // Log to see what data is coming from ERP
        console.log('[Order Detail API] Response keys:', Object.keys(erpData));
        console.log('[Order Detail API] totalDiscountPoint:', JSON.stringify(erpData.totalDiscountPoint));
        console.log('[Order Detail API] totalPromoPoint:', JSON.stringify(erpData.totalPromoPoint));

        // Return the order detail directly
        return NextResponse.json(erpData);
    } catch (error) {
        console.error('Order detail API error:', error);
        return NextResponse.json(
            { error: 'Захиалгын дэлгэрэнгүй мэдээлэл татахад алдаа гарлаа' },
            { status: 500 }
        );
    }
}
