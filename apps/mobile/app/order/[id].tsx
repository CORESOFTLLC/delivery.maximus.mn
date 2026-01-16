/**
 * ЗАХИАЛГЫН ДЭЛГЭРЭНГҮЙ ДЭЛГЭЦ
 * 
 * API: POST /hs/od/OrderDetail
 * Body: { username, uuid }
 * 
 * ХЭСГҮҮД:
 * 1. Харилцагчийн мэдээлэл (companyName, registryNumber)
 * 2. Захиалгын мэдээлэл (orderCode, date, totalAmount, status)
 * 3. Урамшууллын оноо (discountPoint)
 * 4. Промо жагсаалт (promotionPoint)
 * 5. Бүтээгдэхүүний жагсаалт (products)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Building2, 
  Calendar,
  Tag,
  Gift,
  ShoppingBag,
  Grid3X3,
  List,
  Package,
  Info,
  Warehouse,
  Banknote,
  Boxes,
} from 'lucide-react-native';
import { Box, VStack, HStack, Text, Heading } from '../../components/ui';
import { getOrderDetail, type OrderDetail, type OrderDetailProduct } from '../../services/api';
import { useAuthStore } from '../../stores/auth-store';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { erpDetails, user } = useAuthStore();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const fetchOrderDetail = useCallback(async () => {
    const username = user?.username;
    if (!username || !id) {
      setError('Хэрэглэгчийн мэдээлэл олдсонгүй');
      setIsLoading(false);
      return;
    }

    try {
      const result = await getOrderDetail({ username, uuid: id });
      
      if (result.success && result.data) {
        setOrder(result.data);
        setError(null);
      } else {
        setError(result.error || 'Захиалга олдсонгүй');
      }
    } catch (err) {
      setError('Сүлжээний алдаа');
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.username]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetail();
    setRefreshing(false);
  }, [fetchOrderDetail]);

  const formatDate = (dateStr: string) => {
    return dateStr.replace(' ', ' | ');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + '₮';
  };

  // Calculate total discount from products
  const calculateTotalDiscount = () => {
    if (!order?.products) return 0;
    return order.products.reduce((sum, product) => {
      const discountAmount = product.discountPoint?.reduce((d, dp) => d + dp.discountPointAmount, 0) || 0;
      return sum + discountAmount;
    }, 0);
  };

  // Get discount items with details
  const getDiscountItems = () => {
    if (!order?.products) return [];
    const items: { id: string; date: string; name: string; amount: number }[] = [];
    
    order.products.forEach(product => {
      product.discountPoint?.forEach(dp => {
        if (dp.discountPointAmount > 0) {
          items.push({
            id: dp.discountPointID,
            date: order.date,
            name: 'төлбөр төлөлт-н хөнгөлөлт',
            amount: -dp.discountPointAmount,
          });
        }
      });
    });
    
    return items;
  };

  // Calculate product total
  const calculateProductTotal = (product: OrderDetailProduct) => {
    const quantity = product.stock?.[0]?.count || 0;
    return product.price * quantity;
  };

  // Group products by brand
  const groupProductsByBrand = (products: OrderDetailProduct[]) => {
    const groups: { [key: string]: { brandName: string; products: OrderDetailProduct[] } } = {};
    
    products.forEach((product) => {
      const brandName = product.brand?.name || 'Бусад';
      const brandId = product.brand?.uuid || 'other';
      
      if (!groups[brandId]) {
        groups[brandId] = { brandName, products: [] };
      }
      groups[brandId].products.push(product);
    });
    
    // Sort groups alphabetically, but keep "Бусад" at the end
    return Object.entries(groups).sort(([idA, a], [idB, b]) => {
      if (idA === 'other') return 1;
      if (idB === 'other') return -1;
      return a.brandName.localeCompare(b.brandName);
    });
  };

  const groupedProducts = order?.products ? groupProductsByBrand(order.products) : [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Box className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-typography-500">Ачаалж байна...</Text>
        </Box>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <Box className="flex-1 justify-center items-center px-4">
          <Info size={48} color="#DC2626" />
          <Text className="mt-4 text-typography-500 text-center">{error || 'Захиалга олдсонгүй'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrderDetail}
          >
            <Text style={styles.retryButtonText}>Дахин оролдох</Text>
          </TouchableOpacity>
        </Box>
      </SafeAreaView>
    );
  }

  const discountItems = getDiscountItems();
  const totalDiscount = calculateTotalDiscount();
  const hasPromotions = order.promotionPoint && order.promotionPoint.length > 0 && 
    order.promotionPoint.some(p => p.promotionPointAmount > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Захиалга засаж дахин илгээх</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Company Info Card */}
        <View style={styles.card}>
          <HStack style={{ alignItems: 'flex-start', gap: 12 }}>
            <View style={styles.cardIcon}>
              <Building2 size={24} color="#6B7280" />
            </View>
            <VStack style={{ flex: 1 }}>
              <Text style={styles.companyName}>{order.companyName}</Text>
              <Text style={styles.registryNumber}>Регистр: {order.registryNumber || '-'}</Text>
            </VStack>
          </HStack>
          
          {/* Order Info */}
          <View style={styles.orderInfoRow}>
            <HStack style={{ alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconBadge, { backgroundColor: '#DBEAFE' }]}>
                <Calendar size={14} color="#2563EB" />
              </View>
              <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Warehouse size={14} color="#F59E0B" />
              </View>
              <Text style={styles.orderInfoLabel}>Агуулах:</Text>
            </HStack>
            <Text style={styles.orderInfoValue}>Огноо: {formatDate(order.date)}</Text>
          </View>
          
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderCode}>Дугаар: {order.orderCode}</Text>
            <Text style={styles.totalAmount}>Дүн: {formatAmount(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Discount Points Card */}
        <View style={styles.card}>
          <HStack style={{ alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={[styles.cardIconSmall, { backgroundColor: '#FEF3C7' }]}>
              <Tag size={20} color="#F59E0B" />
            </View>
            <VStack>
              <Text style={styles.sectionTitle}>УРАМШУУЛЛЫН ОНОО</Text>
              <Text style={styles.sectionSubtitle}>Нийт: {discountItems.length} ширхэг</Text>
            </VStack>
          </HStack>
          
          {discountItems.length > 0 ? (
            <>
              <View style={styles.discountTable}>
                <View style={styles.discountTableHeader}>
                  <Text style={styles.discountHeaderText}>#ID: {discountItems[0]?.id?.slice(0, 12) || '-'}</Text>
                  <HStack style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={styles.discountHeaderText}>{formatDate(order.date)}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{discountItems.length}</Text>
                    </View>
                  </HStack>
                </View>
                {discountItems.slice(0, 1).map((item, index) => (
                  <View key={index} style={styles.discountRow}>
                    <Text style={styles.discountName}>{item.name}</Text>
                    <Text style={styles.discountAmount}>{formatAmount(item.amount)}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.totalDiscountRow}>
                <Text style={styles.totalDiscountLabel}>Нийт хасагдсан урамшуулал:</Text>
                <Text style={styles.totalDiscountAmount}>-{formatAmount(totalDiscount)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyInfo}>
              <Info size={16} color="#9CA3AF" />
              <Text style={styles.emptyText}>Энэ захиалгад урамшуулал байхгүй байна</Text>
            </View>
          )}
        </View>

        {/* Promo Points Card */}
        <View style={styles.card}>
          <HStack style={{ alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={[styles.cardIconSmall, { backgroundColor: '#F3E8FF' }]}>
              <Gift size={20} color="#8B5CF6" />
            </View>
            <VStack>
              <Text style={styles.sectionTitle}>НӨХЦӨЛ БИЕЛСЭН ПРОМО ЖАГСААЛТ</Text>
              <Text style={styles.sectionSubtitle}>Промо мэдээлэл {hasPromotions ? 'байна' : 'байхгүй'}</Text>
            </VStack>
          </HStack>
          
          {hasPromotions ? (
            order.promotionPoint.map((promo, index) => (
              <View key={index} style={styles.promoItem}>
                <Text style={styles.promoName}>{promo.promotionPointName}</Text>
                <Text style={styles.promoAmount}>{formatAmount(promo.promotionPointAmount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyInfo}>
              <Info size={16} color="#9CA3AF" />
              <Text style={styles.emptyText}>Энэ захиалгад промо мэдээлэл байхгүй байна</Text>
            </View>
          )}
        </View>

        {/* Products List Card */}
        <View style={styles.productsHeader}>
          <HStack style={{ alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={20} color="#111827" />
            <Text style={styles.productsTitle}>Худалдан авсан барааны жагсаалт ({order.products?.length || 0})</Text>
          </HStack>
          <HStack style={{ gap: 4 }}>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Grid3X3 size={18} color={viewMode === 'grid' ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={18} color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
          </HStack>
        </View>

        {/* Products */}
        {viewMode === 'grid' ? (
          // Grid View - Card style grouped by brand
          <View style={styles.productsCardList}>
            {groupedProducts.map(([brandId, group]) => (
              <View key={brandId} style={styles.brandGroup}>
                {/* Brand Header */}
                <View style={styles.brandHeader}>
                  <View style={styles.brandHeaderIcon}>
                    <Package size={14} color="#7C3AED" />
                  </View>
                  <Text style={styles.brandHeaderText}>{group.brandName}</Text>
                  <View style={styles.brandCountBadge}>
                    <Text style={styles.brandCountText}>{group.products.length}</Text>
                  </View>
                </View>
                
                {/* Products in this brand */}
                {group.products.map((product, index) => (
                  <View key={product.uuid} style={styles.productCard}>
                    <HStack style={{ gap: 12 }}>
                      {/* Product Image */}
                      <View style={styles.productImage}>
                        <Package size={28} color="#9CA3AF" />
                      </View>
                      
                      {/* Product Info */}
                      <VStack style={{ flex: 1 }}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {index + 1}. {product.name}
                        </Text>
                        
                        {/* Qty, Price, Total - all in one row */}
                        <HStack style={{ marginTop: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                          <HStack style={{ gap: 12 }}>
                            <HStack style={{ alignItems: 'center', gap: 4 }}>
                              <Boxes size={12} color="#6B7280" />
                              <Text style={styles.priceText}>
                                {product.stock?.[0]?.count || 0}ш
                              </Text>
                            </HStack>
                            <HStack style={{ alignItems: 'center', gap: 4 }}>
                              <Banknote size={12} color="#6B7280" />
                              <Text style={styles.priceText}>{formatAmount(product.price)}</Text>
                            </HStack>
                          </HStack>
                          <Text style={styles.productTotalText}>Нийт: {formatAmount(calculateProductTotal(product))}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          // List View - Products grouped by brand
          <View style={styles.productListContainer}>
            {groupedProducts.map(([brandId, group], groupIndex) => (
              <View key={brandId} style={styles.brandGroup}>
                {/* Brand Header */}
                <View style={styles.brandHeader}>
                  <View style={styles.brandHeaderIcon}>
                    <Package size={12} color="#6B7280" />
                  </View>
                  <Text style={styles.brandHeaderText}>{group.brandName}</Text>
                  <View style={styles.brandCountBadge}>
                    <Text style={styles.brandCountText}>{group.products.length}</Text>
                  </View>
                </View>
                
                {/* Products in this brand */}
                {group.products.map((product, index) => (
                  <View key={product.uuid} style={styles.productListItem}>
                    {/* Row 1: Number and Product Name */}
                    <View style={styles.productListNameRow}>
                      <Text style={styles.productListIndex}>{index + 1}.</Text>
                      <Text style={styles.productListName}>
                        {product.name}
                      </Text>
                    </View>
                    
                    {/* Row 2: Price, Qty, Total */}
                    <View style={styles.productListPriceRow}>
                      <HStack style={{ gap: 12 }}>
                        <Text style={styles.productListPriceLabel}>Үнэ: <Text style={styles.productListPriceValue}>{formatAmount(product.price)}</Text></Text>
                        <Text style={styles.productListPriceLabel}>Тоо: <Text style={styles.productListPriceValue}>{product.stock?.[0]?.count || 0}</Text></Text>
                      </HStack>
                      <Text style={styles.productListTotalValue}>{formatAmount(calculateProductTotal(product))}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Bottom Notice */}
        {(discountItems.length > 0 || hasPromotions) && (
          <View style={styles.bottomNotice}>
            <Info size={18} color="#F59E0B" />
            <Text style={styles.bottomNoticeText}>
              Тухайн захиалгад Промо болон урамшууллын дүн тооцоологдсон байна
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  registryNumber: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfoLabel: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  orderInfoValue: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  orderCode: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'GIP-Bold',
    color: '#111827',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: '#10B981',
    marginTop: 2,
  },
  discountTable: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
  },
  discountTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  discountHeaderText: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  discountBadge: {
    backgroundColor: '#F97316',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadgeText: {
    fontSize: 11,
    fontFamily: 'GIP-Bold',
    color: '#FFFFFF',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  discountName: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#374151',
  },
  discountAmount: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#F97316',
  },
  totalDiscountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  totalDiscountLabel: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#DC2626',
  },
  totalDiscountAmount: {
    fontSize: 16,
    fontFamily: 'GIP-Bold',
    color: '#DC2626',
  },
  emptyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  promoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  promoName: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#374151',
  },
  promoAmount: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#8B5CF6',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  productsTitle: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewModeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  bottomNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bottomNoticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#B45309',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  // Card List View Styles (Grid button)
  productsCardList: {
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
    lineHeight: 18,
  },
  priceIcon: {
    fontSize: 11,
  },
  priceText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
  },
  productTotalText: {
    fontSize: 12,
    fontFamily: 'GIP-Bold',
    color: '#10B981',
  },
  quantitySummary: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
  },
  quantityValue: {
    fontSize: 11,
    fontFamily: 'GIP-Bold',
    color: '#2563EB',
  },
  // Expanded List View Styles (List button)
  productListContainer: {
    marginHorizontal: 16,
  },
  brandGroup: {
    marginBottom: 10,
  },
  brandHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 4,
  },
  brandHeaderIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  brandHeaderText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
  },
  brandCountBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  brandCountText: {
    fontSize: 10,
    fontFamily: 'GIP-Bold',
    color: '#FFFFFF',
  },
  productListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 2,
    borderLeftColor: '#D1D5DB',
  },
  productListNameRow: {
    flexDirection: 'row' as const,
    gap: 4,
  },
  productListIndex: {
    fontSize: 11,
    fontFamily: 'GIP-SemiBold',
    color: '#2563EB',
    minWidth: 20,
  },
  productListName: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: '#111827',
    lineHeight: 16,
  },
  productBadgesRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
    marginLeft: 24,
  },
  categoryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: 'GIP-Medium',
    color: '#1D4ED8',
  },
  brandBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 10,
    fontFamily: 'GIP-Medium',
    color: '#7C3AED',
  },
  productListPriceRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 4,
    marginLeft: 20,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  productListPriceLabel: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  productListPriceValue: {
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
  },
  productListTotalValue: {
    fontSize: 12,
    fontFamily: 'GIP-Bold',
    color: '#10B981',
  },
});
