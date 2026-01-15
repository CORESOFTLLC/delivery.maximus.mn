import Portfolio, { type PortfolioItem } from '@/components/shadcn-studio/blocks/portfolio-12/portfolio-12'

const portfolioItems: PortfolioItem[] = [
  {
    id: '1',
    title: 'Finlytics Dashboard',
    description:
      'An AI-powered finance dashboard built to help users visualize complex financial data with clarity and ease of interaction.',
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/portfolio/image-61.png'
  },
  {
    id: '2',
    title: 'EcoTech Mobile App',
    description:
      'A sustainable technology platform that connects users with eco-friendly products and services through.',
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/portfolio/image-62.png'
  },
  {
    id: '3',
    title: 'CreativeFlow Studio',
    description: 'A comprehensive creative workspace that streamlines design workflows and collaboration for teams.',
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/portfolio/image-63.png'
  },
  {
    id: '4',
    title: 'DataViz Analytics',
    description:
      'An enterprise-grade analytics platform that transforms complex datasets into actionable insights through.',
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/portfolio/image-64.png'
  },
  {
    id: '5',
    title: 'HealthTrack Pro',
    description:
      'A comprehensive health monitoring application that helps users track their wellness journey with personalized.',
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/portfolio/image-65.png'
  },
  {
    id: '6',
    title: 'TravelMate Explorer',
    description:
      'An all-in-one travel planning app that offers personalized itineraries, real-time updates, and seamless.',
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/portfolio/image-63.png'
  },
  {
    id: '7',
    title: 'ShopEase E-commerce',
    description:
      'A user-friendly e-commerce platform designed to provide a seamless shopping experience with advanced search.',
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/portfolio/image-64.png'
  }
]

const PortfolioPage = () => {
  return <Portfolio portfolioItems={portfolioItems} />
}

export default PortfolioPage
