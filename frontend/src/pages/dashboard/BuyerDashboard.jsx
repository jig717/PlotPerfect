import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService, inquiryService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, timeAgo, getInitials } from '../../utils/index'
import { toast } from 'react-toastify'

const TABS = ['Overview', 'Saved Properties', 'Scheduled Visits', 'My Inquiries']

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

/* ── Property Row (light theme) with safety guard ── */
function PropRow({ prop, onUnsave, favoriteId }) {
  const navigate = useNavigate()
  
  // ✅ Guard against null/undefined prop
  if (!prop) {
    return (
      <div style={{ padding: 16, background: '#f9f9ff', borderRadius: 12, border: '1px solid rgba(124,58,237,0.08)', textAlign: 'center', color: '#ef4444' }}>
        ⚠️ Property data missing. Please remove this favorite.
      </div>
    )
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
            onClick={() => onUnsave(favoriteId || prop._id)} 
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
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Visit Card (light theme) ── */
function VisitCard({ visit }) {
  const navigate = useNavigate()
  const d = visit.scheduled_date ? new Date(visit.scheduled_date) : null
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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>{visit.property?.title || 'Property Visit'}</div>
        <span style={{ 
          fontSize: 11, padding: '3px 10px', borderRadius: 20, 
          background: visit.visit_status === 'CONFIRMED' ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.08)', 
          color: visit.visit_status === 'CONFIRMED' ? '#16a34a' : '#7c3aed', 
          fontWeight: 600, textTransform: 'capitalize' 
        }}>
          {visit.visit_status || 'Requested'}
        </span>
      </div>
      {d && (
        <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.6)', marginBottom: 6 }}>
          📅 {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} 
          at {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)', marginBottom: 12 }}>📍 {visit.property?.city}</div>
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
    </div>
  )
}

/* ── Inquiry Card (light theme) ── */
function InquiryCard({ inquiry }) {
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
    </div>
  )
}

/* ── Overview Tab ── */
function Overview({ saved, visits, inquiries }) {
  const navigate = useNavigate()
  // Ensure saved items have a valid property (filter out nulls)
  const validSaved = saved.filter(item => item && item.property)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20, marginBottom: 32 }}>
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
            <button 
              onClick={() => {}} 
              style={{ marginTop: 12, fontSize: 13, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}
            >
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
        <button 
          onClick={() => navigate('/properties')} 
          style={{ 
            padding: '12px 32px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', 
            border: 'none', borderRadius: 40, color: '#fff', fontSize: 14, fontWeight: 700, 
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
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

/* ── Main Dashboard ── */
export default function BuyerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [saved, setSaved] = useState([])
  const [visits, setVisits] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // Fetch saved properties (favorites)
        const savedRes = await userService.getSaved(user._id);
        let favs = savedRes?.message || savedRes?.data || savedRes || [];
        // ✅ Filter out favorites where property is null (deleted property)
        const validFavs = Array.isArray(favs) ? favs.filter(fav => fav && fav.property) : [];
        setSaved(validFavs);

        // Fetch scheduled visits
        const visitsRes = await userService.getVisits();
        const visitsData = visitsRes?.data || visitsRes || [];
        // Filter visits by the current buyer (buyer_id)
        const userVisits = Array.isArray(visitsData) ? visitsData.filter(v => v.buyer_id === user._id) : [];
        setVisits(userVisits);

        // Fetch user inquiries
        const inquiriesRes = await inquiryService.getMine(user._id);
        const inquiriesData = inquiriesRes?.data || inquiriesRes || [];
        setInquiries(Array.isArray(inquiriesData) ? inquiriesData : []);
      } catch (error) {
        console.error('Error fetching buyer dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleUnsave = async (favoriteId) => {
    if (!favoriteId) {
      toast.error('Invalid favorite ID');
      return;
    }
    try {
      await userService.unsave(favoriteId);
      setSaved(prev => prev.filter(fav => fav._id !== favoriteId));
      toast.success('Property removed from saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove');
    }
  };

  const tabContent = [
    <Overview saved={saved} visits={visits} inquiries={inquiries} />,
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {saved.length === 0 ? (
        <EmptyState icon="❤️" title="No saved properties" sub="Save properties to view them here" btn="Browse Properties" to="/properties" />
      ) : (
        saved.map(fav => (
          <PropRow 
            key={fav._id} 
            prop={fav.property} 
            favoriteId={fav._id} 
            onUnsave={handleUnsave} 
          />
        ))
      )}
    </div>,
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {visits.length === 0 ? (
        <EmptyState icon="📅" title="No visits scheduled" sub="Schedule property visits to track them here" btn="Browse Properties" to="/properties" />
      ) : (
        visits.map(visit => <VisitCard key={visit._id} visit={visit} />)
      )}
    </div>,
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {inquiries.length === 0 ? (
        <EmptyState icon="💬" title="No inquiries yet" sub="Contact property owners to see inquiries here" btn="Browse Properties" to="/properties" />
      ) : (
        inquiries.map(inq => <InquiryCard key={inq._id} inquiry={inq} />)
      )}
    </div>,
  ];

  const firstName = user?.name?.split(' ')[0] || user?.username?.split(' ')[0] || 'there';

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
              <div style={{ 
                width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, 
                fontWeight: 800, color: '#fff', boxShadow: '0 6px 20px rgba(124,58,237,0.25)'
              }}>
                {getInitials(user?.name || user?.username || 'U')}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#1a0a2e' }}>
                  Welcome back, {firstName}!
                </div>
                <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)', marginTop: 2 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => navigate('/properties')} 
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
                Browse Properties
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

          {/* Tabs */}
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
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
    </div>
  );
}