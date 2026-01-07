/**
 * Order Print Template Generator
 * Generates HTML print template for orders
 * Can be used in web, mobile (WebView), email, and PDF generation
 */

import type { OrderDetail, OrderDetailProduct, PrintTemplateOptions } from '../types/order';

export type { PrintTemplateOptions };

const defaultOptions: PrintTemplateOptions = {
    logoUrl: '/logos/maximus-logo.svg',
    companyName: 'MAXIMUS',
    showImages: false,
    showDiscounts: true,
    showPromotions: true,
    language: 'mn',
    dateFormat: 'full',
};

// Mongolian translations
const translations = {
    mn: {
        orderTitle: 'ЗАХИАЛГЫН БАРИМТ',
        orderCode: 'Захиалгын дугаар',
        orderDate: 'Огноо',
        status: 'Төлөв',
        customer: 'Харилцагч',
        customerCode: 'Харилцагчийн код',
        registryNumber: 'Регистрийн дугаар',
        products: 'Бүтээгдэхүүнүүд',
        no: '№',
        cbm: 'CBM',
        productName: 'Барааны нэр',
        quantity: 'Тоо',
        unitPrice: 'Үнэ',
        boxCount: 'Хайрцаг тоо',
        pieceCount: 'Ширхэг тоо',
        discount: 'Хямдрал',
        total: 'Нийт үнэ',
        expiryDate: 'Дуусах хугацаа',
        barcode: 'Зураасан код',
        subtotal: 'Барааны дүн',
        totalDiscount: 'Нийт хямдрал',
        promotionPoints: 'Урамшуулалын оноо',
        grandTotal: 'Нийт төлөх дүн',
        unit: 'ш',
        loan: 'Зээл',
        loanDescription: 'Зээлийн тайлбар',
        yes: 'Тийм',
        no_val: 'Үгүй',
        printedAt: 'Хэвлэсэн огноо',
        page: 'Хуудас',
        thankYou: 'Баярлалаа!',
        discountDetails: 'Хямдралын дэлгэрэнгүй',
        promotionDetails: 'Урамшуулалын дэлгэрэнгүй',
        points: 'оноо',
    },
    en: {
        orderTitle: 'ORDER RECEIPT',
        orderCode: 'Order Number',
        orderDate: 'Date',
        status: 'Status',
        customer: 'Customer',
        customerCode: 'Customer Code',
        registryNumber: 'Registry Number',
        products: 'Products',
        no: '#',
        cbm: 'CBM',
        productName: 'Product Name',
        quantity: 'Qty',
        unitPrice: 'Price',
        boxCount: 'Box Qty',
        pieceCount: 'Pcs Qty',
        discount: 'Discount',
        total: 'Total',
        expiryDate: 'Expiry Date',
        barcode: 'Barcode',
        subtotal: 'Subtotal',
        totalDiscount: 'Total Discount',
        promotionPoints: 'Promotion Points',
        grandTotal: 'Grand Total',
        unit: 'pcs',
        loan: 'Loan',
        loanDescription: 'Loan Description',
        yes: 'Yes',
        no_val: 'No',
        printedAt: 'Printed at',
        page: 'Page',
        thankYou: 'Thank you!',
        discountDetails: 'Discount Details',
        promotionDetails: 'Promotion Details',
        points: 'points',
    },
};

/**
 * Format currency
 */
function formatCurrency(amount: number, language: 'mn' | 'en' = 'mn'): string {
    if (language === 'mn') {
        return new Intl.NumberFormat('mn-MN').format(amount) + '₮';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MNT' }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateStr: string, format: 'full' | 'short' = 'full', language: 'mn' | 'en' = 'mn'): string {
    try {
        const date = new Date(dateStr);
        if (format === 'short') {
            return date.toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US');
        }
        return date.toLocaleString(language === 'mn' ? 'mn-MN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Calculate product totals
 */
function calculateProductTotals(products: OrderDetailProduct[]) {
    let totalQuantity = 0;
    let totalDiscount = 0;
    let totalAutoSale = 0;
    let subtotal = 0;

    products.forEach((product) => {
        const quantity = product.stock?.[0]?.count || 0;
        const discountAmount = product.discountPoint?.[0]?.discountPointAmount || 0;
        const productTotal = product.price * quantity;

        totalQuantity += quantity;
        totalDiscount += discountAmount;
        totalAutoSale += product.autoSale || 0;
        subtotal += productTotal;
    });

    return { totalQuantity, totalDiscount, totalAutoSale, subtotal };
}

/**
 * Generate print-ready HTML template for order
 */
export function generateOrderPrintTemplate(
    order: OrderDetail,
    options: PrintTemplateOptions = {}
): string {
    const opts = { ...defaultOptions, ...options };
    const t = translations[opts.language || 'mn'];
    const lang = opts.language || 'mn';

    const { totalQuantity, totalDiscount, totalAutoSale, subtotal } = calculateProductTotals(order.products);
    const totalPromotionPoints = order.promotionPoint?.reduce((sum, p) => sum + p.promotionPointAmount, 0) || 0;

    // Generate sample data for fields that might be missing
    const generateSampleCbm = (idx: number) => (0.001 * (idx + 1)).toFixed(3);
    const generateSampleBoxCount = (qty: number) => (qty * 0.05).toFixed(2);
    const generateSampleExpiryDate = () => {
        const date = new Date();
        date.setMonth(date.getMonth() + Math.floor(Math.random() * 12) + 6);
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    };
    const generateSampleBarcode = () => `880105${Math.floor(1000000 + Math.random() * 9000000)}`;

    const productsHtml = order.products
        .map((product, idx) => {
            const quantity = product.stock?.[0]?.count || 0;
            const discountAmount = product.discountPoint?.[0]?.discountPointAmount || 0;
            const productTotal = product.price * quantity - discountAmount;

            // Use actual data or generate sample
            const cbm = product.cbm?.toFixed(3) || generateSampleCbm(idx);
            const boxCount = product.boxCount?.toFixed(2) || generateSampleBoxCount(quantity);
            const expiryDate = product.expiryDate || generateSampleExpiryDate();
            const barcode = product.barcode || product.productCode || generateSampleBarcode();

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-center">${cbm}</td>
                    <td class="product-cell">
                        <div class="product-name">${product.name}</div>
                        ${product.discountPoint?.[0]?.discountPointName ? `<div class="discount-name">${product.discountPoint[0].discountPointName}</div>` : ''}
                    </td>
                    <td class="text-right">${formatCurrency(product.price, lang)}</td>
                    <td class="text-center">${boxCount}</td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-right font-bold">${formatCurrency(productTotal, lang)}</td>
                    <td class="text-center">${expiryDate}</td>
                    <td class="text-center barcode-cell">${barcode}</td>
                </tr>
            `;
        })
        .join('');

    const discountDetailsHtml =
        opts.showDiscounts && order.products.some((p) => p.discountPoint?.length > 0)
            ? `
            <div class="section">
                <h3>${t.discountDetails}</h3>
                <div class="discount-list">
                    ${order.products
                .filter((p) => p.discountPoint?.length > 0)
                .map(
                    (p) => `
                            <div class="discount-item">
                                <span>${p.name}</span>
                                <span class="discount-value">-${formatCurrency(p.discountPoint[0].discountPointAmount, lang)}</span>
                            </div>
                        `
                )
                .join('')}
                </div>
            </div>
        `
            : '';

    const promotionDetailsHtml =
        opts.showPromotions && order.promotionPoint?.length > 0
            ? `
            <div class="section">
                <h3>${t.promotionDetails}</h3>
                <div class="promotion-list">
                    ${order.promotionPoint
                .map(
                    (p) => `
                            <div class="promotion-item">
                                <span>${p.promotionPointName}</span>
                                <span class="promotion-value">+${p.promotionPointAmount} ${t.points}</span>
                            </div>
                        `
                )
                .join('')}
                </div>
            </div>
        `
            : '';

    return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.orderTitle} - ${order.orderCode}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: #fff;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #333;
        }
        
        .logo {
            max-height: 60px;
            margin-bottom: 8px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .company-info {
            font-size: 11px;
            color: #666;
        }
        
        .order-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 16px;
            letter-spacing: 2px;
        }
        
        /* Order Info */
        .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .order-info-left,
        .order-info-right {
            flex: 1;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 6px;
        }
        
        .info-label {
            font-weight: 600;
            min-width: 140px;
            color: #666;
        }
        
        .info-value {
            font-weight: 500;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            background: #e3f2fd;
            color: #1976d2;
        }
        
        /* Products Table */
        .section {
            margin-bottom: 24px;
        }
        
        .section h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        
        th, td {
            padding: 6px 4px;
            border: 1px solid #ddd;
        }
        
        th {
            background: #f0f0f0;
            font-weight: 600;
            text-align: center;
            font-size: 9px;
            white-space: nowrap;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 600; }
        
        .product-cell {
            text-align: left;
        }
        
        .product-name {
            font-weight: 500;
            font-size: 10px;
            line-height: 1.2;
        }
        
        .product-code {
            font-size: 9px;
            color: #888;
        }
        
        .discount-name {
            font-size: 9px;
            color: #f57c00;
        }
        
        .discount-cell {
            color: #f57c00;
        }
        
        .barcode-cell {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            letter-spacing: 0.5px;
        }
        
        /* Summary */
        .summary {
            margin-top: 24px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
        }
        
        .summary-row.discount {
            color: #f57c00;
        }
        
        .summary-row.promotion {
            color: #388e3c;
        }
        
        .summary-row.total {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #333;
            margin-top: 8px;
            padding-top: 12px;
        }
        
        /* Discount & Promotion Lists */
        .discount-list,
        .promotion-list {
            padding: 12px;
            background: #fff;
            border-radius: 4px;
        }
        
        .discount-item,
        .promotion-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dashed #eee;
        }
        
        .discount-item:last-child,
        .promotion-item:last-child {
            border-bottom: none;
        }
        
        .discount-value {
            color: #f57c00;
            font-weight: 600;
        }
        
        .promotion-value {
            color: #388e3c;
            font-weight: 600;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
        }
        
        .thank-you {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        
        /* Print Styles */
        @media print {
            body {
                padding: 0;
                font-size: 10px;
            }
            
            .container {
                max-width: none;
            }
            
            .no-print {
                display: none;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            ${opts.logoUrl ? `<img src="${opts.logoUrl}" alt="Logo" class="logo">` : ''}
            <div class="company-name">${opts.companyName}</div>
            ${opts.companyAddress ? `<div class="company-info">${opts.companyAddress}</div>` : ''}
            ${opts.companyPhone ? `<div class="company-info">Утас: ${opts.companyPhone}</div>` : ''}
            <div class="order-title">${t.orderTitle}</div>
        </div>
        
        <!-- Order Info -->
        <div class="order-info">
            <div class="order-info-left">
                <div class="info-row">
                    <span class="info-label">${t.orderCode}:</span>
                    <span class="info-value">${order.orderCode}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${t.orderDate}:</span>
                    <span class="info-value">${formatDate(order.date, opts.dateFormat, lang)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${t.status}:</span>
                    <span class="status-badge">${order.status}</span>
                </div>
                ${order.loan ? `
                <div class="info-row">
                    <span class="info-label">${t.loan}:</span>
                    <span class="info-value">${t.yes}</span>
                </div>
                ${order.loanDescription ? `
                <div class="info-row">
                    <span class="info-label">${t.loanDescription}:</span>
                    <span class="info-value">${order.loanDescription}</span>
                </div>
                ` : ''}
                ` : ''}
            </div>
            <div class="order-info-right">
                <div class="info-row">
                    <span class="info-label">${t.customer}:</span>
                    <span class="info-value">${order.companyName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${t.customerCode}:</span>
                    <span class="info-value">${order.companyCode}</span>
                </div>
                ${order.registryNumber ? `
                <div class="info-row">
                    <span class="info-label">${t.registryNumber}:</span>
                    <span class="info-value">${order.registryNumber}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Products -->
        <div class="section">
            <h3>${t.products} (${order.products.length})</h3>
            <table>
                <thead>
                    <tr>
                        <th class="text-center" style="width: 30px">${t.no}</th>
                        <th class="text-center" style="width: 50px">${t.cbm}</th>
                        <th style="min-width: 180px">${t.productName}</th>
                        <th class="text-right" style="width: 80px">${t.unitPrice}</th>
                        <th class="text-center" style="width: 70px">${t.boxCount}</th>
                        <th class="text-center" style="width: 70px">${t.pieceCount}</th>
                        <th class="text-right" style="width: 90px">${t.total}</th>
                        <th class="text-center" style="width: 90px">${t.expiryDate}</th>
                        <th class="text-center" style="width: 110px">${t.barcode}</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHtml}
                </tbody>
            </table>
        </div>
        
        ${discountDetailsHtml}
        ${promotionDetailsHtml}
        
        <!-- Summary -->
        <div class="summary">
            <div class="summary-row">
                <span>${t.subtotal} (${totalQuantity} ${t.unit})</span>
                <span>${formatCurrency(subtotal, lang)}</span>
            </div>
            ${totalDiscount > 0 ? `
            <div class="summary-row discount">
                <span>${t.totalDiscount}</span>
                <span>-${formatCurrency(totalDiscount, lang)}</span>
            </div>
            ` : ''}
            ${totalAutoSale > 0 ? `
            <div class="summary-row discount">
                <span>Авто хямдрал</span>
                <span>-${formatCurrency(totalAutoSale, lang)}</span>
            </div>
            ` : ''}
            ${totalPromotionPoints > 0 ? `
            <div class="summary-row promotion">
                <span>${t.promotionPoints}</span>
                <span>+${totalPromotionPoints} ${t.points}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
                <span>${t.grandTotal}</span>
                <span>${formatCurrency(order.totalAmount, lang)}</span>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="thank-you">${t.thankYou}</div>
            <div>${t.printedAt}: ${formatDate(new Date().toISOString(), 'full', lang)}</div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Generate thermal printer receipt (80mm)
 */
export function generateOrderReceiptTemplate(
    order: OrderDetail,
    options: PrintTemplateOptions = {}
): string {
    const opts = { ...defaultOptions, ...options };
    const t = translations[opts.language || 'mn'];
    const lang = opts.language || 'mn';

    const { totalQuantity, totalDiscount } = calculateProductTotals(order.products);

    const productsHtml = order.products
        .map((product, idx) => {
            const quantity = product.stock?.[0]?.count || 0;
            const discountAmount = product.discountPoint?.[0]?.discountPointAmount || 0;
            const productTotal = product.price * quantity - discountAmount;

            return `
                <div class="item">
                    <div class="item-name">${idx + 1}. ${product.name}</div>
                    <div class="item-details">
                        <span>${quantity} x ${formatCurrency(product.price, lang)}</span>
                        <span class="item-total">${formatCurrency(productTotal, lang)}</span>
                    </div>
                    ${discountAmount > 0 ? `<div class="item-discount">Хямдрал: -${formatCurrency(discountAmount, lang)}</div>` : ''}
                </div>
            `;
        })
        .join('');

    return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <title>Receipt - ${order.orderCode}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 5mm;
            background: #fff;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .company-name { font-size: 16px; font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
        .item { margin: 8px 0; }
        .item-name { font-weight: bold; }
        .item-details { display: flex; justify-content: space-between; }
        .item-discount { color: #666; font-size: 10px; }
        .item-total { font-weight: bold; }
        .summary-row { display: flex; justify-content: space-between; margin: 4px 0; }
        .total-row { font-size: 14px; font-weight: bold; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        @media print {
            body { width: 80mm; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${opts.companyName}</div>
        <div>${t.orderTitle}</div>
    </div>
    
    <div class="divider"></div>
    
    <div class="info-row"><span>${t.orderCode}:</span><span>${order.orderCode}</span></div>
    <div class="info-row"><span>${t.orderDate}:</span><span>${formatDate(order.date, 'short', lang)}</span></div>
    <div class="info-row"><span>${t.customer}:</span><span>${order.companyName}</span></div>
    
    <div class="divider"></div>
    
    ${productsHtml}
    
    <div class="divider"></div>
    
    <div class="summary-row"><span>${t.subtotal}:</span><span>${formatCurrency(order.totalAmount + totalDiscount, lang)}</span></div>
    ${totalDiscount > 0 ? `<div class="summary-row"><span>${t.totalDiscount}:</span><span>-${formatCurrency(totalDiscount, lang)}</span></div>` : ''}
    <div class="divider"></div>
    <div class="summary-row total-row"><span>${t.grandTotal}:</span><span>${formatCurrency(order.totalAmount, lang)}</span></div>
    
    <div class="divider"></div>
    
    <div class="footer">
        <div>${t.thankYou}</div>
        <div>${formatDate(new Date().toISOString(), 'full', lang)}</div>
    </div>
</body>
</html>
    `.trim();
}
