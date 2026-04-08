import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { agentService, propertyService, inquiryService, threadService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, timeAgo, getInitials } from '../../utils/index'
import { toast } from 'react-toastify'
import { Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler 
} from 'chart.js'
import visitService from '../../services/visitService'   
import ThreadPanel from '../../Components/messaging/ThreadPanel'
import NotificationBell from '../../Components/ui/NotificationBell'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

//  added 'Visit Requests' tab
const TABS = ['Overview','My Listings','Leads','Analytics','Visit Requests']

const extractVisitsList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.visits)) return payload.visits
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getVisitStatus = (visit) => visit?.status || visit?.visit_status || 'REQUESTED'

const getVisitDate = (visit) => visit?.scheduledDate || visit?.scheduled_date || null

const getVisitPropertyId = (visit) =>
  visit?.property?._id || visit?.propertyId || visit?.property_id || visit?.property || null

const getVisitBuyer = (visit) => visit?.buyer || visit?.user || visit?.buyerInfo || null

const extractThreads = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getParticipantUserId = (participant) =>
  participant?.user?._id || participant?.user || null

/* ── Stat Card (light mode) ── */
function StatCard({ icon, label, value, change, up=true }) {
  return (
    <div style={{ background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:'#f0eeff', border:'0.5px solid rgba(124,58,237,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#7c3aed' }}>{icon}</div>
        {change && <span style={{ fontSize:12, fontWeight:600, padding:'3px 8px', borderRadius:6, background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: up ? '#16a34a' : '#dc2626' }}>{up?'↑':'↓'} {change}</span>}
      </div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color:'#1a0a2e', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, color:'rgba(26,10,46,0.5)', marginTop:5 }}>{label}</div>
    </div>
  )
}

/* ── Listing Row ── */
function ListingRow({ prop, onDelete }) {
  const navigate = useNavigate()
  const statusColor = { active:'#16a34a', pending:'#f59e0b', sold:'#a78bfa', rented:'#0891b2' }
  const status = prop.status || 'active'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'60px 1fr auto auto', gap:14, padding:'14px 16px', background:'#f9f9ff', border:'0.5px solid rgba(124,58,237,0.1)', borderRadius:12, alignItems:'center' }}>
      <div style={{ width:60, height:50, borderRadius:8, background:'linear-gradient(135deg,#f0eeff,#e8e4ff)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#7c3aed' }}>
        {prop.images?.[0] ? <img src={prop.images[0]} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '🏠'}
      </div>
      <div>
        <div style={{ fontSize:14.5, fontWeight:700, color:'#1a0a2e', marginBottom:3 }}>{prop.title}</div>
        <div style={{ fontSize:12, color:'rgba(26,10,46,0.5)', display:'flex', gap:10 }}>
          <span>📍 {prop.city}</span>
          {prop.views && <span>👁 {prop.views} views</span>}
          <span>🕒 {timeAgo(prop.createdAt)}</span>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:800, color:'#1a0a2e' }}>{formatPrice(prop.price)}</div>
        <span style={{ fontSize:11, padding:'2px 9px', borderRadius:5, background:`${statusColor[status]}20`, color:statusColor[status], fontWeight:700, textTransform:'capitalize', marginTop:4, display:'inline-block' }}>{status}</span>
      </div>
      <div style={{ display:'flex', gap:7 }}>
        <button onClick={() => navigate(`/property/${prop._id||prop.id}`)} style={{ padding:'6px 12px', borderRadius:7, border:'0.5px solid rgba(124,58,237,0.4)', color:'#7c3aed', background:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>View</button>
        <button onClick={() => onDelete(prop._id||prop.id)} style={{ padding:'6px 10px', borderRadius:7, border:'0.5px solid rgba(239,68,68,0.3)', color:'#ef4444', background:'none', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ── Lead Card ── */
function LeadCard({ lead, onRespond, onOpenConversation }) {
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRespond = async () => {
    if (!reply.trim()) return
    setLoading(true)
    try {
      await inquiryService.respond(lead._id, reply)
      toast.success('Reply sent!')
      setReplying(false)
      onRespond?.(lead._id, reply)
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding:16, background:'#f9f9ff', border:'0.5px solid rgba(124,58,237,0.1)', borderRadius:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>
            {getInitials(lead.name || lead.sender?.username || '?')}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#1a0a2e' }}>{lead.name || lead.sender?.username || 'Buyer'}</div>
            <div style={{ fontSize:12, color:'rgba(26,10,46,0.5)' }}>{lead.email} · {lead.phone}</div>
          </div>
        </div>
        <span style={{ fontSize:11.5, color:'rgba(26,10,46,0.4)' }}>{timeAgo(lead.createdAt)}</span>
      </div>
      <p style={{ fontSize:13.5, color:'rgba(26,10,46,0.7)', lineHeight:1.65, marginBottom:10, fontStyle:'italic' }}>"{lead.message}"</p>
      <div style={{ fontSize:12, color:'rgba(26,10,46,0.5)', marginBottom:12 }}>Property: {lead.property?.title || '—'}</div>

      {lead.response
        ? <div style={{ padding:'10px 14px', background:'rgba(34,197,94,0.07)', border:'0.5px solid rgba(34,197,94,0.2)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'#16a34a', fontWeight:700, marginBottom:4 }}>YOUR REPLY</div>
            <p style={{ fontSize:13, color:'rgba(26,10,46,0.7)' }}>{lead.response}</p>
          </div>
        : replying
          ? <div style={{ display:'flex', gap:8 }}>
              <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your reply..." style={{ flex:1, height:40, background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, padding:'0 12px', color:'#1a0a2e', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
              <button onClick={handleRespond} disabled={loading} style={{ padding:'0 14px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1 }}>{loading?'…':'Send'}</button>
              <button onClick={()=>setReplying(false)} style={{ padding:'0 10px', background:'none', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, color:'rgba(26,10,46,0.5)', cursor:'pointer' }}>✕</button>
            </div>
          : <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={()=>setReplying(true)} style={{ padding:'7px 14px', background:'rgba(124,58,237,0.08)', border:'0.5px solid rgba(124,58,237,0.3)', borderRadius:8, color:'#7c3aed', fontSize:13, fontWeight:600, cursor:'pointer' }}>↩ Reply</button>
              <button onClick={() => onOpenConversation?.(lead)} style={{ padding:'7px 14px', background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, color:'#1a0a2e', fontSize:13, fontWeight:600, cursor:'pointer' }}>Open Thread</button>
            </div>
      }
      {(lead.response || replying) && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
          <button onClick={() => onOpenConversation?.(lead)} style={{ padding:'7px 14px', background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, color:'#1a0a2e', fontSize:13, fontWeight:600, cursor:'pointer' }}>Open Thread</button>
        </div>
      )}
    </div>
  )
}

/* ── Line Chart ── */
function LineChart({ data, labels, label }) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.05)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#1a0a2e' } },
      tooltip: { backgroundColor: '#fff', titleColor: '#1a0a2e', bodyColor: '#1a0a2e', borderColor: '#7c3aed', borderWidth: 1 },
    },
    scales: {
      y: { grid: { color: '#e8e4ff' }, ticks: { color: '#1a0a2e' } },
      x: { grid: { display: false }, ticks: { color: '#1a0a2e' } },
    },
  }

  return (
    <div className="chart-container" style={{ height: 300 }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

/* ── Pie Chart ── */
function PieChart({ data, labels }) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6'],
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#1a0a2e' } },
      tooltip: { backgroundColor: '#fff', titleColor: '#1a0a2e', bodyColor: '#1a0a2e' },
    },
  }

  return (
    <div className="chart-container" style={{ height: 280 }}>
      <Pie data={chartData} options={options} />
    </div>
  )
}

/* ── Overview (with real stats) ── */
function Overview({ stats, listings, leads, dailyViews, leadSources }) {
  const navigate = useNavigate()

  const viewLabels = dailyViews.length > 0 ? dailyViews.map(d => d.date.slice(5)) : []
  const viewData = dailyViews.length > 0 ? dailyViews.map(d => d.views) : []

  const leadLabels = Object.keys(leadSources).length > 0 ? Object.keys(leadSources) : []
  const leadData = Object.keys(leadSources).length > 0 ? Object.values(leadSources) : []

  const finalLeadLabels = leadLabels.length ? leadLabels : ['No data']
  const finalLeadData = leadData.length ? leadData : [1]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16, marginBottom:32 }}>
        <StatCard icon="🏘" label="Active Listings" value={stats.activeListings || listings.length || 0} change="3 this month" up/>
        <StatCard icon="👥" label="Total Leads"     value={stats.totalLeads    || leads.length    || 0} change="5 this week" up/>
        <StatCard icon="📈" label="Conversion Rate" value={stats.conversionRate ? `${stats.conversionRate}%` : '12%'} change="+2%" up/>
        <StatCard icon="⏱️" label="Avg Response Time" value={stats.avgResponseTime  || '1.5h'} change="-30m" up/>
      </div>

      <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:32 }}>
        <div style={{ background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:20 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>Views Trend (Last 7 Days)</h3>
          {viewData.length > 0 ? (
            <LineChart data={viewData} labels={viewLabels} label="Views" />
          ) : (
            <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:14 }}>No data available</div>
          )}
        </div>
        <div style={{ background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:20 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>Lead Sources</h3>
          {leadLabels.length > 0 ? (
            <PieChart data={finalLeadData} labels={finalLeadLabels} />
          ) : (
            <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:14 }}>No lead source data</div>
          )}
        </div>
      </div>

      {listings.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:14 }}>Recent Listings</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {listings.slice(0,3).map((p,i) => <ListingRow key={p._id||i} prop={p} onDelete={()=>{}}/>)}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/protected/agent')}
        style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
        + Post New Property
      </button>
    </div>
  )
}

/* ── Agent Visit Card (for the new tab) ── */
function AgentVisitCard({ visit, onStatusChange, updating }) {
  const visitStatus = getVisitStatus(visit)
  const visitDate = getVisitDate(visit)
  const d = visitDate ? new Date(visitDate) : null
  const buyer = getVisitBuyer(visit)
  const propertyCity = visit.property?.location?.city || visit.property?.city || 'Location not specified'
  const propertyAddress = visit.property?.location?.address || visit.property?.locality || ''
  const statusColors = {
    REQUESTED: { bg: 'rgba(124,58,237,0.08)', color: '#7c3aed', label: 'Pending' },
    CONFIRMED: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', label: 'Confirmed' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: 'Cancelled' },
    COMPLETED: { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', label: 'Completed' },
  }
  const style = statusColors[visitStatus] || statusColors.REQUESTED

  return (
    <div style={{ padding:16, background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#1a0a2e', marginBottom:4 }}>{visit.property?.title || 'Property Visit'}</h3>
          <p style={{ fontSize:13, color:'rgba(26,10,46,0.6)' }}>
            📍 {propertyCity}{propertyAddress ? ` · ${propertyAddress}` : ''}
          </p>
          {d && (
            <p style={{ fontSize:13, marginTop:6 }}>
              📅 {d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
              {' at '}
              {d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
            </p>
          )}
          <p style={{ fontSize:13, color:'rgba(26,10,46,0.6)', marginTop:4 }}>
            👤 Buyer: {buyer?.name || buyer?.username || visit.buyer_name || 'Buyer'}{buyer?.email ? ` (${buyer.email})` : ''}
          </p>
          {visit.notes && (
            <p style={{ fontSize:12, fontStyle:'italic', color:'rgba(26,10,46,0.5)', marginTop:6 }}>📝 {visit.notes}</p>
          )}
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:style.bg, color:style.color }}>
            {style.label}
          </span>
          {visitStatus === 'REQUESTED' && (
            <div style={{ marginTop:12, display:'flex', gap:8 }}>
              <button
                onClick={() => onStatusChange(visit._id, 'CONFIRMED')}
                disabled={updating === visit._id}
                style={{ padding:'6px 14px', background:'#16a34a', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
              >
                Confirm
              </button>
              <button
                onClick={() => onStatusChange(visit._id, 'CANCELLED')}
                disabled={updating === visit._id}
                style={{ padding:'6px 14px', background:'#dc2626', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}
          {visitStatus === 'CONFIRMED' && (
            <button
              onClick={() => onStatusChange(visit._id, 'COMPLETED')}
              disabled={updating === visit._id}
              style={{ marginTop:12, padding:'6px 14px', background:'#2563eb', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              Mark Completed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main AgentDashboard ── */
export default function AgentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [listings, setListings] = useState([])
  const [leads, setLeads] = useState([])
  const [leadSearch, setLeadSearch] = useState('')
  const [activeLead, setActiveLead] = useState(null)
  const [stats, setStats] = useState({})
  const [dailyViews, setDailyViews] = useState([])
  const [leadSources, setLeadSources] = useState({})
  const [loading, setLoading] = useState(true)

  // NEW: state for visits
  const [visits, setVisits] = useState([])
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [updatingVisitId, setUpdatingVisitId] = useState(null)
  const threadNotificationRef = useRef({})
  const threadPollBootstrappedRef = useRef(false)
  const inquiryNotificationRef = useRef({})
  const inquiryPollBootstrappedRef = useRef(false)

  // Fetch agent's visits
  const fetchAgentVisits = async (agentListings = listings) => {
    setVisitsLoading(true)
    try {
      const res = await visitService.getAgentVisits({ limit: 100 })
      const visitList = extractVisitsList(res)
      const listingIds = new Set(
        (Array.isArray(agentListings) ? agentListings : [])
          .map((listing) => listing?._id || listing?.id)
          .filter(Boolean)
      )
      const filteredVisits = listingIds.size
        ? visitList.filter((visit) => listingIds.has(getVisitPropertyId(visit)))
        : visitList
      setVisits(filteredVisits)
    } catch (err) {
      console.error('Failed to fetch visits:', err)
      toast.error('Could not load visit requests')
    } finally {
      setVisitsLoading(false)
    }
  }

  // Update visit status (confirm/cancel/complete)
  const handleVisitStatus = async (visitId, newStatus) => {
    setUpdatingVisitId(visitId)
    try {
      await visitService.updateStatus(visitId, newStatus)
      toast.success(`Visit ${newStatus.toLowerCase()} successfully`)
      setVisits(prev => prev.map(v => v._id === visitId ? { ...v, status: newStatus, visit_status: newStatus } : v))
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingVisitId(null)
    }
  }

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        const [propsRes, inquiriesRes, statsRes, dailyRes, leadRes] = await Promise.allSettled([
          propertyService.getByOwner(user._id),
          inquiryService.getForAgent(),
          agentService.getStats(),
          agentService.getDailyViews(),
          agentService.getLeadSources(),
        ])

        if (propsRes.status === 'fulfilled') {
          const listingsData = propsRes.value.data || []
          setListings(listingsData)
          await fetchAgentVisits(listingsData)
        } else {
          console.error('Failed to fetch listings:', propsRes.reason)
          await fetchAgentVisits([])
        }

        if (inquiriesRes.status === 'fulfilled') {
          const leadsData = inquiriesRes.value.data || []
          setLeads(leadsData)
        } else {
          console.error('Failed to fetch leads:', inquiriesRes.reason)
        }

        if (statsRes.status === 'fulfilled') {
          const statsData = statsRes.value
          setStats({
            totalViews: statsData.totalViews,
            totalValue: statsData.totalValue,
            conversionRate: statsData.conversionRate,
            avgResponseTime: statsData.avgResponseTime,
            activeListings: statsData.activeListings,
            totalLeads: statsData.totalInquiries,
          })
        } else {
          console.error('Failed to fetch stats:', statsRes.reason)
        }

        if (dailyRes.status === 'fulfilled') {
          setDailyViews(dailyRes.value || [])
        } else {
          console.error('Failed to fetch daily views:', dailyRes.reason)
        }

        if (leadRes.status === 'fulfilled') {
          setLeadSources(leadRes.value || {})
        } else {
          console.error('Failed to fetch lead sources:', leadRes.reason)
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    fetchAgentVisits()   // ✅ load visits separately
  }, [user])

  useEffect(() => {
    if (!user?._id) return

    let cancelled = false

    const pollLeadNotifications = async () => {
      try {
        const payload = await inquiryService.getForAgent()
        const nextLeads = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
        const nextMap = {}

        nextLeads.forEach((lead) => {
          const leadId = lead?._id
          if (!leadId) return
          const createdTs = lead?.createdAt ? new Date(lead.createdAt).getTime() : Date.now()
          nextMap[leadId] = createdTs

          const seenTs = inquiryNotificationRef.current[leadId]
          if (!inquiryPollBootstrappedRef.current || seenTs != null) return

          // NotificationBell handles real-time toast notifications globally.
        })

        if (!cancelled) {
          setLeads(nextLeads)
          inquiryNotificationRef.current = nextMap
          if (!inquiryPollBootstrappedRef.current) {
            inquiryPollBootstrappedRef.current = true
          }
        }
      } catch {
        // Keep polling silent on transient failures.
      }
    }

    pollLeadNotifications()
    const timer = window.setInterval(pollLeadNotifications, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

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
        // Silent polling failure: avoid noisy toasts during transient network failures.
      }
    }

    pollThreadNotifications()
    const timer = window.setInterval(pollThreadNotifications, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

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

  const handleLeadRespond = async (id, reply) => {
    setLeads(l => l.map(lead => lead._id === id ? { ...lead, response: reply } : lead))
    try {
      await inquiryService.respond(id, reply)
      toast.success('Reply sent!')
    } catch {
      setLeads(l => l.map(lead => lead._id === id ? { ...lead, response: undefined } : lead))
      toast.error('Failed to send reply')
    }
  }

  const filteredLeads = leads
    .slice()
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    .filter((lead) => {
      const keyword = leadSearch.trim().toLowerCase()
      if (!keyword) return true
      const name = String(lead?.name || lead?.sender?.username || lead?.user?.name || '').toLowerCase()
      return name.includes(keyword)
    })

  // EmptyState component (used inside tabContent)
  const EmptyState = ({ icon, title, sub, btn, to }) => (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:42, marginBottom:14 }}>{icon}</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:800, color:'#1a0a2e', marginBottom:8 }}>{title}</h3>
      <p style={{ color:'rgba(26,10,46,0.5)', fontSize:14, marginBottom:20 }}>{sub}</p>
      <button onClick={() => navigate(to)} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>{btn}</button>
    </div>
  )

  const tabContent = [
    <Overview stats={stats} listings={listings} leads={leads} dailyViews={dailyViews} leadSources={leadSources} />,
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <span style={{ fontSize:15, fontWeight:700, color:'#1a0a2e' }}>{listings.length} Listings</span>
        <button onClick={() => navigate('/protected/agent')} style={{ padding:'9px 18px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Add New</button>
      </div>
      {listings.length === 0
        ? <EmptyState icon="🏘" title="No listings yet" sub="Add your first property listing to get started" btn="Post Property" to="/protected/agent"/>
        : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{listings.map((p,i)=><ListingRow key={p._id||i} prop={p} onDelete={handleDeleteListing}/>)}</div>
      }
    </div>,
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>{leads.length} Total Leads</div>
      <input
        type="text"
        value={leadSearch}
        onChange={(event) => setLeadSearch(event.target.value)}
        placeholder="Search buyer name..."
        style={{ width: '100%', maxWidth: 320, height: 36, borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', color: '#1a0a2e', padding: '0 12px', fontSize: 13, marginBottom: 14, outline: 'none' }}
      />
      {leads.length === 0
        ? <EmptyState icon="👥" title="No leads yet" sub="Leads from potential buyers will appear here" btn="View My Listings" to="/dashboard/agent"/>
        : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{filteredLeads.map((l,i)=><LeadCard key={l._id||i} lead={l} onRespond={handleLeadRespond} onOpenConversation={setActiveLead}/>)}</div>
      }
    </div>,
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
        {[
          { icon:'📊', label:'Total Views',     value:stats.totalViews    || 0 },
          { icon:'💰', label:'Total Value',     value:stats.totalValue    ? formatPrice(stats.totalValue) : '—' },
          { icon:'📈', label:'Conversion Rate', value:stats.conversionRate ? `${stats.conversionRate}%`  : '—' },
          { icon:'⭐', label:'Avg Response Time',value:stats.avgResponse  || '< 2h' },
        ].map(s=><StatCard key={s.label} {...s}/>)}
      </div>
    </div>,
    // NEW: Visit Requests tab
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>Visit Requests ({visits.length})</div>
      {visitsLoading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:140, background:'#f0eeff', borderRadius:14, animation:'pulse 1.5s infinite' }} />)}
        </div>
      ) : visits.length === 0 ? (
        <EmptyState icon="📅" title="No visit requests" sub="Buyers' visit requests will appear here" btn="View Properties" to="/properties" />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {visits.map(visit => (
            <AgentVisitCard
              key={visit._id}
              visit={visit}
              onStatusChange={handleVisitStatus}
              updating={updatingVisitId}
            />
          ))}
        </div>
      )}
    </div>,
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff', fontFamily:"'DM Sans',sans-serif", color:'#1a0a2e' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box;}
        
        @media (max-width: 768px) {
          .ag-header-row {
            flex-direction: column !important;
            gap: 12px !important;
            align-items: flex-start !important;
          }
          .charts-row {
            grid-template-columns: 1fr !important;
          }
          .chart-container {
            height: 250px !important;
          }
          .stats-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
          }
        }
        
        @media (max-width: 480px) {
          .chart-container {
            height: 220px !important;
          }
          .listing-row {
            grid-template-columns: 50px 1fr auto auto !important;
            gap: 8px !important;
          }
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>

      {/* Header */}
      <div style={{ background:'#ffffff', backdropFilter:'blur(20px)', borderBottom:'0.5px solid rgba(124,58,237,0.12)', padding:'20px 6vw' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="ag-header-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', boxShadow:'0 4px 16px rgba(124,58,237,0.2)' }}>
                {getInitials(user?.username || user?.name)}
              </div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:800, color:'#1a0a2e' }}>Agent Dashboard</div>
                <div style={{ fontSize:13, color:'rgba(26,10,46,0.5)', marginTop:2 }}>{user?.email} · <span style={{ color:'#7c3aed', fontWeight:600, textTransform:'capitalize' }}>{user?.role}</span></div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <NotificationBell user={user} />
              <button onClick={() => navigate('/protected/agent')} style={{ padding:'9px 18px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Post Property</button>
              <button onClick={() => { logout(); navigate('/') }} style={{ padding:'9px 14px', background:'rgba(124,58,237,0.08)', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:9, color:'#7c3aed', fontSize:13, fontWeight:600, cursor:'pointer' }}>Logout</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none' }}>
            {TABS.map((t,i) => (
              <button key={t} onClick={() => setTab(i)}
                style={{ padding:'9px 18px', borderRadius:9, border:'none', fontSize:13.5, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
                  background: tab===i ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(124,58,237,0.08)',
                  color: tab===i ? '#fff' : '#7c3aed',
                }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 6vw 60px' }}>
        {loading
          ? <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>{Array.from({length:4}).map((_,i)=><div key={i} style={{ height:110, background:'#f0eeff', borderRadius:14, animation:'pulse 1.5s infinite' }}/>)}</div>
          : tabContent[tab]
        }
      </div>
      {activeLead && (
        <ThreadPanel inquiry={activeLead} user={user} onClose={() => setActiveLead(null)} />
      )}
    </div>
  )
}
