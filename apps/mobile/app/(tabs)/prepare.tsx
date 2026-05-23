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
  Modal,
  TextInput,
  KeyboardAvoidingView,
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
  MessageSquare,
  GitBranch,
  X,
  Check,
} from 'lucide-react-native';
import {
  getWarehouseBatches,
  getWarehouseBatchDetail,
  startBatchPreparing,
  markBatchPrepared,
  toggleProductPrep,
  savePreparerNote,
  getProductSeries,
  submitSeriesRequest,
  WarehouseBatchItem,
  WarehouseBatchDetail,
  BatchProduct,
  BridgeSeries,
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
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [prepFilter, setPrepFilter] = useState<'all' | 'prepared' | 'unprepared'>('all');

  // Prep toggle per product
  const [togglingUuids, setTogglingUuids] = useState<Set<string>>(new Set());

  // Note modal
  const [noteModal, setNoteModal] = useState<{ productUuid: string; note: string } | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

  // Series request modal
  const [seriesModal, setSeriesModal] = useState<{
    productUuid: string;
    productName: string;
    series: BridgeSeries[];
    loading: boolean;
    selected: BridgeSeries | null;
    note: string;
  } | null>(null);
  const [seriesSubmitting, setSeriesSubmitting] = useState(false);

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

  const handleTogglePrep = useCallback(async (productUuid: string) => {
    setTogglingUuids((s) => new Set(s).add(productUuid));
    try {
      const r = await toggleProductPrep(uuid, productUuid);
      if (r.success) {
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            products: prev.products.map((p) =>
              p.product_uuid === productUuid
                ? { ...p, prep_status: r.prep_status as 'new' | 'prepared' }
                : p
            ),
          };
        });
      } else {
        Alert.alert('Алдаа', r.error || 'Алдаа гарлаа');
      }
    } catch {
      Alert.alert('Алдаа', 'Сүлжээний алдаа');
    } finally {
      setTogglingUuids((s) => { const ns = new Set(s); ns.delete(productUuid); return ns; });
    }
  }, [uuid]);

  const handleOpenNote = useCallback((productUuid: string) => {
    const p = detail?.products.find((x) => x.product_uuid === productUuid);
    setNoteModal({ productUuid, note: p?.preparer_note ?? '' });
  }, [detail]);

  const handleSaveNote = useCallback(async () => {
    if (!noteModal) return;
    setNoteSaving(true);
    try {
      const r = await savePreparerNote(uuid, noteModal.productUuid, noteModal.note);
      if (r.success) {
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            products: prev.products.map((p) =>
              p.product_uuid === noteModal.productUuid
                ? { ...p, preparer_note: noteModal.note || null }
                : p
            ),
          };
        });
        setNoteModal(null);
      } else {
        Alert.alert('Алдаа', r.error || 'Алдаа гарлаа');
      }
    } catch {
      Alert.alert('Алдаа', 'Сүлжээний алдаа');
    } finally {
      setNoteSaving(false);
    }
  }, [uuid, noteModal]);

  const handleOpenSeriesRequest = useCallback(async (productUuid: string) => {
    const p = detail?.products.find((x) => x.product_uuid === productUuid);
    setSeriesModal({
      productUuid,
      productName: p?.name ?? '',
      series: [],
      loading: true,
      selected: null,
      note: p?.series_request_note ?? '',
    });
    try {
      const r = await getProductSeries(uuid, productUuid);
      setSeriesModal((prev) => prev ? { ...prev, series: r.series ?? [], loading: false } : null);
    } catch {
      setSeriesModal((prev) => prev ? { ...prev, loading: false } : null);
    }
  }, [uuid, detail]);

  const handleSubmitSeriesRequest = useCallback(async () => {
    if (!seriesModal?.selected) {
      Alert.alert('Анхааруулга', 'Сери сонгоно уу');
      return;
    }
    setSeriesSubmitting(true);
    try {
      const r = await submitSeriesRequest(uuid, seriesModal.productUuid, {
        series_uuid: seriesModal.selected.uuid,
        series_name: seriesModal.selected.name,
        series_expiry_date: seriesModal.selected.expireDate,
        note: seriesModal.note,
      });
      if (r.success) {
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            products: prev.products.map((p) =>
              p.product_uuid === seriesModal.productUuid
                ? {
                    ...p,
                    series_request_uuid: seriesModal.selected!.uuid,
                    series_request_name: seriesModal.selected!.name,
                    series_request_expiry_date: seriesModal.selected!.expireDate,
                    series_request_note: seriesModal.note || null,
                    series_request_status: 'pending',
                  }
                : p
            ),
          };
        });
        setSeriesModal(null);
        Alert.alert('Амжилттай', 'Сери хүсэлт илгээгдлээ. Нярав батална.');
      } else {
        Alert.alert('Алдаа', r.error || 'Алдаа гарлаа');
      }
    } catch {
      Alert.alert('Алдаа', 'Сүлжээний алдаа');
    } finally {
      setSeriesSubmitting(false);
    }
  }, [uuid, seriesModal]);

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
    <View style={{ flex: 1 }}>
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
      <View style={styles.prepFilterTabs}>
        {(
          [['all', 'Бүгд'], ['prepared', 'Бэлдсэн'], ['unprepared', 'Бэлдээгүй']] as const
        ).map(([key, label]) => {
          const count = key === 'all'
            ? detail.products.length
            : key === 'prepared'
            ? detail.products.filter((p) => p.prep_status === 'prepared').length
            : detail.products.filter((p) => p.prep_status !== 'prepared').length;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.prepFilterTab, prepFilter === key && styles.prepFilterTabActive]}
              onPress={() => setPrepFilter(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.prepFilterTabText, prepFilter === key && styles.prepFilterTabTextActive]}>
                {label}
              </Text>
              <View style={[styles.prepFilterBadge, prepFilter === key && styles.prepFilterBadgeActive]}>
                <Text style={[styles.prepFilterBadgeText, prepFilter === key && styles.prepFilterBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.sectionTitle}>Бараануудын жагсаалт ({detail.products.length})</Text>

      {(() => {
        // Compute unique brands sorted alphabetically
        const allBrands = [...new Set(
          detail.products.map((p) => p.brand_name ?? '—')
        )].sort((a, b) => a.localeCompare(b, 'mn'));

        // Group by brand, sort groups and products alphabetically
        const grouped = new Map<string, typeof detail.products>();
        const prepFiltered = prepFilter === 'prepared'
          ? detail.products.filter((p) => p.prep_status === 'prepared')
          : prepFilter === 'unprepared'
          ? detail.products.filter((p) => p.prep_status !== 'prepared')
          : detail.products;
        const filtered = selectedBrand
          ? prepFiltered.filter((p) => (p.brand_name ?? '—') === selectedBrand)
          : prepFiltered;
        const sorted = [...filtered].sort((a, b) =>
          (a.name ?? '').localeCompare(b.name ?? '', 'mn')
        );
        for (const p of sorted) {
          const brand = p.brand_name ?? '—';
          if (!grouped.has(brand)) grouped.set(brand, []);
          grouped.get(brand)!.push(p);
        }
        const brandsSorted = [...grouped.keys()].sort((a, b) => a.localeCompare(b, 'mn'));
        let globalIdx = 0;

        return (
          <>
            {/* Brand filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandFilterRow}
              style={styles.brandFilterScroll}
            >
              <TouchableOpacity
                style={[styles.brandChip, selectedBrand === null && styles.brandChipActive]}
                onPress={() => setSelectedBrand(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.brandChipText, selectedBrand === null && styles.brandChipTextActive]}>
                  Бүгд
                </Text>
              </TouchableOpacity>
              {allBrands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={[styles.brandChip, selectedBrand === brand && styles.brandChipActive]}
                  onPress={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.brandChipText, selectedBrand === brand && styles.brandChipTextActive]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {brandsSorted.map((brand) => (
              <View key={brand}>
                <View style={styles.brandHeader}>
                  <Text style={styles.brandHeaderText}>{brand}</Text>
                  <Text style={styles.brandHeaderCount}>{grouped.get(brand)!.length} нэр</Text>
                </View>
                {grouped.get(brand)!.map((product) => (
                  <ProductRow
                    key={product.product_uuid}
                    product={product}
                    index={globalIdx++}
                    toggling={togglingUuids.has(product.product_uuid)}
                    onTogglePrep={handleTogglePrep}
                    onOpenNote={handleOpenNote}
                    onOpenSeriesRequest={handleOpenSeriesRequest}
                  />
                ))}
              </View>
            ))}
          </>
        );
      })()}
    </ScrollView>

    {/* ── Note Modal ── */}
    <Modal visible={noteModal !== null} transparent animationType="slide" onRequestClose={() => setNoteModal(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Тайлбар нэмэх</Text>
            <TouchableOpacity onPress={() => setNoteModal(null)}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.noteInput}
            value={noteModal?.note ?? ''}
            onChangeText={(t) => setNoteModal((prev) => prev ? { ...prev, note: t } : null)}
            placeholder="Тайлбар бичнэ үү..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.modalSubmitBtn, noteSaving && { opacity: 0.6 }]}
            onPress={handleSaveNote}
            disabled={noteSaving}
          >
            {noteSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Хадгалах</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* ── Series Request Modal ── */}
    <Modal visible={seriesModal !== null} transparent animationType="slide" onRequestClose={() => setSeriesModal(null)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>Сери хүсэлт</Text>
            <TouchableOpacity onPress={() => setSeriesModal(null)}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {seriesModal?.loading ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.loadingText}>Сери татаж байна...</Text>
            </View>
          ) : (seriesModal?.series?.length ?? 0) === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <AlertCircle size={32} color="#D97706" />
              <Text style={{ marginTop: 8, color: '#6B7280', fontFamily: 'GIP-Regular', fontSize: 13 }}>
                Боломжит сери олдсонгүй
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {seriesModal!.series.map((s) => {
                const isSelected = seriesModal?.selected?.uuid === s.uuid;
                return (
                  <TouchableOpacity
                    key={s.uuid}
                    style={[styles.seriesItem, isSelected && styles.seriesItemSelected]}
                    onPress={() => setSeriesModal((prev) => prev ? { ...prev, selected: s } : null)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.seriesItemName, isSelected && { color: '#2563EB' }]}>{s.name}</Text>
                      <Text style={styles.seriesItemMeta}>
                        {s.expireDate ? s.expireDate.slice(0, 10) : '—'} · {s.quantity.toLocaleString()} ш
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color="#2563EB" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <TextInput
            style={[styles.noteInput, { marginTop: 12 }]}
            value={seriesModal?.note ?? ''}
            onChangeText={(t) => setSeriesModal((prev) => prev ? { ...prev, note: t } : null)}
            placeholder="Нэмэлт тайлбар (заавал биш)..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.modalSubmitBtn, (!seriesModal?.selected || seriesSubmitting) && { opacity: 0.5 }]}
            onPress={handleSubmitSeriesRequest}
            disabled={!seriesModal?.selected || seriesSubmitting}
          >
            {seriesSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.modalSubmitText}>Хүсэлт илгээх</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
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

function ProductRow({
  product,
  index,
  toggling,
  onTogglePrep,
  onOpenNote,
  onOpenSeriesRequest,
}: {
  product: BatchProduct;
  index: number;
  toggling: boolean;
  onTogglePrep: (productUuid: string) => void;
  onOpenNote: (productUuid: string) => void;
  onOpenSeriesRequest: (productUuid: string) => void;
}) {
  const isPrepared = product.prep_status === 'prepared';

  const hasSeriesRequest = product.series_request_uuid !== null;
  const requestStatusColor =
    product.series_request_status === 'approved'
      ? '#10B981'
      : product.series_request_status === 'rejected'
      ? '#EF4444'
      : '#F59E0B';

  return (
    <View style={styles.productCard}>
      {/* ── Header: index badge + name + prep chip ── */}
      <View style={styles.productCardHeader}>
        <View style={styles.productCardIndexBadge}>
          <Text style={styles.productCardIndexText}>#{index + 1}</Text>
        </View>
        <Text style={styles.productCardName} numberOfLines={2}>{product.name}</Text>
        <TouchableOpacity
          style={[styles.prepChip, isPrepared && styles.prepChipDone]}
          onPress={() => onTogglePrep(product.product_uuid)}
          disabled={toggling}
          activeOpacity={0.7}
        >
          {toggling ? (
            <ActivityIndicator size="small" color={isPrepared ? '#10B981' : '#9CA3AF'} />
          ) : (
            <>
              <Check size={11} color={isPrepared ? '#10B981' : '#9CA3AF'} />
              <Text style={[styles.prepChipText, isPrepared && styles.prepChipTextDone]}>
                {isPrepared ? 'Бэлдсэн' : 'Бэлдээгүй'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Body: thumbnail + info + qty ── */}
      <View style={styles.productCardBody}>
        {/* Thumbnail */}
        <View style={styles.productCardThumb}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productCardThumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.productCardThumbPlaceholder}>
              <Package size={22} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 4 }}>
          {product.bridge_name ? (
            <Text style={styles.productCardBridge} numberOfLines={1}>{product.bridge_name}</Text>
          ) : null}

          {/* Code chips */}
          {(product.barcode || product.product_code) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {product.barcode ? (
                <View style={styles.productCodeChip}>
                  <Text style={styles.productCodeChipText}>{product.barcode}</Text>
                </View>
              ) : null}
              {product.product_code ? (
                <View style={styles.productCodeChip}>
                  <Hash size={9} color="#6B7280" />
                  <Text style={styles.productCodeChipText}>{product.product_code}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Series */}
          {product.series_expiry_date ? (
            <View style={styles.productSeriesChip}>
              <Text style={styles.productSeriesChipText}>
                {product.series_name ?? ''} · {product.series_expiry_date.slice(0, 10)}
              </Text>
            </View>
          ) : product.series_name ? (
            <View style={styles.productSeriesChip}>
              <Text style={styles.productSeriesChipText}>{product.series_name}</Text>
            </View>
          ) : product.seri_days > 0 ? (
            <View style={styles.productSeriesWarnChip}>
              <AlertCircle size={10} color="#D97706" />
              <Text style={styles.productSeriesWarnChipText}>
                Сери оноогдоогүй ({product.seri_days}хн)
              </Text>
            </View>
          ) : null}

          {/* Series request chip */}
          {hasSeriesRequest ? (
            <View style={[styles.productSeriesReqChip, { borderColor: requestStatusColor + '66' }]}>
              <GitBranch size={10} color={requestStatusColor} />
              <Text style={[styles.productSeriesReqChipText, { color: requestStatusColor }]} numberOfLines={1}>
                {product.series_request_name}
                {product.series_request_status === 'pending'
                  ? ' · хүлээгдэж буй'
                  : product.series_request_status === 'approved'
                  ? ' · батлагдсан'
                  : ' · татгалзсан'}
              </Text>
            </View>
          ) : null}

          {/* Preparer note */}
          {product.preparer_note ? (
            <View style={styles.productNoteChip}>
              <MessageSquare size={10} color="#2563EB" />
              <Text style={styles.productNoteChipText} numberOfLines={2}>{product.preparer_note}</Text>
            </View>
          ) : null}
        </View>

        {/* Qty */}
        <View style={styles.productCardQty}>
          <Text style={styles.productCardQtyNum}>{product.total_quantity.toLocaleString()}</Text>
          <Text style={styles.productCardQtyLabel}>ш</Text>
          {product.warehouse_checked ? (
            <CheckCheck size={14} color="#10B981" style={{ marginTop: 2 }} />
          ) : null}
        </View>
      </View>

      {/* ── Footer: action buttons ── */}
      <View style={styles.productCardFooter}>
        <TouchableOpacity
          style={[styles.productCardActionBtn, product.preparer_note ? styles.productCardActionBtnActive : null]}
          onPress={() => onOpenNote(product.product_uuid)}
          activeOpacity={0.7}
        >
          <MessageSquare size={13} color={product.preparer_note ? '#2563EB' : '#9CA3AF'} />
          <Text style={[styles.productCardActionText, product.preparer_note ? { color: '#2563EB' } : null]}>
            Тайлбар
          </Text>
        </TouchableOpacity>

        {!product.series_uuid && product.seri_days > 0 ? (
          <TouchableOpacity
            style={[styles.productCardActionBtn, hasSeriesRequest ? styles.productCardActionBtnActive : null]}
            onPress={() => onOpenSeriesRequest(product.product_uuid)}
            activeOpacity={0.7}
          >
            <GitBranch size={13} color={hasSeriesRequest ? '#F59E0B' : '#9CA3AF'} />
            <Text style={[styles.productCardActionText, hasSeriesRequest ? { color: '#F59E0B' } : null]}>
              Сери хүсэлт
            </Text>
          </TouchableOpacity>
        ) : null}
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
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  brandHeaderText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
    flex: 1,
  },
  brandHeaderCount: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },

  // ── Brand filter ──
  prepFilterTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  prepFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  prepFilterTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  prepFilterTabText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#6B7280',
  },
  prepFilterTabTextActive: {
    color: '#111827',
  },
  prepFilterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  prepFilterBadgeActive: {
    backgroundColor: '#2563EB',
  },
  prepFilterBadgeText: {
    fontSize: 10,
    fontFamily: 'GIP-Bold',
    color: '#6B7280',
  },
  prepFilterBadgeTextActive: {
    color: '#fff',
  },
  brandFilterScroll: {
    marginBottom: 8,
  },
  brandFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  brandChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  brandChipText: {
    fontSize: 12,
    fontFamily: 'GIP-SemiBold',
    color: '#6B7280',
  },
  brandChipTextActive: {
    color: '#fff',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  prepCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prepCheckCircleDone: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
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
  // ── Product Card ──
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: 'hidden',
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productCardIndexBadge: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  productCardIndexText: {
    fontSize: 11,
    fontFamily: 'GIP-Bold',
    color: '#fff',
  },
  productCardName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
    lineHeight: 18,
  },
  prepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    flexShrink: 0,
  },
  prepChipDone: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  prepChipText: {
    fontSize: 11,
    fontFamily: 'GIP-SemiBold',
    color: '#9CA3AF',
  },
  prepChipTextDone: {
    color: '#10B981',
  },
  productCardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  productCardThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    flexShrink: 0,
  },
  productCardThumbImg: {
    width: '100%',
    height: '100%',
  },
  productCardThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardBridge: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  productCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  productCodeChipText: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  productSeriesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
  },
  productSeriesChipText: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#059669',
  },
  productSeriesWarnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    alignSelf: 'flex-start',
  },
  productSeriesWarnChipText: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#D97706',
  },
  productSeriesReqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FFFBEB',
    alignSelf: 'flex-start',
  },
  productSeriesReqChipText: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
  },
  productNoteChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
  },
  productNoteChipText: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#2563EB',
    flex: 1,
  },
  productCardQty: {
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 36,
  },
  productCardQtyNum: {
    fontSize: 20,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  productCardQtyLabel: {
    fontSize: 10,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
  },
  productCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  productCardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  productCardActionBtnActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  productCardActionText: {
    fontSize: 11,
    fontFamily: 'GIP-SemiBold',
    color: '#9CA3AF',
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'GIP-Bold',
    color: '#111827',
    flex: 1,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#374151',
    minHeight: 80,
  },
  modalSubmitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  modalSubmitText: {
    color: '#fff',
    fontFamily: 'GIP-SemiBold',
    fontSize: 14,
  },
  seriesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  seriesItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  seriesItemName: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
  },
  seriesItemMeta: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
});
