'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Calendar,
    Building2,
    CreditCard,
    Package,
    Tag,
    Truck,
    CheckCircle,
    XCircle,
    Gift,
    Percent,
    Hash,
    Layers,
} from 'lucide-react';
import { getClient } from '@/lib/auth';
import type { OrderDetail, OrderDetailProduct } from '@/types/order';

interface OrderDetailSheetProps {
    orderUuid: string | null;
    orderNumber?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Format price helper
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('mn-MN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price) + '₮';
};

// Format date helper
const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Loading skeleton for detail
function DetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-48 h-6" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="w-20 h-3" />
                        <Skeleton className="w-full h-5" />
                    </div>
                ))}
            </div>
            <Separator />
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 p-3 border rounded-lg">
                        <Skeleton className="w-12 h-12 rounded" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-3/4 h-4" />
                            <Skeleton className="w-1/2 h-3" />
                        </div>
                        <Skeleton className="w-20 h-5" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Product card component
function ProductCard({ product }: { product: OrderDetailProduct }) {
    // Calculate total quantity from stock
    const totalQty = product.stock.reduce((sum, s) => sum + s.count, 0);

    // Get stock type name
    const getStockTypeName = (typeId: string) => {
        const stockType = product.stockTypes.find(st => st.uuid === typeId);
        return stockType?.name || 'ш';
    };

    // Calculate subtotal (price * quantity)
    const price = product.price || 0;
    const subtotal = price * totalQty;

    // Calculate discount
    const discountAmount = product.discountPoint?.reduce((sum, d) => sum + d.discountPointAmount, 0) || 0;

    // Calculate auto sale
    const autoSale = product.autoSale || 0;

    // Check if has discounts
    const hasDiscounts = product.discountPoint && product.discountPoint.length > 0 && discountAmount > 0;

    return (
        <div className="p-3 transition-colors border rounded-lg hover:bg-muted/50">
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-2">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        {product.brand?.name && (
                            <Badge variant="outline" className="text-xs">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {product.brand.name}
                            </Badge>
                        )}
                        {product.category?.name && (
                            <span className="text-xs text-muted-foreground">{product.category.name}</span>
                        )}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatPrice(subtotal)}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(price)}/ш</p>
                </div>
            </div>

            {/* Stock, Discount & Sale info - All in one row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Stock badges */}
                {product.stock.map((s, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                        <Layers className="h-2.5 w-2.5 mr-1" />
                        {s.count} {getStockTypeName(s.typeId)}
                    </Badge>
                ))}

                {/* Discount total badge */}
                {discountAmount > 0 && (
                    <Badge variant="secondary" className="text-xs text-blue-700 bg-blue-100">
                        <Percent className="h-2.5 w-2.5 mr-1" />
                        {formatPrice(discountAmount)}
                    </Badge>
                )}

                {/* Auto sale badge */}
                {autoSale > 0 && (
                    <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
                        <Gift className="h-2.5 w-2.5 mr-1" />
                        {formatPrice(autoSale)}
                    </Badge>
                )}

                {/* Under stock warning */}
                {product.isUnderStock && (
                    <Badge variant="destructive" className="text-xs">
                        Нөөц бага
                    </Badge>
                )}
            </div>

            {/* Discount Details - Show detailed breakdown if has discounts */}
            {hasDiscounts && (
                <div className="pt-2 mt-2 border-t border-dashed">
                    <p className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
                        <Percent className="w-3 h-3 text-blue-500" />
                        Хөнгөлөлтийн дэлгэрэнгүй:
                    </p>
                    <div className="space-y-1">
                        {product.discountPoint.map((d, idx) => (
                            <div key={idx} className="flex justify-between px-2 py-1 text-xs rounded bg-blue-50">
                                <span className="text-blue-700">{d.discountPointName}</span>
                                <span className="font-medium text-blue-800">{formatPrice(d.discountPointAmount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function OrderDetailSheet({ orderUuid, orderNumber, open, onOpenChange }: OrderDetailSheetProps) {
    const [detail, setDetail] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !orderUuid) {
            setDetail(null);
            setError(null);
            return;
        }

        const fetchDetail = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const client = getClient();
                if (!client?.corporate_id) {
                    throw new Error('Нэвтрэх шаардлагатай');
                }

                const response = await fetch('/api/orders/detail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: client.corporate_id,
                        uuid: orderUuid,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Захиалгын мэдээлэл татахад алдаа гарлаа');
                }

                const data = await response.json();
                setDetail(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [open, orderUuid]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[50%] p-0">
                <SheetHeader className="p-6 pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {detail?.orderCode || orderNumber || 'Захиалгын дэлгэрэнгүй'}
                    </SheetTitle>
                    {detail?.date && (
                        <SheetDescription className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(detail.date)}
                        </SheetDescription>
                    )}
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-100px)]">
                    <div className="p-6 space-y-6">
                        {isLoading && <DetailSkeleton />}

                        {error && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <XCircle className="w-12 h-12 mb-3 text-destructive" />
                                <p className="font-medium text-destructive">{error}</p>
                            </div>
                        )}

                        {!isLoading && !error && detail && (
                            <>
                                {/* Order Status */}
                                <div className="flex items-center justify-between">
                                    <Badge
                                        variant={detail.isPaid ? 'default' : 'secondary'}
                                        className={detail.isPaid ? 'bg-green-500' : ''}
                                    >
                                        {detail.isPaid ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Төлөгдсөн
                                            </>
                                        ) : (
                                            'Төлөгдөөгүй'
                                        )}
                                    </Badge>
                                    <Badge variant="outline">
                                        {detail.status || 'Шинэ'}
                                    </Badge>
                                </div>

                                {/* Order Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Building2 className="w-3 h-3" />
                                            Харилцагч
                                        </p>
                                        <p className="text-sm font-medium">{detail.companyName || '-'}</p>
                                        {detail.companyCode && (
                                            <p className="text-xs text-muted-foreground">{detail.companyCode}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Hash className="w-3 h-3" />
                                            Регистр
                                        </p>
                                        <p className="text-sm font-medium">{detail.registryNumber || '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Truck className="w-3 h-3" />
                                            Хүргэлт
                                        </p>
                                        <Badge variant="outline" className="text-xs">
                                            {detail.delivery === 'PENDING' ? 'Хүлээгдэж буй' :
                                                detail.delivery === 'DELIVERED' ? 'Хүргэгдсэн' :
                                                    detail.delivery || '-'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <CreditCard className="w-3 h-3" />
                                            Зээл
                                        </p>
                                        {detail.loan ? (
                                            <div>
                                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                                    Зээлээр
                                                </Badge>
                                                {detail.loanDescription && (
                                                    <p className="mt-1 text-xs text-muted-foreground">{detail.loanDescription}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Үгүй</p>
                                        )}
                                    </div>
                                </div>

                                {/* Total Amount */}
                                <Separator />
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Нийт дүн</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {formatPrice(detail.totalAmount || 0)}
                                        </span>
                                    </div>
                                    {detail.products && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {detail.products.length} бүтээгдэхүүн
                                        </p>
                                    )}
                                </div>

                                {/* Products List */}
                                {detail.products && detail.products.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold">
                                                <Package className="w-4 h-4" />
                                                Бүтээгдэхүүнүүд ({detail.products.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {detail.products.map((product, idx) => (
                                                    <ProductCard key={product.uuid || idx} product={product} />
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Total Discount Point Section - Below Products */}
                                {detail.totalDiscountPoint && detail.totalDiscountPoint.discountList && detail.totalDiscountPoint.discountList.length > 0 ? (
                                    <>
                                        <Separator />
                                        <div className="p-4 rounded-lg bg-blue-50">
                                            <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-blue-800">
                                                <Percent className="w-4 h-4 text-blue-500" />
                                                Хөнгөлөлтийн мэдээлэл
                                                <Badge variant="secondary" className="ml-auto text-blue-800 bg-blue-200">
                                                    {detail.totalDiscountPoint.discountList.length} хөнгөлөлт
                                                </Badge>
                                            </h3>
                                            <div className="space-y-2">
                                                {detail.totalDiscountPoint.discountList.map((d, idx) => (
                                                    <div key={idx} className="px-3 py-2 bg-white border border-blue-200 rounded-lg">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full shrink-0">
                                                                    <Percent className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-blue-900">{d.discountPointName}</p>
                                                                    <p className="text-xs text-blue-600">#{d.discountPointNumber} • {d.discountPointDate}</p>
                                                                </div>
                                                            </div>
                                                            <span className="ml-2 font-bold text-blue-700 shrink-0">{formatPrice(d.discountPointAmount)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Total discount amount */}
                                            <div className="flex items-center justify-between pt-2 mt-3 border-t border-blue-200">
                                                <span className="text-sm font-medium text-blue-800">Нийт хөнгөлөлт:</span>
                                                <span className="text-lg font-bold text-blue-700">
                                                    {formatPrice(detail.totalDiscountPoint.totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Fallback: Calculate from product discounts if totalDiscountPoint not available */
                                    detail.products && detail.products.some(p => p.discountPoint && p.discountPoint.length > 0) && (
                                        <>
                                            <Separator />
                                            <div className="p-4 rounded-lg bg-blue-50">
                                                <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-blue-800">
                                                    <Percent className="w-4 h-4 text-blue-500" />
                                                    Хөнгөлөлтийн мэдээлэл
                                                    <Badge variant="secondary" className="ml-auto text-blue-800 bg-blue-200">
                                                        {detail.products.filter(p => p.discountPoint && p.discountPoint.length > 0).length} бараа
                                                    </Badge>
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-blue-800">Нийт хөнгөлөлт:</span>
                                                    <span className="text-lg font-bold text-blue-700">
                                                        {formatPrice(
                                                            detail.products.reduce((sum, p) =>
                                                                sum + (p.discountPoint?.reduce((ds, d) => ds + d.discountPointAmount, 0) || 0), 0
                                                            )
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )
                                )}

                                {/* Total Promo Point Section - Below Products */}
                                {detail.totalPromoPoint && detail.totalPromoPoint.PromoList && detail.totalPromoPoint.PromoList.length > 0 ? (
                                    <>
                                        <Separator />
                                        <div className="p-4 rounded-lg bg-purple-50">
                                            <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-purple-800">
                                                <Gift className="w-4 h-4 text-purple-500" />
                                                Урамшууллын мэдээлэл
                                                <Badge variant="secondary" className="ml-auto text-purple-800 bg-purple-200">
                                                    {detail.totalPromoPoint.PromoList.length} урамшуулал
                                                </Badge>
                                            </h3>
                                            <div className="space-y-2">
                                                {detail.totalPromoPoint.PromoList.map((p, idx) => (
                                                    <div key={idx} className="px-3 py-2 bg-white border border-purple-200 rounded-lg">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full shrink-0">
                                                                    <Gift className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-purple-900">{p.promoName}</p>
                                                                    <p className="text-xs text-purple-600 truncate">{p.name}</p>
                                                                </div>
                                                            </div>
                                                            <span className="ml-2 font-bold text-purple-700 shrink-0">{formatPrice(p.amount)}</span>
                                                        </div>
                                                        <div className="ml-10 text-xs text-purple-500">
                                                            {p.startDate} - {p.endDate}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Total promo amount */}
                                            <div className="flex items-center justify-between pt-2 mt-3 border-t border-purple-200">
                                                <span className="text-sm font-medium text-purple-800">Нийт урамшуулал:</span>
                                                <span className="text-lg font-bold text-purple-700">
                                                    {formatPrice(detail.totalPromoPoint.totalPromoAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Fallback: Show promotionPoint if totalPromoPoint not available */
                                    detail.promotionPoint && detail.promotionPoint.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="p-4 rounded-lg bg-purple-50">
                                                <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-purple-800">
                                                    <Gift className="w-4 h-4 text-purple-500" />
                                                    Урамшууллын оноо
                                                    <Badge variant="secondary" className="ml-auto text-purple-800 bg-purple-200">
                                                        {detail.promotionPoint.length} урамшуулал
                                                    </Badge>
                                                </h3>
                                                <div className="space-y-2">
                                                    {detail.promotionPoint.map((p, idx) => (
                                                        <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white border border-purple-200 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                                                                    <Gift className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-purple-900">{p.promotionPointName}</p>
                                                                    <p className="text-xs text-purple-600">ID: {p.promotionPointID}</p>
                                                                </div>
                                                            </div>
                                                            <span className="font-bold text-purple-700">{formatPrice(p.promotionPointAmount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between pt-2 mt-3 border-t border-purple-200">
                                                    <span className="text-sm font-medium text-purple-800">Нийт урамшуулал:</span>
                                                    <span className="text-lg font-bold text-purple-700">
                                                        {formatPrice(detail.promotionPoint.reduce((sum, p) => sum + p.promotionPointAmount, 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )
                                )}

                                {/* Sale Documents */}
                                {detail.saleDocuments && detail.saleDocuments.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h3 className="mb-2 text-sm font-semibold">Борлуулалтын баримтууд</h3>
                                            <div className="space-y-1">
                                                {detail.saleDocuments.map((doc, idx) => (
                                                    <Badge key={idx} variant="outline" className="mr-1 text-xs">
                                                        {doc.uuid.slice(0, 8)}...
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
