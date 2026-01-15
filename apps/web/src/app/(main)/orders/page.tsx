'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  ShoppingBag,
  FileText,
  Calendar,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Percent,
  Gift,
  Warehouse,
  Building2,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getClient } from '@/lib/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { OrderDetailSheet } from '@/components/order-detail-sheet';
import type { OrderListItem, OrderListResponse } from '@/types/order';

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
  });
};

// Status badge colors
const getStatusBadge = (status: string, t: (key: string) => string) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('баталгаажсан') || statusLower.includes('confirmed') || statusLower.includes('approved')) {
    return <Badge variant="default" className="bg-green-500">{status}</Badge>;
  }
  if (statusLower.includes('цуцлагдсан') || statusLower.includes('cancelled') || statusLower.includes('rejected')) {
    return <Badge variant="destructive">{status}</Badge>;
  }
  if (statusLower.includes('хүлээгдэж') || statusLower.includes('pending') || statusLower.includes('new')) {
    return <Badge variant="secondary">{status}</Badge>;
  }
  return <Badge variant="outline">{status || t('orders.new')}</Badge>;
};

// Loading skeleton
function OrdersTableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 items-center p-4 border rounded-lg">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyOrders() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold text-center mb-2">{t('orders.noOrdersTitle')}</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        {t('orders.noOrdersDescription')}
      </p>
      <Button asChild size="lg">
        <Link href="/products">
          <ShoppingBag className="mr-2 h-5 w-5" />
          {t('cart.browseProducts')}
        </Link>
      </Button>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Order detail sheet state
  const [selectedOrderUuid, setSelectedOrderUuid] = useState<string | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | undefined>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const router = useRouter();
  const { t } = useTranslation();

  // Handle row click to navigate to detail page
  const handleRowClick = (order: OrderListItem) => {
    router.push(`/orders/${order.uuid}`);
  };

  const fetchOrders = useCallback(async (pageNum: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const client = getClient();
      if (!client?.corporate_id) {
        throw new Error(t('orders.loginRequired'));
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: client.corporate_id,
          page: pageNum,
          pageSize,
        }),
      });

      if (!response.ok) {
        throw new Error(t('orders.fetchError'));
      }

      const data: OrderListResponse = await response.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // Filter orders by search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(query) ||
      order.companyName?.toLowerCase().includes(query) ||
      order.status?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {t('orders.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('orders.last30DaysHistory')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="default">
            <Link href="/products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              {t('orders.newOrder')}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchOrders(page)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('orders.refresh')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('orders.totalOrders')}</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('orders.onThisPage')}</CardDescription>
            <CardTitle className="text-2xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('orders.page')}</CardDescription>
            <CardTitle className="text-2xl">{page} / {totalPages}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('orders.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <OrdersTableSkeleton />
          ) : filteredOrders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">{t('orders.number')}</TableHead>
                    <TableHead className="w-28">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {t('orders.date')}
                      </div>
                    </TableHead>
                    <TableHead>{t('orders.partner')}</TableHead>
                    <TableHead className="text-right">{t('orders.amount')}</TableHead>
                    <TableHead className="w-32 text-center">{t('orders.discount')}</TableHead>
                    <TableHead className="w-28">{t('orders.warehouse')}</TableHead>
                    <TableHead className="w-28">{t('orders.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id || order.uuid}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(order)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-primary">{order.orderNumber || '-'}</span>
                          {order.companyCode && (
                            <span className="text-xs text-muted-foreground">{order.companyCode}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">{order.companyName || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-lg">{formatPrice(order.totalAmount || 0)}</span>
                          {order.loan && (
                            <Badge variant="outline" className="text-xs mt-1 border-orange-300 text-orange-600">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {t('orders.loan')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center justify-center gap-1">
                            {/* Discount Badge */}
                            {order.totalDiscountPoint && order.totalDiscountPoint.totalAmount > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-help">
                                    <Percent className="h-3 w-3 mr-1" />
                                    {formatPrice(order.totalDiscountPoint.totalAmount)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-sm">{t('orders.discount')}</p>
                                    {order.totalDiscountPoint.discountList?.map((d, i) => (
                                      <div key={i} className="text-xs">
                                        <span className="font-medium">{d.discountPointName}</span>
                                        <span className="text-muted-foreground ml-2">{formatPrice(d.discountPointAmount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Promo Badge */}
                            {order.totalPromoPoint && order.totalPromoPoint.totalPromoAmount > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-help">
                                    <Gift className="h-3 w-3 mr-1" />
                                    {formatPrice(order.totalPromoPoint.totalPromoAmount)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-sm">{t('orders.promo')}</p>
                                    {order.totalPromoPoint.PromoList?.map((p, i) => (
                                      <div key={i} className="text-xs">
                                        <span className="font-medium">{p.promoName}</span>
                                        <span className="text-muted-foreground ml-2">{formatPrice(p.amount)}</span>
                                        <div className="text-muted-foreground">
                                          {p.startDate} - {p.endDate}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* No discount/promo */}
                            {(!order.totalDiscountPoint || order.totalDiscountPoint.totalAmount === 0) &&
                              (!order.totalPromoPoint || order.totalPromoPoint.totalPromoAmount === 0) && (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Warehouse className="h-3 w-3" />
                          <span className="truncate max-w-[80px]">{order.warehouseName || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {order.poster && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {getStatusBadge(order.status || t('orders.new'), t)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('orders.previous')}
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {t('orders.pageOf', { current: page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            {t('orders.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        orderUuid={selectedOrderUuid}
        orderNumber={selectedOrderNumber}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
