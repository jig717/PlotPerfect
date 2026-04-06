import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { propertyService } from '../../services'
import { useDebounce } from '../../hooks'
import { formatPrice, getBadgeColor, buildQuery } from '../../utils/index'
import { toast } from 'react-toastify'
import { CardSkeleton } from '../../Components/skeletons/CardSkeleton'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

/* ── Constants ── */
const CITIES  = ['Mumbai','Delhi NCR','Bangalore','Hyderabad','Pune','Chennai','Ahmedabad','Kolkata']
const TYPES   = ['Apartment','House','Villa','Plot','PG','Commercial','Office']
const BHK     = ['1 BHK','2 BHK','3 BHK','4 BHK','4+ BHK']
const BUDGETS = [{label:'Any',value:''},{label:'Under ₹30L',value:'0-3000000'},{label:'₹30L–₹60L',value:'3000000-6000000'},{label:'₹60L–₹1Cr',value:'6000000-10000000'},{label:'₹1Cr–₹2Cr',value:'10000000-20000000'},{label:'Above ₹2Cr',value:'20000000+'}]
const SORT_OPTS = [{label:'Newest First',value:'newest'},{label:'Price ↑',value:'price_asc'},{label:'Price ↓',value:'price_desc'},{label:'Most Popular',value:'popular'}]
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
function PropCard({ prop, index }) {
  const navigate = useNavigate()
  const [fav, setFav] = useState(false)
  const [hov, setHov] = useState(false)
  const grad = prop.gradient || GRADIENTS[index % GRADIENTS.length]
  const badge = prop.listingType || 'sale'
  const badgeLabel = { sale:'For Sale', rent:'For Rent', pg:'PG', lease:'Lease' }[badge] || 'For Sale'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(`/property/${prop._id || prop.id}`)}
      style={{
        background:'#ffffff', borderRadius:16, overflow:'hidden', cursor:'pointer',
        border:`1px solid ${hov ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.1)'}`,
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? '0 12px 28px rgba(124,58,237,0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
      }}
    >
      <div style={{ height:180, background: grad, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
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
              background: 'linear-gradient(135deg,#f0eeff,#e8e4ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(26,10,46,0.4)',
              fontSize: 14,
              textTransform: 'uppercase'
            }}
          >
            No Image
          </div>
        )}
        <span style={{ position:'absolute', top:10, left:10, background: getBadgeColor(badge), color:'#fff', fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:6, textTransform:'uppercase', letterSpacing:0.5 }}>{badgeLabel}</span>
        {prop.isVerified && <span style={{ position:'absolute', top:10, right:44, background:'rgba(34,197,94,0.15)', border:'0.5px solid #22c55e', color:'#16a34a', fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:6 }}>✓ Verified</span>}
        <button
          onClick={e => { e.stopPropagation(); setFav(f => !f);
            toast.success(fav ? 'Removed from saved' : 'Saved!') }}
          style={{ position:'absolute', top:10, right:10, width:30, height:30, borderRadius:'50%', background:'rgba(0,0,0,0.4)', border:'0.5px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, cursor:'pointer', transform: fav ? 'scale(1.3)' : 'scale(1)', transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {fav ? '❤️' : '🤍'}
        </button>
      </div>
      <div style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:20, fontWeight:800, color:'#1a0a2e', fontFamily:"'Playfair Display',serif" }}>
          {formatPrice(prop.price)} {prop.listingType === 'rent' && <sub style={{ fontSize:12, color:'rgba(26,10,46,0.5)', fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>/mo</sub>}
        </div>
        <div style={{ fontSize:13.5, fontWeight:600, color:'rgba(26,10,46,0.7)', margin:'5px 0 3px', lineHeight:1.35 }}>{prop.title}</div>
        <div style={{ fontSize:11.5, color:'rgba(26,10,46,0.5)', marginBottom:10, display:'flex', alignItems:'center', gap:4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(26,10,46,0.5)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          {prop.city}{prop.locality ? `, ${prop.locality}` : ''}
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {prop.bhk    && <span style={chipLight}>{prop.bhk} BHK</span>}
          {prop.baths  && <span style={chipLight}>🚿 {prop.baths} Bath</span>}
          {prop.area   && <span style={chipLight}>📐 {prop.area} sqft</span>}
        </div>
      </div>
      <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(124,58,237,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11.5, color:'rgba(26,10,46,0.5)' }}>
          {prop.propertyType && <span style={{ textTransform:'capitalize' }}>{prop.propertyType}</span>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); navigate(`/property/${prop._id || prop.id}`) }}
          style={{ padding:'6px 14px', borderRadius:7, border:`1px solid ${hov ? '#7c3aed' : 'rgba(124,58,237,0.4)'}`, color: hov ? '#fff' : '#7c3aed', background: hov ? '#7c3aed' : 'none', fontSize:11.5, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>
          View Details
        </button>
      </div>
    </div>
  )
}

const chipLight = { background:'#f9f9ff', border:'1px solid rgba(124,58,237,0.1)', color:'rgba(26,10,46,0.6)', fontSize:11, padding:'3px 8px', borderRadius:5, fontWeight:500 }

/* ── Filter Sidebar (light theme) ── */
function FilterSidebar({ filters, onChange, onReset, priceRange, setPriceRange, selectedAmenities, setSelectedAmenities, amenitiesList }) {
  return (
    <div style={{ background:'#ffffff', border:'1px solid rgba(124,58,237,0.1)', borderRadius:16, padding:20, position:'sticky', top:80, boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <span style={{ fontSize:15, fontWeight:700, color:'#1a0a2e' }}>Filters</span>
        <button onClick={onReset} style={{ fontSize:12, color:'#7c3aed', background:'none', border:'none', cursor:'pointer' }}>Reset All</button>
      </div>

      <FilterGroupLight title="Listing Type">
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[{v:'sale',l:'For Sale'},{v:'rent',l:'For Rent'},{v:'pg',l:'PG'},{v:'lease',l:'Lease'}].map(t => (
            <button key={t.v} onClick={() => onChange('listingType', filters.listingType===t.v ? '' : t.v)}
              style={{ padding:'6px 12px', borderRadius:8, fontSize:12.5, fontWeight:600, border:`1px solid ${filters.listingType===t.v ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`, background: filters.listingType===t.v ? 'rgba(124,58,237,0.08)' : 'none', color: filters.listingType===t.v ? '#7c3aed' : 'rgba(26,10,46,0.6)', cursor:'pointer', transition:'all 0.18s' }}>
              {t.l}
            </button>
          ))}
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="City">
        <FilterSelectLight value={filters.city} onChange={v => onChange('city', v)} options={['',...CITIES]} />
      </FilterGroupLight>

      <FilterGroupLight title="Property Type">
        <FilterSelectLight value={filters.propertyType} onChange={v => onChange('propertyType', v)} options={['',...TYPES]} />
      </FilterGroupLight>

      <FilterGroupLight title="BHK">
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {BHK.map(b => (
            <button key={b} onClick={() => onChange('bhk', filters.bhk===b.replace(' BHK','') ? '' : b.replace(' BHK',''))}
              style={{ padding:'5px 10px', borderRadius:7, fontSize:12, fontWeight:600, border:`1px solid ${filters.bhk===b.replace(' BHK','') ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`, background: filters.bhk===b.replace(' BHK','') ? 'rgba(124,58,237,0.08)' : 'none', color: filters.bhk===b.replace(' BHK','') ? '#7c3aed' : 'rgba(26,10,46,0.6)', cursor:'pointer' }}>
              {b}
            </button>
          ))}
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="Budget">
        <FilterSelectLight value={filters.budget} onChange={v => onChange('budget', v)} options={BUDGETS} />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'rgba(26,10,46,0.6)' }}>
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
                style={{ width: 16, height: 16, accentColor: '#7c3aed' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(26,10,46,0.7)' }}>{amenity}</span>
            </label>
          ))}
        </div>
      </FilterGroupLight>
    </div>
  )
}

function FilterGroupLight({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'rgba(26,10,46,0.5)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  )
}

function FilterSelectLight({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', height:42, background:'#f9f9ff', border:'1px solid rgba(124,58,237,0.2)', borderRadius:9, padding:'0 12px', color: value ? '#1a0a2e' : 'rgba(26,10,46,0.5)', fontSize:13.5, outline:'none', cursor:'pointer', appearance:'none', fontFamily:"'DM Sans',sans-serif" }}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o} style={{ background:'#fff', color:'#1a0a2e' }}>{o.label ?? (o||'Any')}</option>
      ))}
    </select>
  )
}

/* ── Main Page (light theme) ── */
export default function PropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]     = useState(true)
  const [total,      setTotal]       = useState(0)
  const [page,       setPage]        = useState(1)
  const [sort,       setSort]        = useState('newest')
  const [search,     setSearch]      = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()   // <-- added for back button

  const [priceRange, setPriceRange] = useState([0, 10000000])
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const amenitiesList = ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Lift', 'Power Backup']

  const [filters, setFilters] = useState({
    city:         searchParams.get('city')         || '',
    propertyType: searchParams.get('propertyType') || '',
    listingType:  searchParams.get('type')         || '',
    bhk:          searchParams.get('bhk')          || '',
    budget:       searchParams.get('budget')       || '',
  })

  const debouncedSearch = useDebounce(search, 500)
  const PER_PAGE = 12

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

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const handleReset = () => {
    setFilters({ city:'', propertyType:'', listingType:'', bhk:'', budget:'' })
    setSearch('')
    setPage(1)
    setPriceRange([0, 10000000])
    setSelectedAmenities([])
  }

  const totalPages = Math.ceil(total / PER_PAGE)
  const activeFilters = Object.values(filters).filter(Boolean).length + (priceRange[0] > 0 || priceRange[1] < 20000000 ? 1 : 0) + selectedAmenities.length

  return (
    <div style={{ minHeight:'100vh', background:'#f8f7ff', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .search-inp::placeholder{color:rgba(26,10,46,0.4);}
        .search-inp:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,0.12)!important;}
        @media(max-width:768px){.list-layout{grid-template-columns:1fr!important;} .filter-sidebar{display:none;} .filter-sidebar.open{display:block;position:fixed;inset:0;z-index:100;overflow-y:auto;padding:20px;background:#fff;} }
      `}</style>

      {/* Top bar */}
      <div style={{ background:'#ffffff', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(124,58,237,0.1)', padding:'14px 6vw', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1300, margin:'0 auto', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          {/* Back button */}
          <button 
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: '#7c3aed',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>

          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <svg style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'rgba(26,10,46,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input className="search-inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by city, locality, project..." style={{ width:'100%', height:44, paddingLeft:42, paddingRight:14, background:'#f9f9ff', border:'1px solid rgba(124,58,237,0.2)', borderRadius:10, color:'#1a0a2e', fontSize:14, outline:'none', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif" }}/>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ height:44, padding:'0 36px 0 12px', background:'#f9f9ff', border:'1px solid rgba(124,58,237,0.2)', borderRadius:10, color:'#1a0a2e', fontSize:13.5, outline:'none', cursor:'pointer', appearance:'none', fontFamily:"'DM Sans',sans-serif" }}>
            {SORT_OPTS.map(o => <option key={o.value} value={o.value} style={{ background:'#fff' }}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(f => !f)}
            style={{ height:44, padding:'0 16px', background: activeFilters > 0 ? 'rgba(124,58,237,0.1)' : '#f9f9ff', border:`1px solid ${activeFilters > 0 ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`, borderRadius:10, color: activeFilters > 0 ? '#7c3aed' : 'rgba(26,10,46,0.6)', fontSize:13.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:"'DM Sans',sans-serif" }}>
            ⚙ Filters {activeFilters > 0 && <span style={{ background:'#7c3aed', color:'white', width:18, height:18, borderRadius:'50%', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>{activeFilters}</span>}
          </button>
          <span style={{ fontSize:13, color:'rgba(26,10,46,0.5)', whiteSpace:'nowrap' }}>
            {loading ? '...' : `${total.toLocaleString()} properties`}
          </span>
        </div>
      </div>

      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 6vw' }}>
        <div className="list-layout" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:24, alignItems:'start' }}>
          <div className={`filter-sidebar${showFilters ? ' open' : ''}`}>
            <FilterSidebar
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedAmenities={selectedAmenities}
              setSelectedAmenities={setSelectedAmenities}
              amenitiesList={amenitiesList}
            />
          </div>

          <div>
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
                {Array.from({length:6}).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : properties.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 20px' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, color:'#1a0a2e', marginBottom:8 }}>No properties found</h3>
                <p style={{ color:'rgba(26,10,46,0.5)', fontSize:14 }}>Try adjusting your filters or search term</p>
                <button onClick={handleReset} style={{ marginTop:20, padding:'10px 24px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Clear All Filters</button>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
                  {properties.map((p, i) => <PropCard key={p._id||p.id||i} prop={p} index={i}/>)}
                </div>
                {totalPages > 1 && (
                  <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:36, flexWrap:'wrap' }}>
                    <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                      style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(124,58,237,0.2)', background:'none', color: page===1 ? 'rgba(26,10,46,0.4)' : '#7c3aed', cursor: page===1 ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:600 }}>← Prev</button>
                    {Array.from({length: Math.min(5, totalPages)}, (_,i) => {
                      const p = totalPages <= 5 ? i+1 : Math.max(1, Math.min(page-2, totalPages-4)) + i
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          style={{ width:38, height:38, borderRadius:8, border:`1px solid ${page===p ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`, background: page===p ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'none', color: page===p ? '#fff' : '#7c3aed', cursor:'pointer', fontSize:13, fontWeight:600 }}>{p}</button>
                      )
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                      style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(124,58,237,0.2)', background:'none', color: page===totalPages ? 'rgba(26,10,46,0.4)' : '#7c3aed', cursor: page===totalPages ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:600 }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}