/**
 * БАРАА БЭЛДЭХ ДЭЛГЭЦimport
 *
 * Агуулахын бараа бэлдэх багцуудын жагсаалт + дэлгэрэнгүй харагдац
 * Хаалганы ажилчид болон нярав нарт зориулагдсан
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
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  Package,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  Hash,
  Play,
  CheckCheck,
  RefreshCw,
  User,
  Shield,
  DoorOpen,
} from 'lucide-react-native';
import {
  getWarehouseBatches,
  getWarehouseBatchDetail,
  startBatchPreparing,
  markBatchPrepared,
  WarehouseBatchItem,
  WarehouseBatchDetail,
  BatchProduct,
} from '../../services/delivery-api';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;

// ── Status helpers ──────────────────────────────────────────────────────────

function StatusBadge({ status, label, color }: { status: string; label: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={11} color={color} />,
    preparing: <RefreshCw size={11} color={color} />,
    prepared: <CheckCircle2 size={11} color={color} />,
    completed: <CheckCheck size={11} color={color} />,
    cancelled: <AlertCircle size={11} color={color} />,
  };
  return (
    <View style={[styles.badge, { borderColor: color + '33', backgroundColor: color + '15' }]}>
      {icons[status] || <Clock size={11} color={color} />}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function PrepStatusDot({ status }: { status: string }) {
  const color =
    status === 'prepared' ? '#10B981' : status === 'preparing' ? '#F59E0B' : '#D1D5DB';
  return <View style={[styles.prepDot, { backgroundColor: color }]} />;
}

// ── Batch List Screen ───────────────────────────────────────────────────────

function BatchListView({
  onSelectBatch,
}: {
  onSelectBatch: (uuid: string) => void;
}) {
  const [batches, setBatches] = useState<WarehouseBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      const result = await getWarehouseBatches();
      if (result.success && result.data) {
        setBatches(result.data);
      } else {
        Alert.alert('Алдаа', result.message || 'Багц татахад алдаа гарлаа');
      }
    } catch {
      Alert.alert('Алдаа', 'Сүлжээний алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBatches();
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return d.replace('T', ' ').slice(0, 16);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Татаж байна...</Text>
      </View>
    );
  }

  if (batches.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Package size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Багц байхгүй</Text>
        <Text style={styles.emptySubtitle}>Танд хуваарилагдсан бараа бэлдэх багц одоогоор байхгүй байна.</Text>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={batches}
      keyExtractor={(item) => item.uuid}
      contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.batchCard}
          onPress={() => onSelectBatch(item.uuid)}
          activeOpacity={0.75}
        >
          {/* Top row */}
          <View style={styles.batchCardTop}>
            <View style={styles.batchCodeRow}>
              <View style={styles.batchIconBox}>
                <Package size={16} color="#2563EB" />
              </View>
              <Text style={styles.batchCode}>{item.batch_code}</Text>
            </View>
            <StatusBadge status={item.status} label={item.status_label} color={item.status_color} />
          </View>

          {/* Warehouse + Gate row */}
          <View style={styles.warehouseGateRow}>
            <View style={styles.warehouseChip}>
              <Text style={styles.warehouseChipText} numberOfLines={1}>{item.warehouse_name}</Text>
            </View>
            <ChevronRight size={12} color="#9CA3AF" />
            <View style={styles.gateChip}>
              <Text style={styles.gateChipText} numberOfLines={1}>{item.gate_name}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.batchStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.total_orders}</Text>
              <Text style={styles.statLabel}>Захиалга</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.total_products}</Text>
              <Text style={styles.statLabel}>Нэр төрөл</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{item.total_quantity.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Тоо хэмжээ</Text>
            </View>
          </View>

          {/* Personnel */}
          {(item.preparer_name || item.checker_name) && (
            <View style={styles.personnelRow}>
              {item.preparer_name && (
                <View style={styles.personChip}>
                  <User size={11} color="#6B7280" />
                  <Text style={styles.personText} numberOfLines={1}>{item.preparer_name}</Text>
                </View>
              )}
              {item.checker_name && (
                <View style={styles.personChip}>
                  <Shield size={11} color="#6B7280" />
                  <Text style={styles.personText} numberOfLines={1}>{item.checker_name}</Text>
                </View>
              )}
            </View>
          )}

          {/* Date + arrow */}
          <View style={styles.batchCardBottom}>
            <View style={styles.batchDateBlock}>
              <Text style={styles.batchDateLabel}>Үүсгэсэн</Text>
              <Text style={styles.batchDate}>{formatDate(item.created_at)}</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

// ── Batch Detail Screen ─────────────────────────────────────────────────────

function BatchDetailView({
  uuid,
  onBack,
}: {
  uuid: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<WarehouseBatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const result = await getWarehouseBatchDetail(uuid);
      if (result.success && result.data) {
        setDetail(result.data);
      } else {
        Alert.alert('Алдаа', result.message || 'Мэдээлэл татахад алдаа гарлаа');
      }
    } catch {
      Alert.alert('Алдаа', 'Сүлжээний алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const handleStartPreparing = () => {
    Alert.alert('Бэлтгэл эхлүүлэх', 'Бэлтгэл эхлүүлэх үү?', [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Эхлүүлэх',
        onPress: async () => {
          setActionLoading(true);
          const r = await startBatchPreparing(uuid);
          setActionLoading(false);
          if (r.success) {
            Alert.alert('Амжилттай', r.message || 'Бэлтгэл эхэллээ');
            fetchDetail();
          } else {
            Alert.alert('Алдаа', r.error || 'Алдаа гарлаа');
          }
        },
      },
    ]);
  };

  const handleMarkPrepared = () => {
    Alert.alert('Бэлтгэл дуусгах', 'Бэлтгэл дууссан гэж тэмдэглэх үү?', [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Дуусгах',
        onPress: async () => {
          setActionLoading(true);
          const r = await markBatchPrepared(uuid);
          setActionLoading(false);
          if (r.success) {
            Alert.alert('Амжилттай', r.message || 'Бэлтгэл дуусгалаа');
            fetchDetail();
          } else {
            Alert.alert('Алдаа', r.error || 'Алдаа гарлаа');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Татаж байна...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>Мэдээлэл олдсонгүй</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const checkedProducts = detail.products.filter((p) => p.warehouse_checked).length;
  const preparedProducts = detail.products.filter((p) => p.prep_status === 'prepared').length;

  return (
    <ScrollView
      style={styles.detailContainer}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.detailHeader}>
        <View style={styles.detailHeaderLeft}>
          <Text style={styles.detailBatchCode}>{detail.batch_code}</Text>
          <StatusBadge status={detail.status} label={detail.status_label} color={detail.status_color} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <DoorOpen size={14} color="#6B7280" />
          <Text style={styles.detailGate}>{detail.gate_name}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoGrid}>
        <InfoCard icon={<Layers size={16} color="#2563EB" />} label="Захиалга" value={String(detail.total_orders)} color="#2563EB" />
        <InfoCard icon={<Package size={16} color="#10B981" />} label="Нэр төрөл" value={String(detail.total_products)} color="#10B981" />
        <InfoCard icon={<BarChart3 size={16} color="#F59E0B" />} label="Нийт тоо" value={detail.total_quantity.toLocaleString()} color="#F59E0B" />
        <InfoCard
          icon={<Hash size={16} color="#8B5CF6" />}
          label="Сери"
          value={detail.seri_day > 0 ? `${detail.seri_day} хоног` : 'FEFO'}
          color="#8B5CF6"
        />
        <InfoCard
          icon={<CheckCircle2 size={16} color="#10B981" />}
          label="Бэлтгэгдсэн"
          value={`${preparedProducts}/${detail.total_products}`}
          color="#10B981"
        />
        <InfoCard
          icon={<CheckCheck size={16} color="#3B82F6" />}
          label="Тулгасан"
          value={`${checkedProducts}/${detail.total_products}`}
          color="#3B82F6"
        />
      </View>

      {/* Personnel */}
      {(detail.preparer || detail.checker) && (
        <View style={styles.personnelCard}>
          {detail.preparer && (
            <PersonRow role="Бэлдэж буй" person={detail.preparer} accent="#10B981" />
          )}
          {detail.checker && (
            <PersonRow role="Нярав" person={detail.checker} accent="#3B82F6" />
          )}
        </View>
      )}

      {/* Action Buttons */}
      {(detail.can_start_preparing || detail.can_mark_prepared) && (
        <View style={styles.actionRow}>
          {detail.can_start_preparing && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={handleStartPreparing}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Play size={16} color="#fff" />
              )}
              <Text style={styles.actionBtnPrimaryText}>Бэлтгэл эхлүүлэх</Text>
            </TouchableOpacity>
          )}
          {detail.can_mark_prepared && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSuccess]}
              onPress={handleMarkPrepared}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <CheckCheck size={16} color="#fff" />
              )}
              <Text style={styles.actionBtnSuccessText}>Бэлтгэл дуусгах</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Products List */}
      <Text style={styles.sectionTitle}>Бараануудын жагсаалт ({detail.products.length})</Text>

      {detail.products.map((product, idx) => (
        <ProductRow key={product.product_uuid} product={product} index={idx} />
      ))}
    </ScrollView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoCardIcon, { backgroundColor: color + '15' }]}>{icon}</View>
      <Text style={styles.infoCardValue}>{value}</Text>
      <Text style={styles.infoCardLabel}>{label}</Text>
    </View>
  );
}

function PersonRow({
  role,
  person,
  accent,
}: {
  role: string;
  person: { name: string; job: string | null; avatar: string | null };
  accent: string;
}) {
  const initials = person.name.trim().slice(0, 1).toUpperCase();
  return (
    <View style={styles.personRow}>
      <Text style={styles.personRoleLabel}>{role}</Text>
      <View style={styles.personInfo}>
        {person.avatar ? (
          <Image source={{ uri: person.avatar }} style={[styles.personAvatar, { borderColor: accent }]} />
        ) : (
          <View style={[styles.personAvatarInitials, { backgroundColor: accent + '20', borderColor: accent }]}>
            <Text style={[styles.personInitials, { color: accent }]}>{initials}</Text>
          </View>
        )}
        <View>
          <Text style={styles.personName}>{person.name}</Text>
          {person.job && <Text style={styles.personJob}>{person.job}</Text>}
        </View>
      </View>
    </View>
  );
}

function ProductRow({ product, index }: { product: BatchProduct; index: number }) {
  const prepColor =
    product.prep_status === 'prepared'
      ? '#10B981'
      : product.prep_status === 'preparing'
      ? '#F59E0B'
      : '#9CA3AF';

  const prepLabel =
    product.prep_status === 'prepared'
      ? 'Бэлтгэгдсэн'
      : product.prep_status === 'preparing'
      ? 'Бэлдэж байна'
      : 'Хүлээгдэж байна';

  const initials = product.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.productRow, index % 2 === 0 && styles.productRowEven]}>
      {/* Left: image + name */}
      <View style={styles.productLeft}>
        <View style={styles.productImageWrap}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: prepColor + '22' }]}>
              <Text style={[styles.productImageInitials, { color: prepColor }]}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.productMeta}>
            {product.bridge_name ? (
              <Text style={styles.productBridgeName} numberOfLines={1}>{product.bridge_name}</Text>
            ) : null}
            {(product.barcode || product.product_code) ? (
              <Text style={styles.productCodes} numberOfLines={1}>
                {[product.barcode, product.product_code].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {product.series_name ? (
              <Text style={styles.productSeries} numberOfLines={1}>{product.series_name}</Text>
            ) : product.seri_days > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <AlertCircle size={11} color="#D97706" />
                <Text style={styles.productSeriesWarn}>Сери оноогдоогүй ({product.seri_days}хн)</Text>
              </View>
            ) : null}
            <Text style={[styles.productPrepStatus, { color: prepColor }]}>{prepLabel}</Text>
          </View>
        </View>
      </View>

      {/* Right: qty */}
      <View style={styles.productRight}>
        <Text style={styles.productQty}>{product.total_quantity.toLocaleString()}</Text>
        <Text style={styles.productQtyLabel}>ш</Text>
        {product.warehouse_checked && (
          <CheckCheck size={13} color="#10B981" style={{ marginTop: 2 }} />
        )}
      </View>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function PrepareScreen() {
  const [selectedBatchUuid, setSelectedBatchUuid] = useState<string | null>(null);

  if (selectedBatchUuid) {
    return (
      <View style={styles.screen}>
        {/* Back header */}
        <TouchableOpacity style={styles.detailBackHeader} onPress={() => setSelectedBatchUuid(null)}>
          <ChevronLeft size={22} color="#2563EB" />
          <Text style={styles.detailBackText}>Буцах</Text>
        </TouchableOpacity>
        <BatchDetailView uuid={selectedBatchUuid} onBack={() => setSelectedBatchUuid(null)} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <BatchListView onSelectBatch={setSelectedBatchUuid} />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'GIP-Regular',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: 'GIP-SemiBold',
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontFamily: 'GIP-SemiBold',
    fontSize: 14,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // ── Badge ──
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'GIP-SemiBold',
  },

  // ── Batch Card ──
  batchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  batchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  batchCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchCode: {
    fontSize: 15,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  warehouseGateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  warehouseChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  warehouseChipText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#1D4ED8',
    maxWidth: 140,
  },
  gateChip: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  gateChipText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#15803D',
  },
  batchStats: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    marginTop: 1,
  },
  personnelRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personText: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    maxWidth: 120,
  },
  batchCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  batchDateBlock: {
    flexDirection: 'column',
    gap: 1,
  },
  batchDateLabel: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },
  batchDate: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
  },

  // ── Detail ──
  detailBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 4,
  },
  detailBackText: {
    fontSize: 15,
    fontFamily: 'GIP-SemiBold',
    color: '#2563EB',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  detailHeader: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  detailBatchCode: {
    fontSize: 20,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  detailGate: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },

  // ── Info Grid ──
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  infoCard: {
    width: '30.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  infoCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  infoCardValue: {
    fontSize: 16,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  infoCardLabel: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Personnel card ──
  personnelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personRoleLabel: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    width: 80,
  },
  personInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  personAvatarInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitials: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
  },
  personName: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
  },
  personJob: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },

  // ── Actions ──
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnPrimary: {
    backgroundColor: '#2563EB',
  },
  actionBtnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
  },
  actionBtnSuccess: {
    backgroundColor: '#059669',
  },
  actionBtnSuccessText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
  },

  // ── Products ──
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productRowEven: {
    backgroundColor: '#FAFAFA',
  },
  productLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  prepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  productImageWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageInitials: {
    fontSize: 14,
    fontFamily: 'GIP-Bold',
  },
  productName: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#1F2937',
    marginBottom: 3,
    lineHeight: 18,
  },
  productMeta: {
    gap: 2,
  },
  productSeries: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  productBridgeName: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#374151',
  },
  productCodes: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },
  productSeriesWarn: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#D97706',
  },
  productPrepStatus: {
    fontSize: 11,
    fontFamily: 'GIP-SemiBold',
  },
  productRight: {
    alignItems: 'center',
    minWidth: 48,
    paddingLeft: 8,
  },
  productQty: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  productQtyLabel: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },
});
