import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropertyCard from '../property/PropertyCard'
import { propertyService } from '../../services'
import { formatPrice, getBadgeColor, getBadgeLabel } from '../../utils'

const TYPE_BG = {
  sale: 'linear-gradient(135deg,#1a0a2e,#3b1f7c)',
  rent: 'linear-gradient(135deg,#001833,#003875)',
  pg: 'linear-gradient(135deg,#001a12,#003d28)',
  lease: 'linear-gradient(135deg,#3a1a00,#7c3f00)',
}

const TYPE_AVATAR = {
  sale: '#7c3aed',
  rent: '#0891b2',
  pg: '#059669',
  lease: '#ea580c',
}

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PP'
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

const mapPropertyToCard = (property, index) => {
  const typeRaw = String(property.listingType || property.purpose || 'sale').toLowerCase()
  const listingType = ['sale', 'rent', 'pg', 'lease'].includes(typeRaw) ? typeRaw : 'sale'
  const images = Array.isArray(property.images) ? property.images : []

  const city = property.city || property.location?.city || ''
  const locality = property.locality || property.location?.address || ''
  const locationText = [locality, city].filter(Boolean).join(', ') || 'Location not specified'

  const bhk = property.bhk || property.bedrooms
  const baths = property.baths || property.bathrooms
  const area = property.area
  const typeText = property.propertyType || property.type
  const amenities = Array.isArray(property.amenities) ? property.amenities : []

  const chips = []
  if (bhk) chips.push(`🛏 ${bhk} BHK`)
  if (baths) chips.push(`🚿 ${baths} Bath`)
  if (area) chips.push(`📐 ${area} sqft`)
  if (!chips.length && typeText) chips.push(`🏠 ${typeText}`)
  if (listingType === 'pg') {
    if (amenities.includes('Meals')) chips.push('🍽 Meals')
    if (amenities.includes('Wi-Fi') || amenities.includes('WiFi')) chips.push('📶 Wi-Fi')
  }
  const finalChips = chips.slice(0, 3)

  const createdAt = property.createdAt ? new Date(property.createdAt).getTime() : 0
  const isNew = createdAt ? Date.now() - createdAt < 14 * 24 * 60 * 60 * 1000 : false

  return {
    id: property._id || property.id || `property-${index}`,
    image: images[0] || '',
    badge: getBadgeLabel(listingType),
    bc: getBadgeColor(listingType),
    price: formatPrice(Number(property.price) || 0),
    sub: listingType === 'rent' || listingType === 'pg' ? '/month' : 'onwards',
    title: property.title || 'Property Listing',
    loc: locationText,
    chips: finalChips,
    grad: TYPE_BG[listingType] || TYPE_BG.sale,
    init: getInitials(property.owner?.name || property.contactName || property.title),
    initC: TYPE_AVATAR[listingType] || TYPE_AVATAR.sale,
    verified: Boolean(property.isVerified),
    isNew,
    cls: `cb-${listingType}`,
  }
}

export default function FeaturedProperties() {
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadFeatured = async () => {
      try {
        setLoading(true)
        const response = await propertyService.getAll({ page: 1, limit: 4, sort: 'newest' })
        const list = Array.isArray(response?.data) ? response.data : []
        if (isMounted) {
          setCards(list.map((property, index) => mapPropertyToCard(property, index)))
        }
      } catch {
        if (isMounted) {
          setCards([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFeatured()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="sec alt py-16 px-4 sm:px-6 bg-[#f9f9ff]">
      <div className="wrap max-w-7xl mx-auto">
        <div className="sec-head flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8 r" data-reveal>
          <div>
            <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
              Featured <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Properties</span>
            </h2>
            <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">Verified listings from trusted owners and agents</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="see-all text-sm font-semibold text-[#a78bfa] hover:text-[#7c3aed] hover:underline"
          >
            View All →
          </button>
        </div>

        <div
          className="cards-row flex flex-nowrap gap-5 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
          id="cards-grid"
          aria-label="Featured properties list"
        >
          {loading && (
            <div className="text-sm text-[rgba(26,10,46,0.5)]">Loading featured properties...</div>
          )}
          {!loading && cards.length > 0 && cards.map((card, i) => (
            <div key={card.id} className="min-w-65 sm:min-w-75 max-w-[320px] shrink-0 snap-start">
              <PropertyCard card={card} index={i} />
            </div>
          ))}
          {!loading && cards.length === 0 && (
            <div className="text-sm text-[rgba(26,10,46,0.5)]">No featured properties available right now.</div>
          )}
        </div>
      </div>
    </section>
  )
}
