import React, { useEffect, useRef, useState, useMemo } from 'react'
import NotificationBell from '../components/NotificationBell.jsx'
import UsersList from './UsersList.jsx'

export default function AdminPanel({ routeHash, adminStats, adminError, adminTab, setAdminTab, adminJwt, setAdminJwt, loadAdminStats, onLogout }) {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [nearby, setNearby] = useState([])
  const [fetchingNearby, setFetchingNearby] = useState(false)
  const [nearbyMsg, setNearbyMsg] = useState('')
  const [query, setQuery] = useState('')
  const autoFetchedRef = useRef(false)
  const [tasks, setTasks] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loadingBusinesses, setLoadingBusinesses] = useState(false)
  const [businessError, setBusinessError] = useState('')
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')

  function getAcc() {
    return localStorage.getItem('acc_token') || localStorage.getItem('token') || ''
  }

  useEffect(() => {
    // get location on mount
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(String(pos.coords.latitude))
        setLng(String(pos.coords.longitude))
      })
    }
    // load tasks on mount
    loadTasks()
    loadBusinesses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // when lat/lng become available, auto-load first 20km
  useEffect(() => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (isFinite(latNum) && isFinite(lngNum) && !autoFetchedRef.current && !fetchingNearby) {
      autoFetchedRef.current = true
      loadNearby()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  // Sync tab from hash: #admin/<section>
  useEffect(() => {
    const h = routeHash || ''
    if (h.startsWith('#admin/')) {
      const section = h.slice('#admin/'.length)
      const allowed = ['overview','users','businesses','reviews','reservations','activities','tasks','notifications']
      if (allowed.includes(section) && adminTab !== section) {
        setAdminTab(section)
        return
      }
      if (section.startsWith('task/')) {
        if (adminTab !== 'tasks') setAdminTab('tasks')
        return
      }
      return
    }
    if ((h === '#admin' || h === '') && adminTab !== 'overview') {
      setAdminTab('overview')
    }
  }, [routeHash])

  async function loadNearby() {
    try {
      setNearbyMsg('')
      setFetchingNearby(true)
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      if (!isFinite(latNum) || !isFinite(lngNum)) {
        setNearbyMsg('Geçerli konum alınamadı')
        return
      }
      const radiusMeters = 20000 // 20km sabit
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/nearby?lat=${latNum}&lng=${lngNum}&radius=${radiusMeters}`, {
        headers: { Authorization: `Bearer ${acc}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Liste alınamadı')
      setNearby(Array.isArray(data) ? data : [])
      setNearbyMsg(`Bulunan kamp sayısı: ${Array.isArray(data) ? data.length : 0}`)
    } catch (err) {
      setNearbyMsg(err?.message || 'Bir hata oluştu')
    } finally {
      setFetchingNearby(false)
    }
  }

  async function handleSearch(e) {
    e?.preventDefault?.()
    const q = query.trim()
    if (!q) return
    setNearbyMsg('')
    setFetchingNearby(true)
    try {
      const res = await fetch(`http://localhost:5001/api/campsites/search?query=${encodeURIComponent(q)}&radius=8000&store=false`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error_message || 'Arama başarısız')
      if (data?.center?.lat && data?.center?.lng) {
        setLat(String(data.center.lat))
        setLng(String(data.center.lng))
      }
      const results = Array.isArray(data?.results) ? data.results : []
      setNearby(results)
      setNearbyMsg(`Bulunan kamp sayısı: ${results.length}`)
    } catch (err) {
      setNearbyMsg(err?.message || 'Bir hata oluştu')
    } finally {
      setFetchingNearby(false)
    }
  }

  async function loadTasks() {
    try {
      setTasksError('')
      setTasksLoading(true)
      const acc = getAcc()
      const res = await fetch('http://localhost:5001/api/admin/tasks', { headers: { Authorization: `Bearer ${acc}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Görevler alınamadı')
      setTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      setTasksError(err?.message || 'Bir hata oluştu')
    } finally {
      setTasksLoading(false)
    }
  }

  async function loadBusinesses() {
    try {
      setBusinessError('')
      setLoadingBusinesses(true)
      const acc = getAcc()
      const res = await fetch('http://localhost:5001/api/admin/businesses', { headers: { Authorization: `Bearer ${acc}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'İşletmeler alınamadı')
      setBusinesses(Array.isArray(data) ? data : [])
    } catch (err) {
      setBusinessError(err?.message || 'Bir hata oluştu')
    } finally {
      setLoadingBusinesses(false)
    }
  }

  async function addTaskFromCamp(c) {
    try {
      const acc = getAcc()
      const body = {
        googlePlaceId: c.googlePlaceId,
        name: c.name,
        address: c.address,
        photoRef: c.photoRef,
        location: c.location,
      }
      const res = await fetch('http://localhost:5001/api/admin/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` }, body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Göreve eklenemedi')
      setTasks((prev) => {
        const exists = prev.find((x) => x.googlePlaceId === data.googlePlaceId)
        return exists ? prev.map((x) => x.googlePlaceId === data.googlePlaceId ? data : x) : [data, ...prev]
      })
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function updateTaskStatus(taskId, status) {
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` }, body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Güncellenemedi')
      setTasks((prev) => prev.map((t) => t._id === data._id ? data : t))
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm('Görevi silmek istediğinize emin misiniz?')) return
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${acc}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Silinemedi')
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function updateTaskNotes(taskId, notes) {
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` }, body: JSON.stringify({ notes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Güncellenemedi')
      setTasks((prev) => prev.map((t) => t._id === data._id ? data : t))
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  function renderTaskStatus(status) {
    const map = {
      added: { text: 'Sıraya Alındı', bg: '#f59e0b' },
      in_progress: { text: 'İşlemde', bg: '#16a34a' },
      positive: { text: 'Onaylandı', bg: '#2563eb' },
      negative: { text: 'Onaylanmadı', bg: '#dc2626' },
    }
    const m = map[status]
    if (!m) return null
    return (
      <div className="meta" style={{ marginBottom: 6 }}>
        <span className="badge" style={{ backgroundColor: m.bg, color: '#fff' }}>{m.text}</span>
      </div>
    )
  }

  function goTaskDetail(taskId) {
    window.location.hash = `#admin/task/${taskId}`
  }

  const [activeStatus, setActiveStatus] = useState('') // '' => tümü, added|in_progress|positive|negative
  const statusCounts = useMemo(() => {
    const acc = { added: 0, in_progress: 0, positive: 0, negative: 0 }
    for (const t of tasks) {
      if (acc.hasOwnProperty(t.status)) acc[t.status] += 1
    }
    return acc
  }, [tasks])
  const filteredTasks = useMemo(() => {
    if (!activeStatus) return tasks
    return tasks.filter((t) => t.status === activeStatus)
  }, [tasks, activeStatus])
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
          <div className="row">
            {!localStorage.getItem('acc_token') && (
              <>
                <input
                  className="input"
                  placeholder="Admin JWT token"
                  value={adminJwt}
                  onChange={(e) => { setAdminJwt(e.target.value); localStorage.setItem('acc_token', e.target.value) }}
                  style={{ width: 360 }}
                />
                <button type="button" className="btn" onClick={loadAdminStats}>Yükle</button>
              </>
            )}
          </div>
        </div>
        {adminError && <div className="meta" style={{ marginTop: 8 }}>{adminError}</div>}
        <div className="panel-shell" style={{ marginTop: 12 }}>
          <nav className="panel-nav">
            <button className={`navlink ${adminTab==='overview' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/overview')}>Genel</button>
            <button className={`navlink ${adminTab==='users' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/users')}>Kullanıcılar</button>
            <button className={`navlink ${adminTab==='businesses' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/businesses')}>İşletmeler</button>
            <button className={`navlink ${adminTab==='reviews' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/reviews')}>Yorumlar</button>
            <button className={`navlink ${adminTab==='reservations' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/reservations')}>Rezervasyonlar</button>
            <button className={`navlink ${adminTab==='activities' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/activities')}>Aktiviteler</button>
            <button className={`navlink ${adminTab==='tasks' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/tasks')}>Görevler</button>
            <button className={`navlink ${adminTab==='notifications' ? 'active' : ''}`} onClick={() => (window.location.hash = '#admin/notifications')}>Bildirimler</button>
          </nav>
          <div className="panel-content">
            {adminTab === 'overview' && (
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {adminStats ? (
                  <>
                    <div className="card"><div className="title">Kullanıcılar</div><div className="meta">{adminStats.userCount}</div></div>
                    <div className="card"><div className="title">İşletmeler</div><div className="meta">{adminStats.businessCount}</div></div>
                    <div className="card"><div className="title">Yorumlar</div><div className="meta">{adminStats.reviewCount}</div></div>
                    <div className="card"><div className="title">Rezervasyonlar</div><div className="meta">{adminStats.reservationCount}</div></div>
                    <div className="card"><div className="title">Aktiviteler</div><div className="meta">{adminStats.activityCount}</div></div>
                  </>
                ) : (
                  <div className="meta">İstatistikler için token girip Yükle’ye basın.</div>
                )}
              </div>
            )}
            {(adminTab === 'tasks' || (routeHash||'').endsWith('/tasks')) && (
              <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
                <div className="card">
                  <div className="title">Yakındaki Kamplar</div>
                  <form onSubmit={handleSearch} className="row searchbar" style={{ marginBottom: 8 }}>
                    <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Şehir veya bölge ara (örn. İstanbul, Antalya)" />
                    <button disabled={fetchingNearby} type="submit" className="btn">Ara</button>
                  </form>
                  {/* Lat/Lng ve yarıçap gizlendi; sayfa açılışında 20km otomatik yüklenir */}
                  {nearbyMsg && <div className="meta" style={{ marginBottom: 8 }}>{nearbyMsg}</div>}
                  <div className="grid">
                    {nearby.map((c) => {
                      const imgUrl = c.photoRef ? `http://localhost:5001/api/campsites/photo?photoRef=${encodeURIComponent(c.photoRef)}&maxWidth=400` : null
                      return (
                        <div key={c._id || c.googlePlaceId} className="card">
                          {imgUrl && (
                            <div className="thumb-wrap"><img className="thumb" alt={c.name||''} src={imgUrl} loading="lazy" /></div>
                          )}
                          <div className="title-row"><div className="title">{c.name}</div></div>
                          {c.address && <div className="sub">{c.address}</div>}
                          <div className="actions">
                            <button className="btn" onClick={() => addTaskFromCamp(c)}>Göreve Ekle</button>
                          </div>
                        </div>
                      )
                    })}
                    {nearby.length === 0 && <div className="meta">Sonuç yok.</div>}
                  </div>
                </div>
                {/* Durum özet kartları */}
                <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div
                    className="card"
                    onClick={() => setActiveStatus((s) => s === 'added' ? '' : 'added')}
                    style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer', background: activeStatus==='added' ? 'rgba(245,158,11,.12)' : undefined }}
                  >
                    <div className="title">Sıraya Alındı</div>
                    <div className="meta">{statusCounts.added}</div>
                  </div>
                  <div
                    className="card"
                    onClick={() => setActiveStatus((s) => s === 'in_progress' ? '' : 'in_progress')}
                    style={{ borderLeft: '4px solid #16a34a', cursor: 'pointer', background: activeStatus==='in_progress' ? 'rgba(22,163,74,.12)' : undefined }}
                  >
                    <div className="title">İşlemde</div>
                    <div className="meta">{statusCounts.in_progress}</div>
                  </div>
                  <div
                    className="card"
                    onClick={() => setActiveStatus((s) => s === 'positive' ? '' : 'positive')}
                    style={{ borderLeft: '4px solid #2563eb', cursor: 'pointer', background: activeStatus==='positive' ? 'rgba(37,99,235,.12)' : undefined }}
                  >
                    <div className="title">Onaylandı</div>
                    <div className="meta">{statusCounts.positive}</div>
                  </div>
                  <div
                    className="card"
                    onClick={() => setActiveStatus((s) => s === 'negative' ? '' : 'negative')}
                    style={{ borderLeft: '4px solid #dc2626', cursor: 'pointer', background: activeStatus==='negative' ? 'rgba(220,38,38,.12)' : undefined }}
                  >
                    <div className="title">Onaylanmadı</div>
                    <div className="meta">{statusCounts.negative}</div>
                  </div>
                </div>
                <div className="card">
                  <div className="title">Görev Listem</div>
                  {tasksError && <div className="meta" style={{ marginBottom: 8 }}>{tasksError}</div>}
                  <div className="grid">
                    {(tasksLoading ? [] : filteredTasks).map((t) => (
                      <div key={t._id} className="card" style={{ borderLeft: `4px solid ${
                        t.status === 'in_progress' ? '#16a34a' : t.status === 'positive' ? '#2563eb' : t.status === 'negative' ? '#dc2626' : '#f59e0b'
                      }` }}>
                        {renderTaskStatus(t.status)}
                        <div className="title-row"><div className="title">{t.name || t.googlePlaceId}</div></div>
                        {t.address && <div className="sub">{t.address}</div>}
                        <div className="row" style={{ gap: 6, marginTop: 6 }}>
                          <button className="btn secondary" onClick={() => updateTaskStatus(t._id, 'added')}>Turuncu</button>
                          <button className="btn secondary" onClick={() => updateTaskStatus(t._id, 'in_progress')}>Yeşil</button>
                          <button className="btn secondary" onClick={() => updateTaskStatus(t._id, 'positive')}>Mavi</button>
                          <button className="btn secondary" onClick={() => updateTaskStatus(t._id, 'negative')}>Kırmızı</button>
                        </div>
                        <div className="row" style={{ gap: 6, marginTop: 6 }}>
                          <button className="btn" onClick={() => goTaskDetail(t._id)}>Detay</button>
                          <button className="btn btn-delete" onClick={() => deleteTask(t._id)}>Sil</button>
                        </div>
                      </div>
                    ))}
                    {!tasksLoading && filteredTasks.length === 0 && <div className="meta">Görev yok.</div>}
                  </div>
                </div>

              </div>
            )}
            {(adminTab === 'businesses' || (routeHash||'').endsWith('/businesses')) && (
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <div className="title">Onaylanan Premium İşletmeler</div>
                  {businessError && <div className="meta" style={{ marginBottom: 8 }}>{businessError}</div>}
                  {loadingBusinesses && <div className="meta">Yükleniyor…</div>}
                  {!loadingBusinesses && businesses.length === 0 && <div className="meta">Onaylanan işletme yok.</div>}
                </div>
                {!loadingBusinesses && businesses.map((b) => (
                  <div key={b._id} className="card">
                    <div className="title-row">
                      <div className="title">{b.name}</div>
                      <span className="badge" style={{ background: 'rgba(37,99,235,.15)', color: '#bfdbfe' }}>Premium</span>
                    </div>
                    {b.address && <div className="sub">{b.address}</div>}
                    <div className="meta" style={{ fontSize: 12 }}>Google Place ID: {b.googlePlaceId}</div>
                    {b.promotedAt && <div className="meta" style={{ fontSize: 12 }}>Onay Tarihi: {new Date(b.promotedAt).toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            )}
            {(adminTab === 'users' || (routeHash||'').endsWith('/users')) && (
              <UsersList />
            )}
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


