import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { propertyService, inquiryService } from "../../services"
import { useAuth } from "../../context/AuthContext"
import { formatPrice, timeAgo, getInitials } from "../../utils/index"
import api from "../../services/api"

// Cloudinary configuration
const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME

// MOCK only for development when backend is down
const MOCK = {
  _id: "507f1f77bcf86cd799439011",
  title: "2 BHK Premium Apartment",
  city: "Ahmedabad",
  locality: "Satellite",
  price: 4500000,
  listingType: "sale",
  images: ["/house.jpg", "/banner.jpg"],
  description: "Spacious 2 BHK apartment...",
  bhk: 2,
  baths: 2,
  area: 1200,
  floor: 4,
  totalFloors: 12,
  age: 3,
  facing: "East",
  furnishing: "semi_furnished",
  propertyType: "Apartment",
  isVerified: true,
  amenities: ["Lift", "Parking", "Gym", "Security", "CCTV", "Power Backup"],
  owner: { name: "Raj Patel", role: "owner" },
  createdAt: new Date(Date.now() - 2 * 86400000),
}

const getImageUrl = (publicId, width, height) => {
  if (!publicId) return null
  if (publicId.startsWith('http')) return publicId
  if (!CLOUD_NAME) return `https://picsum.photos/id/104/${width}/${height}`
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`
}

function Gallery({ images = [], title }) {
  const [active, setActive] = useState(0)
  if (!images.length) {
    return (
      <div className="h-80 rounded-2xl bg-linear-to-br from-[#f0eeff] to-[#e8e4ff] flex items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-40">
          <path d="M10 70V35L40 10l30 25v35H52V50H28v20H10z" fill="#a78bfa" />
          <rect x="33" y="50" width="14" height="20" rx="2" fill="#c4b5fd" />
          <rect x="20" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
          <rect x="46" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
        </svg>
      </div>
    )
  }
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden h-80">
        <img src={getImageUrl(images[active], 800, 450)} alt={title} className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button onClick={() => setActive((a) => (a - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">‹</button>
            <button onClick={() => setActive((a) => (a + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">›</button>
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">{active+1}/{images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {images.map((img, i) => (
            <img key={i} src={getImageUrl(img, 100, 70)} onClick={() => setActive(i)} className={`w-20 h-14 rounded-lg object-cover cursor-pointer border-2 ${active===i ? 'border-[#7c3aed]' : 'border-transparent'} opacity-${active===i ? 1 : 60}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ icon, label }) {
  return (
    <div className="flex items-center gap-2 bg-[#f9f9ff] border border-[rgba(124,58,237,0.15)] rounded-xl px-4 py-2 text-sm font-medium text-[#1a0a2e]">
      {icon && <span>{icon}</span>}
      {label}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <h3 className="font-serif text-lg font-bold text-[#1a0a2e] border-b border-[rgba(124,58,237,0.1)] pb-2 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function InquiryForm({ propertyId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState("Hi, I am interested in this property. Please share more details.")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.info("Please login to send an inquiry")
      navigate("/login")
      return
    }
    if (!propertyId || propertyId.length !== 24) {
      toast.error("Invalid property ID. Please refresh the page.")
      return
    }
    setLoading(true)
    try {
      await inquiryService.send({
        user: user._id,
        property: propertyId,
        message,
      })
      toast.success("Inquiry sent! The owner will contact you shortly.")
      setMessage("")
    } catch (error) {
      console.error(error)
      toast.error("Failed to send inquiry. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea rows={3} placeholder="Your message" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-3 bg-[#f9f9ff] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#1a0a2e] text-sm outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]" required />
      <button type="submit" disabled={loading} className="w-full py-3 bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-70">{loading ? "Sending…" : "Send Inquiry"}</button>
    </form>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [isToggling, setIsToggling] = useState(false)

  // FETCH PROPERTY with error handling
  useEffect(() => {
    let cancelled = false
    const fetchProperty = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await propertyService.getById(id)
        if (!cancelled) {
          if (data?.data) setProperty(data.data)
          else if (data) setProperty(data)
          else throw new Error("No property data received")
        }
      } catch (err) {
        console.error("Property fetch error:", err)
        if (!cancelled) {
          // Show user-friendly error
          const status = err.response?.status
          const message = err.response?.data?.message || err.message
          if (status === 500) {
            setError("Server error. Please try again later.")
          } else if (status === 404) {
            setError("Property not found.")
          } else {
            setError(message || "Failed to load property details.")
          }
          // In development, fallback to MOCK to keep testing
          if (import.meta.env.DEV) {
            console.warn("Using mock property data (development only)")
            setProperty(MOCK)
            setError(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchProperty()
    return () => { cancelled = true }
  }, [id])

  // CHECK FAVORITE STATUS (using GET /favorite/:userid)
  useEffect(() => {
    if (!user || !property?._id) return
    const checkFavoriteStatus = async () => {
      try {
        const res = await api.get(`/favorite/${user._id}`)
        // Your backend returns { hell: "...", message: [...] }
        let favorites = []
        if (res?.data?.message && Array.isArray(res.data.message)) {
          favorites = res.data.message
        } else if (Array.isArray(res?.data)) {
          favorites = res.data
        } else if (Array.isArray(res?.message)) {
          favorites = res.message
        }
        const found = favorites.find(
          fav => fav.property?._id?.toString() === property._id || fav.property?.toString() === property._id
        )
        if (found) {
          setSaved(true)
          setFavoriteId(found._id)
        } else {
          setSaved(false)
          setFavoriteId(null)
        }
      } catch (err) {
        console.warn("Failed to fetch favorites", err)
      }
    }
    checkFavoriteStatus()
  }, [user, property?._id])

  // HANDLE SAVE / UNSAVE
  const handleSave = async () => {
  if (!user) {
    toast.info("Please login to save properties");
    navigate("/login");
    return;
  }

  if (!property?._id || property._id.length !== 24) {
    toast.error("Invalid property ID. Please refresh.");
    return;
  }

  if (isToggling) return;
  setIsToggling(true);

  try {
    if (saved) {
      // ✅ REMOVE FLOW (NO CRASH)
      if (!favoriteId) {
        // 🔁 fallback: fetch favorites to find ID
        const res = await api.get(`/favorite/${user._id}`);
        const favorites = res?.data?.data || [];

        const found = favorites.find(
          f =>
            f.property?._id === property._id ||
            f.property?.toString() === property._id
        );

        if (!found) {
          toast.error("Favorite not found");
          return;
        }

        await api.delete(`/favorite/${found._id}`);
      } else {
        await api.delete(`/favorite/${favoriteId}`);
      }

      toast.success("Removed from saved");
      setSaved(false);
      setFavoriteId(null);

    } else {
      // ✅ SAVE FLOW
      await api.post("/favorite", {
        userId: user._id,
        propertyId: property._id,
      });
      //console.log("Saving propertyId:", property._id);

      // 🔁 ALWAYS REFETCH (PRO WAY)
      const res = await api.get(`/favorite/${user._id}`);
      const favorites = res?.data?.data || [];

      const found = favorites.find(
        f =>
          f.property?._id === property._id ||
          f.property?.toString() === property._id
      );

      if (!found) {
        toast.error("Save failed (not persisted)");
        return;
      }

      setFavoriteId(found._id);
      setSaved(true);

      toast.success("Property saved! ❤️");
    }

  } catch (error) {
    console.error("Save error:", error);

    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
    } else {
      toast.error("Something went wrong. Try again.");
    }

  } finally {
    setIsToggling(false);
  }
};

  const handleShare = async () => {
    const url = window.location.href
    const title = property?.title || 'Check out this property'

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        toast.success('Shared successfully!')
        return
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Link copied! You can now share it.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-[#f0eeff] rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-80 bg-[#f0eeff] rounded-2xl"></div>
              <div className="h-8 bg-[#f0eeff] rounded w-3/4"></div>
              <div className="h-4 bg-[#f0eeff] rounded w-1/2"></div>
              <div className="flex gap-3"><div className="h-10 w-24 bg-[#f0eeff] rounded-full"></div><div className="h-10 w-24 bg-[#f0eeff] rounded-full"></div></div>
            </div>
            <div className="h-96 bg-[#f0eeff] rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load property</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!property) return null

  const badgeLabel = { sale: "For Sale", rent: "For Rent", pg: "PG", lease: "Lease" }[property.listingType] || "For Sale"
  const badgeColor = { sale: "#7c3aed", rent: "#0891b2", pg: "#059669", lease: "#d97706" }[property.listingType] || "#7c3aed"

  const detailRows = [
    ["Property Type", property.propertyType],
    ["Listing Type", badgeLabel],
    ["City", property.city],
    ["Locality", property.locality],
    ["BHK", property.bhk ? `${property.bhk} BHK` : null],
    ["Bathrooms", property.baths],
    ["Area", property.area ? `${property.area} sqft` : null],
    ["Floor", property.floor],
    ["Total Floors", property.totalFloors],
    ["Furnishing", property.furnishing?.replace("_", " ")],
    ["Age", property.age ? `${property.age} years` : null],
    ["Facing", property.facing],
  ].filter(([, v]) => v)

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-[rgba(124,58,237,0.1)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-[rgba(26,10,46,0.5)]">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-[#7c3aed] transition">← Back</button>
          <span>/</span>
          <button onClick={() => navigate("/")} className="hover:text-[#7c3aed]">Home</button>
          <span>/</span>
          <button onClick={() => navigate("/properties")} className="hover:text-[#7c3aed]">Properties</button>
          <span>/</span>
          <span className="text-[#7c3aed] font-medium">{property.city}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Gallery images={property.images || []} title={property.title} />

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide" style={{ background: badgeColor, color: "#fff" }}>{badgeLabel}</span>
                {property.isVerified && <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">✓ Verified</span>}
                <span className="text-xs text-[rgba(26,10,46,0.5)] ml-auto">Listed {timeAgo(property.createdAt)}</span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#1a0a2e] mb-2">{property.title}</h1>
              <div className="flex items-center gap-1 text-[rgba(26,10,46,0.5)] mb-5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                {property.locality && `${property.locality}, `}{property.city}
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {property.bhk && <Chip icon="🛏" label={`${property.bhk} BHK`} />}
                {property.baths && <Chip icon="🚿" label={`${property.baths} Bath`} />}
                {property.area && <Chip icon="📐" label={`${property.area} sqft`} />}
                {property.furnishing && <Chip icon="🪑" label={property.furnishing.replace("_", " ")} />}
                {property.propertyType && <Chip icon="🏠" label={property.propertyType} />}
              </div>

              <Section title="Description">
                <p className="text-[rgba(26,10,46,0.7)] leading-relaxed">{property.description || "No description provided."}</p>
              </Section>

              {property.amenities?.length > 0 && (
                <Section title="Amenities">
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map(a => (
                      <span key={a} className="bg-[#f0eeff] text-[#7c3aed] text-sm px-3 py-1.5 rounded-lg">✓ {a}</span>
                    ))}
                  </div>
                </Section>
              )}

              <Section title="Property Details">
                <div className="grid grid-cols-2 gap-3">
                  {detailRows.map(([key, val]) => (
                    <div key={key} className="bg-[#f9f9ff] rounded-xl p-3 border border-[rgba(124,58,237,0.08)]">
                      <div className="text-xs uppercase tracking-wide text-[rgba(26,10,46,0.4)] mb-1">{key}</div>
                      <div className="text-sm font-semibold text-[#1a0a2e]">{val}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[rgba(124,58,237,0.15)] shadow-sm p-6 sticky top-24">
              <div className="font-serif text-3xl font-bold text-[#1a0a2e]">
                {formatPrice(property.price)}
                {property.listingType === "rent" && <span className="text-base font-normal text-[rgba(26,10,46,0.5)]">/month</span>}
              </div>
              {property.area > 0 && (
                <div className="text-sm text-[rgba(26,10,46,0.5)] mt-1">₹{Math.round(property.price / property.area).toLocaleString()} / sqft</div>
              )}

              {property.owner && (
                <div className="flex items-center gap-3 py-4 my-4 border-y border-[rgba(124,58,237,0.08)]">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center text-white font-bold shadow-md">
                    {getInitials(property.owner.name)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a0a2e]">{property.owner.name}</div>
                    <div className="text-xs text-[rgba(26,10,46,0.5)]">{property.owner.role === "agent" ? "✓ Verified Agent" : "Property Owner"}</div>
                  </div>
                </div>
              )}

              <InquiryForm propertyId={property._id} />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={isToggling}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition ${
                    saved
                      ? "border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed]"
                      : "border-[rgba(124,58,237,0.3)] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white"
                  }`}
                >
                  {isToggling ? (saved ? "Removing..." : "Saving...") : (saved ? "❤️ Saved" : "🤍 Save")}
                </button>
                <button onClick={handleShare} className="flex-1 py-3 rounded-xl border border-[rgba(124,58,237,0.3)] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white transition font-semibold">Share 📤</button>
              </div>
            </div>

            <div className="bg-[#f9f9ff] rounded-2xl p-5 border border-[rgba(124,58,237,0.1)]">
              <div className="text-xs font-bold uppercase tracking-wide text-[rgba(26,10,46,0.4)] mb-3">Why PlotPerfect?</div>
              <div className="space-y-2 text-sm text-[rgba(26,10,46,0.7)]">
                <div>✓ Verified listings only</div>
                <div>✓ Direct owner contact</div>
                <div>✓ Zero brokerage</div>
                <div>✓ Secure inquiries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}