import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inquiryService, propertyService, threadService, userService } from '../../services'
import { toast } from 'react-toastify'

const listFrom = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const normalizeRole = (role) => String(role || '').trim().toLowerCase()

const supportsInquiryAlerts = (role) =>
  ['agent', 'owner', 'admin', 'support'].includes(normalizeRole(role))

const supportsAdminEntityAlerts = (role) =>
  ['admin', 'support'].includes(normalizeRole(role))

const getId = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return value._id
  if (value.id) return value.id
  return null
}

const compactText = (value, limit = 70) => {
  const text = String(value || '').trim()
  if (!text) return 'New update'
  if (text.length <= limit) return text
  return `${text.slice(0, limit - 3)}...`
}

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const getDashboardRoute = (role) => {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return '/admin'
  if (normalized === 'support') return '/support'
  if (normalized === 'agent') return '/dashboard/agent'
  if (normalized === 'owner') return '/dashboard/owner'
  return '/dashboard/buyer'
}

export default function NotificationBell({ user }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState([])
  const [refreshToken, setRefreshToken] = useState(0)
  const rootRef = useRef(null)
  const seenRef = useRef({})
  const bootRef = useRef(false)

  const storageKey = useMemo(
    () => (user?._id ? `plotperfect.notifications.${user._id}` : null),
    [user?._id]
  )

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  )

  const persistSeen = (nextSeen) => {
    seenRef.current = nextSeen
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextSeen))
    } catch {
      // ignore local storage write issues
    }
  }

  const mergeItems = (incoming) => {
    if (!incoming.length) return
    setItems((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]))
      incoming.forEach((item) => map.set(item.id, item))
      return Array.from(map.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 24)
    })
  }

  useEffect(() => {
    if (!storageKey) return
    try {
      seenRef.current = JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch {
      seenRef.current = {}
    }
    setItems([])
    bootRef.current = false
    setRefreshToken((value) => value + 1)
  }, [storageKey])

  useEffect(() => {
    if (!user?._id) return
    let cancelled = false

    const poll = async () => {
      const seen = { ...seenRef.current }
      const incoming = []
      const booting = !bootRef.current

      try {
        const threadPayload = await threadService.getMine()
        const threads = listFrom(threadPayload)
        const changedThreads = threads.filter((thread) => {
          const threadId = thread?._id
          const lastTs = thread?.lastMessageAt ? new Date(thread.lastMessageAt).getTime() : 0
          if (!threadId || !lastTs) return false

          const sourceKey = `thread:${threadId}`
          if (booting) {
            seen[sourceKey] = Math.max(Number(seen[sourceKey] || 0), lastTs)
            return false
          }
          return lastTs > Number(seen[sourceKey] || 0)
        })

        const latestPairs = await Promise.all(
          changedThreads.slice(0, 8).map(async (thread) => {
            try {
              const messagesPayload = await threadService.getMessages(thread._id)
              const messages = listFrom(messagesPayload)
              return { thread, latest: messages[messages.length - 1] }
            } catch {
              return { thread, latest: null }
            }
          })
        )

        latestPairs.forEach(({ thread, latest }) => {
          const lastTs = thread?.lastMessageAt ? new Date(thread.lastMessageAt).getTime() : 0
          const sourceKey = `thread:${thread._id}`
          seen[sourceKey] = Math.max(Number(seen[sourceKey] || 0), lastTs)

          if (!latest) return
          if (String(getId(latest.sender)) === String(user._id)) return

          incoming.push({
            id: `${sourceKey}:${lastTs}`,
            sourceKey,
            type: 'message',
            threadId: thread._id,
            sender: latest?.sender?.name || latest?.sender?.email || 'New message',
            preview: compactText(latest?.content || thread?.title || 'You have a new message'),
            timestamp: lastTs,
            read: false,
          })
        })
      } catch {
        // silent polling failure
      }

      try {
        if (supportsInquiryAlerts(user?.role)) {
          const role = normalizeRole(user?.role)
          const inquiryPayload =
            role === 'agent' || role === 'owner'
              ? await inquiryService.getForAgent()
              : await inquiryService.getAll()
          const inquiries = listFrom(inquiryPayload)

          inquiries.forEach((inquiry) => {
            const inquiryId = inquiry?._id
            const createdTs = inquiry?.createdAt ? new Date(inquiry.createdAt).getTime() : 0
            if (!inquiryId || !createdTs) return

            const sourceKey = `inquiry:${inquiryId}`
            if (booting) {
              seen[sourceKey] = Math.max(Number(seen[sourceKey] || 0), createdTs)
              return
            }
            if (createdTs <= Number(seen[sourceKey] || 0)) return

            seen[sourceKey] = createdTs
            incoming.push({
              id: `${sourceKey}:${createdTs}`,
              sourceKey,
              type: 'inquiry',
              sender: inquiry?.user?.name || inquiry?.user?.email || inquiry?.name || 'Buyer',
              preview: compactText(
                inquiry?.message || `New inquiry on ${inquiry?.property?.title || 'a property'}`
              ),
              timestamp: createdTs,
              read: false,
            })
          })
        }
      } catch {
        // silent polling failure
      }

      try {
        if (supportsAdminEntityAlerts(user?.role)) {
          const [usersPayload, propertiesPayload] = await Promise.all([
            userService.getAllUsers(),
            propertyService.getAll({ limit: 100 }),
          ])

          listFrom(usersPayload).forEach((entry) => {
            const entityId = entry?._id
            const createdTs = entry?.createdAt ? new Date(entry.createdAt).getTime() : 0
            if (!entityId || !createdTs) return

            const sourceKey = `user:${entityId}`
            if (booting) {
              seen[sourceKey] = Math.max(Number(seen[sourceKey] || 0), createdTs)
              return
            }
            if (createdTs <= Number(seen[sourceKey] || 0)) return

            seen[sourceKey] = createdTs
            incoming.push({
              id: `${sourceKey}:${createdTs}`,
              sourceKey,
              type: 'user',
              entityId,
              sender: entry?.name || entry?.email || 'New user',
              preview: compactText(`${entry?.name || 'A new user'} joined as ${entry?.role || 'user'}`),
              timestamp: createdTs,
              read: false,
            })
          })

          listFrom(propertiesPayload).forEach((entry) => {
            const entityId = entry?._id
            const createdTs = entry?.createdAt ? new Date(entry.createdAt).getTime() : 0
            if (!entityId || !createdTs) return

            const sourceKey = `property:${entityId}`
            if (booting) {
              seen[sourceKey] = Math.max(Number(seen[sourceKey] || 0), createdTs)
              return
            }
            if (createdTs <= Number(seen[sourceKey] || 0)) return

            seen[sourceKey] = createdTs
            incoming.push({
              id: `${sourceKey}:${createdTs}`,
              sourceKey,
              type: 'property',
              entityId,
              sender: entry?.owner?.name || entry?.title || 'New property',
              preview: compactText(`New property listed: ${entry?.title || 'Untitled property'}`),
              timestamp: createdTs,
              read: false,
            })
          })
        }
      } catch {
        // silent polling failure
      }

      if (cancelled) return
      persistSeen(seen)
      if (incoming.length > 0 && bootRef.current) {
        const newest = [...incoming].sort((a, b) => b.timestamp - a.timestamp)[0]
        if (newest) {
          const label =
            newest.type === 'inquiry'
              ? 'New inquiry'
              : newest.type === 'user'
                ? 'New user'
                : newest.type === 'property'
                  ? 'New property'
                  : 'New message'
          toast.info(`${label} from ${newest.sender}`)
        }
      }
      mergeItems(incoming)
      if (!bootRef.current) bootRef.current = true
    }

    poll()
    const timer = window.setInterval(poll, 10000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [refreshToken, user?._id, user?.role])

  useEffect(() => {
    if (!isOpen) return

    const onOutside = (event) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  const markAsRead = async (item) => {
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)))

    const nextSeen = {
      ...seenRef.current,
      [item.sourceKey]: Math.max(
        Number(seenRef.current[item.sourceKey] || 0),
        Number(item.timestamp || 0)
      ),
    }
    persistSeen(nextSeen)

    if (item.type === 'message' && item.threadId) {
      try {
        await threadService.markRead(item.threadId)
      } catch {
        // ignore mark-read failures
      }
    }
  }

  const openNotification = async (item) => {
    await markAsRead(item)
    setIsOpen(false)

    if (item.type === 'property' && item.entityId) {
      navigate(`/property/${item.entityId}`)
      return
    }

    navigate(getDashboardRoute(user?.role))
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={`Notifications ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-controls="role-notification-panel"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid rgba(124,58,237,0.2)',
          background: '#fff',
          color: '#7c3aed',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="m5 7 7 5 7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread notifications`}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '18px',
              textAlign: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="role-notification-panel"
          role="region"
          aria-label="Notifications panel"
          style={{
            position: 'absolute',
            right: 0,
            top: 46,
            width: 320,
            maxHeight: 380,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid rgba(124,58,237,0.16)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
            padding: 10,
            zIndex: 1200,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a0a2e', marginBottom: 8 }}>
            Notifications
          </div>
          {items.length === 0 ? (
            <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.55)' }}>No new notifications</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...items].sort((a, b) => b.timestamp - a.timestamp).map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid rgba(124,58,237,0.12)',
                    borderRadius: 10,
                    background: item.read ? '#faf8ff' : '#f5f3ff',
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                        {String(item.sender || '?').trim().charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: 'rgba(26,10,46,0.5)', marginBottom: 1 }}>From</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0a2e' }}>{item.sender}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(26,10,46,0.5)' }}>{formatTime(item.timestamp)}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.72)', margin: '4px 0 8px' }}>
                    {item.preview}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'rgba(26,10,46,0.5)', marginBottom: 8 }}>
                    {item.type === 'message'
                      ? 'New message'
                      : item.type === 'inquiry'
                        ? 'New inquiry'
                        : item.type === 'user'
                          ? 'New user registration'
                          : 'New property listing'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => openNotification(item)}
                      aria-label={`Open notification from ${item.sender}`}
                      style={{
                        border: '1px solid rgba(124,58,237,0.25)',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#7c3aed',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      Open
                    </button>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item)}
                        aria-label={`Mark notification from ${item.sender} as read`}
                        style={{
                          border: '1px solid rgba(124,58,237,0.18)',
                          borderRadius: 8,
                          background: '#f5f3ff',
                          color: '#7c3aed',
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

