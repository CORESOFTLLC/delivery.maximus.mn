/**
 * sales Wrapper
 * Screensaver + Main content нэгтгэх
 * 120 сек хөдөлгөөнгүй бол screensaver
 * Хөдөлгөөн илэрвэл /products руу очно
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIdleTimer } from '@/hooks/use-idle-timer';
import { ProductScreensaver } from '@/components/sales/product-screensaver';
import { useProductStore } from '@/stores/product-store';
import { getToken, getDefaultWarehouse } from '@/lib/auth';

interface salesWrapperProps {
  children: React.ReactNode;
  idleTimeout?: number; // milliseconds, default 120 seconds
}

export function salesWrapper({ children, idleTimeout = 120000 }: salesWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { products, fetchProducts } = useProductStore();

  // Screensaver-д хэрэглэх бараануудыг татах
  useEffect(() => {
    const init = async () => {
      const token = getToken();
      const warehouse = getDefaultWarehouse();

      if (token && warehouse && products.length === 0) {
        await fetchProducts(1);
      }
      setIsReady(true);
    };

    init();
  }, [fetchProducts, products.length]);

  const handleIdle = useCallback(() => {
    setShowScreensaver(true);
  }, []);

  const handleActive = useCallback(() => {
    setShowScreensaver(false);
    // Хөдөлгөөн илэрвэл /products руу очно
    if (pathname !== '/products') {
      router.push('/products');
    }
  }, [pathname, router]);

  useIdleTimer({
    timeout: idleTimeout,
    onIdle: handleIdle,
    onActive: handleActive,
  });

  const handleScreensaverInteraction = useCallback(() => {
    setShowScreensaver(false);
    // Screensaver дээр хүрэхэд /products руу очно
    if (pathname !== '/products') {
      router.push('/products');
    }
  }, [pathname, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mt-1" />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
          
          {/* Search Skeleton */}
          <div className="flex gap-2 mb-4 sm:mb-6">
            <div className="h-10 sm:h-11 w-80 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-10 sm:h-11 w-28 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          
          {/* Categories Skeleton */}
          <div className="mb-6">
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="p-2 sm:p-3 pb-1 sm:pb-2">
                  <div className="aspect-square bg-gray-100 rounded-lg sm:rounded-xl animate-pulse" />
                </div>
                <div className="px-2 sm:px-3 pb-2 sm:pb-3 pt-1 space-y-2">
                  <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-8 sm:h-9 w-full bg-gray-100 rounded-lg sm:rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showScreensaver && (
        <ProductScreensaver
          products={products}
          onInteraction={handleScreensaverInteraction}
        />
      )}
      <div className={showScreensaver ? 'hidden' : ''}>{children}</div>
    </>
  );
}
