import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME

const getImageUrl = (image, width = 640, height = 400) => {
  if (!image) return null
  if (String(image).startsWith('http')) return image
  if (!CLOUD_NAME) return null
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${image}`
}

const getFavoritesList = (response) => {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.message)) return response.message
  if (Array.isArray(response)) return response
  return []
}

export default function PropertyCard({ card, index }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const syncFavoriteState = async () => {
      if (!user?._id || !card?.id || String(card.id).length !== 24) {
        if (!cancelled) {
          setSaved(false)
          setFavoriteId(null)
        }
        return
      }

      try {
        const response = await api.get(`/favorite/${user._id}`)
        const favorites = getFavoritesList(response)
        const found = favorites.find(
          (item) =>
            item?.property?._id?.toString() === String(card.id) ||
            item?.property?.toString() === String(card.id)
        )

        if (!cancelled) {
          setSaved(Boolean(found))
          setFavoriteId(found?._id || null)
        }
      } catch {
        if (!cancelled) {
          setSaved(false)
          setFavoriteId(null)
        }
      }
    }

    syncFavoriteState()
    return () => {
      cancelled = true
    }
  }, [user?._id, card?.id])

  const openProperty = () => {
    if (!card?.id) return
    navigate(`/property/${card.id}`)
  }

  const handleFavoriteToggle = async (event) => {
    event.stopPropagation()

    if (!user) {
      toast.info('Please login to save properties')
      navigate('/login')
      return
    }

    if (!card?.id || String(card.id).length !== 24) {
      toast.error('This property is not available yet.')
      return
    }

    if (saving) return
    setSaving(true)

    try {
      if (saved) {
        const removeId = favoriteId
        if (!removeId) {
          const response = await api.get(`/favorite/${user._id}`)
          const favorites = getFavoritesList(response)
          const found = favorites.find(
            (item) =>
              item?.property?._id?.toString() === String(card.id) ||
              item?.property?.toString() === String(card.id)
          )
          if (!found?._id) {
            toast.error('Saved item was not found.')
            return
          }
          await api.delete(`/favorite/${found._id}`)
        } else {
          await api.delete(`/favorite/${removeId}`)
        }

        setSaved(false)
        setFavoriteId(null)
        toast.success('Removed from saved properties')
      } else {
        await api.post('/favorite', { userId: user._id, propertyId: card.id })
        const response = await api.get(`/favorite/${user._id}`)
        const favorites = getFavoritesList(response)
        const found = favorites.find(
          (item) =>
            item?.property?._id?.toString() === String(card.id) ||
            item?.property?.toString() === String(card.id)
        )

        setSaved(Boolean(found))
        setFavoriteId(found?._id || null)
        toast.success('Property saved')
      }
    } catch (error) {
      if (error?.response?.status === 400 && error?.response?.data?.message === 'Already in favorites') {
        setSaved(true)
        toast.info('Property is already saved.')
      } else {
        toast.error('Could not update saved property.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleContactClick = (event) => {
    event.stopPropagation()
    if (!card?.id) return
    navigate(`/property/${card.id}#contact-owner`)
  }

  const imageUrl = getImageUrl(card.image)
  const normalizedStatus = String(card.status || '').toUpperCase()
  const isBooked = normalizedStatus === 'BOOKED'
  const bookingBadge = card.badge || card.listingLabel || 'Booked'

  return (
    <div
      className={`prop-card bg-[#e8e4ff] border border-[rgba(124,58,237,0.15)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[rgba(124,58,237,0.4)] r d${index + 1}`}
      data-reveal
      role="button"
      tabIndex={0}
      onClick={openProperty}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openProperty()
        }
      }}
    >
      <div className="card-img relative h-48 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-400 hover:scale-108"
          />
        ) : (
          <div
            className="card-img-bg w-full h-full flex items-center justify-center transition-transform duration-400 hover:scale-108"
            style={{ background: card.grad }}
          >
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none" className="opacity-35">
              <path d="M10 70V35L40 10l30 25v35H52V50H28v20H10z" fill="#a78bfa" />
              <rect x="33" y="50" width="14" height="20" rx="2" fill="#c4b5fd" />
              <rect x="20" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
              <rect x="46" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
            </svg>
          </div>
        )}

        <span className={`cb absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${card.cls}`} style={{ background: isBooked ? '#0f766e' : card.bc }}>
          {isBooked ? bookingBadge : card.badge}
        </span>
        {card.isNew && (
          <span className="cb cb-new absolute top-2.5 right-11 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
            NEW
          </span>
        )}
        <button
          type="button"
          className="fav absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-sm cursor-pointer backdrop-blur-sm transition-all duration-300 hover:scale-120 hover:bg-[rgba(124,58,237,0.35)] hover:border-[#7c3aed]"
          onClick={handleFavoriteToggle}
          aria-label={saved ? 'Remove from saved properties' : 'Save property'}
          disabled={saving}
        >
          {saved ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="card-body p-3 sm:p-4">
        <div className="card-price font-serif text-xl font-extrabold text-[#1a0a2e]">
          {card.price} <sub className="text-[11.5px] font-normal text-[rgba(26,10,46,0.4)]">{card.sub}</sub>
        </div>
        <div className="card-title text-sm font-semibold text-[rgba(26,10,46,0.7)] my-1 leading-tight wrap-break-word">{card.title}</div>
        <div className="card-loc text-[11.5px] text-[rgba(26,10,46,0.4)] flex items-center gap-0.5 mb-2 wrap-break-word">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          {card.loc}
        </div>
        <div className="flex gap-1 flex-wrap">
          {card.chips.map((ch, i) => (
            <span key={i} className="chip bg-[rgba(255,255,255,0.06)] border border-[rgba(124,58,237,0.15)] text-[rgba(26,10,46,0.4)] text-[11px] px-2 py-0.5 rounded font-medium">
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div className="card-foot p-3 sm:p-4 border-t border-[rgba(124,58,237,0.15)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-md"
            style={{ background: card.initC }}
          >
            {card.init}
          </div>
          <span className={`text-[11.5px] font-semibold ${card.verified ? 'text-green-600' : 'text-[rgba(26,10,46,0.5)]'}`}>
            {card.verified ? '✓ Verified' : 'Listed'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleContactClick}
          className="card-btn w-full sm:w-auto px-3 py-1.5 rounded border border-[rgba(124,58,237,0.45)] text-[#a78bfa] text-[11.5px] font-bold bg-transparent hover:bg-[#7c3aed] hover:text-white transition"
        >
          Contact
        </button>
      </div>
    </div>
  )
}
