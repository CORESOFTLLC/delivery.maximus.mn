'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft,
    ArrowRight,
    ShoppingCart,
    ShoppingBag,
    FileText,
    CheckCircle,
    Package,
    Building2,
    Truck,
    CreditCard,
    MapPin,
    Loader2,
    Plus,
    Minus,
    Trash2,
    AlertCircle,
    Warehouse,
    Percent,
    Receipt,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { QuantityKeypad } from '@/components/cart/QuantityKeypad';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Stepper, StepperStep } from '@/components/ui/stepper';
import { useCartStore } from '@/stores/cart-store';
import { useWarehouseStore } from '@/stores/warehouse-store';
import { getUser } from '@/lib/auth';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Constants
const WEB_IMEI = 'WEB_B2B_CLIENT';

const PAYMENT_TYPES: Record<string, number> = {
    cash: 1,
    transfer: 2,
    qpay: 3,
};

const DELIVERY_TYPES: Record<string, number> = {
    pickup: 1,
    delivery: 2,
};

// Step definitions - will be populated with translations in component
const STEP_ICONS = [ShoppingCart, FileText, CheckCircle];

// Format currency
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('mn-MN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + '₮';
}

export default function MultiStepCheckoutPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderUuid, setOrderUuid] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    
    // Quantity edit keypad state
    const [editingItem, setEditingItem] = useState<{ productId: string; name: string; quantity: number; maxStock: number } | null>(null);
    const [isKeypadOpen, setIsKeypadOpen] = useState(false);
    const [keypadKey, setKeypadKey] = useState(0);

    // Cart store - includes selectedPartner
    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        totalAmount,
        totalItems,
        selectedPartner,
        clearSelectedPartner,
        refreshCartImages,
    } = useCartStore();

    // Get selected warehouse from store
    const { selectedWarehouse: warehouseFromStore } = useWarehouseStore();
    
    // Use warehouse from store or fallback to default
    const selectedWarehouse = warehouseFromStore || {
        uuid: '5a811d4a-6dc5-11e6-9c23-3085a97c20be',
        name: 'Үндсэн агуулах',
        priceTypeId: 'ee731f38-6e58-11e6-9c23-3085a97c20be',
        isSale: false,
    };

    // ERP details
    const [erpDetails] = useState<{ routeIMEI?: string } | null>(null);

    // Step 1: Order form data
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [deliveryMethod, setDeliveryMethod] = useState<string>('delivery');
    const [notes, setNotes] = useState('');
    const [useDiscount, setUseDiscount] = useState(true);

    // Step 2: Finish form data
    const [useLoan, setUseLoan] = useState(false);
    const [loanDescription, setLoanDescription] = useState('');
    const [latitude, setLatitude] = useState(47.89994322);
    const [longitude, setLongitude] = useState(106.8937231);

    // Order dates
    const [orderStartDate, setOrderStartDate] = useState<string | null>(null);

    // Translated steps
    const STEPS = useMemo(() => [
        { id: 0, title: t('checkout.multiStep.step0Title'), description: t('checkout.multiStep.step0Description'), icon: STEP_ICONS[0] },
        { id: 1, title: t('checkout.multiStep.step1Title'), description: t('checkout.multiStep.step1Description'), icon: STEP_ICONS[1] },
        { id: 2, title: t('checkout.multiStep.step2Title'), description: t('checkout.multiStep.step2Description'), icon: STEP_ICONS[2] },
    ], [t]);

    useEffect(() => {
        setMounted(true);
        // Refresh cart images if any item is missing an image
        const hasItemsWithoutImages = items.some(item => !item.imageUrl);
        if (hasItemsWithoutImages) {
            refreshCartImages();
        }
        // Get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude);
                    setLongitude(position.coords.longitude);
                },
                (error) => {
                    console.log('Geolocation error:', error);
                }
            );
        }
    }, []);

    // Validation
    const validation = useMemo(() => {
        const errors: string[] = [];

        if (!selectedPartner) errors.push(t('checkout.multiStep.partnerNotSelected'));
        if (!selectedWarehouse) errors.push(t('checkout.multiStep.warehouseNotSelected'));
        if (items.length === 0) errors.push(t('checkout.multiStep.emptyCart'));

        return {
            isValid: errors.length === 0,
            errors,
        };
    }, [selectedPartner, selectedWarehouse, items, t]);

    // Calculate totals
    const subtotal = totalAmount;
    const discount = 0; // Will be calculated from ERP
    const total = subtotal - discount;

    // Build order products
    const buildOrderProducts = useCallback(() => {
        return items.map((item) => ({
            productId: item.productId,
            stock: [{
                typeId: 'd114bb13-9c37-11e5-9beb-3085a97c20be',
                count: item.quantity,
            }],
            priceType: selectedWarehouse?.priceTypeId || '',
            sale: 0.0,
            promotions: [],
        }));
    }, [items, selectedWarehouse]);

    // Step 1: Create Order (paymentcheck: false)
    const createOrder = useCallback(async (): Promise<{ uuid: string; datetime: string } | null> => {
        if (!selectedPartner || !selectedWarehouse) return null;

        const user = getUser();
        const now = new Date();
        const datetime = now.toISOString().slice(0, 19).replace('T', ' ');

        const orderData = {
            companyId: selectedPartner.id,
            contractId: 'db05d0d6-9c37-11e5-9beb-3085a97c20be',
            username: user?.email || '9915513',
            imei: erpDetails?.routeIMEI || WEB_IMEI,
            warehouseId: selectedWarehouse.uuid,
            priceTypeId: selectedWarehouse.priceTypeId,
            customerPriceTypeId: selectedWarehouse.priceTypeId,
            paymentType: PAYMENT_TYPES[paymentMethod] || 1,
            cashAmount: null,
            deliveryType: DELIVERY_TYPES[deliveryMethod] || 2,
            deliveryDatetime: datetime,
            deliveryAdditionalInfo: '',
            description: notes,
            orderProducts: buildOrderProducts(),
            latitude,
            longitude,
            useDiscount,
            isSale: selectedWarehouse.isSale || false,
        };

        console.log('[Checkout] Step 1 - Creating order:', orderData);

        try {
            const response = await fetch('/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();
            console.log('[Checkout] Step 1 result:', result);

            if (result.success && result.uuid) {
                setOrderStartDate(datetime);
                return { uuid: result.uuid, datetime };
            } else {
                throw new Error(result.error || t('checkout.multiStep.orderCreateError'));
            }
        } catch (error) {
            throw error;
        }
    }, [selectedPartner, selectedWarehouse, erpDetails, paymentMethod, deliveryMethod, notes, buildOrderProducts, latitude, longitude, useDiscount, t]);

    // Step 2: Finish Order (paymentcheck: true)
    const finishOrder = useCallback(async (uuid: string, startDate: string): Promise<boolean> => {
        if (!selectedPartner || !selectedWarehouse) return false;

        const user = getUser();
        const now = new Date();
        const endDatetime = now.toISOString().slice(0, 19).replace('T', ' ');

        const finishData = {
            uuid,
            companyId: selectedPartner.id,
            contractId: 'db05d0d6-9c37-11e5-9beb-3085a97c20be',
            username: user?.email || '9915513',
            imei: erpDetails?.routeIMEI || WEB_IMEI,
            warehouseId: selectedWarehouse.uuid,
            priceTypeId: selectedWarehouse.priceTypeId,
            customerPriceTypeId: selectedWarehouse.priceTypeId,
            paymentType: PAYMENT_TYPES[paymentMethod] || 1,
            cashAmount: null,
            deliveryType: DELIVERY_TYPES[deliveryMethod] || 2,
            deliveryDatetime: startDate,
            deliveryAdditionalInfo: '',
            description: notes,
            orderProducts: buildOrderProducts(),
            latitudeFinish: latitude,
            longitudeFinish: longitude,
            useDiscount,
            isSale: selectedWarehouse.isSale || false,
            loan: useLoan,
            loanDescription: useLoan ? loanDescription : '',
            start_date: startDate,
            end_date: endDatetime,
        };

        console.log('[Checkout] Step 2 - Finishing order:', finishData);

        try {
            const response = await fetch('/api/order/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finishData),
            });

            const result = await response.json();
            console.log('[Checkout] Step 2 result:', result);

            if (result.success) {
                return true;
            } else {
                throw new Error(result.error || t('checkout.multiStep.orderFinishError'));
            }
        } catch (error) {
            throw error;
        }
    }, [selectedPartner, selectedWarehouse, erpDetails, paymentMethod, deliveryMethod, notes, buildOrderProducts, latitude, longitude, useDiscount, useLoan, loanDescription, t]);

    // Handle step navigation
    const handleNext = async () => {
        if (currentStep === 0) {
            // Step 0 -> 1: Validate cart
            if (items.length === 0) {
                toast.error(t('checkout.multiStep.emptyCart'));
                return;
            }
            if (!selectedPartner) {
                toast.error(t('checkout.multiStep.noPartner'));
                return;
            }
            setCurrentStep(1);
        } else if (currentStep === 1) {
            // Step 1 -> 2: Create order
            setIsSubmitting(true);
            try {
                toast.loading(t('checkout.multiStep.creatingOrder'), { id: 'order-progress' });
                const result = await createOrder();

                if (result) {
                    setOrderUuid(result.uuid);
                    toast.success(t('checkout.multiStep.orderCreated'), { id: 'order-progress' });
                    setCurrentStep(2);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : t('checkout.multiStep.orderCreateError');
                toast.error(message, { id: 'order-progress' });
            } finally {
                setIsSubmitting(false);
            }
        } else if (currentStep === 2) {
            // Step 2 -> Complete: Finish order
            if (!orderUuid || !orderStartDate) {
                toast.error(t('checkout.multiStep.orderNotCreated'));
                return;
            }

            setIsSubmitting(true);
            try {
                toast.loading(t('checkout.multiStep.confirmingOrder'), { id: 'order-progress' });
                const success = await finishOrder(orderUuid, orderStartDate);

                if (success) {
                    toast.success(t('checkout.multiStep.orderSuccess'), {
                        id: 'order-progress',
                        duration: 5000,
                    });

                    // Clear cart
                    clearCart();
                    clearSelectedPartner();

                    // Redirect to order detail
                    router.push(`/orders/${orderUuid}`);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : t('checkout.multiStep.orderFinishError');
                toast.error(message, { id: 'order-progress' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!mounted) {
        return (
            <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto animate-pulse">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                    <div className="space-y-2">
                        <div className="h-7 w-48 bg-gray-200 rounded" />
                        <div className="h-4 w-32 bg-gray-100 rounded" />
                    </div>
                </div>

                {/* Stepper Skeleton */}
                <div className="bg-white rounded-xl border p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                                <div className="hidden sm:block space-y-1">
                                    <div className="h-4 w-20 bg-gray-200 rounded" />
                                    <div className="h-3 w-28 bg-gray-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl border p-6">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                                    <div className="h-16 w-16 bg-gray-200 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-gray-200 rounded" />
                                        <div className="h-3 w-1/2 bg-gray-100 rounded" />
                                    </div>
                                    <div className="h-5 w-20 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border p-6">
                            <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-4 w-20 bg-gray-100 rounded" />
                                    <div className="h-4 w-24 bg-gray-200 rounded" />
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-16 bg-gray-100 rounded" />
                                    <div className="h-4 w-20 bg-gray-200 rounded" />
                                </div>
                                <div className="border-t pt-3 flex justify-between">
                                    <div className="h-5 w-12 bg-gray-200 rounded" />
                                    <div className="h-5 w-28 bg-gray-300 rounded" />
                                </div>
                            </div>
                        </div>
                        <div className="h-12 w-full bg-gray-300 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/cart">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t('checkout.multiStep.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('checkout.multiStep.subtitle')}</p>
                </div>
            </div>

            {/* Stepper */}
            <Card className="mb-6">
                <CardContent className="py-6">
                    <Stepper activeStep={currentStep}>
                        {STEPS.map((step) => (
                            <StepperStep
                                key={step.id}
                                step={step.id}
                                title={step.title}
                                description={step.description}
                                icon={<step.icon className="h-5 w-5" />}
                            />
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Step 0: Cart Review */}
                    {currentStep === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    {t('checkout.multiStep.cartItems')} ({items.length})
                                </CardTitle>
                                <CardDescription>{t('checkout.multiStep.checkItems')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {items.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">{t('checkout.multiStep.emptyCart')}</p>
                                        <Button asChild className="mt-4">
                                            <Link href="/products">{t('checkout.multiStep.addProducts')}</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item) => (
                                            <div key={item.productId} className="flex items-center gap-4 p-4 rounded-lg border">
                                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" unoptimized />
                                                    ) : (
                                                        <Package className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem({
                                                                productId: item.productId,
                                                                name: item.name,
                                                                quantity: item.quantity,
                                                                maxStock: item.maxStock || 9999,
                                                            });
                                                            setKeypadKey(prev => prev + 1);
                                                            setIsKeypadOpen(true);
                                                        }}
                                                        className="w-12 h-8 text-center font-medium bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                                    >
                                                        {item.quantity}
                                                    </button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => removeItem(item.productId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            {items.length > 0 && (
                                <CardFooter className="flex justify-between border-t pt-6">
                                    <Button variant="outline" asChild>
                                        <Link href="/products">
                                            <ShoppingBag className="h-4 w-4 mr-2" />
                                            {t('cart.continueShopping')}
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowClearConfirm(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('cart.clearCart')}
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    )}

                    {/* Step 1: Order Details */}
                    {currentStep === 1 && (
                        <>
                            {/* Partner Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        {t('checkout.multiStep.partner')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedPartner ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{selectedPartner.name}</p>
                                                <p className="text-sm text-muted-foreground">{selectedPartner.street1 || selectedPartner.city || t('checkout.multiStep.noAddress')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>{t('checkout.multiStep.noPartner')}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        {t('checkout.multiStep.paymentType')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <Label
                                                htmlFor="cash"
                                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : ''
                                                    }`}
                                            >
                                                <RadioGroupItem value="cash" id="cash" />
                                                <div>
                                                    <p className="font-medium">{t('checkout.multiStep.cashPayment')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('checkout.multiStep.cashDescription')}</p>
                                                </div>
                                            </Label>
                                            <Label
                                                htmlFor="transfer"
                                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'transfer' ? 'border-primary bg-primary/5' : ''
                                                    }`}
                                            >
                                                <RadioGroupItem value="transfer" id="transfer" />
                                                <div>
                                                    <p className="font-medium">{t('checkout.multiStep.transferPayment')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('checkout.multiStep.transferDescription')}</p>
                                                </div>
                                            </Label>
                                            <Label
                                                htmlFor="qpay"
                                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'qpay' ? 'border-primary bg-primary/5' : ''
                                                    }`}
                                            >
                                                <RadioGroupItem value="qpay" id="qpay" />
                                                <div>
                                                    <p className="font-medium">QPay</p>
                                                    <p className="text-xs text-muted-foreground">{t('checkout.multiStep.qpayDescription')}</p>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* Delivery Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="h-5 w-5" />
                                        {t('checkout.multiStep.deliveryType')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Label
                                                htmlFor="delivery"
                                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5' : ''
                                                    }`}
                                            >
                                                <RadioGroupItem value="delivery" id="delivery" />
                                                <div>
                                                    <p className="font-medium">{t('checkout.multiStep.delivery')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('checkout.multiStep.deliveryDescription')}</p>
                                                </div>
                                            </Label>
                                            <Label
                                                htmlFor="pickup"
                                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : ''
                                                    }`}
                                            >
                                                <RadioGroupItem value="pickup" id="pickup" />
                                                <div>
                                                    <p className="font-medium">{t('checkout.multiStep.pickup')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('checkout.multiStep.pickupDescription')}</p>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* Options */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('checkout.multiStep.settings')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Percent className="h-4 w-4 text-orange-500" />
                                            <Label htmlFor="discount">{t('checkout.multiStep.useDiscount')}</Label>
                                        </div>
                                        <Switch
                                            id="discount"
                                            checked={useDiscount}
                                            onCheckedChange={setUseDiscount}
                                        />
                                    </div>

                                    <Separator />

                                    <div>
                                        <Label htmlFor="notes">{t('checkout.multiStep.notes')}</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder={t('checkout.multiStep.notesPlaceholder')}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="mt-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Step 2: Confirmation */}
                    {currentStep === 2 && (
                        <>
                            {/* Order Created Info */}
                            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-5 w-5" />
                                        {t('checkout.multiStep.orderCreated')}
                                    </CardTitle>
                                    <CardDescription>
                                        UUID: <code className="bg-muted px-2 py-0.5 rounded text-xs">{orderUuid}</code>
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Finish Order Options */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5" />
                                        {t('checkout.multiStep.confirmInfo')}
                                    </CardTitle>
                                    <CardDescription>{t('checkout.multiStep.confirmDescription')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Location */}
                                    <div>
                                        <Label className="flex items-center gap-2 mb-3">
                                            <MapPin className="h-4 w-4" />
                                            {t('checkout.multiStep.location')}
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="latitude" className="text-xs text-muted-foreground">{t('checkout.multiStep.latitude')}</Label>
                                                <Input
                                                    id="latitude"
                                                    type="number"
                                                    step="any"
                                                    value={latitude}
                                                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="longitude" className="text-xs text-muted-foreground">{t('checkout.multiStep.longitude')}</Label>
                                                <Input
                                                    id="longitude"
                                                    type="number"
                                                    step="any"
                                                    value={longitude}
                                                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Loan Option */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-blue-500" />
                                                <Label htmlFor="loan">{t('checkout.multiStep.useLoan')}</Label>
                                            </div>
                                            <Switch
                                                id="loan"
                                                checked={useLoan}
                                                onCheckedChange={setUseLoan}
                                            />
                                        </div>

                                        {useLoan && (
                                            <div>
                                                <Label htmlFor="loanDescription">{t('checkout.multiStep.loanDescription')}</Label>
                                                <Textarea
                                                    id="loanDescription"
                                                    placeholder={t('checkout.multiStep.loanPlaceholder')}
                                                    value={loanDescription}
                                                    onChange={(e) => setLoanDescription(e.target.value)}
                                                    className="mt-2"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Summary Info */}
                                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('checkout.multiStep.startDate')} (start_date)</span>
                                            <span className="font-mono text-xs">{orderStartDate}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('checkout.multiStep.endDate')} (end_date)</span>
                                            <span className="font-mono text-xs">{t('checkout.multiStep.onConfirm')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">paymentcheck</span>
                                            <Badge variant="default">true</Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">useDiscount</span>
                                            <Badge variant={useDiscount ? 'default' : 'secondary'}>{useDiscount ? 'true' : 'false'}</Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">loan</span>
                                            <Badge variant={useLoan ? 'default' : 'secondary'}>{useLoan ? 'true' : 'false'}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Sidebar - Order Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>{t('checkout.multiStep.orderSummary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('checkout.multiStep.totalItems')}</span>
                                <span>{items.reduce((sum, item) => sum + item.quantity, 0)} {t('checkout.multiStep.pcs')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('checkout.multiStep.subtotal')}</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-orange-600">
                                    <span>{t('checkout.multiStep.discount')}</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>{t('checkout.multiStep.total')}</span>
                                <span className="text-primary">{formatCurrency(total)}</span>
                            </div>

                            {/* Warehouse Info */}
                            {selectedWarehouse && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-2 text-sm">
                                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground truncate">{selectedWarehouse.name}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting || (currentStep === 0 && items.length === 0)}
                            className="w-full"
                            size="lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('checkout.multiStep.loading')}
                                </>
                            ) : currentStep === 2 ? (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {t('checkout.multiStep.confirmOrder')}
                                </>
                            ) : (
                                <>
                                    {t('checkout.multiStep.continue')}
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>

                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('checkout.multiStep.back')}
                            </Button>
                        )}
                    </div>

                    {/* Validation Errors */}
                    {!validation.isValid && currentStep === 0 && (
                        <Card className="border-destructive/50">
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-2 text-destructive">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    <div className="text-sm">
                                        {validation.errors.map((error, idx) => (
                                            <p key={idx}>{error}</p>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Clear Cart Confirmation Dialog */}
            <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('cart.confirmClear')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('cart.confirmClearDescription', { count: totalItems })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cart.noGoBack')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                clearCart();
                                setShowClearConfirm(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('cart.yesClear')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Quantity Edit Keypad */}
            {editingItem && (
                <QuantityKeypad
                    isOpen={isKeypadOpen}
                    onClose={() => {
                        setIsKeypadOpen(false);
                        setEditingItem(null);
                    }}
                    onConfirm={(quantity) => {
                        if (editingItem) {
                            updateQuantity(editingItem.productId, quantity);
                            toast.success(t('cart.quantityUpdated', { name: editingItem.name, quantity }));
                        }
                        setIsKeypadOpen(false);
                        setEditingItem(null);
                    }}
                    productName={editingItem.name}
                    maxQuantity={editingItem.maxStock}
                    resetKey={keypadKey}
                />
            )}
        </div>
    );
}
