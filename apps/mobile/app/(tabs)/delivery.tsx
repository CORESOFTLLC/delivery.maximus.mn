import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;
// @ts-ignore - expo-router exports router in v6
import { router } from 'expo-router';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '../../stores/delivery-auth-store';
import { getWorkerPackages, getWorkerProfile, TodayStats, PackageListItem } from '../../services/delivery-api';

export default function DeliveryScreen() {
  const { worker } = useAuthStore();
  
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [packagesResult, profileResult] = await Promise.all([
        getWorkerPackages(worker?.id),
        getWorkerProfile(worker?.id),
      ]);
      
      if (packagesResult.success && packagesResult.data) {
        // Filter only packages with delivery_pending > 0 or delivered > 0
        // These are packages that have left the warehouse (Түгээлт section only)
        const deliveryPackages = packagesResult.data.packages.filter(
          pkg => pkg.delivery_pending > 0 || pkg.delivered > 0 || pkg.failed > 0
        );
        setPackages(deliveryPackages);
      }
      
      if (profileResult.success && profileResult.data) {
        setStats(profileResult.data.today_stats);
      }
    } catch (error) {
      Alert.alert('Алдаа', 'Сүлжээний алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [worker?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Navigate to package delivery detail page
  const goToPackageDelivery = (packageId: number) => {
    router.push(`/package/${packageId}/delivery` as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return '#8B5CF6';
      case 'in_progress': return '#3B82F6';
      case 'delivered': return '#f59e0b';
      case 'failed': return '#EF4444';
      case 'returned': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'loaded': return 'Ачигдсан';
      case 'in_progress': return 'Хүргэж байна';
      case 'delivered': return 'Хүргэгдсэн';
      case 'failed': return 'Амжилтгүй';
      case 'returned': return 'Буцаагдсан';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    const color = getStatusColor(status);
    switch (status) {
      case 'loaded': return <Package size={16} color={color} />;
      case 'in_progress': return <Truck size={16} color={color} />;
      case 'delivered': return <CheckCircle2 size={16} color={color} />;
      case 'failed': return <XCircle size={16} color={color} />;
      default: return <Clock size={16} color={color} />;
    }
  };

  const renderPackageItem = ({ item }: { item: PackageListItem }) => {
    const totalOrders = item.total_orders || 0;
    const deliveredOrders = item.delivered || 0;
    const pendingOrders = item.delivery_pending || 0;
    const progress = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
    const isCompleted = progress === 100 && totalOrders > 0;
    const hasPending = pendingOrders > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          isCompleted && styles.packageCardCompleted,
          hasPending && styles.packageCardPending,
        ]}
        onPress={() => goToPackageDelivery(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.packageIconContainer, isCompleted && { backgroundColor: '#D1FAE5' }]}>
          <Truck size={28} color={isCompleted ? '#10B981' : '#e17100'} />
        </View>
        
        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packageDate}>{item.formatted_date}</Text>
          
          <View style={styles.packageStats}>
            <View style={styles.packageStatItem}>
              <Package size={14} color="#6B7280" />
              <Text style={styles.packageStatText}>{totalOrders} падаан</Text>
            </View>
            <View style={[styles.packageStatItem, { marginLeft: 12 }]}>
              <CheckCircle2 size={14} color="#e17100" />
              <Text style={[styles.packageStatText, { color: '#e17100' }]}>{deliveredOrders}</Text>
            </View>
            {pendingOrders > 0 && (
              <View style={[styles.packageStatItem, { marginLeft: 12 }]}>
                <Clock size={14} color="#D97706" />
                <Text style={[styles.packageStatText, { color: '#D97706' }]}>{pendingOrders}</Text>
              </View>
            )}
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
        
        <ChevronRight size={24} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.summaryBar}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.summaryItem}>
              <View style={styles.skeletonCircle} />
              <View style={[styles.skeletonLine, { width: 28, marginTop: 6 }]} />
              <View style={[styles.skeletonLine, { width: 40, marginTop: 4 }]} />
            </View>
          ))}
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.packageCard, { height: 100 }]}>
              <View style={[styles.skeletonLine, { width: '50%', height: 14 }]} />
              <View style={[styles.skeletonLine, { width: '30%', height: 10, marginTop: 8 }]} />
              <View style={[styles.skeletonLine, { width: '100%', height: 6, marginTop: 12, borderRadius: 3 }]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary bar — warehouse загвараар */}
      {stats && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#DBEAFE' }]}>
              <Package size={16} color="#2563EB" />
            </View>
            <Text style={styles.summaryValue}>{stats.total_orders}</Text>
            <Text style={styles.summaryLabel}>Нийт</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle2 size={16} color="#059669" />
            </View>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>{stats.delivered}</Text>
            <Text style={styles.summaryLabel}>Хүргэсэн</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={16} color="#D97706" />
            </View>
            <Text style={[styles.summaryValue, { color: '#B45309' }]}>{stats.pending + stats.in_progress}</Text>
            <Text style={styles.summaryLabel}>Үлдсэн</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FEE2E2' }]}>
              <XCircle size={16} color="#DC2626" />
            </View>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{stats.failed}</Text>
            <Text style={styles.summaryLabel}>Амжилтгүй</Text>
          </View>
        </View>
      )}

      <FlatList
        data={packages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          packages.length === 0 && { flex: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <CheckCircle2 size={40} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>Хүргэлтийн багц алга</Text>
            <Text style={styles.emptySubtitle}>
              Агуулах хэсэгт тулгалт хийснийх дараа{'\n'}хүргэлтийн багц энд харагдана.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/warehouse' as any)}
            >
              <Text style={styles.emptyButtonText}>Агуулах руу шилжих</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  /* ── Summary bar (warehouse-тай ижил загвар) ── */
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },

  listContent: {
    padding: 16,
    paddingBottom: TAB_BAR_HEIGHT + 16,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  packageCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  packageCardPending: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  packageIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageInfo: {
    flex: 1,
    marginLeft: 14,
  },
  packageName: {
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  packageDate: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  packageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  packageStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packageStatText: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#6B7280',
    minWidth: 36,
  },

  /* ── Empty state (warehouse-тай ижил загвар) ── */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },

  /* ── Skeleton ── */
  skeletonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },

});

