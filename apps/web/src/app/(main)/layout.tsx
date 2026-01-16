'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users,
  ShoppingCart,
  Building2,
  X,
  AlertTriangle,
  Warehouse,
  ChevronDown,
  Check,
  FileText,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';
import { salesWrapper } from '@/components/sales/sales-wrapper';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { useCartStore } from '@/stores/cart-store';
import { usePartnerStore } from '@/stores/partner-store';
import { useWarehouseStore, getWarehouseDisplayName } from '@/stores/warehouse-store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Hook for hydration-safe client-side rendering
function useHydrated() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

// sales Top Navigation Bar
function TopNavBar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { totalItems, itemCount, selectedPartner, hasPartner, clearSelectedPartner, setSelectedPartner } = useCartStore();
  const { partners, fetchPartners, isLoading: partnersLoading } = usePartnerStore();
  const { warehouses, selectedWarehouse, selectWarehouseById } = useWarehouseStore();
  const isHydrated = useHydrated();
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [pendingWarehouseId, setPendingWarehouseId] = useState<string | null>(null);
  const [showPartnerClearDialog, setShowPartnerClearDialog] = useState(false);

  // Auto-select first partner if no partner selected (sales mode)
  useEffect(() => {
    // Fetch partners on mount if not loaded
    if (partners.length === 0 && !partnersLoading) {
      fetchPartners();
    }
  }, [partners.length, partnersLoading, fetchPartners]);

  useEffect(() => {
    // Auto-select first partner when partners are loaded and no partner selected
    if (partners.length > 0 && !hasPartner && !selectedPartner) {
      const firstPartner = partners[0];
      setSelectedPartner(firstPartner);
    }
  }, [partners, hasPartner, selectedPartner, setSelectedPartner]);

  // sales navigation - with translations
  const salesNavigation = [
    { name: t('nav.products'), href: '/products', icon: Package },
    { name: t('nav.partners'), href: '/partners', icon: Users },
    { name: t('nav.orders'), href: '/orders', icon: FileText },
  ];

  const handleWarehouseSelect = (warehouseId: string) => {
    if (selectedWarehouse?.uuid === warehouseId) return;
    if (totalItems > 0) {
      setPendingWarehouseId(warehouseId);
      setShowClearCartDialog(true);
    } else {
      selectWarehouseById(warehouseId);
    }
  };

  const handleConfirmWarehouseChange = () => {
    if (pendingWarehouseId) {
      useCartStore.getState().clearCart();
      selectWarehouseById(pendingWarehouseId);
    }
    setShowClearCartDialog(false);
    setPendingWarehouseId(null);
  };

  const handleClearPartner = () => {
    if (totalItems > 0) {
      setShowPartnerClearDialog(true);
    } else {
      clearSelectedPartner();
    }
  };

  const handleConfirmClearPartner = () => {
    clearSelectedPartner();
    setShowPartnerClearDialog(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/products" className="flex items-center shrink-0">
            <Image
              src="/logos/maximus-logo.svg"
              alt="Maximus"
              width={160}
              height={48}
              priority
              style={{ width: 'auto', height: '48px' }}
            />
          </Link>

          {/* Center Navigation */}
          <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {salesNavigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Selected Partner */}
            {isHydrated && hasPartner && selectedPartner && (
              <div className="hidden md:flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium max-w-[150px] truncate">{selectedPartner.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-gray-400 hover:text-destructive"
                  onClick={handleClearPartner}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Warehouse Selector */}
            {isHydrated && warehouses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 h-9">
                    <Warehouse className="h-4 w-4 text-orange-500" />
                    <span className="hidden sm:inline text-sm max-w-[100px] truncate">
                      {selectedWarehouse ? getWarehouseDisplayName(selectedWarehouse) : t('warehouse.title')}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel className="text-xs">{t('warehouse.select')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {warehouses.map((wh) => (
                    <DropdownMenuItem
                      key={wh.uuid}
                      onClick={() => handleWarehouseSelect(wh.uuid)}
                      className="cursor-pointer"
                    >
                      <span className="flex-1 truncate">{getWarehouseDisplayName(wh)}</span>
                      {selectedWarehouse?.uuid === wh.uuid && (
                        <Check className="h-4 w-4 text-primary ml-2" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Cart Button */}
            <Link href="/cart">
              <Button 
                variant={itemCount > 0 ? "default" : "outline"} 
                className={cn(
                  "gap-2 h-9",
                  itemCount > 0 && "bg-primary hover:bg-primary/90"
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.cart')}</span>
                {isHydrated && itemCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-2 py-0.5 text-lg font-bold bg-white/20">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* User Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-9 px-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  {isHydrated && user && (
                    <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">
                      {user.name}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {isHydrated && user && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.username || user.corporate_id}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Профайл</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Тохиргоо</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Гарах</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Warehouse Change Confirmation Dialog */}
      <AlertDialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('warehouse.changeWarehouse')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('warehouse.changeWarehouseDescription', { count: totalItems })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.no')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWarehouseChange} className="bg-destructive hover:bg-destructive/90">
              {t('warehouse.confirmChange')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partner Clear Confirmation Dialog */}
      <AlertDialog open={showPartnerClearDialog} onOpenChange={setShowPartnerClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('partnerSelection.clearPartner')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('partnerSelection.clearPartnerDescription', { name: selectedPartner?.name || '', count: totalItems })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.no')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClearPartner} className="bg-destructive hover:bg-destructive/90">
              {t('partnerSelection.confirmClear')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <salesWrapper idleTimeout={120000}>
        <div className="min-h-screen bg-gray-50/50">
          {/* Top Navigation Bar */}
          <TopNavBar />

          {/* Main Content */}
          <main className="pt-16 min-h-screen">
            {children}
          </main>

          {/* Footer with Version */}
          <footer className="fixed bottom-0 left-0 right-0 py-1 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100">
            <div className="text-center text-xs text-gray-400">
              MAXIMUS sales v1.0.1
            </div>
          </footer>
        </div>
      </salesWrapper>
    </AuthGuard>
  );
}
