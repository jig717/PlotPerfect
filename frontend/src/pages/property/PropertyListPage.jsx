import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { propertyService, userService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useDebounce } from '../../hooks'
import { formatPrice, getBadgeColor } from '../../utils/index'
import { toast } from 'react-toastify'
import { CardSkeleton } from '../../Components/skeletons/CardSkeleton'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

/* ── Constants ── */
const CITIES = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata']
const TYPES = ['Apartment', 'House', 'Villa', 'Plot', 'PG', 'Commercial', 'Office']
const BHK = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK']
const BUDGETS = [{ label: 'Any', value: '' }, { label: 'Under ₹30L', value: '0-3000000' }, { label: '₹30L–₹60L', value: '3000000-6000000' }, { label: '₹60L–₹1Cr', value: '6000000-10000000' }, { label: '₹1Cr–₹2Cr', value: '10000000-20000000' }, { label: 'Above ₹2Cr', value: '20000000+' }]
const SORT_OPTS = [{ label: 'Newest First', value: 'newest' }, { label: 'Price ↑', value: 'price_asc' }, { label: 'Price ↓', value: 'price_desc' }, { label: 'Most Popular', value: 'popular' }]
const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME

const GRADIENTS = [
  'linear-gradient(135deg,#f0eeff,#e8e4ff)',
  'linear-gradient(135deg,#e0e7ff,#c7d2fe)',
  'linear-gradient(135deg,#fce7f3,#fbcfe8)',
  'linear-gradient(135deg,#fef3c7,#fde68a)',
  'linear-gradient(135deg,#dcfce7,#bbf7d0)',
  'linear-gradient(135deg,#fef9c3,#fef08a)',
]

const getImageUrl = (publicId, width, height) => {
  if (!publicId) return null
  if (publicId.startsWith('http')) return publicId
  if (!CLOUD_NAME) return `https://picsum.photos/id/104/${width}/${height}`
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`
}

/* ── Property Card (light theme) ── */
function PropCard({ prop, index, isFavorite, onToggleFavorite }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(false)
  const grad = prop.gradient || GRADIENTS[index % GRADIENTS.length]
  const badge = prop.listingType || 'sale'
  const normalizedStatus = String(prop.status || '').toUpperCase()
  const isBooked = normalizedStatus === 'BOOKED'
  const badgeLabel = isBooked
    ? 'Booked'
    : (prop.listingLabel || { sale: 'For Sale', rent: 'For Rent', pg: 'PG', lease: 'Lease' }[badge] || 'For Sale')
  const badgeColor = isBooked ? '#0f766e' : getBadgeColor(badge)

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(prop._id || prop.id);
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => {
        const targetId = prop._id || prop.id;
        if (targetId && targetId !== "undefined") {
          navigate(`/property/${targetId}`);
        } else {
          toast.warn("Property details unavailable.");
        }
      }}
      style={{
        background: '#ffffff', borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${hov ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.1)'}`,
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? '0 12px 28px rgba(124,58,237,0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ height: 180, background: grad, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {prop.images?.[0] ? (
          <img
            src={getImageUrl(prop.images[0], 400, 240)}
            alt={prop.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hov ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.4s'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg,#f8f8ff,#f0f0ff)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(26,10,46,0.2)',
              gap: 8
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>No Image</span>
          </div>
        )}
        <span style={{ position: 'absolute', top: 10, left: 10, background: badgeColor, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5, zIndex: 2 }}>{badgeLabel}</span>
        {prop.isVerified && <span style={{ position: 'absolute', top: 10, right: 44, background: 'rgba(34,197,94,0.15)', backdropFilter: 'blur(4px)', border: '0.5px solid #22c55e', color: '#16a34a', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, zIndex: 2 }}>✓ Verified</span>}
        <button
          onClick={handleFavoriteClick}
          style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 2 }}>
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed', fontFamily: "'Playfair Display',serif", marginBottom: 2 }}>
          {formatPrice(prop.price)} {prop.listingType === 'rent' && <sub style={{ fontSize: 12, color: 'rgba(26,10,46,0.5)', fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>/mo</sub>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a0a2e', marginBottom: 4, lineHeight: 1.3, minHeight: 1.3 * 14 }}>{prop.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(26,10,46,0.5)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(26,10,46,0.5)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.city}{prop.locality ? `, ${prop.locality}` : ''}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
          {prop.bhk && <span style={chipLight}>{prop.bhk} BHK</span>}
          {prop.baths && <span style={chipLight}>🚿 {prop.baths} Bath</span>}
          {prop.area && <span style={chipLight}>📐 {prop.area} sqft</span>}
        </div>
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(124,58,237,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: hov ? '#fcfaff' : 'none', transition: 'background 0.2s' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(124,58,237,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {prop.propertyType}
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            const targetId = prop._id || prop.id;
            if (targetId && targetId !== "undefined") {
              navigate(`/property/${targetId}`);
            } else {
              toast.warn("Property details unavailable.");
            }
          }}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', color: '#fff', background: '#7c3aed', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: hov ? '0 4px 12px rgba(124,58,237,0.3)' : 'none' }}>
          View Details
        </button>
      </div>
    </div >
  )
}

const chipLight = { background: '#f5f3ff', border: '1px solid rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }

/* ── Custom Select (Premium) ── */
function CustomSelect({ value, onChange, options, label = 'Select' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => (o.value ?? o) === value)?.label ?? (value || 'Any');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{
          width: '100%',
          height: 44,
          background: '#ffffff',
          border: `1px solid ${isOpen ? '#7c3aed' : 'rgba(124,58,237,0.15)'}`,
          borderRadius: 12,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(124,58,237,0.08)' : 'none',
        }}
      >
        <span style={{ fontSize: 13.5, color: value ? '#1a0a2e' : 'rgba(26,10,46,0.4)', fontWeight: 500 }}>
          {selectedLabel}
        </span>
        <svg
          style={{ transform: `rotate(${isOpen ? 180 : 0}deg)`, transition: 'transform 0.2s', color: 'rgba(26,10,46,0.3)' }}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 6,
          background: '#ffffff',
          border: '1px solid rgba(124,58,237,0.1)',
          borderRadius: 12,
          boxShadow: '0 12px 32px rgba(26,10,46,0.12)',
          zIndex: 100,
          maxHeight: 240,
          overflowY: 'auto',
          padding: 6
        }}>
          {options.map(o => {
            const v = o.value ?? o;
            const l = o.label ?? (o || 'Any');
            const active = v === value;
            return (
              <div
                key={v}
                onMouseDown={() => { onChange(v); setIsOpen(false); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#7c3aed' : 'rgba(26,10,46,0.7)',
                  background: active ? 'rgba(124,58,237,0.06)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={e => e.currentTarget.style.background = active ? 'rgba(124,58,237,0.08)' : '#f8f7ff'}
                onMouseLeave={e => e.currentTarget.style.background = active ? 'rgba(124,58,237,0.06)' : 'transparent'}
              >
                {l}
                {active && <span style={{ color: '#7c3aed' }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Filter Sidebar (light theme) ── */
function FilterSidebar({ filters, onChange, onReset, priceRange, setPriceRange, selectedAmenities, setSelectedAmenities, amenitiesList, dynamicOptions }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(124,58,237,0.1)', borderRadius: 16, padding: 20, position: 'sticky', top: 80, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>Filters</span>
        <button onClick={onReset} style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset All</button>
      </div>

      <FilterGroupLight title="Listing Type">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ v: 'sale', l: 'For Sale' }, { v: 'rent', l: 'For Rent' }, { v: 'pg', l: 'PG' }, { v: 'lease', l: 'Lease' }].map(t => (
            <button key={t.v} onClick={() => onChange('listingType', filters.listingType === t.v ? '' : t.v)}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${filters.listingType === t.v ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`, background: filters.listingType === t.v ? 'rgba(124,58,237,0.08)' : 'none', color: filters.listingType === t.v ? '#7c3aed' : 'rgba(26,10,46,0.6)', cursor: 'pointer', transition: 'all 0.18s' }}>
              {t.l}
            </button>
          ))}
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="City">
        <CustomSelect value={filters.city} onChange={v => onChange('city', v)} options={['Any', ...dynamicOptions.cities]} />
      </FilterGroupLight>

      <FilterGroupLight title="Property Type">
        <CustomSelect value={filters.propertyType} onChange={v => onChange('propertyType', v)} options={['Any', ...dynamicOptions.types]} />
      </FilterGroupLight>

      <FilterGroupLight title="BHK">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BHK.map(b => (
            <button key={b} onClick={() => onChange('bhk', filters.bhk === b.replace(' BHK', '') ? '' : b.replace(' BHK', ''))}
              style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, border: `1px solid ${filters.bhk === b.replace(' BHK', '') ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`, background: filters.bhk === b.replace(' BHK', '') ? 'rgba(124,58,237,0.08)' : 'none', color: filters.bhk === b.replace(' BHK', '') ? '#7c3aed' : 'rgba(26,10,46,0.6)', cursor: 'pointer' }}>
              {b}
            </button>
          ))}
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="Budget">
        <CustomSelect value={filters.budget} onChange={v => onChange('budget', v)} options={BUDGETS} />
      </FilterGroupLight>

      <FilterGroupLight title="Price Range (₹)">
        <div style={{ padding: '0 8px' }}>
          <Slider
            range
            min={0}
            max={20000000}
            step={100000}
            value={priceRange}
            onChange={setPriceRange}
            trackStyle={{ backgroundColor: '#7c3aed' }}
            handleStyle={{ borderColor: '#7c3aed', backgroundColor: '#7c3aed' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontWeight: 600, color: 'rgba(26,10,46,0.5)' }}>
            <span>₹{(priceRange[0] / 100000).toFixed(1)}L</span>
            <span>₹{(priceRange[1] / 100000).toFixed(1)}L</span>
          </div>
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="Amenities">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {amenitiesList.map(amenity => (
            <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAmenities([...selectedAmenities, amenity]);
                  } else {
                    setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                  }
                }}
                style={{ width: 15, height: 15, accentColor: '#7c3aed' }}
              />
              <span style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.7)', fontWeight: 500 }}>{amenity}</span>
            </label>
          ))}
        </div>
      </FilterGroupLight>
    </div>
  )
}

function FilterGroupLight({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(26,10,46,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

/* ── Main Page (light theme) ── */
export default function PropertyListPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  const [priceRange, setPriceRange] = useState([0, 20000000])
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const amenitiesList = ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Lift', 'Power Backup']

  const [dynamicOptions, setDynamicOptions] = useState({ cities: [], types: [] });

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    listingType: searchParams.get('type') || '',
    bhk: searchParams.get('bhk') || '',
    budget: searchParams.get('budget') || '',
  })

  const debouncedSearch = useDebounce(search, 500)
  const PER_PAGE = 12

  // Fetch cities/types from backend filters API
  useEffect(() => {
    const loadFilterMetadata = async () => {
      try {
        const res = await propertyService.getFilters();
        if (res.data) {
          setDynamicOptions({
            cities: res.data.cities || [],
            types: res.data.types || []
          });
        }
      } catch (err) {
        console.warn('Failed to load filter metadata', err);
      }
    };
    loadFilterMetadata();
  }, []);

  // Fetch initial favorites for current user
  useEffect(() => {
    if (!user?._id) {
      setFavorites([]);
      return;
    }
    const loadFavorites = async () => {
      try {
        const res = await userService.getSaved(user._id);
        const list = Array.isArray(res.data) ? res.data : [];
        const favIds = list.map(f => f.property?._id || f.property);
        setFavorites(favIds);
      } catch (err) {
        console.warn('Failed to load favorites', err);
      }
    };
    loadFavorites();
  }, [user?._id]);

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        ...filters,
        search: debouncedSearch,
        sort,
        page,
        limit: PER_PAGE,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        amenities: selectedAmenities.join(',')
      }
      
      // Map 'Any' back to empty
      if (params.city === 'Any') params.city = '';
      if (params.propertyType === 'Any') params.propertyType = '';

      Object.keys(params).forEach(key => (params[key] === '' || params[key] == null) && delete params[key]);
      const data = await propertyService.getAll(params)
      setProperties(data.data || [])
      setTotal(data.total || (data.data || []).length)
    } catch {
      toast.error('Failed to load properties')
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [filters, debouncedSearch, sort, page, priceRange, selectedAmenities])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  const toggleFavorite = async (propertyId) => {
    if (!user) {
      toast.info('Please log in to save properties');
      navigate('/login');
      return;
    }
    const isFav = favorites.includes(propertyId);
    setFavorites(prev => isFav ? prev.filter(id => id !== propertyId) : [...prev, propertyId]);
    try {
      if (isFav) {
        const res = await userService.getSaved(user._id);
        const record = res.data?.find(f => (f.property?._id || f.property) === propertyId);
        if (record) {
          await userService.unsave(record._id);
          toast.success('Removed from saved');
        }
      } else {
        await userService.saveProperty(user._id, propertyId);
        toast.success('Saved to your list!');
      }
    } catch (err) {
      setFavorites(prev => isFav ? [...prev, propertyId] : prev.filter(id => id !== propertyId));
      toast.error('Failed to update favorites');
    }
  };

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const handleReset = () => {
    setFilters({ city: '', propertyType: '', listingType: '', bhk: '', budget: '' })
    setSearch('')
    setPage(1)
    setPriceRange([0, 20000000])
    setSelectedAmenities([])
  }

  const totalPages = Math.ceil(total / PER_PAGE)
  const activeFilters = Object.values(filters).filter(Boolean).length + (priceRange[0] > 0 || priceRange[1] < 20000000 ? 1 : 0) + selectedAmenities.length

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .search-inp::placeholder{color:rgba(26,10,46,0.3);}
        .search-inp:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,0.1)!important;}
        @media(max-width:768px){.list-layout{grid-template-columns:1fr!important;} .filter-sidebar{display:none;} .filter-sidebar.open{display:block;position:fixed;inset:0;z-index:100;overflow-y:auto;padding:20px;background:#fff;} }
      `}</style>

      {/* Top bar */}
      <div style={{ background: '#ffffff', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.08)', padding: '12px 6vw', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 14px', borderRadius: 9, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Back
          </button>

          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(26,10,46,0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input className="search-inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city, area, or property name..." style={{ width: '100%', height: 44, paddingLeft: 42, paddingRight: 14, background: '#f9f9ff', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, color: '#1a0a2e', fontSize: 13.5, outline: 'none', transition: 'all 0.2s', fontFamily: "'DM Sans',sans-serif" }} />
          </div>
          <div style={{ width: 180 }}>
            <CustomSelect value={sort} onChange={v => setSort(v)} options={SORT_OPTS} />
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            style={{ height: 44, padding: '0 16px', background: activeFilters > 0 ? 'rgba(124,58,237,0.1)' : '#f9f9ff', border: `1px solid ${activeFilters > 0 ? '#7c3aed' : 'rgba(124,58,237,0.15)'}`, borderRadius: 12, color: activeFilters > 0 ? '#7c3aed' : 'rgba(26,10,46,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans',sans-serif" }}>
            ⚙ Filters {activeFilters > 0 && <span style={{ background: '#7c3aed', color: 'white', width: 18, height: 18, borderRadius: '50%', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 6vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: '#1a0a2e', margin: 0 }}>
            {filters.city ? `Properties in ${filters.city}` : 'Find Your Dream Home'}
          </h1>
          <span style={{ fontSize: 13, color: 'rgba(26,10,46,0.4)', fontWeight: 600 }}>{loading ? 'Searching...' : `${total.toLocaleString()} results`}</span>
        </div>

        <div className="list-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
          <aside className={`filter-sidebar${showFilters ? ' open' : ''}`}>
            <FilterSidebar
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedAmenities={selectedAmenities}
              setSelectedAmenities={setSelectedAmenities}
              amenitiesList={amenitiesList}
              dynamicOptions={dynamicOptions}
            />
          </aside>

          <main>
            {loading && properties.length === 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 24 }}>
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(124,58,237,0.06)' }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🏡</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: '#1a0a2e', marginBottom: 12 }}>No matching properties</h3>
                <p style={{ color: 'rgba(26,10,46,0.4)', fontSize: 15, maxWidth: 400, margin: '0 auto 28px' }}>We couldn't find anything matching your current filters. Try broadening your search.</p>
                <button onClick={handleReset} style={{ padding: '12px 32px', background: '#7c3aed', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 16px rgba(124,58,237,0.2)' }}>Clear All Filters</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 24 }}>
                  {properties.map((p, i) => (
                    <PropCard 
                      key={p._id || p.id || i} 
                      prop={p} 
                      index={i} 
                      isFavorite={favorites.includes(p._id || p.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48, flexWrap: 'wrap' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.15)', background: '#fff', color: page === 1 ? 'rgba(26,10,46,0.2)' : '#7c3aed', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>← Prev</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: page === p ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#fff', color: page === p ? '#fff' : '#7c3aed', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: page === p ? '0 4px 12px rgba(124,58,237,0.2)' : 'none' }}>{p}</button>
                      )
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.15)', background: '#fff', color: page === totalPages ? 'rgba(26,10,46,0.2)' : '#7c3aed', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
