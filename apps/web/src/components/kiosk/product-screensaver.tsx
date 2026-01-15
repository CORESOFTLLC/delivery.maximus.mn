/**
 * Product Screensaver Component
 * Random 20 бараа авч slider-ээр харуулах screensaver
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { MotionPreset } from '@/components/ui/motion-preset';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductScreensaverProps {
  products: Product[];
  onInteraction?: () => void;
}

export function ProductScreensaver({ products, onInteraction }: ProductScreensaverProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { t } = useTranslation();

  // Random 40 бараа сонгох
  const randomProducts = useMemo(() => {
    if (products.length <= 40) return products;
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 40);
  }, [products]);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const getSlideScale = (index: number) => {
    const distance = Math.abs(index - current);
    const totalItems = randomProducts.length;

    if (distance === 0) return 'md:basis-1/2 xl:basis-1/3';
    if (distance === 1 || distance === totalItems - 1) return 'md:basis-1/3 xl:basis-1/4';
    return 'md:basis-1/4 xl:basis-1/5';
  };

  const handleClick = () => {
    onInteraction?.();
  };

  if (randomProducts.length === 0) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100"
        onClick={handleClick}
      >
        <div className="text-center">
          <div className="mb-6">
            <Image
              src="/logos/maximus-logo.svg"
              alt="MAXIMUS"
              width={200}
              height={60}
              className="mx-auto"
            />
          </div>
          <p className="text-gray-500 text-lg">{t('screensaver.touchToStart')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 cursor-pointer"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex-shrink-0 py-8 px-4 text-center">
        <MotionPreset
          fade
          slide={{ direction: 'down', offset: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-4">
            <Image
              src="/logos/maximus-logo.svg"
              alt="MAXIMUS"
              width={160}
              height={48}
              className="mx-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="16" rx="2" />
              <rect x="8" y="6" width="8" height="8" rx="1" />
              <line x1="8" y1="18" x2="8" y2="22" />
              <line x1="16" y1="18" x2="16" y2="22" />
              <line x1="6" y1="22" x2="18" y2="22" />
            </svg>
            MAXIMUS KIOSK
          </h1>
          <p className="text-gray-500 text-lg">
            {t('screensaver.touchToOrder')}
          </p>
        </MotionPreset>
      </div>

      {/* Product Carousel */}
      <div className="flex-1 flex items-center overflow-hidden">
        <Carousel
          setApi={setApi}
          opts={{
            align: 'center',
            loop: true,
            slidesToScroll: 1,
            duration: 40,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: false,
              stopOnFocusIn: false,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="ml-0 transition-transform duration-700 ease-out">
            {randomProducts.map((product, index) => {
              const isActive = current === index;

              return (
                <CarouselItem
                  key={product.id}
                  className={cn(
                    'flex basis-full cursor-grab items-center justify-center max-md:px-4 md:pl-6 lg:max-xl:px-3 xl:pl-6 transition-all duration-500',
                    getSlideScale(index)
                  )}
                >
                  <div className="relative w-full max-w-md">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-2xl flex items-center justify-center p-4">
                      {(product.main_image_url || product.images?.[0]) ? (
                        <Image
                          src={product.main_image_url || product.images[0]}
                          alt={product.name}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Overlay for non-active slides */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-white/50 transition-opacity duration-300" />
                      )}
                    </div>

                    {/* Product Details - Only visible for active slide */}
                    {isActive && (
                      <MotionPreset
                        fade
                        slide={{ direction: 'up', offset: 30 }}
                        delay={0.2}
                        transition={{ duration: 0.5 }}
                        className="mt-6 text-center"
                      >
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 line-clamp-2 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-2xl md:text-3xl font-bold text-primary">
                          {product.formatted_price}
                        </p>
                        {product.brand && (
                          <p className="text-gray-500 text-sm mt-1">
                            {product.brand}
                          </p>
                        )}
                      </MotionPreset>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 py-6 text-center">
        <MotionPreset
          fade
          slide={{ direction: 'up', offset: 20 }}
          delay={1.2}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 text-gray-400">
            <span className="animate-pulse">●</span>
            <span>{t('screensaver.touchToStart')}</span>
            <span className="animate-pulse">●</span>
          </div>
        </MotionPreset>
      </div>
    </div>
  );
}
