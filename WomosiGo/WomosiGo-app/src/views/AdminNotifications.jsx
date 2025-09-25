import React, { useEffect, useState } from 'react'
import NotificationBell from '../components/NotificationBell.jsx'

export default function AdminNotifications({ onBack, onLogout }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('admin')

  function getAcc() { try { return localStorage.getItem('acc_token') || localStorage.getItem('token') || '' } catch (_) { return '' } }

  async function load() {
    try {
      setLoading(true)
      setError('')
      const acc = getAcc()
      const url = `http://localhost:5001/api/admin/notifications${audience ? `?audience=${audience}` : ''}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${acc}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Yüklenemedi')
      setList(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [audience])

  async function createNotification() {
    const txt = message.trim()
    if (!txt) return
    try {
      const acc = getAcc()
      const res = await fetch('http://localhost:5001/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` }, body: JSON.stringify({ message: txt, audience })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Oluşturulamadı')
      setMessage('')
      setList((prev) => [data, ...prev])
      try {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') new Notification('Yeni Bildirim', { body: txt })
          else if (Notification.permission !== 'denied') Notification.requestPermission()
        }
        // Broadcast to all tabs/views so NotificationBell badges update
        localStorage.setItem('admin_notify_broadcast', JSON.stringify({ message: txt, ts: Date.now() }))
        // clear immediately to allow future writes with same key
        localStorage.removeItem('admin_notify_broadcast')
        // Same-tab broadcast (storage event doesn't fire in same document)
        try { window.dispatchEvent(new CustomEvent('admin_notify_broadcast', { detail: { message: txt, ts: Date.now() } })) } catch (_) {}
      } catch (_) {}
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function deleteNotification(id) {
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${acc}` } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Silinemedi')
      setList((prev) => prev.filter((n) => n._id !== id))
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brand-logo" />
          <div className="brand-title">WomosiGo</div>
        </div>
        <div className="row">
          <NotificationBell />
          <button type="button" className="btn secondary" onClick={() => (window.location.hash = '')}>Anasayfa</button>
          <button type="button" className="btn" onClick={onLogout}>Çıkış Yap</button>
        </div>
      </div>
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2>Admin Panel</h2>
            <div className="meta">Genel görünüm, kullanıcı ve içerik yönetimi</div>
          </div>
        </div>
        <div className="panel-shell" style={{ marginTop: 0 }}>
          <nav className="panel-nav">
            <button className={`navlink`} onClick={() => (window.location.hash = '#admin/overview')}>Genel</button>
            <button className={`navlink`} onClick={() => (window.location.hash = '#admin/users')}>Kullanıcılar</button>
            <button className={`navlink`} onClick={() => (window.location.hash = '#admin/businesses')}>İşletmeler</button>
            <button className={`navlink`} onClick={() => (window.location.hash = '#admin/reviews')}>Yorumlar</button>
            <button className={`navlink`} onClick={() => (window.location.hash = '#admin/reservations')}>Rezervasyonlar</button>
            <button className={`navlink`} onClick={() => (window.location.hash = '#admin/activities')}>Aktiviteler</button>
            <button className={`navlink`} onClick={() => (window.location.hash = '#admin/tasks')}>Görevler</button>
            <button className={`navlink active`} onClick={() => (window.location.hash = '#admin/notifications')}>Bildirimler</button>
          </nav>
          <div className="panel-content">
            {error && <div className="meta" style={{ marginBottom: 8 }}>{error}</div>}
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)} style={{ width: 200 }}>
                <option value="admin">Sadece Admin</option>
                <option value="user">Kullanıcılar</option>
              </select>
            </div>
            <div className="row" style={{ gap: 8, marginBottom: 10 }}>
              <input
                className="input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) createNotification() }}
                placeholder="Bildirim mesajı"
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={createNotification}>Bildirim Ekle</button>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
              {list.map((n) => (
                <div key={n._id} className="card">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="title">{new Date(n.createdAt).toLocaleString()}</div>
                    <button className="btn btn-delete" onClick={() => deleteNotification(n._id)}>Sil</button>
                  </div>
                  <div className="sub" style={{ marginTop: 4 }}>{n.message}</div>
                </div>
              ))}
              {list.length === 0 && <div className="meta">Bildirim yok.</div>}
            </div>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="footer-links">
          <a href="#" title="Datenschutz">Datenschutz</a>
          <a href="#" title="AGB">AGB</a>
          <a href="#" title="Impressum">Impressum</a>
          <a href="#" title="Wir über uns">Wir über uns</a>
          <a href="#" title="Kontakt">Kontakt</a>
        </div>
        <small>Entwickelt von den Entwicklern von Bremer Sitzbezüge</small>
      </footer>
    </div>
  )
}


