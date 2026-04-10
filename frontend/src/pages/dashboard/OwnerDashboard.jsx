import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { propertyService, inquiryService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, timeAgo, getInitials } from '../../utils/index'
import { toast } from 'react-toastify'
import NotificationBell from '../../Components/ui/NotificationBell'
import ThreadPanel from '../../Components/messaging/ThreadPanel'

const TABS = ['Overview', 'My Properties', 'Inquiries', 'Analytics']

/* ── Stat Card (light theme) ── */
function StatCard({ icon, label, value, change, up = true }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: 14, background: '#f0eeff', 
          border: '1px solid rgba(124,58,237,0.15)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#7c3aed' 
        }}>
          {icon}
        </div>
        {change && (
          <span style={{ 
            fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 20, 
            background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
            color: up ? '#16a34a' : '#dc2626' 
          }}>
            {up ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: '#1a0a2e', lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(26,10,46,0.5)', marginTop: 6 }}>{label}</div>
    </div>
  )
}

/* ── Property Row (light theme) – with editable status dropdown ── */
function PropertyRow({ prop, onDelete, onStatusChange }) {
  const navigate = useNavigate()
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(prop.status || 'PENDING')

  // Convert price to rupees (assuming prop.price is in lakhs)
  const priceInRupees = Number(prop.price) * 100000
  let formattedPrice = '₹0'
  if (!isNaN(priceInRupees)) {
    if (priceInRupees >= 10000000) {
      formattedPrice = `₹${(priceInRupees / 10000000).toFixed(2)} Cr`
    } else if (priceInRupees >= 100000) {
      formattedPrice = `₹${(priceInRupees / 100000).toFixed(2)} L`
    } else {
      formattedPrice = `₹${priceInRupees.toLocaleString('en-IN')}`
    }
  }

  // Status mapping for display
  const statusMap = {
    'PENDING': { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'APPROVED': { label: 'Active', color: '#16a34a', bg: 'rgba(34,197,94,0.1)' },
    'SOLD': { label: 'Sold', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    'RENTED': { label: 'Rented', color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
  }
  const statusStyle = statusMap[currentStatus] || statusMap['PENDING']

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    setUpdatingStatus(true)
    try {
      await propertyService.update(prop._id, { status: newStatus })
      setCurrentStatus(newStatus)
      toast.success(`Status updated to ${newStatus === 'APPROVED' ? 'Active' : newStatus}`)
      if (onStatusChange) onStatusChange(prop._id, newStatus)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div 
      className="property-row"
      style={{ 
        display: 'grid', 
        gridTemplateColumns: '80px 1fr auto auto auto', 
        gap: 16, 
        padding: '14px 20px', 
        background: '#ffffff', 
        border: '1px solid rgba(124,58,237,0.08)', 
        borderRadius: 14, 
        alignItems: 'center', 
        transition: 'all 0.2s'
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
      {/* Image */}
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

      {/* Title and views */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e', marginBottom: 4 }}>{prop.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(26,10,46,0.5)' }}>
          👁 {prop.views || 0} views
        </div>
      </div>

      {/* Price */}
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, color: '#1a0a2e', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {formattedPrice}
      </div>

      {/* Editable Status Dropdown */}
      <div>
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={updatingStatus}
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            background: statusStyle.bg,
            color: statusStyle.color,
            border: '1px solid rgba(124,58,237,0.2)',
            fontSize: 11,
            fontWeight: 600,
            cursor: updatingStatus ? 'not-allowed' : 'pointer',
            outline: 'none',
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Active</option>
          <option value="SOLD">Sold</option>
          <option value="RENTED">Rented</option>
        </select>
      </div>

      {/* Buttons */}
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
        <button 
          onClick={() => onDelete(prop._id)} 
          style={{ 
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', 
            background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, 
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

/* ── Inquiry Card (light theme) ── */
function InquiryCard({ inquiry, onRespond, onOpenConversation }) {
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRespond = async () => {
    if (!reply.trim()) return
    setLoading(true)
    try {
      await inquiryService.respond(inquiry._id, reply)
      toast.success('Reply sent!')
      setReplying(false)
      onRespond?.(inquiry._id, reply)
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setLoading(false)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
            {getInitials(inquiry.user?.name || '?')}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a0a2e' }}>{inquiry.user?.name || 'Buyer'}</div>
            <div style={{ fontSize: 12, color: 'rgba(26,10,46,0.5)' }}>{inquiry.user?.email} · {inquiry.user?.phone}</div>
          </div>
        </div>
        <span style={{ fontSize: 11.5, color: 'rgba(26,10,46,0.4)' }}>{timeAgo(inquiry.createdAt)}</span>
      </div>
      <p style={{ fontSize: 13.5, color: 'rgba(26,10,46,0.7)', lineHeight: 1.65, marginBottom: 10, fontStyle: 'italic' }}>
        "{inquiry.message}"
      </p>
      <div style={{ fontSize: 12, color: 'rgba(26,10,46,0.5)', marginBottom: 12 }}>
        Property: {inquiry.property?.title || '—'}
      </div>

      {inquiry.response ? (
        <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>YOUR REPLY</div>
          <p style={{ fontSize: 13, color: 'rgba(26,10,46,0.7)' }}>{inquiry.response}</p>
        </div>
      ) : replying ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." style={{ flex: 1, height: 40, background: '#f9f9ff', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '0 12px', color: '#1a0a2e', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif" }} />
          <button onClick={handleRespond} disabled={loading} style={{ padding: '0 14px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? '…' : 'Send'}</button>
          <button onClick={() => setReplying(false)} style={{ padding: '0 10px', background: 'none', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, color: 'rgba(26,10,46,0.5)', cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setReplying(true)} style={{ padding: '7px 14px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, color: '#7c3aed', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↩ Reply</button>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={() => onOpenConversation?.(inquiry)}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.25)', background: '#fff', color: '#7c3aed', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Open Chat
        </button>
      </div>
    </div>
  )
}

/* ── Bar Chart (light theme) ── */
function BarChart({ data, label, color = '#7c3aed' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,10,46,0.6)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 100 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: `linear-gradient(180deg,${color},${color}88)`, height: `${(d.value / max) * 80}px`, minHeight: 4, transition: 'height 0.6s ease' }} />
            <span style={{ fontSize: 10, color: 'rgba(26,10,46,0.4)', whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Empty State (light theme) ── */
function EmptyState({ icon, title, sub, btn, to }) {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(124,58,237,0.08)' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: '#1a0a2e', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ color: 'rgba(26,10,46,0.5)', fontSize: 14, marginBottom: 20 }}>{sub}</p>
      <button 
        onClick={() => navigate(to)} 
        style={{ 
          padding: '10px 24px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', 
          border: 'none', borderRadius: 40, color: '#fff', fontSize: 14, fontWeight: 600, 
          cursor: 'pointer', transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {btn}
      </button>
    </div>
  )
}

/* ── Main Component ── */
export default function OwnerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [listings, setListings] = useState([])
  const [leads, setLeads] = useState([])
  const [leadSearch, setLeadSearch] = useState('')
  const [activeInquiry, setActiveInquiry] = useState(null)
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const inquiryNotificationRef = useRef({})
  const inquiryPollBootstrappedRef = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propsRes = await propertyService.getByOwner(user._id)
        const listingsData = propsRes.data || propsRes || []
        setListings(listingsData)

        const inquiriesRes = await inquiryService.getAll()
        const allInquiries = inquiriesRes.data || inquiriesRes || []
        const propertyIds = listingsData.map(p => p._id.toString())
        const filteredLeads = allInquiries.filter(inq => 
          inq.property && propertyIds.includes(inq.property._id?.toString())
        )
        setLeads(filteredLeads)

        setStats({
          activeListings: listingsData.filter(p => p.status !== 'SOLD' && p.status !== 'RENTED').length,
          totalViews: listingsData.reduce((acc, p) => acc + (p.views || 0), 0),
          totalInquiries: filteredLeads.length,
          mon: 12, tue: 19, wed: 8, thu: 25, fri: 30, sat: 22, sun: 15,
        })
      } catch (error) {
        console.error('Error fetching owner dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchData()
  }, [user])

  useEffect(() => {
    if (!user?._id) return

    let cancelled = false

    const pollOwnerInquiryNotifications = async () => {
      try {
        const inquiriesPayload = await inquiryService.getAll()
        const allInquiries = inquiriesPayload?.data || inquiriesPayload || []
        const propertyIds = new Set((listings || []).map((property) => property?._id?.toString()).filter(Boolean))
        const ownerInquiries = propertyIds.size
          ? allInquiries.filter((inquiry) => propertyIds.has(inquiry?.property?._id?.toString()))
          : []

        const nextMap = {}
        ownerInquiries.forEach((inquiry) => {
          const inquiryId = inquiry?._id
          if (!inquiryId) return
          const createdTs = inquiry?.createdAt ? new Date(inquiry.createdAt).getTime() : Date.now()
          nextMap[inquiryId] = createdTs

          const seenTs = inquiryNotificationRef.current[inquiryId]
          if (!inquiryPollBootstrappedRef.current || seenTs != null) return

          // NotificationBell handles real-time toast notifications globally.
        })

        if (!cancelled) {
          setLeads(ownerInquiries)
          inquiryNotificationRef.current = nextMap
          if (!inquiryPollBootstrappedRef.current) {
            inquiryPollBootstrappedRef.current = true
          }
        }
      } catch {
        // Keep polling silent on transient failures.
      }
    }

    pollOwnerInquiryNotifications()
    const timer = window.setInterval(pollOwnerInquiryNotifications, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id, listings])

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return
    try {
      await propertyService.delete(id)
      setListings(l => l.filter(p => p._id !== id))
      toast.success('Listing deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleLeadRespond = (id, reply) => {
    setLeads(l => l.map(lead => lead._id === id ? { ...lead, response: reply } : lead))
  }

  const handleStatusChange = (id, newStatus) => {
    setListings(prev => prev.map(item => 
      item._id === id ? { ...item, status: newStatus } : item
    ))
    setStats(prev => ({
      ...prev,
      activeListings: prev.activeListings + (newStatus === 'APPROVED' ? 1 : newStatus === 'SOLD' || newStatus === 'RENTED' ? -1 : 0)
    }))
  }

  const filteredLeads = leads
    .slice()
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    .filter((lead) => {
      const keyword = leadSearch.trim().toLowerCase()
      if (!keyword) return true
      const name = String(lead?.user?.name || lead?.name || '').toLowerCase()
      return name.includes(keyword)
    })

  const viewsData = [
    { label: 'Mon', value: stats.mon || 12 },
    { label: 'Tue', value: stats.tue || 19 },
    { label: 'Wed', value: stats.wed || 8 },
    { label: 'Thu', value: stats.thu || 25 },
    { label: 'Fri', value: stats.fri || 30 },
    { label: 'Sat', value: stats.sat || 22 },
    { label: 'Sun', value: stats.sun || 15 },
  ]

  const tabContent = [
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard icon="🏘" label="Active Listings" value={stats.activeListings || 0} change="2 this week" up />
        <StatCard icon="👥" label="Total Inquiries" value={stats.totalInquiries || 0} change="+5" up />
        <StatCard icon="👁" label="Profile Views" value={stats.totalViews || 0} change="+12%" up />
        <StatCard icon="⭐" label="Avg Rating" value={stats.avgRating ? `${stats.avgRating}/5` : '—'} />
      </div>
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(124,58,237,0.1)', padding: 20, marginBottom: 32 }}>
        <BarChart data={viewsData} label="Property Views This Week" />
      </div>
      <button
        onClick={() => navigate('/protected/agent')}
        style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
      >
        + Post New Property
      </button>
    </div>,
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e' }}>{listings.length} Properties</span>
        <button onClick={() => navigate('/protected/agent')} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add New</button>
      </div>
      {listings.length === 0 ? (
        <EmptyState icon="🏘" title="No properties yet" sub="Add your first property listing to get started" btn="Post Property" to="/protected/agent" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {listings.map(p => (
            <PropertyRow 
              key={p._id} 
              prop={p} 
              onDelete={handleDeleteListing} 
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>,
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 20 }}>{leads.length} Total Inquiries</div>
      <input
        type="text"
        value={leadSearch}
        onChange={(event) => setLeadSearch(event.target.value)}
        placeholder="Search buyer name..."
        style={{ width: '100%', maxWidth: 320, height: 36, borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', color: '#1a0a2e', padding: '0 12px', fontSize: 13, marginBottom: 14, outline: 'none' }}
      />
      {leads.length === 0 ? (
        <EmptyState icon="💬" title="No inquiries yet" sub="Leads from potential buyers will appear here" btn="View My Listings" to="/dashboard/owner" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredLeads.map(lead => <InquiryCard key={lead._id} inquiry={lead} onRespond={handleLeadRespond} onOpenConversation={setActiveInquiry} />)}
        </div>
      )}
    </div>,
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
        {[
          { icon: '📊', label: 'Total Views', value: stats.totalViews || 0 },
          { icon: '💰', label: 'Total Value', value: stats.totalValue ? formatPrice(stats.totalValue) : '—' },
          { icon: '📈', label: 'Conversion Rate', value: stats.conversionRate ? `${stats.conversionRate}%` : '—' },
          { icon: '⭐', label: 'Avg Response Time', value: stats.avgResponse || '< 2h' },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>
    </div>,
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: "'DM Sans',sans-serif", color: '#1a0a2e' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box;}
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .owner-header-row {
            flex-direction: column !important;
            gap: 16px !important;
            align-items: flex-start !important;
          }
          .property-row {
            grid-template-columns: 80px 1fr auto !important;
            gap: 12px !important;
          }
          .property-row > div:nth-child(3), /* price */
          .property-row > div:nth-child(4) { /* status dropdown */
            grid-column: span 2;
            text-align: left !important;
            justify-self: start !important;
          }
          .property-row > div:nth-child(5) { /* buttons */
            grid-column: span 3;
            justify-content: flex-start !important;
            margin-top: 4px;
          }
          .stat-cards {
            grid-template-columns: 1fr !important;
          }
          .charts-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .chart-container {
            height: 250px !important;
          }
        }
        
        @media (max-width: 480px) {
          .property-row {
            grid-template-columns: 60px 1fr !important;
            gap: 8px !important;
            padding: 12px !important;
          }
          .property-row > div:nth-child(2) { /* title+views */
            font-size: 13px !important;
          }
          .property-row > div:nth-child(3),
          .property-row > div:nth-child(4) {
            grid-column: span 2;
            margin-left: 68px;
          }
          .property-row > div:nth-child(5) {
            grid-column: span 2;
            margin-left: 68px;
          }
          .property-row img {
            width: 60px !important;
            height: 50px !important;
          }
          .chart-container {
            height: 220px !important;
          }
        }
      `}</style>

      <div style={{ background: '#ffffff', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.1)', padding: '20px 6vw', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="owner-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, 
                fontWeight: 800, color: '#fff', boxShadow: '0 6px 20px rgba(124,58,237,0.25)'
              }}>
                {getInitials(user?.name || 'Owner')}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#1a0a2e' }}>
                  Owner Dashboard
                </div>
                <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)', marginTop: 2 }}>
                  {user?.email} · <span style={{ color: '#7c3aed', fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 20px', background: '#ffffff', border: '1px solid rgba(124,58,237,0.22)',
                  borderRadius: 40, color: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ← Back to Website
              </button>
              <NotificationBell user={user} />
              <button 
                onClick={() => navigate('/protected/agent')} 
                style={{ 
                  padding: '10px 20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', 
                  borderRadius: 40, color: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer', 
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#7c3aed';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                  e.currentTarget.style.color = '#7c3aed';
                }}
              >
                + Post Property
              </button>
              <button 
                onClick={() => { logout(); navigate('/') }} 
                style={{ 
                  padding: '10px 20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', 
                  borderRadius: 40, color: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer', 
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                  e.currentTarget.style.color = '#7c3aed';
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map((t, i) => (
              <button 
                key={t} 
                onClick={() => setTab(i)}
                style={{ 
                  padding: '10px 22px', borderRadius: 40, border: 'none', fontSize: 14, fontWeight: 600, 
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                  background: tab === i ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(124,58,237,0.08)',
                  color: tab === i ? '#fff' : '#7c3aed',
                }}
                onMouseEnter={e => {
                  if (tab !== i) e.currentTarget.style.background = 'rgba(124,58,237,0.15)';
                }}
                onMouseLeave={e => {
                  if (tab !== i) e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                }}
              >
                {t}
                {i === 0 && listings.length > 0 && (
                  <span style={{ marginLeft: 6, background: tab === i ? '#fff' : '#7c3aed', color: tab === i ? '#7c3aed' : '#fff', borderRadius: 20, padding: '0 6px', fontSize: 11 }}>
                    {listings.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

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
