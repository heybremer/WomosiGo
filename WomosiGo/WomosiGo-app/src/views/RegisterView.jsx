import React from 'react'

export default function RegisterView({
  GERMAN_STATES,
  REGIONS_BY_STATE,
  PHONE_CODES,
  CAR_BRANDS,
  YEARS,
  values,
  setValues,
  onSubmit,
  regLoading,
  regMessage,
}) {
  const {
    regFirstName,
    regLastName,
    regEmail,
    regPassword,
    regPassword2,
    regPhoneCountry,
    regPhone,
    regState,
    regRegion,
    regCarBrand,
    regCarModel,
    regCarYear,
  } = values

  const update = (k) => (e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brand-logo" />
          <div className="brand-title">WomosiGo</div>
        </div>
        <div className="row">
          <button type="button" className="btn secondary" onClick={() => (window.location.hash = '')}>Geri</button>
        </div>
      </div>
      <section className="panel">
        <div className="register-hero">
          <h2>Kayıt Ol</h2>
          <div className="meta">Hızlıca hesabınızı oluşturun ve kamp alanlarını yönetin.</div>
        </div>
        <form onSubmit={onSubmit} className="register-form" style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
          <div className="form-grid">
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Ad</span>
              <input value={regFirstName} onChange={update('regFirstName')} placeholder="Ad" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Soyad</span>
              <input value={regLastName} onChange={update('regLastName')} placeholder="Soyad" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>E-posta</span>
              <input value={regEmail} onChange={update('regEmail')} type="email" placeholder="rep@firma.com" required className="input" />
            </label>
            <div style={{ display: 'grid', gap: 6 }}>
              <span>Telefon</span>
              <div className="row" style={{ gap: 8 }}>
                <select className="input" value={regPhoneCountry} onChange={update('regPhoneCountry')} style={{ width: 140 }}>
                  {PHONE_CODES.map((p) => (<option key={p.code} value={p.code}>{p.label}</option>))}
                </select>
                <input value={regPhone} onChange={update('regPhone')} placeholder="Mobil telefon" className="input" style={{ flex: 1 }} />
              </div>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Şifre</span>
              <input value={regPassword} onChange={update('regPassword')} type="password" placeholder="••••••••" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Şifre (tekrar)</span>
              <input value={regPassword2} onChange={update('regPassword2')} type="password" placeholder="••••••••" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Eyalet</span>
              <select className="input" value={regState} onChange={(e) => { update('regState')(e); setValues((prev) => ({ ...prev, regRegion: '' })) }}>
                <option value="">Seçiniz</option>
                {GERMAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Bölge</span>
              <select className="input" value={regRegion} onChange={update('regRegion')} disabled={!regState}>
                <option value="">Seçiniz</option>
                {(REGIONS_BY_STATE[regState] || []).map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </label>
          </div>
          <div className="form-section">
            <div className="title" style={{ marginBottom: 4 }}>Karavan Bilgileri</div>
            <div className="form-grid-3">
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Marka</span>
                <select className="input" value={regCarBrand} onChange={update('regCarBrand')}>
                  <option value="">Seçiniz</option>
                  {CAR_BRANDS.map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Model</span>
                <input value={regCarModel} onChange={update('regCarModel')} placeholder="Model" className="input" />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Yıl</span>
                <select className="input" value={regCarYear} onChange={update('regCarYear')}>
                  <option value="">Seçiniz</option>
                  {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              </label>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="meta">Kayıt olarak şartları kabul etmiş olursunuz.</div>
            <button disabled={regLoading} type="submit" className="btn">{regLoading ? 'Kayıt yapılıyor…' : 'Kayıt Ol'}</button>
          </div>
          {regMessage && (<div role="status" aria-live="polite" className="meta">{regMessage}</div>)}
        </form>
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


