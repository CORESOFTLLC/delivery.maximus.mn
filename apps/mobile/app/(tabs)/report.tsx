/**
 * ТАЙЛАН ДЭЛГЭЦ
 *
 * Хүргэлтийн тайлан (хугацаа сонголттой):
 * - Хугацааны сонголт (Өнөөдөр / Бүгд / Огноо сонгох)
 * - Хүргэлтийн статистик
 * - Мөнгөний задаргаа (тооцоо нийлэх)
 * - Төлбөрийн мэдээлэл
 * - Буцаалтын мэдээлэл
 * - Багцын нэгтгэл
 * - Гүйцэтгэл + дундаж хугацаа
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package,
  CheckCircle2,
  Truck,
  XCircle,
  Banknote,
  CreditCard,
  Clock,
  TrendingUp,
  BarChart3,
  Wallet,
  Calendar,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Receipt,
  ArrowRightLeft,
  Landmark,
  CircleDollarSign,
  X,
} from 'lucide-react-native';
import { useAuthStore } from '../../stores/delivery-auth-store';
import { getTodayReport, TodayReportData, ReturnItem } from '../../services/delivery-api';

type DateFilter = 'today' | 'all' | 'custom';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Өнөөдөр' },
  { key: 'all', label: 'Бүгд' },
  { key: 'custom', label: 'Огноо сонгох' },
];

export default function ReportScreen() {
  const { worker } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState<TodayReportData | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);
  const [packagesExpanded, setPackagesExpanded] = useState(false);

  // Available dates from packages
  const availableDates = useMemo(() => {
    if (!report?.packages) return [];
    return report.packages.map((p) => p.delivery_date).filter(Boolean);
  }, [report?.packages]);

  const fetchReport = useCallback(
    async (filter?: DateFilter, date?: string) => {
      try {
        const currentFilter = filter ?? dateFilter;
        let params: { date?: string; from?: string; to?: string } | undefined;

        if (currentFilter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          params = { date: today };
        } else if (currentFilter === 'custom' && date) {
          params = { date };
        }
        // 'all' = no params, returns everything

        const result = await getTodayReport(params);
        if (result.success && result.data) {
          setReport(result.data);
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateFilter]
  );

  useEffect(() => {
    fetchReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleFilterChange = (filter: DateFilter) => {
    if (filter === 'custom') {
      setShowDatePicker(true);
      return;
    }
    setDateFilter(filter);
    setCustomDate('');
    setLoading(true);
    fetchReport(filter);
  };

  const handleDateSelect = (date: string) => {
    setCustomDate(date);
    setDateFilter('custom');
    setShowDatePicker(false);
    setLoading(true);
    fetchReport('custom', date);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + '₮';
  };

  const getFilterLabel = () => {
    if (dateFilter === 'today') return 'Өнөөдөр';
    if (dateFilter === 'custom' && customDate) return customDate;
    return 'Бүгд';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Тайлан ачааллаж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const deliveryPercent = report?.total_orders
    ? Math.round((report.delivered / report.total_orders) * 100)
    : 0;

  const hasReturns = (report?.returns?.total_return_orders ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <BarChart3 size={28} color="#2563EB" />
          <Text style={styles.headerTitle}>Хүргэлтийн тайлан</Text>
          <Text style={styles.headerDate}>{getFilterLabel()}</Text>
        </View>

        {/* Date Filter Tabs */}
        <View style={styles.filterContainer}>
          {DATE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTab,
                (dateFilter === f.key || (f.key === 'custom' && dateFilter === 'custom')) &&
                  styles.filterTabActive,
              ]}
              onPress={() => handleFilterChange(f.key)}
            >
              {f.key === 'custom' && <Calendar size={14} color={dateFilter === 'custom' ? '#FFF' : '#6B7280'} />}
              <Text
                style={[
                  styles.filterTabText,
                  (dateFilter === f.key || (f.key === 'custom' && dateFilter === 'custom')) &&
                    styles.filterTabTextActive,
                ]}
              >
                {f.key === 'custom' && customDate ? customDate : f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Хүргэлтийн статистик</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Package size={22} color="#2563EB" />
              <Text style={styles.statValue}>{report?.total_orders || 0}</Text>
              <Text style={styles.statLabel}>Нийт</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
              <CheckCircle2 size={22} color="#10B981" />
              <Text style={styles.statValue}>{report?.delivered || 0}</Text>
              <Text style={styles.statLabel}>Хүргэсэн</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
              <Truck size={22} color="#3B82F6" />
              <Text style={styles.statValue}>{report?.in_progress || 0}</Text>
              <Text style={styles.statLabel}>Хүргэж буй</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={22} color="#F59E0B" />
              <Text style={styles.statValue}>{report?.pending || 0}</Text>
              <Text style={styles.statLabel}>Хүлээгдэж буй</Text>
            </View>

            {(report?.failed ?? 0) > 0 && (
              <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                <XCircle size={22} color="#EF4444" />
                <Text style={styles.statValue}>{report?.failed || 0}</Text>
                <Text style={styles.statLabel}>Амжилтгүй</Text>
              </View>
            )}
          </View>
        </View>

        {/* Money Reconciliation — Мөнгөний тооцоо */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Мөнгөний тооцоо</Text>

          <View style={styles.reconciliationCard}>
            {/* Top summary: total / delivered / remaining */}
            <View style={styles.reconcileRow}>
              <View style={styles.reconcileLeft}>
                <Wallet size={18} color="#6B7280" />
                <Text style={styles.reconcileLabel}>Нийт захиалгын дүн</Text>
              </View>
              <Text style={styles.reconcileAmount}>{formatAmount(report?.total_amount || 0)}</Text>
            </View>

            <View style={styles.thinDivider} />

            <View style={styles.reconcileRow}>
              <View style={styles.reconcileLeft}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={styles.reconcileLabel}>Хүргэсэн дүн</Text>
              </View>
              <Text style={[styles.reconcileAmount, { color: '#10B981' }]}>
                {formatAmount(report?.delivered_amount || 0)}
              </Text>
            </View>

            <View style={styles.thinDivider} />

            <View style={styles.reconcileRow}>
              <View style={styles.reconcileLeft}>
                <Clock size={18} color="#F59E0B" />
                <Text style={styles.reconcileLabel}>Үлдсэн дүн</Text>
              </View>
              <Text style={[styles.reconcileAmount, { color: '#F59E0B' }]}>
                {formatAmount(report?.remaining_amount || 0)}
              </Text>
            </View>

            {/* Return deduction */}
            {hasReturns && (
              <>
                <View style={styles.thinDivider} />
                <View style={styles.reconcileRow}>
                  <View style={styles.reconcileLeft}>
                    <RotateCcw size={18} color="#EF4444" />
                    <Text style={styles.reconcileLabel}>Буцаалтын дүн</Text>
                  </View>
                  <Text style={[styles.reconcileAmount, { color: '#EF4444' }]}>
                    -{formatAmount(report?.returns?.total_return_amount || 0)}
                  </Text>
                </View>
              </>
            )}

            {/* Thick divider before payment section */}
            <View style={styles.thickDivider} />

            <Text style={styles.reconcileSubtitle}>Төлбөрийн задаргаа</Text>

            <View style={styles.paymentBreakdown}>
              <PaymentRow
                icon={<Banknote size={16} color="#10B981" />}
                label="Бэлэн мөнгө"
                amount={report?.cash_amount || 0}
                formatAmount={formatAmount}
              />
              <PaymentRow
                icon={<CreditCard size={16} color="#8B5CF6" />}
                label="Картын төлбөр"
                amount={report?.card_amount || 0}
                formatAmount={formatAmount}
              />
              <PaymentRow
                icon={<CircleDollarSign size={16} color="#3B82F6" />}
                label="QPay"
                amount={report?.qpay_amount || 0}
                formatAmount={formatAmount}
              />
              <PaymentRow
                icon={<Landmark size={16} color="#6366F1" />}
                label="Шилжүүлэг"
                amount={report?.transfer_amount || 0}
                formatAmount={formatAmount}
              />
              <PaymentRow
                icon={<Receipt size={16} color="#F59E0B" />}
                label="Зээл"
                amount={report?.loan_amount || 0}
                formatAmount={formatAmount}
              />
              {(report?.other_payment_amount ?? 0) > 0 && (
                <PaymentRow
                  icon={<ArrowRightLeft size={16} color="#6B7280" />}
                  label="Бусад"
                  amount={report?.other_payment_amount || 0}
                  formatAmount={formatAmount}
                />
              )}
            </View>

            <View style={styles.thickDivider} />

            {/* Collection summary */}
            <View style={styles.reconcileRow}>
              <View style={styles.reconcileLeft}>
                <TrendingUp size={18} color="#10B981" />
                <Text style={[styles.reconcileLabel, { fontFamily: 'GIP-SemiBold' }]}>Цуглуулсан</Text>
              </View>
              <Text style={[styles.reconcileAmount, { color: '#10B981', fontFamily: 'GIP-Bold' }]}>
                {formatAmount(report?.collected_amount || 0)}
              </Text>
            </View>

            {(report?.uncollected_amount ?? 0) > 0 && (
              <>
                <View style={styles.thinDivider} />
                <View style={styles.reconcileRow}>
                  <View style={styles.reconcileLeft}>
                    <AlertTriangle size={18} color="#EF4444" />
                    <Text style={[styles.reconcileLabel, { fontFamily: 'GIP-SemiBold' }]}>
                      Цуглуулаагүй
                    </Text>
                  </View>
                  <Text style={[styles.reconcileAmount, { color: '#EF4444', fontFamily: 'GIP-Bold' }]}>
                    {formatAmount(report?.uncollected_amount || 0)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Returns Section */}
        {hasReturns && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setReturnsExpanded(!returnsExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <RotateCcw size={18} color="#EF4444" />
                <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                  Буцаалтын мэдээлэл
                </Text>
              </View>
              <View style={styles.sectionHeaderRight}>
                <View style={styles.returnsBadge}>
                  <Text style={styles.returnsBadgeText}>
                    {report?.returns?.total_return_orders} захиалга
                  </Text>
                </View>
                {returnsExpanded ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </View>
            </TouchableOpacity>

            {/* Returns summary cards */}
            <View style={styles.returnsGrid}>
              <View style={styles.returnSummaryCard}>
                <Text style={styles.returnSummaryValue}>{report?.returns?.total_return_products}</Text>
                <Text style={styles.returnSummaryLabel}>Бараа</Text>
              </View>
              <View style={styles.returnSummaryCard}>
                <Text style={styles.returnSummaryValue}>{report?.returns?.total_return_quantity}</Text>
                <Text style={styles.returnSummaryLabel}>Тоо ширхэг</Text>
              </View>
              <View style={styles.returnSummaryCard}>
                <Text style={[styles.returnSummaryValue, { color: '#EF4444', fontSize: 14 }]}>
                  {formatAmount(report?.returns?.total_return_amount || 0)}
                </Text>
                <Text style={styles.returnSummaryLabel}>Дүн</Text>
              </View>
            </View>

            {/* Expanded return items */}
            {returnsExpanded && (report?.returns?.return_items?.length ?? 0) > 0 && (
              <View style={styles.returnItemsContainer}>
                {report?.returns?.return_items.map((item: ReturnItem, idx: number) => (
                  <View key={idx} style={styles.returnItemCard}>
                    <View style={styles.returnItemHeader}>
                      <Text style={styles.returnItemOrder}>#{item.order_code}</Text>
                      <Text style={styles.returnItemCustomer}>{item.customer_name}</Text>
                    </View>
                    <Text style={styles.returnItemProduct} numberOfLines={2}>
                      {item.product_name}
                    </Text>
                    <View style={styles.returnItemDetails}>
                      <View style={styles.returnItemQty}>
                        <Text style={styles.returnItemQtyLabel}>Захиалга:</Text>
                        <Text style={styles.returnItemQtyValue}>{item.ordered_quantity}</Text>
                      </View>
                      <View style={styles.returnItemQty}>
                        <Text style={styles.returnItemQtyLabel}>Хүргэсэн:</Text>
                        <Text style={[styles.returnItemQtyValue, { color: '#10B981' }]}>
                          {item.delivered_quantity}
                        </Text>
                      </View>
                      <View style={styles.returnItemQty}>
                        <Text style={styles.returnItemQtyLabel}>Буцаасан:</Text>
                        <Text style={[styles.returnItemQtyValue, { color: '#EF4444' }]}>
                          {item.returned_quantity}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.returnItemFooter}>
                      <Text style={styles.returnItemAmount}>
                        {formatAmount(item.return_amount)}
                      </Text>
                      {item.notes && (
                        <Text style={styles.returnItemNotes} numberOfLines={1}>
                          {item.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Packages Summary */}
        {(report?.packages?.length ?? 0) > 1 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setPackagesExpanded(!packagesExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Package size={18} color="#2563EB" />
                <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                  Багцын нэгтгэл
                </Text>
              </View>
              <View style={styles.sectionHeaderRight}>
                <View style={[styles.returnsBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.returnsBadgeText, { color: '#2563EB' }]}>
                    {report?.packages?.length} багц
                  </Text>
                </View>
                {packagesExpanded ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </View>
            </TouchableOpacity>

            {packagesExpanded &&
              report?.packages?.map((pkg) => (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageDate}>{pkg.delivery_date}</Text>
                  </View>
                  <View style={styles.packageStats}>
                    <View style={styles.packageStat}>
                      <Text style={styles.packageStatLabel}>Захиалга</Text>
                      <Text style={styles.packageStatValue}>
                        {pkg.delivered}/{pkg.total_orders}
                      </Text>
                    </View>
                    <View style={styles.packageStat}>
                      <Text style={styles.packageStatLabel}>Хүргэсэн дүн</Text>
                      <Text style={[styles.packageStatValue, { color: '#10B981' }]}>
                        {formatAmount(pkg.delivered_amount)}
                      </Text>
                    </View>
                    <View style={styles.packageStat}>
                      <Text style={styles.packageStatLabel}>Нийт дүн</Text>
                      <Text style={styles.packageStatValue}>{formatAmount(pkg.total_amount)}</Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Гүйцэтгэл</Text>

          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Хүргэлтийн хувь</Text>
              <Text style={styles.performanceValue}>{deliveryPercent}%</Text>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${deliveryPercent}%` }]} />
            </View>

            <View style={styles.performanceDetails}>
              <Text style={styles.performanceDetailText}>
                {report?.delivered || 0} / {report?.total_orders || 0} захиалга хүргэгдсэн
              </Text>
            </View>
          </View>
        </View>

        {/* Average Delivery Time */}
        {report?.avg_delivery_minutes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Дундаж хугацаа</Text>

            <View style={styles.timeCard}>
              <Clock size={32} color="#2563EB" />
              <Text style={styles.timeValue}>
                {report.avg_delivery_minutes < 60
                  ? `${Math.round(report.avg_delivery_minutes)} минут`
                  : `${Math.floor(report.avg_delivery_minutes / 60)} цаг ${Math.round(report.avg_delivery_minutes % 60)} мин`}
              </Text>
              <Text style={styles.timeLabel}>Дундаж хүргэлтийн хугацаа</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Огноо сонгох</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Хүргэлтийн багцын огноо</Text>

            {availableDates.length > 0 ? (
              availableDates.map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateOption, customDate === date && styles.dateOptionActive]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Calendar size={18} color={customDate === date ? '#2563EB' : '#6B7280'} />
                  <Text
                    style={[
                      styles.dateOptionText,
                      customDate === date && styles.dateOptionTextActive,
                    ]}
                  >
                    {date}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDateText}>Багц олдсонгүй</Text>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalCloseBtnText}>Хаах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Payment row sub-component */
function PaymentRow({
  icon,
  label,
  amount,
  formatAmount,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  formatAmount: (n: number) => string;
}) {
  return (
    <View style={styles.paymentRow}>
      <View style={styles.paymentRowLeft}>
        {icon}
        <Text style={styles.paymentRowLabel}>{label}</Text>
      </View>
      <Text style={[styles.paymentRowAmount, amount === 0 && { color: '#D1D5DB' }]}>
        {formatAmount(amount)}
      </Text>
    </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
    marginTop: 8,
  },
  headerDate: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    marginTop: 4,
  },

  /* Filter tabs */
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  /* Section */
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /* Stats grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
    marginTop: 2,
  },

  /* Reconciliation card */
  reconciliationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  reconcileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reconcileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reconcileLabel: {
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#4B5563',
  },
  reconcileAmount: {
    fontSize: 15,
    fontFamily: 'GIP-SemiBold',
    color: '#1F2937',
  },
  reconcileSubtitle: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thinDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  thickDivider: {
    height: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },

  /* Payment breakdown */
  paymentBreakdown: {
    gap: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  paymentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentRowLabel: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  paymentRowAmount: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
  },

  /* Returns */
  returnsBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  returnsBadgeText: {
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: '#EF4444',
  },
  returnsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  returnSummaryCard: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  returnSummaryValue: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
  },
  returnSummaryLabel: {
    fontSize: 11,
    fontFamily: 'GIP-Medium',
    color: '#9CA3AF',
    marginTop: 2,
  },
  returnItemsContainer: {
    gap: 8,
  },
  returnItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  returnItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  returnItemOrder: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#2563EB',
  },
  returnItemCustomer: {
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
    maxWidth: '60%',
    textAlign: 'right',
  },
  returnItemProduct: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  returnItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  returnItemQty: {
    alignItems: 'center',
  },
  returnItemQtyLabel: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },
  returnItemQtyValue: {
    fontSize: 14,
    fontFamily: 'GIP-Bold',
    color: '#374151',
  },
  returnItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
  },
  returnItemAmount: {
    fontSize: 14,
    fontFamily: 'GIP-Bold',
    color: '#EF4444',
  },
  returnItemNotes: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    maxWidth: '60%',
  },

  /* Package cards */
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  packageName: {
    fontSize: 15,
    fontFamily: 'GIP-SemiBold',
    color: '#1F2937',
  },
  packageDate: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  packageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  packageStat: {
    alignItems: 'center',
  },
  packageStatLabel: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },
  packageStatValue: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
    marginTop: 2,
  },

  /* Performance */
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceLabel: {
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#4B5563',
  },
  performanceValue: {
    fontSize: 24,
    fontFamily: 'GIP-Bold',
    color: '#2563EB',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  performanceDetails: {
    marginTop: 12,
    alignItems: 'center',
  },
  performanceDetailText: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },

  /* Time card */
  timeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 28,
    fontFamily: 'GIP-Bold',
    color: '#2563EB',
    marginTop: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
    marginTop: 4,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  dateOptionActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  dateOptionText: {
    fontSize: 15,
    fontFamily: 'GIP-Medium',
    color: '#374151',
  },
  dateOptionTextActive: {
    color: '#2563EB',
    fontFamily: 'GIP-SemiBold',
  },
  noDateText: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalCloseBtn: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontFamily: 'GIP-SemiBold',
    color: '#6B7280',
  },
});
