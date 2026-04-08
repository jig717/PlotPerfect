import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { userService, inquiryService, threadService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, timeAgo, getInitials } from '../../utils/index'
import { toast } from 'react-toastify'
import visitService from '../../services/visitService'
import ThreadPanel from '../../Components/messaging/ThreadPanel'
import NotificationBell from '../../Components/ui/NotificationBell'

const TABS = ['Overview', 'Saved Properties', 'Scheduled Visits', 'My Inquiries']

const extractVisitsList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.visits)) return payload.visits
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getVisitStatus = (visit) => visit?.status || visit?.visit_status || 'REQUESTED'

const getVisitDate = (visit) => visit?.scheduledDate || visit?.scheduled_date || null

const getVisitBuyerId = (visit) =>
  visit?.buyer?._id || visit?.buyer_id || visit?.buyerId || visit?.user?._id || visit?.userId || null

const extractThreads = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getParticipantUserId = (participant) =>
  participant?.user?._id || participant?.user || null

/* ── Stat Card ── */
function StatCard({ icon, label, value }) {
  return (
    <div 
      style={{ 
        background: '#ffffff', 
        border: '1px solid rgba(124,58,237,0.12)', 
        borderRadius: 16, 
        padding: '20px 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)';
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.12)';
      }}
    >
      <div style={{ 
        width: 48, height: 48, borderRadius: 14, background: '#f0eeff', 
        border: '1px solid rgba(124,58,237,0.15)', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#7c3aed' 
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: '#1a0a2e', lineHeight: 1.2, marginTop: 12 }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(26,10,46,0.5)', marginTop: 6 }}>{label}</div>
    </div>
  )
}

/* ── Property Row (with remove functionality) ── */
function PropRow({ prop, onUnsave, favoriteId, propertyId }) {
  const navigate = useNavigate()
  const [isRemoving, setIsRemoving] = useState(false)

  if (!prop) {
    return (
      <div style={{ padding: 16, background: '#f9f9ff', borderRadius: 12, border: '1px solid rgba(124,58,237,0.08)', textAlign: 'center', color: '#ef4444' }}>
        ⚠️ Property data missing. Please remove this favorite.
        {onUnsave && (
          <button onClick={() => onUnsave(favoriteId, propertyId)} style={{ marginLeft: 12, padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Remove
          </button>
        )}
      </div>
    )
  }

  const handleRemoveClick = async () => {
    const confirmRemove = window.confirm(`Remove "${prop.title}" from saved properties?`)
    if (!confirmRemove) return

    setIsRemoving(true)
    try {
      await onUnsave(favoriteId, prop._id)
    } catch (error) {
      // Error already handled in onUnsave (toast)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div 
      style={{ 
        display: 'grid', gridTemplateColumns: '80px 1fr auto 100px', 
        gap: 16, padding: '14px 20px', background: '#ffffff', 
        border: '1px solid rgba(124,58,237,0.08)', borderRadius: 14, 
        alignItems: 'center', transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
        e.currentTarget.style.backgroundColor = '#fcfaff';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.08)';
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ 
        width: 72, height: 60, borderRadius: 10, background: 'linear-gradient(135deg,#f0eeff,#e8e4ff)', 
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontSize: 20, color: '#7c3aed'
      }}>
        {prop.images?.[0] ? (
          <img src={prop.images[0]} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          '🏠'
        )}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e', marginBottom: 4 }}>{prop.title}</div>
        <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)' }}>{prop.city}</div>
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: '#1a0a2e' }}>
        {formatPrice(prop.price)}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button 
          onClick={() => navigate(`/property/${prop._id}`)} 
          style={{ 
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', 
            background: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 600, 
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#7c3aed';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#7c3aed';
          }}
        >
          View
        </button>
        {onUnsave && (
          <button 
            onClick={handleRemoveClick}
            disabled={isRemoving}
            style={{ 
              padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', 
              background: isRemoving ? '#fecaca' : 'none', 
              color: isRemoving ? '#b91c1c' : '#ef4444', 
              fontSize: 12, fontWeight: 600, 
              cursor: isRemoving ? 'not-allowed' : 'pointer', 
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (!isRemoving) {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (!isRemoving) {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#ef4444';
              }
            }}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── ENHANCED Visit Card (with cancel) ── */
function VisitCard({ visit, onCancel }) {
  const navigate = useNavigate()
  const [isCancelling, setIsCancelling] = useState(false)
  const visitStatus = getVisitStatus(visit)
  const visitDate = getVisitDate(visit)
  const d = visitDate ? new Date(visitDate) : null

  const handleCancel = async () => {
    const confirm = window.confirm(`Cancel visit to "${visit.property?.title}"?`)
    if (!confirm) return
    setIsCancelling(true)
    try {
      await onCancel(visit._id)
    } catch (error) {
      // error already handled in parent
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div 
      style={{ 
        padding: 16, background: '#ffffff', border: '1px solid rgba(124,58,237,0.08)', 
        borderRadius: 14, transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
        e.currentTarget.style.backgroundColor = '#fcfaff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.08)';
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>
          {visit.property?.title || 'Property Visit'}
        </div>
        <span style={{ 
          fontSize: 11, padding: '3px 10px', borderRadius: 20, 
          background: 
            visitStatus === 'CONFIRMED' ? 'rgba(34,197,94,0.1)' :
            visitStatus === 'CANCELLED' ? 'rgba(239,68,68,0.1)' :
            'rgba(124,58,237,0.08)',
          color: 
            visitStatus === 'CONFIRMED' ? '#16a34a' :
            visitStatus === 'CANCELLED' ? '#dc2626' :
            '#7c3aed',
          fontWeight: 600, textTransform: 'capitalize' 
        }}>
          {visitStatus}
        </span>
      </div>
      {d && (
        <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.6)', marginBottom: 6 }}>
          📅 {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} 
          at {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)', marginBottom: 12 }}>
        📍 {visit.property?.city || visit.property?.location?.city || 'Location not specified'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={() => navigate(`/property/${visit.property?._id}`)} 
          style={{ 
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', 
            background: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 600, cursor: 'pointer', 
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#7c3aed';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#7c3aed';
          }}
        >
          View Property
        </button>
        {visitStatus !== 'CANCELLED' && (
          <button 
            onClick={handleCancel}
            disabled={isCancelling}
            style={{ 
              padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', 
              background: isCancelling ? '#fecaca' : 'none', 
              color: isCancelling ? '#b91c1c' : '#ef4444', 
              fontSize: 12, fontWeight: 600, 
              cursor: isCancelling ? 'not-allowed' : 'pointer', 
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (!isCancelling) {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (!isCancelling) {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#ef4444';
              }
            }}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Visit'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Inquiry Card ── */
function InquiryCard({ inquiry, onOpenConversation }) {
  return (
    <div 
      style={{ 
        padding: 16, background: '#ffffff', border: '1px solid rgba(124,58,237,0.08)', 
        borderRadius: 14, transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
        e.currentTarget.style.backgroundColor = '#fcfaff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.08)';
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>{inquiry.property?.title || 'Property Inquiry'}</div>
        <span style={{ fontSize: 12, color: 'rgba(26,10,46,0.4)' }}>{timeAgo(inquiry.createdAt)}</span>
      </div>
      <p style={{ fontSize: 13.5, color: 'rgba(26,10,46,0.7)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: inquiry.response ? 12 : 0 }}>
        "{inquiry.message}"
      </p>
      {inquiry.response && (
        <div style={{ padding: '10px 14px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 10, marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 5 }}>OWNER RESPONSE</div>
          <p style={{ fontSize: 13, color: 'rgba(26,10,46,0.7)', lineHeight: 1.6 }}>{inquiry.response}</p>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={() => onOpenConversation?.(inquiry)}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(124,58,237,0.08)', color: '#7c3aed', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Open Conversation
        </button>
      </div>
    </div>
  )
}

/* ── Overview Tab ── */
function Overview({ saved, visits, inquiries }) {
  const navigate = useNavigate()
  const validSaved = saved.filter(item => item && item.property)
  return (
    <div>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard icon="❤️" label="Saved Properties" value={validSaved.length} />
        <StatCard icon="📅" label="Scheduled Visits" value={visits.length} />
        <StatCard icon="💬" label="Inquiries Sent" value={inquiries.length} />
        <StatCard icon="🏠" label="Properties Viewed" value="0" />
      </div>

      {validSaved.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 16 }}>Recently Saved</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {validSaved.slice(0, 3).map(item => (
              <PropRow key={item._id} prop={item.property} />
            ))}
          </div>
          {validSaved.length > 3 && (
            <button onClick={() => {}} style={{ marginTop: 12, fontSize: 13, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all {validSaved.length} →
            </button>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f9f9ff', borderRadius: 20, border: '1px solid rgba(124,58,237,0.1)' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#1a0a2e', marginBottom: 8 }}>
          Find Your Dream Home
        </h3>
        <p style={{ color: 'rgba(26,10,46,0.5)', fontSize: 14, marginBottom: 20 }}>Browse thousands of verified properties</p>
        <button onClick={() => navigate('/properties')} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 40, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          Browse Properties
        </button>
      </div>
    </div>
  )
}

/* ── Empty State ── */
function EmptyState({ icon, title, sub, btn, to }) {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(124,58,237,0.08)' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: '#1a0a2e', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ color: 'rgba(26,10,46,0.5)', fontSize: 14, marginBottom: 20 }}>{sub}</p>
      <button onClick={() => navigate(to)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 40, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
        {btn}
      </button>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function BuyerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [saved, setSaved] = useState([])
  const [visits, setVisits] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [inquirySearch, setInquirySearch] = useState('')
  const [activeInquiry, setActiveInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const threadNotificationRef = useRef({})
  const threadPollBootstrappedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [savedRes, visitsRes, inquiriesRes] = await Promise.allSettled([
        userService.getSaved(user._id),
        visitService.getBuyerVisits({ limit: 100 }),
        inquiryService.getMine(user._id),
      ])

      if (savedRes.status === 'fulfilled') {
        let favs = savedRes.value?.data || savedRes.value || []
        const validFavs = Array.isArray(favs) ? favs.filter(fav => fav && fav.property) : []
        setSaved(validFavs)
      } else {
        console.error('Failed to fetch saved properties:', savedRes.reason)
        setSaved([])
      }

      if (visitsRes.status === 'fulfilled') {
        const visitsData = extractVisitsList(visitsRes.value)
        const userVisits = visitsData.filter((visit) => {
          const buyerId = getVisitBuyerId(visit)
          return !buyerId || buyerId === user._id
        })
        setVisits(userVisits)
      } else {
        console.error('Failed to fetch visits:', visitsRes.reason)
        setVisits([])
      }

      if (inquiriesRes.status === 'fulfilled') {
        const inquiriesData = inquiriesRes.value?.data || inquiriesRes.value || []
        setInquiries(Array.isArray(inquiriesData) ? inquiriesData : [])
      } else {
        console.error('Failed to fetch inquiries:', inquiriesRes.reason)
        setInquiries([])
      }
    } catch (error) {
      console.error('Error fetching buyer dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData, location.key])

  useEffect(() => {
    if (!user?._id) return

    let cancelled = false

    const pollThreadNotifications = async () => {
      try {
        const payload = await threadService.getMine()
        const threads = extractThreads(payload)
        const nextMap = {}

        for (const thread of threads) {
          const threadId = thread?._id
          if (!threadId) continue

          const lastMessageTs = thread?.lastMessageAt ? new Date(thread.lastMessageAt).getTime() : 0
          nextMap[threadId] = lastMessageTs

          const participants = Array.isArray(thread?.participants) ? thread.participants : []
          const me = participants.find((participant) => String(getParticipantUserId(participant)) === String(user._id))
          const myLastReadTs = me?.lastReadAt ? new Date(me.lastReadAt).getTime() : 0
          const hasUnread = lastMessageTs > myLastReadTs
          const alreadyNotifiedTs = threadNotificationRef.current[threadId] || 0

          if (!threadPollBootstrappedRef.current || !hasUnread || lastMessageTs <= alreadyNotifiedTs) {
            continue
          }

          // NotificationBell handles real-time toast notifications globally.
        }

        if (!cancelled) {
          threadNotificationRef.current = nextMap
          if (!threadPollBootstrappedRef.current) {
            threadPollBootstrappedRef.current = true
          }
        }
      } catch {
        // Silent polling failure: dashboard data flow already surfaces hard errors.
      }
    }

    pollThreadNotifications()
    const timer = window.setInterval(pollThreadNotifications, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

  const extractObjectId = (id) => {
    if (!id) return null
    const str = String(id).trim()
    const match = str.match(/[a-fA-F0-9]{24}/)
    return match ? match[0] : null
  }

  const handleUnsave = async (favoriteId, propertyId) => {
    const cleanFavId = extractObjectId(favoriteId)
    const cleanPropId = extractObjectId(propertyId)

    if (!cleanFavId && !cleanPropId) {
      toast.error('Invalid favorite or property ID')
      return
    }

    let error = null
    if (cleanFavId) {
      try {
        await userService.unsave(cleanFavId)
        setSaved(prev => prev.filter(fav => fav._id !== favoriteId))
        toast.success('Property removed from saved')
        return
      } catch (err) {
        error = err
        console.error('Unsave with cleaned favoriteId failed:', err)
      }
    }

    if (cleanPropId) {
      try {
        await userService.unsave(cleanPropId)
        setSaved(prev => prev.filter(fav => fav.property?._id !== propertyId))
        toast.success('Property removed from saved')
        return
      } catch (err2) {
        console.error('Unsave with cleaned propertyId failed:', err2)
        error = err2
      }
    }

    const msg = error?.response?.data?.message || error?.message || 'Failed to remove property'
    toast.error(msg)
  }

  // 🆕 Cancel visit
  const handleCancelVisit = async (visitId) => {
    try {
      await visitService.updateStatus(visitId, 'CANCELLED')
      setVisits(prev => prev.map(v => v._id === visitId ? { ...v, status: 'CANCELLED', visit_status: 'CANCELLED' } : v))
      toast.success('Visit cancelled successfully')
    } catch (error) {
      console.error('Cancel visit error:', error)
      toast.error(error?.response?.data?.message || 'Failed to cancel visit')
      throw error
    }
  }

  const tabContent = [
    <Overview key="overview" saved={saved} visits={visits} inquiries={inquiries} />,
    <div key="saved" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {saved.length === 0 ? (
        <EmptyState icon="❤️" title="No saved properties" sub="Save properties to view them here" btn="Browse Properties" to="/properties" />
      ) : (
        saved.map(fav => (
          <PropRow 
            key={fav._id} 
            prop={fav.property} 
            favoriteId={fav._id} 
            propertyId={fav.property?._id}
            onUnsave={handleUnsave} 
          />
        ))
      )}
    </div>,
    <div key="visits" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>Scheduled Visits ({visits.length})</div>
        <button
          onClick={() => navigate('/properties')}
          style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 40, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          + Schedule Visit
        </button>
      </div>
      {visits.length === 0 ? (
        <EmptyState icon="📅" title="No visits scheduled" sub="Schedule property visits to track them here" btn="Browse Properties" to="/properties" />
      ) : (
        visits.map(visit => (
          <VisitCard 
            key={visit._id} 
            visit={visit} 
            onCancel={handleCancelVisit}
          />
        ))
      )}
    </div>,
    <div key="inquiries" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text"
        value={inquirySearch}
        onChange={(event) => setInquirySearch(event.target.value)}
        placeholder="Search by property name..."
        style={{ width: '100%', maxWidth: 320, height: 36, borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', color: '#1a0a2e', padding: '0 12px', fontSize: 13, marginBottom: 4, outline: 'none' }}
      />
      {inquiries.length === 0 ? (
        <EmptyState icon="💬" title="No inquiries yet" sub="Contact property owners to see inquiries here" btn="Browse Properties" to="/properties" />
      ) : (
        inquiries
          .slice()
          .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
          .filter((inq) => {
            const keyword = inquirySearch.trim().toLowerCase()
            if (!keyword) return true
            return String(inq?.property?.title || '').toLowerCase().includes(keyword)
          })
          .map(inq => <InquiryCard key={inq._id} inquiry={inq} onOpenConversation={setActiveInquiry} />)
      )}
    </div>,
  ]

  const firstName = user?.name?.split(' ')[0] || user?.username?.split(' ')[0] || 'there'

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: "'DM Sans',sans-serif", color: '#1a0a2e' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box;}
        @media(max-width:768px){.db-header-row{flex-direction:column!important;gap:16px!important;}}
        @media(max-width:600px){.prop-row-grid{grid-template-columns:1fr !important; gap:12px !important;}}
      `}</style>

      {/* Header */}
      <div style={{ background: '#ffffff', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.1)', padding: '20px 6vw', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="db-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', boxShadow: '0 6px 20px rgba(124,58,237,0.25)' }}>
                {getInitials(user?.name || user?.username || 'U')}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#1a0a2e' }}>Welcome back, {firstName}!</div>
                <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)', marginTop: 2 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <NotificationBell user={user} />
              <button onClick={() => navigate('/properties')} style={{ padding: '10px 20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 40, color: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.color = '#7c3aed'; }}>
                Browse Properties
              </button>
              <button onClick={() => { logout(); navigate('/') }} style={{ padding: '10px 20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 40, color: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.color = '#7c3aed'; }}>
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={{ padding: '10px 22px', borderRadius: 40, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                background: tab === i ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(124,58,237,0.08)',
                color: tab === i ? '#fff' : '#7c3aed',
              }}
              onMouseEnter={e => { if (tab !== i) e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
              onMouseLeave={e => { if (tab !== i) e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}>
                {t}
                {i === 0 && saved.length > 0 && (
                  <span style={{ marginLeft: 6, background: tab === i ? '#fff' : '#7c3aed', color: tab === i ? '#7c3aed' : '#fff', borderRadius: 20, padding: '0 6px', fontSize: 11 }}>
                    {saved.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 6vw 64px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 120, background: '#f0eeff', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          tabContent[tab]
        )}
      </div>
      {activeInquiry && (
        <ThreadPanel inquiry={activeInquiry} user={user} onClose={() => setActiveInquiry(null)} />
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
    </div>
  )
}
