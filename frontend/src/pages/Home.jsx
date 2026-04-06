import { lazy, Suspense } from 'react'

// Lazy load each section
const Navbar = lazy(() => import('../Components/layout/Navbar'))
const Hero = lazy(() => import('../Components/Home/Hero'))
const Marquee = lazy(() => import('../Components/Home/Marquee'))
const Categories = lazy(() => import('../Components/Home/Categories'))
const FeaturedProperties = lazy(() => import('../Components/Home/FeaturedProperties'))
const HowItWorks = lazy(() => import('../Components/Home/work'))
const CTABanner = lazy(() => import('../Components/Home/CTABanner'))
const Cities = lazy(() => import('../Components/Home/Cities'))
const Testimonials = lazy(() => import('../Components/Home/Testimonials'))
const Footer = lazy(() => import('../Components/layout/Footer'))

// Simple loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-12 h-12 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Navbar />
      <Hero />
      <Marquee />
      <Categories />
      <FeaturedProperties />
      <HowItWorks />
      <CTABanner />
      <Cities />
      <Testimonials />
      <Footer />
    </Suspense>
  )
}