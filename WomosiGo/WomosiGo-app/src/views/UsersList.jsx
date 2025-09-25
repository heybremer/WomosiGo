import React, { useEffect, useMemo, useState } from 'react'

export default function UsersList() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  function getAcc() {
    try {
      return localStorage.getItem('acc_token') || localStorage.getItem('token') || ''
    } catch (_) {
      return ''
    }
  }

  const countryMeta = useMemo(() => ({
    '+49': { code: 'DE', name: 'Germany', flag: 'https://flagcdn.com/w20/de.png' },
    '+90': { code: 'TR', name: 'Türkiye', flag: 'https://flagcdn.com/w20/tr.png' },
    '+43': { code: 'AT', name: 'Austria', flag: 'https://flagcdn.com/w20/at.png' },
    '+41': { code: 'CH', name: 'Switzerland', flag: 'https://flagcdn.com/w20/ch.png' },
    '+31': { code: 'NL', name: 'Netherlands', flag: 'https://flagcdn.com/w20/nl.png' },
  }), [])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const acc = getAcc()
      const res = await fetch('http://localhost:5001/api/admin/users?role=user', {
        headers: { Authorization: `Bearer ${acc}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Yüklenemedi')
      setList(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, next) {
    try {
      setPendingAction(id + next)
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Güncellenemedi')
      setList((prev) => prev.map((u) => (u._id === id ? { ...u, status: next } : u)))
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    } finally {
      setPendingAction(null)
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Bu üyeyi silmek istediğinize emin misiniz?')) return
    try {
      setPendingAction(id + 'delete')
      const acc = getAcc()
      const res = await fetch(`http://localhost:5001/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${acc}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Silinemedi')
      setList((prev) => prev.filter((u) => u._id !== id))
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    } finally {
      setPendingAction(null)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="users-grid">
      {error && <div className="meta" style={{ gridColumn: '1 / -1' }}>{error}</div>}
      {loading && <div className="meta" style={{ gridColumn: '1 / -1' }}>Yükleniyor…</div>}
      {!loading && list.map((u) => {
        const country = countryMeta[u.countryCode]
        const created = u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'
        const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Hiç giriş yapmadı'
        return (
          <div key={u._id} className="card user-card">
            <div className="meta-line">
              <span className={`badge ${u.status === 'suspended' ? 'status-suspended' : 'status-active'}`}>
                {u.status === 'suspended' ? 'Donduruldu' : 'Aktif'}
              </span>
              <span className="meta">Üye ID: {u._id.slice(-6)}</span>
            </div>
            <div className="title-row">
              <div className="title">
                {u.fullName || u.businessName || 'İsimsiz Kullanıcı'}
                <span className="subtle">{u.email}</span>
              </div>
              {country && (
                <span className="badge country">
                  <span className="flag"><img src={country.flag} alt={country.name} /></span>
                  {country.code}
                </span>
              )}
            </div>
            <div className="meta-grid">
              <span><strong>Telefon:</strong> {u.phone || '—'}</span>
              <span><strong>Eyalet/Bölge:</strong> {u.state || '—'}{u.region ? ` / ${u.region}` : ''}</span>
              <span><strong>Karavan:</strong> {u.carBrand || '—'} {u.carModel || ''} {u.carYear || ''}</span>
              <span><strong>Kayıt Tarihi:</strong> {created}</span>
              <span><strong>Son Giriş:</strong> {lastLogin}</span>
              <span><strong>Kayıt IP:</strong> {u.signupIp || '—'}</span>
              <span><strong>Son Giriş IP:</strong> {u.lastLoginIp || '—'}</span>
            </div>
            <div className="separator" />
            <div className="actions">
              <button
                className="btn secondary"
                disabled={pendingAction === u._id + 'active' || u.status === 'active'}
                onClick={() => updateStatus(u._id, 'active')}
              >Aktif Et</button>
              <button
                className="btn secondary"
                disabled={pendingAction === u._id + 'suspended' || u.status === 'suspended'}
                onClick={() => updateStatus(u._id, 'suspended')}
              >Dondur</button>
              <button
                className="btn btn-delete"
                disabled={pendingAction === u._id + 'delete'}
                onClick={() => deleteUser(u._id)}
              >Sil</button>
            </div>
          </div>
        )
      })}
      {!loading && list.length === 0 && <div className="meta" style={{ gridColumn: '1 / -1' }}>Kayıt bulunamadı.</div>}
    </div>
  )
}


