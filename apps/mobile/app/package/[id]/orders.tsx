/**
 * ПАДААНААР ТУЛГАХ ДЭЛГЭЦ
 * 
 * Харилцагч бүрээр захиалгуудыг тулгах
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { 
  Box, 
  Package, 
  ChevronRight, 
  Calendar, 
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Circle,
  Eye,
  CheckCircle2,
  MapPin,
  Navigation,
  Route,
  Map,
  Warehouse,
  Truck,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '../../../stores/delivery-auth-store';
import { getPackageOrders, DeliveryOrder, PackageOrdersData, optimizeRoute, updateOrderSortOrder } from '../../../services/delivery-api';

type FilterStatus = 'all' | 'assigned_to_driver' | 'warehouse_checking' | 'warehouse_checked' | 'driver_checking';

export default function PackageOrdersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { worker } = useAuthStore();
  
  const [data, setData] = useState<PackageOrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [optimizing, setOptimizing] = useState(false);
  const [manualSortMode, setManualSortMode] = useState(false);
  const [savingManualSort, setSavingManualSort] = useState(false);
  const [manualOrders, setManualOrders] = useState<DeliveryOrder[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user's current location
  const getCurrentLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        Alert.alert('Байршил', 'Байршлын зөвшөөрөл өгөөгүй байна. Тохиргооноос зөвшөөрнө үү.');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      console.log('Location obtained:', coords.latitude, coords.longitude);
      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.log('Error getting location:', error);
      // Fallback to last known location
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          const coords = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
          console.log('Using last known location:', coords.latitude, coords.longitude);
          setUserLocation(coords);
          return coords;
        }
      } catch (e) {
        console.log('No last known location');
      }
      return null;
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!id) return;
    
    try {
      // Get current location for distance calculation
      const location = await getCurrentLocation();
      
      const result = await getPackageOrders({
        packageId: parseInt(id),
        workerId: worker?.id,
        startLatitude: location?.latitude,
        startLongitude: location?.longitude,
      });
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        Alert.alert('Алдаа', result.message || 'Захиалга татахад алдаа гарлаа');
      }
    } catch (error) {
      Alert.alert('Алдаа', 'Сүлжээний алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, worker?.id, getCurrentLocation]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Optimize route based on coordinates from current location
  const handleOptimizeRoute = async () => {
    if (!id) return;
    
    Alert.alert(
      'Маршрут оновчлох',
      'Таны одоогийн байршлаас захиалгуудын дарааллыг оновчлох уу?',
      [
        { text: 'Үгүй', style: 'cancel' },
        {
          text: 'Тийм',
          onPress: async () => {
            setOptimizing(true);
            try {
              // Get current location for starting point
              const location = await getCurrentLocation();
              
              const result = await optimizeRoute({
                packageId: parseInt(id),
                startLatitude: location?.latitude,
                startLongitude: location?.longitude,
              });
              
              if (result.success && result.data) {
                Alert.alert(
                  'Амжилттай',
                  `${result.data.total_orders} захиалга оновчлогдлоо.\n` +
                  `Координаттай: ${result.data.orders_with_coords}\n` +
                  `Координатгүй: ${result.data.orders_without_coords}`,
                  [{ text: 'OK', onPress: fetchOrders }]
                );
              } else {
                Alert.alert('Алдаа', result.message || 'Маршрут оновчлоход алдаа гарлаа');
              }
            } catch (error) {
              Alert.alert('Алдаа', 'Сүлжээний алдаа гарлаа');
            } finally {
              setOptimizing(false);
            }
          },
        },
      ]
    );
  };

  const filteredOrders = filterStatus === 'all'
    ? (data?.orders || [])
    : filterStatus === 'warehouse_checking'
      ? (data?.orders.filter((order) => order.delivery_status === 'warehouse_checking' || order.delivery_status === 'warehouse_checked') || [])
      : (data?.orders.filter((order) => order.delivery_status === filterStatus) || []);

  const startManualSort = () => {
    if (!data?.orders || data.orders.length === 0) {
      Alert.alert('Анхааруулга', 'Сортлох захиалга байхгүй байна');
      return;
    }

    const sorted = [...data.orders]
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999))
      .map((order, index) => ({ ...order, sort_order: index + 1 }));

    setFilterStatus('all');
    setManualOrders(sorted);
    setManualSortMode(true);
  };

  const cancelManualSort = () => {
    setManualSortMode(false);
    setManualOrders([]);
  };

  const moveManualOrder = (index: number, direction: 'up' | 'down') => {
    if (!manualSortMode || manualOrders.length === 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= manualOrders.length) return;

    const reordered = [...manualOrders];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setManualOrders(reordered.map((order, idx) => ({ ...order, sort_order: idx + 1 })));
  };

  const saveManualSort = async () => {
    if (!manualSortMode || manualOrders.length === 0) return;

    setSavingManualSort(true);
    try {
      for (let i = 0; i < manualOrders.length; i++) {
        const order = manualOrders[i];
        await updateOrderSortOrder({
          orderUuid: order.uuid,
          newSortOrder: i + 1,
        });
      }

      Alert.alert('Амжилттай', 'Захиалгын дараалал хадгалагдлаа');
      setManualSortMode(false);
      setManualOrders([]);
      fetchOrders();
    } catch (error) {
      Alert.alert('Алдаа', 'Дараалал хадгалахад алдаа гарлаа');
    } finally {
      setSavingManualSort(false);
    }
  };

  const displayedOrders = manualSortMode ? manualOrders : filteredOrders;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned_to_driver': return '#F59E0B';
      case 'warehouse_checking': return '#3B82F6';
      case 'warehouse_checked': return '#8B5CF6';
      case 'driver_checking': return '#f59e0b';
      case 'loaded': return '#e17100';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned_to_driver': return 'Хүлээгдэж';
      case 'warehouse_checking': return 'Нярав шалгаж буй';
      case 'warehouse_checked': return 'Нярав шалгасан';
      case 'driver_checking': return 'Түгээгч тулгаж буй';
      case 'loaded': return 'Ачигдсан';
      default: return status;
    }
  };

  // Open what3words link
  const openWhat3Words = (w3w: string) => {
    const url = `https://what3words.com/${w3w}`;
    Linking.openURL(url);
  };

  // Open Google Maps with full route (all waypoints)
  const openFullRouteInMaps = async () => {
    // Get orders with coordinates, sorted by sort_order
    const ordersWithCoords = filteredOrders
      .filter(order => order.customer.latitude && order.customer.longitude)
      .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));

    if (ordersWithCoords.length === 0) {
      Alert.alert('Анхааруулга', 'Координаттай захиалга олдсонгүй');
      return;
    }

    // Get current location
    let currentLoc = userLocation;
    if (!currentLoc) {
      currentLoc = await getCurrentLocation();
    }

    // Build coordinates list
    const maxWaypoints = Math.min(ordersWithCoords.length, 10);
    const coords = ordersWithCoords.slice(0, maxWaypoints).map(
      order => `${order.customer.latitude},${order.customer.longitude}`
    );

    // Build URL: https://www.google.com/maps/dir/origin/point1/point2/...
    let url = 'https://www.google.com/maps/dir/';
    
    // Add current location as starting point (or skip if not available)
    if (currentLoc) {
      url += `${currentLoc.latitude},${currentLoc.longitude}/`;
    }
    
    // Add all waypoints
    url += coords.join('/');
    
    console.log('Opening Google Maps:', url);
    Linking.openURL(url);
  };

  const renderOrderItem = ({ item, index }: { item: DeliveryOrder; index: number }) => {
    // Check if both warehouse and driver have fully checked
    const isBothFullyChecked = item.check_summary?.is_warehouse_fully_checked && item.check_summary?.is_driver_fully_checked;
    
    return (
      <TouchableOpacity
        style={[
          styles.orderCard,
          isBothFullyChecked && styles.orderCardCompleted
        ]}
        onPress={() => {
          if (!manualSortMode) {
            router.push(`/order/${item.uuid}?packageId=${id}` as any);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.sortOrderBadge, isBothFullyChecked && styles.sortOrderBadgeCompleted]}>
            <Text style={styles.sortOrderText}>#{manualSortMode ? index + 1 : (item.sort_order || '-')}</Text>
          </View>
          {/* Distance badge */}
          {item.distance_km !== null && (
            <View style={styles.distanceBadge}>
              <Navigation size={12} color="#e17100" />
              <Text style={styles.distanceText}>{item.distance_km} км</Text>
            </View>
          )}
          <View style={styles.customerNameContainer}>
            <Text style={[styles.customerNamePrimary, isBothFullyChecked && styles.textCompleted]} numberOfLines={1}>
              {item.customer.name}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.delivery_status)}15` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.delivery_status) }]}>
              {getStatusLabel(item.delivery_status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.orderCodeRow}>
            <Package size={14} color={isBothFullyChecked ? "#e17100" : "#6B7280"} />
            <Text style={[styles.orderCodeSecondary, isBothFullyChecked && styles.textCompleted]}>{item.order_code}</Text>
          </View>

          <View style={styles.orderMetaGrid}>
            <View style={styles.orderMetaItem}>
              <Text style={styles.orderMetaLabel}>Падааны дүн</Text>
              <Text style={styles.orderMetaValue}>{item.total_amount_formatted || `${item.total_amount}₮`}</Text>
            </View>
            <View style={styles.orderMetaItem}>
              <Text style={styles.orderMetaLabel}>Харилцагчийн код</Text>
              <Text style={styles.orderMetaValue}>{item.customer.code || '-'}</Text>
            </View>
            <View style={styles.orderMetaItem}>
              <Text style={styles.orderMetaLabel}>Регистр</Text>
              <Text style={styles.orderMetaValue}>{item.registry_number || '-'}</Text>
            </View>
          </View>

          <Text style={[styles.customerAddress, isBothFullyChecked && styles.textCompleted]} numberOfLines={1}>
            {item.customer.address || 'Хаяг байхгүй'}
        </Text>
        
        {/* Check Progress - Circle Style */}
        {item.check_summary && item.check_summary.total_quantity > 0 && (
          <View style={styles.orderCheckCircles}>
            {/* Warehouse Circle */}
            <View style={styles.circleProgressContainer}>
              <View style={[
                styles.circleProgress,
                styles.circleProgressWarehouse,
                item.check_summary.is_warehouse_fully_checked && styles.circleProgressWarehouseComplete
              ]}>
                <Text style={[
                  styles.circleProgressPercent,
                  styles.circleProgressPercentWarehouse,
                  item.check_summary.is_warehouse_fully_checked && styles.circleProgressPercentWarehouseComplete
                ]}>
                  {Math.round((item.check_summary.warehouse_checked_quantity / item.check_summary.total_quantity) * 100)}%
                </Text>
              </View>
              <View style={styles.circleProgressLabelRow}>
                <Warehouse size={12} color="#2563EB" />
                <Text style={[styles.circleProgressLabel, styles.circleProgressLabelWarehouse]}>Нярав</Text>
              </View>
            </View>
            
            {/* Driver Circle */}
            <View style={styles.circleProgressContainer}>
              <View style={[
                styles.circleProgress,
                styles.circleProgressDriver,
                item.check_summary.is_driver_fully_checked && styles.circleProgressDriverComplete
              ]}>
                <Text style={[
                  styles.circleProgressPercent,
                  styles.circleProgressPercentDriver,
                  item.check_summary.is_driver_fully_checked && styles.circleProgressPercentDriverComplete
                ]}>
                  {Math.round((item.check_summary.driver_checked_quantity / item.check_summary.total_quantity) * 100)}%
                </Text>
              </View>
              <View style={styles.circleProgressLabelRow}>
                <Truck size={12} color="#e17100" />
                <Text style={[styles.circleProgressLabel, styles.circleProgressLabelDriver]}>Түгээгч</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Location Actions: What3Words */}
        <View style={styles.locationActions}>
          {item.customer.what3words && item.customer.what3words !== 'location_no_check' && (
            <TouchableOpacity
              style={styles.w3wButton}
              onPress={(e) => {
                e.stopPropagation();
                openWhat3Words(item.customer.what3words!);
              }}
            >
              <MapPin size={14} color="#E11D48" />
              <Text style={styles.w3wText}>///{item.customer.what3words}</Text>
            </TouchableOpacity>
          )}

          {manualSortMode && (
            <View style={styles.manualActionsWrap}>
              <TouchableOpacity
                style={[styles.manualMoveButton, index === 0 && styles.manualMoveButtonDisabled]}
                disabled={index === 0 || savingManualSort}
                onPress={(e) => {
                  e.stopPropagation();
                  moveManualOrder(index, 'up');
                }}
              >
                <ArrowUp size={14} color="#FFFFFF" />
                <Text style={styles.manualMoveText}>Дээш</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.manualMoveButton, index === displayedOrders.length - 1 && styles.manualMoveButtonDisabled]}
                disabled={index === displayedOrders.length - 1 || savingManualSort}
                onPress={(e) => {
                  e.stopPropagation();
                  moveManualOrder(index, 'down');
                }}
              >
                <ArrowDown size={14} color="#FFFFFF" />
                <Text style={styles.manualMoveText}>Доош</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  const renderFilterButton = (status: FilterStatus, label: string, icon: React.ReactNode) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === status && styles.filterButtonActive,
      ]}
      onPress={() => setFilterStatus(status)}
    >
      {icon}
      <Text
        style={[
          styles.filterButtonText,
          filterStatus === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Уншиж байна...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Падаанаар тулгах',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        {/* Orders List with Header */}
        <FlatList
          data={displayedOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.uuid}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Package Header */}
              {data?.package && (
                <View style={styles.packageHeader}>
                  <View style={styles.packageTitleRow}>
                    <Calendar size={20} color="#2563EB" />
                    <Text style={styles.packageTitle}>Багц: {data.package.name}</Text>
                  </View>
                  <View style={styles.packageInfoRow}>
                    <Text style={styles.packageDate}>{data.package.formatted_date}</Text>
                    <Text style={styles.packageOrderCount}>{data.total_count} захиалга</Text>
                  </View>
                  
                  {/* Route Action Buttons */}
                  <View style={styles.routeButtonsRow}>
                    {manualSortMode ? (
                      <>
                        <TouchableOpacity
                          style={[styles.manualCancelButton, savingManualSort && styles.optimizeButtonDisabled]}
                          onPress={cancelManualSort}
                          disabled={savingManualSort}
                        >
                          <Text style={styles.manualCancelButtonText}>Цуцлах</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.manualSaveButton, savingManualSort && styles.optimizeButtonDisabled]}
                          onPress={saveManualSort}
                          disabled={savingManualSort}
                        >
                          {savingManualSort ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : null}
                          <Text style={styles.manualSaveButtonText}>
                            {savingManualSort ? 'Хадгалж байна...' : 'Хадгалах'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {/* Optimize Route Button */}
                        <TouchableOpacity
                          style={[styles.optimizeButton, optimizing && styles.optimizeButtonDisabled]}
                          onPress={handleOptimizeRoute}
                          disabled={optimizing}
                        >
                          {optimizing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Route size={16} color="#FFFFFF" />
                          )}
                          <Text style={styles.optimizeButtonText}>
                            {optimizing ? 'Оновчилж байна...' : 'Оновчлох'}
                          </Text>
                        </TouchableOpacity>

                        {/* View Full Route on Map Button */}
                        <TouchableOpacity
                          style={styles.viewMapButton}
                          onPress={openFullRouteInMaps}
                        >
                          <Map size={16} color="#FFFFFF" />
                          <Text style={styles.viewMapButtonText}>Зураг дээр</Text>
                        </TouchableOpacity>

                        {/* Manual Sort Button */}
                        <TouchableOpacity
                          style={styles.manualSortButton}
                          onPress={startManualSort}
                        >
                          <Text style={styles.manualSortButtonText}>Гараар сортлох</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Filter Buttons */}
              <View style={styles.filterGrid}>
                <View style={styles.filterRow}>
                  {renderFilterButton('all', `Бүгд (${data?.total_count || 0})`, <Package size={16} color={filterStatus === 'all' ? '#2563EB' : '#6B7280'} />)}
                  {renderFilterButton('assigned_to_driver', `Хүлээгдэж (${data?.status_counts.assigned_to_driver || 0})`, <Circle size={16} color={filterStatus === 'assigned_to_driver' ? '#F59E0B' : '#6B7280'} />)}
                </View>
                <View style={styles.filterRow}>
                  {renderFilterButton('warehouse_checking', `Нярав (${(data?.status_counts.warehouse_checking || 0) + (data?.status_counts.warehouse_checked || 0)})`, <Eye size={16} color={filterStatus === 'warehouse_checking' ? '#3B82F6' : '#6B7280'} />)}
                  {renderFilterButton('driver_checking', `Түгээгч (${data?.status_counts.driver_checking || 0})`, <Eye size={16} color={filterStatus === 'driver_checking' ? '#10B981' : '#6B7280'} />)}
                </View>
              </View>

              {/* Stats Summary */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{data?.status_counts.assigned_to_driver || 0}</Text>
                  <Text style={styles.statLabel}>Хүлээгдэж</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(data?.status_counts.warehouse_checking || 0) + (data?.status_counts.warehouse_checked || 0) + (data?.status_counts.driver_checking || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Нярав</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {data?.status_counts.driver_checking || 0}
                  </Text>
                  <Text style={styles.statLabel}>Түгээгч</Text>
                </View>
              </View>
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Box size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Захиалга байхгүй байна</Text>
              <Text style={styles.emptySubtext}>Дээш татаж шинэчлэнэ үү</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  packageHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
  },
  packageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageDate: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  packageOrderCount: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#2563EB',
  },
  routeButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  optimizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e17100',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  optimizeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  optimizeButtonText: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  viewMapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewMapButtonText: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  manualSortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  manualSortButtonText: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  manualCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
    paddingVertical: 10,
    borderRadius: 8,
  },
  manualCancelButtonText: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  manualSaveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  manualSaveButtonText: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  filterGrid: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#2563EB',
    fontFamily: 'GIP-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    opacity: 0.85,
  },
  sortOrderBadge: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  sortOrderBadgeCompleted: {
    backgroundColor: '#e17100',
  },
  sortOrderText: {
    fontSize: 12,
    fontFamily: 'GIP-Bold',
    color: '#FFFFFF',
  },
  textCompleted: {
    color: '#e17100',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#e17100',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerNameContainer: {
    flex: 1,
    marginRight: 6,
  },
  customerNamePrimary: {
    fontSize: 14,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
  },
  orderCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  orderCodeSecondary: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
  },
  orderBody: {
    marginTop: 2,
  },
  customerAddress: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  orderMetaGrid: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 4,
  },
  orderMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaLabel: {
    fontSize: 11,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  orderMetaValue: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#1F2937',
    maxWidth: '58%',
    textAlign: 'right',
  },
  // Order check progress styles
  orderCheckProgress: {
    marginTop: 10,
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  orderCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderProgressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  orderProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  orderProgressBarWarehouse: {
    backgroundColor: '#2563EB',
  },
  orderProgressBarDriver: {
    backgroundColor: '#e17100',
  },
  orderCheckCount: {
    fontSize: 11,
    fontFamily: 'GIP-SemiBold',
    color: '#6B7280',
    minWidth: 45,
    textAlign: 'right',
  },
  orderCheckComplete: {
    color: '#e17100',
  },
  // Circle Progress Styles
  orderCheckCircles: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  circleProgressContainer: {
    alignItems: 'center',
    gap: 2,
  },
  circleProgress: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  circleProgressWarehouse: {
    borderColor: '#3B82F6',
  },
  circleProgressDriver: {
    borderColor: '#f59e0b',
  },
  circleProgressWarehouseComplete: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  circleProgressDriverComplete: {
    backgroundColor: '#FEF3C7',
    borderColor: '#e17100',
  },
  circleProgressComplete: {
    backgroundColor: '#ECFDF5',
    borderColor: '#e17100',
  },
  circleProgressPercent: {
    fontSize: 10,
    fontFamily: 'GIP-Bold',
    color: '#374151',
  },
  circleProgressPercentWarehouse: {
    color: '#1E40AF',
  },
  circleProgressPercentDriver: {
    color: '#047857',
  },
  circleProgressPercentWarehouseComplete: {
    color: '#1D4ED8',
  },
  circleProgressPercentDriverComplete: {
    color: '#e17100',
  },
  circleProgressPercentComplete: {
    color: '#e17100',
  },
  circleProgressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  circleProgressLabel: {
    fontSize: 9,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  circleProgressLabelWarehouse: {
    color: '#2563EB',
  },
  circleProgressLabelDriver: {
    color: '#e17100',
  },
  locationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  manualActionsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  manualMoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  manualMoveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  manualMoveText: {
    fontSize: 11,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  w3wButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  w3wText: {
    fontSize: 11,
    fontFamily: 'GIP-Medium',
    color: '#E11D48',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
});
