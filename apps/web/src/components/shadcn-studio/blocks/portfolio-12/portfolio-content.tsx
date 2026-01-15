'use client'

import { useEffect, useState } from 'react'

import Autoplay from 'embla-carousel-autoplay'

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'

import { MotionPreset } from '@/components/ui/motion-preset'

import { cn } from '@/lib/utils'

import type { PortfolioItem } from './portfolio-12'

type PortfolioContentProps = {
  portfolioItems: PortfolioItem[]
}

const PortfolioContent = ({ portfolioItems }: PortfolioContentProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const getSlideScale = (index: number) => {
    const distance = Math.abs(index - current)

    if (distance === 0) return 'md:basis-1/2 xl:basis-1/3' // Active slide
    if (distance === 1 || distance === portfolioItems.length - 1) return 'md:basis-1/3 xl:basis-1/4' // Adjacent slides

    return 'md:basis-1/4 xl:basis-1/5' // Further slides
  }

  return (
    <div>
      <Carousel
        setApi={setApi}
        opts={{
          align: 'center',
          loop: true,
          slidesToScroll: 1
        }}
        plugins={[
          Autoplay({
            delay: 2000,
            stopOnInteraction: false,
            stopOnFocusIn: false
          })
        ]}
      >
        {/* Carousel Content */}
        <CarouselContent className='ml-0 ease-in-out md:transition-transform md:duration-500'>
          {portfolioItems.map((item, index) => {
            const isActive = current === index

            return (
              <CarouselItem
                key={item.id}
                className={cn(
                  'flex basis-full cursor-grab items-center justify-center max-md:px-4 md:pl-6 lg:max-xl:px-3 xl:pl-6',
                  getSlideScale(index)
                )}
              >
                <div className='relative pb-34 lg:pb-30'>
                  {/* Portfolio Image */}
                  <div className='relative overflow-hidden rounded-md'>
                    <img src={item.image} alt={item.title} className='w-full rounded-md object-cover' />
                    {/* Hover overlay for non-active slides */}
                    {!isActive && (
                      <div className='absolute inset-0 bg-black/20 transition-opacity duration-300 hover:bg-black/10' />
                    )}
                  </div>
                  {/* Project Details - Only visible for active slide */}
                  {isActive && (
                    <MotionPreset
                      fade
                      slide={{ direction: 'up', offset: 30 }}
                      delay={0.3}
                      transition={{ duration: 0.6 }}
                      className='absolute bottom-0 left-0 w-full space-y-1.5 text-center'
                    >
                      <MotionPreset
                        component='h3'
                        fade
                        slide={{ direction: 'up', offset: 20 }}
                        delay={0.2}
                        transition={{ duration: 0.3 }}
                        className='text-2xl font-semibold lg:text-3xl'
                      >
                        {item.title}
                      </MotionPreset>
                      <MotionPreset
                        component='p'
                        fade
                        slide={{ direction: 'up', offset: 20 }}
                        delay={0.3}
                        transition={{ duration: 0.3 }}
                        className='text-muted-foreground mx-auto leading-relaxed'
                      >
                        {item.description}
                      </MotionPreset>
                    </MotionPreset>
                  )}
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Navigation Dots */}
      <div className='mt-8 flex justify-center space-x-2'>
        {portfolioItems.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'size-3.25 rounded-full transition-all duration-300',
              index === current ? 'bg-primary scale-125' : 'bg-muted hover:bg-muted-foreground/60'
            )}
            aria-label={`Go to project ${index + 1}`}
          />
        ))}
      </div>

      {/* Optional: Project Counter */}
      <div className='mt-6 text-center'>
        <span className='text-muted-foreground text-sm font-medium'>
          {current + 1} of {portfolioItems.length}
        </span>
      </div>
    </div>
  )
}

export default PortfolioContent
