import { Button } from '@/components/ui/button'
import { MotionPreset } from '@/components/ui/motion-preset'

import PortfolioContent from '@/components/shadcn-studio/blocks/portfolio-12/portfolio-content'

export type PortfolioItem = {
  id: string
  title: string
  description: string
  image: string
}

type PortfolioComponentProps = {
  portfolioItems: PortfolioItem[]
}

const Portfolio = ({ portfolioItems }: PortfolioComponentProps) => {
  return (
    <section className='space-y-12 py-8 sm:space-y-16 sm:py-16 lg:space-y-24 lg:py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header Content */}
        <MotionPreset
          fade
          slide={{ direction: 'up', offset: 50 }}
          transition={{ duration: 0.8 }}
          className='space-y-4 text-center'
        >
          <MotionPreset fade slide={{ direction: 'up', offset: 30 }} delay={0.2} transition={{ duration: 0.6 }}>
            <p className='text-primary text-sm font-medium tracking-wider uppercase'>Our portfolio</p>
          </MotionPreset>

          <MotionPreset fade slide={{ direction: 'up', offset: 40 }} delay={0.4} transition={{ duration: 0.8 }}>
            <h2 className='relative z-1 inline-block text-2xl font-semibold sm:text-3xl lg:text-4xl'>
              Transforming{' '}
              <span className='relative'>
                Ideas
                <span
                  className='from-primary absolute bottom-0 left-0 -z-1 h-0.5 w-full rounded-full bg-gradient-to-r to-transparent'
                  aria-hidden='true'
                />
              </span>{' '}
              into Impact
            </h2>
          </MotionPreset>

          <MotionPreset fade slide={{ direction: 'up', offset: 30 }} delay={0.6} transition={{ duration: 0.7 }}>
            <p className='text-muted-foreground text-xl leading-relaxed'>
              Step into our portfolio and discover how we bring concepts to life. From sleek interfaces to scalable
              systems, each piece reflects our dedication to excellence in every detail.
            </p>
          </MotionPreset>

          <MotionPreset fade slide={{ direction: 'up', offset: 20 }} delay={0.8} transition={{ duration: 0.6 }}>
            <Button className='rounded-lg text-base' size='lg' asChild>
              <a href='#'>View all</a>
            </Button>
          </MotionPreset>
        </MotionPreset>
      </div>
      {/* Portfolio Content */}
      <MotionPreset fade slide={{ direction: 'up', offset: 20 }} delay={1.0} transition={{ duration: 0.6 }}>
        <PortfolioContent portfolioItems={portfolioItems} />
      </MotionPreset>
    </section>
  )
}

export default Portfolio
