import React, { useEffect, useState, useRef } from 'react'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // {id,text,ts}
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef(null)

  function getAcc() {
    try { return localStorage.getItem('acc_token') || localStorage.getItem('token') || '' } catch (_) { return '' }
  }

  useEffect(() => {
    const acc = getAcc()
    if (!acc) return
    ;(async () => {
      try {
        const [resTasks, resNotifs] = await Promise.all([
          fetch('http://localhost:5001/api/admin/tasks', { headers: { Authorization: `Bearer ${acc}` } }),
          fetch('http://localhost:5001/api/admin/notifications', { headers: { Authorization: `Bearer ${acc}` } }),
        ])
        const [listTasks, listNotifs] = await Promise.all([
          resTasks.json().catch(() => []),
          resNotifs.json().catch(() => []),
        ])
        const msgs = []
        if (Array.isArray(listNotifs)) {
          for (const n of listNotifs) msgs.push({ id: `notif_${n._id}`, text: n.message, ts: new Date(n.createdAt).getTime() })
        }
        if (Array.isArray(listTasks)) {
          const now = new Date()
          const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
          for (const t of listTasks) {
            if (!t?.visitAt) continue
            const v = new Date(t.visitAt)
            if (v >= tomorrow && v < dayAfter) {
              const when = `${v.toLocaleDateString()} ${v.toLocaleTimeString()}`
              msgs.push({ id: `task_${t._id}`, text: `Yarın planlanan ziyaretiniz var: ${t.name || t.googlePlaceId} (${when})`, ts: v.getTime() })
            }
          }
        }
        msgs.sort((a, b) => (b.ts || 0) - (a.ts || 0))
        const lastRead = Number(localStorage.getItem('notify_last_read') || '0')
        const visible = msgs.filter((m) => (m.ts || 0) > lastRead)
        setMessages(visible)
        setUnreadCount(visible.length)
      } catch (_) {}
    })()
  }, [])

  // Global broadcast: if a new notification is created in another tab/view, update badge
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'admin_notify_broadcast' && e.newValue) {
        try {
          const { message, ts } = JSON.parse(e.newValue)
          setMessages((prev) => [{ id: `local_${ts}`, text: message }, ...prev])
        } catch (_) {}
      }
    }
    window.addEventListener('storage', onStorage)
    function onCustom(e) {
      try {
        const { message, ts } = e.detail || {}
        if (message) setMessages((prev) => [{ id: `local_${ts}`, text: message, ts }, ...prev])
      } catch (_) {}
    }
    window.addEventListener('admin_notify_broadcast', onCustom)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('admin_notify_broadcast', onCustom) }
  }, [])

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  useEffect(() => {
    if (open && messages.length > 0) {
      try { localStorage.setItem('notify_last_read', String(Date.now())) } catch (_) {}
      setUnreadCount(0)
    }
  }, [open, messages.length])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button type="button" className="icon-btn" aria-label="Bildirimler" title="Bildirimler" onClick={() => setOpen((s) => !s)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
        </svg>
      </button>
      {unreadCount > 0 && (
        <span className="badge" style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', fontSize: 10 }}>{unreadCount}</span>
      )}
      {open && (
        <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 360, zIndex: 30 }}>
          <div className="panel">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="title">Bildirimler</div>
              {messages.length > 0 && (
                <button className="btn secondary" onClick={() => { setMessages([]); try { localStorage.setItem('notify_last_read', String(Date.now())) } catch(_) {} setUnreadCount(0) }}>Tümünü temizle</button>
              )}
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
              {messages.map((m) => (
                <div key={m.id} className="card">
                  <div className="meta">
                    {(() => {
                      const d = new Date(m.ts || Date.now())
                      const today = new Date(); today.setHours(0,0,0,0)
                      const isToday = d >= today
                      const dateTxt = isToday ? 'Bugün' : d.toLocaleDateString()
                      const timeTxt = d.toLocaleTimeString()
                      return `${dateTxt} ${timeTxt} - ${m.text}`
                    })()}
                  </div>
                </div>
              ))}
              {messages.length === 0 && <div className="meta">Bildirim yok.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


