import React, { useEffect, useState } from 'react'
import NotificationBell from '../components/NotificationBell.jsx'

export default function AdminTaskDetail({ taskId, onBack }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visitDraft, setVisitDraft] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifMessages, setNotifMessages] = useState([])

  function getAcc() {
    return localStorage.getItem('acc_token') || localStorage.getItem('token') || ''
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const acc = getAcc()
        const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, { headers: { Authorization: `Bearer ${acc}` } })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Yüklenemedi')
        setTask(data)
        try {
          setVisitDraft(data.visitAt ? new Date(data.visitAt).toISOString().slice(0,16) : '')
        } catch (_) {}
      } catch (err) {
        setError(err?.message || 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    })()
  }, [taskId])

  // Notifications: load all tasks to find visits scheduled for tomorrow
  useEffect(() => {
    ;(async () => {
      try {
        const acc = getAcc()
        const res = await fetch('http://localhost:5001/api/admin/tasks', { headers: { Authorization: `Bearer ${acc}` } })
        const list = await res.json().catch(() => [])
        if (!Array.isArray(list)) return
        const now = new Date()
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
        const msgs = []
        for (const t of list) {
          if (!t?.visitAt) continue
          const v = new Date(t.visitAt)
          if (v >= tomorrow && v < dayAfter) {
            const when = `${v.toLocaleDateString()} ${v.toLocaleTimeString()}`
            msgs.push({ id: t._id, text: `Yarın planlanan ziyaretiniz var: ${t.name || t.googlePlaceId} (${when})` })
            // Browser notification (once per day per task)
            try {
              const key = `notified_${t._id}_${tomorrow.toDateString()}`
              if (!localStorage.getItem(key)) {
                if ('Notification' in window) {
                  if (Notification.permission === 'granted') {
                    new Notification('Hatırlatma', { body: `Yarın planlanan ziyaret: ${t.name || ''}` })
                    localStorage.setItem(key, '1')
                  } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then((perm) => {
                      if (perm === 'granted') {
                        new Notification('Hatırlatma', { body: `Yarın planlanan ziyaret: ${t.name || ''}` })
                        localStorage.setItem(key, '1')
                      }
                    })
                  }
                }
              }
            } catch (_) {}
          }
        }
        setNotifMessages(msgs)
      } catch (_) {}
    })()
  }, [])

  async function updateTask(field, value) {
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` }, body: JSON.stringify({ [field]: value })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Güncellenemedi')
      setTask(data)
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }
  async function updateVisitAt(value) {
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` }, body: JSON.stringify({ visitAt: value })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Güncellenemedi')
      setTask(data)
    } catch (err) {
      const msg = err?.message || 'Bir hata oluştu'
      alert(msg)
    }
  }

  async function uploadAttachment(file) {
    try {
      const acc = getAcc()
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}/attachments`, { method: 'POST', headers: { Authorization: `Bearer ${acc}` }, body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Yüklenemedi')
      setTask(data)
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function deleteAttachment(attachmentId) {
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}/attachments/${attachmentId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${acc}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Silinemedi')
      setTask(data)
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function deleteNote(noteId) {
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}/notes/${noteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${acc}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Silinemedi')
      setTask(data)
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  function renderStatus(status) {
    const map = { added: { t: 'Sıraya Alındı', c: '#f59e0b' }, in_progress: { t: 'İşlemde', c: '#16a34a' }, positive: { t: 'Onaylandı', c: '#2563eb' }, negative: { t: 'Onaylanmadı', c: '#dc2626' } }
    const m = map[status]
    if (!m) return null
    return <span className="badge" style={{ backgroundColor: m.c, color: '#fff' }}>{m.t}</span>
  }

  function renderPlannedBadge() {
    if (!task?.visitAt) return null
    const d = new Date(task.visitAt)
    const when = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    return <span className="badge" style={{ backgroundColor: '#1f2937', color: '#e5e7eb' }}>Ziyaret planlandı: {when}</span>
  }

  async function submitNote(text) {
    const t = (text || '').trim()
    if (!t) return
    try {
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` }, body: JSON.stringify({ text: t })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Gönderilemedi')
      setTask(data)
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
          <button type="button" className="btn secondary" onClick={onBack}>Geri</button>
          <NotificationBell />
        </div>
      </div>
      
      <section className="panel">
        <h2>Görev Detayı</h2>
        {error && <div className="meta" style={{ marginBottom: 8 }}>{error}</div>}
        {loading && <div className="meta">Yükleniyor…</div>}
        {!loading && task && (
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="title">{task.name || task.googlePlaceId}</div>
                <div className="row" style={{ gap: 8 }}>
                  {renderPlannedBadge()}
                  {renderStatus(task.status)}
                </div>
              </div>
              {task.address && <div className="sub">{task.address}</div>}
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <button className="btn secondary" onClick={() => updateTask('status', 'added')}>Turuncu</button>
                <button className="btn secondary" onClick={() => updateTask('status', 'in_progress')}>Yeşil</button>
                <button className="btn secondary" onClick={() => updateTask('status', 'positive')}>Mavi</button>
                <button className="btn secondary" onClick={() => updateTask('status', 'negative')}>Kırmızı</button>
              </div>
            </div>
            <div className="card">
              <div className="title">Görüşme Detayları</div>
              <div className="row" style={{ gap: 8 }}>
                <input
                  type="datetime-local"
                  className="input"
                  value={visitDraft}
                  onChange={(e) => setVisitDraft(e.target.value)}
                  style={{ maxWidth: 260 }}
                />
                <button className="btn" onClick={() => visitDraft && updateVisitAt(visitDraft)}>Planla</button>
                <span className="meta">Ziyaret tarihi ve saati</span>
              </div>
              <textarea
                className="input"
                rows={4}
                placeholder="Detay yazın ve Enter'a basın"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const value = e.currentTarget.value
                    e.currentTarget.value = ''
                    submitNote(value)
                  }
                }}
              />
              <div className="grid" style={{ gridTemplateColumns: '1fr', marginTop: 8 }}>
                {(task.notesLog || []).slice().reverse().map((n, i) => {
                  const d = new Date(n.at)
                  const dateStr = d.toLocaleDateString()
                  const timeStr = d.toLocaleTimeString()
                  return (
                    <div key={n._id || i} className="review">
                      <div className="meta-row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="meta">{dateStr} {timeStr}</span>
                        <button className="btn btn-delete" style={{ marginLeft: 5 }} onClick={() => deleteNote(n._id)}>Sil</button>
                      </div>
                      <div>{n.text}</div>
                    </div>
                  )
                })}
                {(task.notesLog || []).length === 0 && <div className="meta">Henüz kayıt yok.</div>}
              </div>
            </div>
            <div className="card">
              <div className="title">Belgeler</div>
              <div className="row" style={{ gap: 8 }}>
                <div
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files && e.dataTransfer.files[0]) uploadAttachment(e.dataTransfer.files[0]) }}
                  style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 16, width: '100%', textAlign: 'center' }}
                >
                  Dosyayı buraya sürükleyip bırakın veya
                  <input type="file" style={{ marginLeft: 8 }} onChange={(e) => e.target.files && e.target.files[0] && uploadAttachment(e.target.files[0])} />
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', marginTop: 8 }}>
                {(task.attachments || []).map((f, i) => {
                  const fileUrl = (f.url || '').startsWith('http') ? f.url : `http://localhost:5001${f.url || ''}`
                  const isImage = (f.mimeType || '').toLowerCase().startsWith('image/')
                  return (
                    <div key={f._id || i} className="card" style={{ display: 'grid', gap: 8 }}>
                      {isImage && (
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="thumb-wrap">
                          <img alt={f.fileName || ''} src={fileUrl} className="thumb" style={{ height: 120 }} />
                        </a>
                      )}
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="title attachment-name" style={{ wordBreak: 'break-all' }}>{f.fileName}</a>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                        <a className="btn btn-download" href={fileUrl} download>
                          İndir
                        </a>
                        <button className="btn btn-delete" onClick={() => deleteAttachment(f._id)}>Sil</button>
                      </div>
                    </div>
                  )
                })}
                {(task.attachments || []).length === 0 && <div className="meta">Belge yok.</div>}
              </div>
            </div>
          </div>
        )}
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


