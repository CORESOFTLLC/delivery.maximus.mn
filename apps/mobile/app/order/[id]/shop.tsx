/**
 * ДЭЛГҮҮРТ ХҮЛЭЭЛГЭХ ДЭЛГЭЦ
 * 
 * 3 Step Wizard:
 * Step 1: Бараа хүлээлгэх (Products - delivered/returned quantities)
 * Step 2: Төлбөр (Payment method and amount)
 * Step 3: E-Barimt + Гарын үсэг + Зураг (Receipt, signature, photo)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  CreditCard,
  Receipt,
  Check,
  CheckCircle2,
  Circle,
  Minus,
  Plus,
  AlertCircle,
  Banknote,
  Smartphone,
  Building2,
  User,
  Camera,
  X,
  Pen,
  RotateCcw,
} from 'lucide-react-native';
import { useAuthStore } from '../../../stores/delivery-auth-store';
import {
  getOrderDetail,
  getReturnReasons,
  updateProductDelivery,
  bulkDeliverProducts,
  savePayment,
  createEbarimt,
  completeOrderDelivery,
  DeliveryOrder,
  OrderProduct,
  ReturnReason,
  PaymentData,
  EbarimtType,
} from '../../../services/delivery-api';
import SignatureScreen from '@/components/SignatureScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Payment method options
const PAYMENT_METHODS = [
  { id: 'cash', label: 'Бэлэн мөнгө', icon: Banknote, color: '#059669' },
  { id: 'card', label: 'Карт (POS)', icon: CreditCard, color: '#2563EB' },
  { id: 'qpay', label: 'QPay', icon: Smartphone, color: '#8B5CF6' },
  { id: 'transfer', label: 'Дансаар', icon: Building2, color: '#F59E0B' },
  { id: 'mixed', label: 'Хольмог', icon: CreditCard, color: '#6B7280' },
  { id: 'credit', label: 'Зээлээр', icon: AlertCircle, color: '#DC2626' },
] as const;

// Ebarimt type options
const EBARIMT_TYPES = [
  { id: 'person' as EbarimtType, label: 'Хувь хүн', icon: User },
  { id: 'organization' as EbarimtType, label: 'Байгууллага', icon: Building2 },
  { id: 'none' as EbarimtType, label: 'Баримтгүй', icon: X },
];

// Product delivery state
interface ProductDeliveryState {
  product_id: number;
  delivered_quantity: number;
  returned_quantity: number;
  return_reason_id?: number;
}

export default function ShopDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { worker } = useAuthStore();
  
  // Main state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Order data
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [returnReasons, setReturnReasons] = useState<ReturnReason[]>([]);
  
  // Step 1: Products state
  const [productStates, setProductStates] = useState<Map<number, ProductDeliveryState>>(new Map());
  const [selectedProductForReturn, setSelectedProductForReturn] = useState<number | null>(null);
  const [returnReasonModalVisible, setReturnReasonModalVisible] = useState(false);
  
  // Step 2: Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  
  // Step 3: Ebarimt + Signature + Photo state
  const [ebarimtType, setEbarimtType] = useState<EbarimtType>('person');
  const [ebarimtPhone, setEbarimtPhone] = useState<string>('');
  const [ebarimtRegistry, setEbarimtRegistry] = useState<string>('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [orderResult, reasonsResult] = await Promise.all([
        getOrderDetail(id),
        getReturnReasons(),
      ]);
      
      if (orderResult.success && orderResult.data) {
        setOrder(orderResult.data.order);
        setProducts(orderResult.data.products || []);
        
        // Initialize product states
        const initialStates = new Map<number, ProductDeliveryState>();
        (orderResult.data.products || []).forEach(p => {
          initialStates.set(p.id, {
            product_id: p.id,
            delivered_quantity: p.delivered_quantity || p.quantity,
            returned_quantity: p.returned_quantity || 0,
            return_reason_id: undefined,
          });
        });
        setProductStates(initialStates);
        
        // Set default payment amount
        const total = parseFloat(orderResult.data.order.total_amount) || 0;
        setPaymentAmount(total.toString());
        
        // Set default ebarimt phone from customer
        if (orderResult.data.order.customer?.phone) {
          setEbarimtPhone(orderResult.data.order.customer.phone);
        }
        // Set registry number for organization
        if (orderResult.data.order.registry_number) {
          setEbarimtRegistry(orderResult.data.order.registry_number);
        }
      }
      
      if (reasonsResult.success && reasonsResult.data) {
        setReturnReasons(reasonsResult.data);
      }
    } catch (error) {
      Alert.alert('Алдаа', 'Мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    let totalDelivered = 0;
    let totalReturned = 0;
    let deliveredAmount = 0;
    
    products.forEach(p => {
      const state = productStates.get(p.id);
      if (state) {
        totalDelivered += state.delivered_quantity;
        totalReturned += state.returned_quantity;
        const price = parseFloat(p.price) || 0;
        deliveredAmount += state.delivered_quantity * price;
      }
    });
    
    return { totalDelivered, totalReturned, deliveredAmount };
  }, [products, productStates]);

  const { totalDelivered, totalReturned, deliveredAmount } = calculateTotals();

  // Product quantity handlers
  const updateProductQuantity = (productId: number, field: 'delivered' | 'returned', delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setProductStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(productId) || {
        product_id: productId,
        delivered_quantity: product.quantity,
        returned_quantity: 0,
      };
      
      if (field === 'delivered') {
        const newDelivered = Math.max(0, Math.min(product.quantity, current.delivered_quantity + delta));
        const newReturned = product.quantity - newDelivered;
        newMap.set(productId, {
          ...current,
          delivered_quantity: newDelivered,
          returned_quantity: newReturned,
        });
        
        // If returning, show reason modal
        if (newReturned > 0 && delta < 0) {
          setSelectedProductForReturn(productId);
          setReturnReasonModalVisible(true);
        }
      } else {
        const newReturned = Math.max(0, Math.min(product.quantity, current.returned_quantity + delta));
        const newDelivered = product.quantity - newReturned;
        newMap.set(productId, {
          ...current,
          delivered_quantity: newDelivered,
          returned_quantity: newReturned,
        });
        
        // If returning, show reason modal
        if (newReturned > 0 && delta > 0) {
          setSelectedProductForReturn(productId);
          setReturnReasonModalVisible(true);
        }
      }
      
      return newMap;
    });
  };

  const setReturnReason = (reasonId: number) => {
    if (selectedProductForReturn === null) return;
    
    setProductStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(selectedProductForReturn);
      if (current) {
        newMap.set(selectedProductForReturn, {
          ...current,
          return_reason_id: reasonId,
        });
      }
      return newMap;
    });
    
    setReturnReasonModalVisible(false);
    setSelectedProductForReturn(null);
  };

  // Bulk deliver all
  const handleBulkDeliver = () => {
    Alert.alert(
      'Бүгдийг хүлээлгэх',
      'Бүх барааг бүрэн хүлээлгэсэн гэж тэмдэглэх үү?',
      [
        { text: 'Үгүй', style: 'cancel' },
        {
          text: 'Тийм',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setProductStates(prev => {
              const newMap = new Map(prev);
              products.forEach(p => {
                newMap.set(p.id, {
                  product_id: p.id,
                  delivered_quantity: p.quantity,
                  returned_quantity: 0,
                  return_reason_id: undefined,
                });
              });
              return newMap;
            });
          },
        },
      ]
    );
  };

  // Take photo
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Зөвшөөрөл', 'Камер ашиглах зөвшөөрөл өгнө үү');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    
    if (!result.canceled && result.assets[0].base64) {
      setDeliveryPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Step validation
  const canProceedToStep2 = () => {
    // At least one product should be delivered or returned
    return totalDelivered > 0 || totalReturned > 0;
  };

  const canProceedToStep3 = () => {
    // Payment must be selected
    if (!paymentMethod) return false;
    if (paymentMethod !== 'credit' && (!paymentAmount || parseFloat(paymentAmount) <= 0)) return false;
    return true;
  };

  const canComplete = () => {
    // Signature is required
    if (!signatureImage) return false;
    // Ebarimt validation
    if (ebarimtType === 'person' && !ebarimtPhone) return false;
    if (ebarimtType === 'organization' && !ebarimtRegistry) return false;
    return true;
  };

  // Submit handlers
  const handleNextStep = () => {
    if (currentStep === 1 && !canProceedToStep2()) {
      Alert.alert('Анхааруулга', 'Дор хаяж нэг бараа хүлээлгэх эсвэл буцаах шаардлагатай');
      return;
    }
    if (currentStep === 2 && !canProceedToStep3()) {
      Alert.alert('Анхааруулга', 'Төлбөрийн мэдээлэл бөглөнө үү');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep(prev => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleComplete = async () => {
    if (!canComplete()) {
      Alert.alert('Анхааруулга', 'Гарын үсэг болон баримтын мэдээлэл шаардлагатай');
      return;
    }
    
    if (!order || !id) return;
    
    Alert.alert(
      'Хүргэлт дуусгах',
      'Захиалгыг хүргэсэн гэж тэмдэглэх үү?',
      [
        { text: 'Үгүй', style: 'cancel' },
        {
          text: 'Тийм',
          onPress: async () => {
            setSubmitting(true);
            
            try {
              // 1. Update product deliveries
              for (const [productId, state] of productStates) {
                await updateProductDelivery({
                  order_uuid: id,
                  product_id: productId,
                  delivered_quantity: state.delivered_quantity,
                  returned_quantity: state.returned_quantity,
                  return_reason_id: state.return_reason_id,
                });
              }
              
              // 2. Save payment
              const paymentData: PaymentData = {
                order_uuid: id,
                payment_type: paymentMethod === 'credit' ? 'unpaid' : (parseFloat(paymentAmount) >= deliveredAmount ? 'full' : 'partial'),
                payment_method: paymentMethod as PaymentData['payment_method'],
                payment_amount: parseFloat(paymentAmount) || 0,
                notes: paymentNotes,
              };
              
              if (paymentMethod === 'mixed') {
                paymentData.cash_amount = parseFloat(cashAmount) || 0;
                paymentData.card_amount = parseFloat(cardAmount) || 0;
              }
              
              await savePayment(paymentData);
              
              // 3. Complete delivery with signature and photo
              const result = await completeOrderDelivery(id, {
                delivery_notes: deliveryNotes,
                signature_image: signatureImage || undefined,
                delivery_photo: deliveryPhoto || undefined,
                ebarimt_type: ebarimtType,
                ebarimt_phone: ebarimtType === 'person' ? ebarimtPhone : undefined,
                ebarimt_registry: ebarimtType === 'organization' ? ebarimtRegistry : undefined,
                payment_type: paymentData.payment_type,
                payment_method: paymentMethod,
                payment_amount: paymentData.payment_amount,
              });
              
              if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Амжилттай',
                  'Захиалга амжилттай хүргэгдлээ!',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('Алдаа', result.message || 'Хүргэлт дуусгахад алдаа гарлаа');
              }
            } catch (error) {
              Alert.alert('Алдаа', 'Сүлжээний алдаа гарлаа');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // Render Step Indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map(step => (
        <React.Fragment key={step}>
          <TouchableOpacity
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
              currentStep === step && styles.stepCircleCurrent,
            ]}
            onPress={() => {
              if (step < currentStep) setCurrentStep(step);
            }}
          >
            {currentStep > step ? (
              <Check size={16} color="#FFFFFF" />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                {step}
              </Text>
            )}
          </TouchableOpacity>
          {step < 3 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // Render Step 1: Products
  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Package size={24} color="#059669" />
        <Text style={styles.stepTitle}>Бараа хүлээлгэх</Text>
      </View>
      
      <TouchableOpacity style={styles.bulkButton} onPress={handleBulkDeliver}>
        <CheckCircle2 size={20} color="#FFFFFF" />
        <Text style={styles.bulkButtonText}>Бүгдийг хүлээлгэх</Text>
      </TouchableOpacity>
      
      {products.map((product, index) => {
        const state = productStates.get(product.id);
        const delivered = state?.delivered_quantity ?? product.quantity;
        const returned = state?.returned_quantity ?? 0;
        const hasReturn = returned > 0;
        const returnReason = returnReasons.find(r => r.id === state?.return_reason_id);
        
        return (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productIndex}>#{index + 1}</Text>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            </View>
            
            <View style={styles.productInfo}>
              <Text style={styles.productPrice}>
                {parseFloat(product.price).toLocaleString()}₮ x {product.quantity}ш
              </Text>
              <Text style={styles.productTotal}>
                = {(parseFloat(product.price) * product.quantity).toLocaleString()}₮
              </Text>
            </View>
            
            <View style={styles.quantityRow}>
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Хүлээлгэх:</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateProductQuantity(product.id, 'delivered', -1)}
                  >
                    <Minus size={18} color="#DC2626" />
                  </TouchableOpacity>
                  <View style={[styles.quantityValue, delivered === product.quantity && styles.quantityValueFull]}>
                    <Text style={[styles.quantityValueText, delivered === product.quantity && styles.quantityValueTextFull]}>
                      {delivered}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateProductQuantity(product.id, 'delivered', 1)}
                  >
                    <Plus size={18} color="#059669" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.quantitySection}>
                <Text style={[styles.quantityLabel, { color: '#DC2626' }]}>Буцаах:</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateProductQuantity(product.id, 'returned', -1)}
                  >
                    <Minus size={18} color="#DC2626" />
                  </TouchableOpacity>
                  <View style={[styles.quantityValue, returned > 0 && styles.quantityValueReturn]}>
                    <Text style={[styles.quantityValueText, returned > 0 && styles.quantityValueTextReturn]}>
                      {returned}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateProductQuantity(product.id, 'returned', 1)}
                  >
                    <Plus size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {hasReturn && (
              <TouchableOpacity
                style={styles.returnReasonButton}
                onPress={() => {
                  setSelectedProductForReturn(product.id);
                  setReturnReasonModalVisible(true);
                }}
              >
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.returnReasonText}>
                  {returnReason ? returnReason.name : 'Буцаалтын шалтгаан сонгох'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
      
      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Хүлээлгэсэн:</Text>
          <Text style={styles.summaryValue}>{totalDelivered} ширхэг</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Буцаасан:</Text>
          <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{totalReturned} ширхэг</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <Text style={styles.summaryTotalLabel}>Төлөх дүн:</Text>
          <Text style={styles.summaryTotalValue}>{deliveredAmount.toLocaleString()}₮</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render Step 2: Payment
  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <CreditCard size={24} color="#2563EB" />
        <Text style={styles.stepTitle}>Төлбөр</Text>
      </View>
      
      <View style={styles.paymentTotalCard}>
        <Text style={styles.paymentTotalLabel}>Төлөх дүн:</Text>
        <Text style={styles.paymentTotalValue}>{deliveredAmount.toLocaleString()}₮</Text>
      </View>
      
      <Text style={styles.sectionLabel}>Төлбөрийн арга:</Text>
      <View style={styles.paymentMethods}>
        {PAYMENT_METHODS.map(method => {
          const Icon = method.icon;
          const isSelected = paymentMethod === method.id;
          
          return (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentMethodCard, isSelected && { borderColor: method.color, borderWidth: 2 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPaymentMethod(method.id);
              }}
            >
              <Icon size={24} color={isSelected ? method.color : '#6B7280'} />
              <Text style={[styles.paymentMethodText, isSelected && { color: method.color }]}>
                {method.label}
              </Text>
              {isSelected && (
                <View style={[styles.paymentMethodCheck, { backgroundColor: method.color }]}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {paymentMethod !== 'credit' && (
        <>
          <Text style={styles.sectionLabel}>Төлсөн дүн:</Text>
          <TextInput
            style={styles.amountInput}
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            keyboardType="numeric"
            placeholder="0"
          />
          
          {paymentMethod === 'mixed' && (
            <View style={styles.mixedPaymentRow}>
              <View style={styles.mixedPaymentField}>
                <Text style={styles.mixedPaymentLabel}>Бэлэн:</Text>
                <TextInput
                  style={styles.mixedPaymentInput}
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.mixedPaymentField}>
                <Text style={styles.mixedPaymentLabel}>Карт:</Text>
                <TextInput
                  style={styles.mixedPaymentInput}
                  value={cardAmount}
                  onChangeText={setCardAmount}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
          )}
        </>
      )}
      
      <Text style={styles.sectionLabel}>Тэмдэглэл:</Text>
      <TextInput
        style={styles.notesInput}
        value={paymentNotes}
        onChangeText={setPaymentNotes}
        placeholder="Төлбөрийн тэмдэглэл..."
        multiline
        numberOfLines={3}
      />
    </ScrollView>
  );

  // Render Step 3: Ebarimt + Signature + Photo
  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Receipt size={24} color="#8B5CF6" />
        <Text style={styles.stepTitle}>Баримт & Баталгаа</Text>
      </View>
      
      {/* E-Barimt Section */}
      <Text style={styles.sectionLabel}>E-Barimt төрөл:</Text>
      <View style={styles.ebarimtTypes}>
        {EBARIMT_TYPES.map(type => {
          const Icon = type.icon;
          const isSelected = ebarimtType === type.id;
          
          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.ebarimtTypeCard, isSelected && styles.ebarimtTypeCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEbarimtType(type.id);
              }}
            >
              <Icon size={20} color={isSelected ? '#8B5CF6' : '#6B7280'} />
              <Text style={[styles.ebarimtTypeText, isSelected && styles.ebarimtTypeTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {ebarimtType === 'person' && (
        <>
          <Text style={styles.sectionLabel}>Утасны дугаар:</Text>
          <TextInput
            style={styles.textInput}
            value={ebarimtPhone}
            onChangeText={setEbarimtPhone}
            placeholder="99001122"
            keyboardType="phone-pad"
            maxLength={8}
          />
        </>
      )}
      
      {ebarimtType === 'organization' && (
        <>
          <Text style={styles.sectionLabel}>Байгууллагын регистр:</Text>
          <TextInput
            style={styles.textInput}
            value={ebarimtRegistry}
            onChangeText={setEbarimtRegistry}
            placeholder="1234567"
            keyboardType="numeric"
            maxLength={7}
          />
        </>
      )}
      
      {/* Signature Section */}
      <Text style={styles.sectionLabel}>Хүлээн авсан хүний гарын үсэг: *</Text>
      {signatureImage ? (
        <View style={styles.signaturePreview}>
          <Image source={{ uri: signatureImage }} style={styles.signatureImage} resizeMode="contain" />
          <TouchableOpacity
            style={styles.signatureRemove}
            onPress={() => setSignatureImage(null)}
          >
            <RotateCcw size={20} color="#DC2626" />
            <Text style={styles.signatureRemoveText}>Дахин зурах</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.signatureButton}
          onPress={() => setShowSignatureModal(true)}
        >
          <Pen size={24} color="#6B7280" />
          <Text style={styles.signatureButtonText}>Гарын үсэг зурах</Text>
        </TouchableOpacity>
      )}
      
      {/* Photo Section */}
      <Text style={styles.sectionLabel}>Хүргэлтийн зураг:</Text>
      {deliveryPhoto ? (
        <View style={styles.photoPreview}>
          <Image source={{ uri: deliveryPhoto }} style={styles.photoImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.photoRemove}
            onPress={() => setDeliveryPhoto(null)}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
          <Camera size={24} color="#6B7280" />
          <Text style={styles.photoButtonText}>Зураг авах</Text>
        </TouchableOpacity>
      )}
      
      {/* Notes */}
      <Text style={styles.sectionLabel}>Хүргэлтийн тэмдэглэл:</Text>
      <TextInput
        style={styles.notesInput}
        value={deliveryNotes}
        onChangeText={setDeliveryNotes}
        placeholder="Нэмэлт тэмдэглэл..."
        multiline
        numberOfLines={3}
      />
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Ачааллаж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Дэлгүүрт хүлээлгэх',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Order Info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderCode}>{order?.order_code}</Text>
        <Text style={styles.customerName}>{order?.customer?.name}</Text>
      </View>
      
      {/* Step Indicator */}
      {renderStepIndicator()}
      
      {/* Step Labels */}
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>Бараа</Text>
        <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>Төлбөр</Text>
        <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>Баримт</Text>
      </View>
      
      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </KeyboardAvoidingView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrevStep}>
            <ArrowLeft size={20} color="#6B7280" />
            <Text style={styles.prevButtonText}>Буцах</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep === 3 && styles.completeButton,
            submitting && styles.buttonDisabled,
          ]}
          onPress={currentStep === 3 ? handleComplete : handleNextStep}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'Хүргэлт дуусгах' : 'Үргэлжлүүлэх'}
              </Text>
              {currentStep < 3 && <ArrowRight size={20} color="#FFFFFF" />}
              {currentStep === 3 && <Check size={20} color="#FFFFFF" />}
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Return Reason Modal */}
      <Modal
        visible={returnReasonModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReturnReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Буцаалтын шалтгаан</Text>
            
            {returnReasons.map(reason => (
              <TouchableOpacity
                key={reason.id}
                style={styles.reasonOption}
                onPress={() => setReturnReason(reason.id)}
              >
                <Text style={styles.reasonText}>{reason.name}</Text>
                <Circle size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setReturnReasonModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Хаах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Signature Modal */}
      <Modal
        visible={showSignatureModal}
        animationType="slide"
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <SignatureScreen
          onSave={(signature: string) => {
            setSignatureImage(signature);
            setShowSignatureModal(false);
          }}
          onCancel={() => setShowSignatureModal(false)}
        />
      </Modal>
    </SafeAreaView>
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
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  orderInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderCode: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#059669',
  },
  stepCircleCurrent: {
    borderWidth: 3,
    borderColor: '#D1FAE5',
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: 'GIP-Bold',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#059669',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#059669',
    fontFamily: 'GIP-SemiBold',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  bulkButtonText: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  productIndex: {
    fontSize: 12,
    fontFamily: 'GIP-Bold',
    color: '#FFFFFF',
    backgroundColor: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  productTotal: {
    fontSize: 13,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quantitySection: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: '#059669',
    marginBottom: 6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityValueFull: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  quantityValueReturn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  quantityValueText: {
    fontSize: 16,
    fontFamily: 'GIP-Bold',
    color: '#111827',
  },
  quantityValueTextFull: {
    color: '#059669',
  },
  quantityValueTextReturn: {
    color: '#DC2626',
  },
  returnReasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: 8,
  },
  returnReasonText: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#DC2626',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#059669',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#374151',
    marginBottom: 10,
    marginTop: 16,
  },
  paymentTotalCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentTotalLabel: {
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#1E40AF',
  },
  paymentTotalValue: {
    fontSize: 20,
    fontFamily: 'GIP-Bold',
    color: '#1E40AF',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentMethodCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodText: {
    fontSize: 11,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  paymentMethodCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 20,
    fontFamily: 'GIP-Bold',
    color: '#111827',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mixedPaymentRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  mixedPaymentField: {
    flex: 1,
  },
  mixedPaymentLabel: {
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
    marginBottom: 6,
  },
  mixedPaymentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ebarimtTypes: {
    flexDirection: 'row',
    gap: 10,
  },
  ebarimtTypeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ebarimtTypeCardActive: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
    backgroundColor: '#F5F3FF',
  },
  ebarimtTypeText: {
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  ebarimtTypeTextActive: {
    color: '#8B5CF6',
    fontFamily: 'GIP-SemiBold',
  },
  signatureButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  signatureButtonText: {
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  signaturePreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signatureImage: {
    width: '100%',
    height: 150,
  },
  signatureRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  signatureRemoveText: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: '#DC2626',
  },
  photoButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  photoPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  photoRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    gap: 6,
  },
  prevButtonText: {
    fontSize: 14,
    fontFamily: 'GIP-Medium',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#059669',
    borderRadius: 10,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#2563EB',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 15,
    fontFamily: 'GIP-SemiBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'GIP-Bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reasonText: {
    fontSize: 15,
    fontFamily: 'GIP-Medium',
    color: '#111827',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: '#6B7280',
  },
});
