import React from 'react'

export default function UserPanel({ userMe, userMeError, userMeLoading, loadUserMe, panelTab, setPanelTab, favDetails, toggleFavorite, onLogout }) {
  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brand-logo" />
          <div className="brand-title">WomosiGo</div>
        </div>
        <div className="row">
          <button type="button" className="btn secondary" onClick={() => (window.location.hash = '')}>Anasayfa</button>
          <button type="button" className="btn" onClick={onLogout}>Çıkış Yap</button>
        </div>
      </div>
      <section className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2>Kullanıcı Paneli</h2>
            <div className="meta">Favoriler, aktiviteler, yorumlar ve rezervasyonlarınızı yönetin.</div>
          </div>
          <button type="button" className="btn" onClick={loadUserMe} disabled={userMeLoading}>
            {userMeLoading ? 'Yükleniyor…' : 'Yenile'}
          </button>
        </div>
        {userMeError && <div className="meta" style={{ marginTop: 8 }}>{userMeError}</div>}
        {!userMe && !userMeLoading && (
          <div className="meta" style={{ marginTop: 8 }}>Bilgiler için Yenile’ye tıklayın.</div>
        )}
        {userMe && (
          <div className="panel-shell">
            <nav className="panel-nav">
              <button className={`navlink ${panelTab==='favorites' ? 'active' : ''}`} onClick={() => setPanelTab('favorites')}>Favoriler</button>
              <button className={`navlink ${panelTab==='activities' ? 'active' : ''}`} onClick={() => setPanelTab('activities')}>Aktiviteler</button>
              <button className={`navlink ${panelTab==='reviews' ? 'active' : ''}`} onClick={() => setPanelTab('reviews')}>Yorumlarım</button>
              <button className={`navlink ${panelTab==='reservations' ? 'active' : ''}`} onClick={() => setPanelTab('reservations')}>Rezervasyonlarım</button>
            </nav>
            <div className="panel-content">
              {panelTab === 'favorites' && (
                <div className="card">
                  <div className="title">Favoriler</div>
                  <div className="meta">Toplam: {userMe?.account?.favorites?.length || 0}</div>
                  <div className="grid">
                    {favDetails.map((c) => {
                      const imgUrl = c.photoRef ? `http://localhost:5001/api/campsites/photo?photoRef=${encodeURIComponent(c.photoRef)}&maxWidth=400` : null
                      const effRating = typeof c.rating === 'number' ? c.rating : undefined
                      const effReviews = typeof c.userRatingsTotal === 'number' ? c.userRatingsTotal : undefined
                      return (
                        <div key={c.googlePlaceId} className="card">
                          {imgUrl ? (
                            <div className="thumb-wrap">
                              <img alt={c.name || ''} className="thumb" src={imgUrl} loading="lazy" />
                              {typeof c.openNow === 'boolean' && (
                                <span className={`dot ${c.openNow ? 'open' : 'closed'}`} aria-label={c.openNow ? 'Açık' : 'Kapalı'} title={c.openNow ? 'Açık' : 'Kapalı'} />
                              )}
                            </div>
                          ) : null}
                          <div>
                            <div className="title-row">
                              <div className="title">{c.name || c.googlePlaceId}</div>
                            </div>
                            {c.address && <div className="sub">{c.address}</div>}
                            {(typeof effRating === 'number' || typeof effReviews === 'number') && (
                              <div className="rating">
                                {typeof effRating === 'number' ? (
                                  <>
                                    <span className="value">{effRating.toFixed(1)}</span>
                                    <span className="stars" aria-hidden="true">
                                      <span className="stars-bg">★★★★★</span>
                                      <span className="stars-fg" style={{ width: `${Math.max(0, Math.min(5, effRating)) / 5 * 100}%` }}>★★★★★</span>
                                    </span>
                                  </>
                                ) : (
                                  <span className="value">-</span>
                                )}
                                <span className="count">({effReviews || 0})</span>
                              </div>
                            )}
                            <div className="actions">
                              <a className="icon-btn" href={`https://www.google.com/maps/place/?q=place_id:${c.googlePlaceId}`} target="_blank" rel="noreferrer" aria-label="Haritada Aç" title="Haritada Aç">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M17.27 6.73L3 12l7.1 1.9L12 21l5.27-14.27z"/>
                                </svg>
                              </a>
                              <button type="button" className="btn" onClick={() => toggleFavorite(c.googlePlaceId)}>Kaldır</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {favDetails.length === 0 && (
                      <div className="meta">Favori yok.</div>
                    )}
                  </div>
                </div>
              )}
              {panelTab === 'activities' && (
                <div className="card">
                  <div className="title">Aktiviteler</div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                    {(userMe?.activities || []).map((a) => (
                      <div key={a._id} className="review">
                        <div className="meta-row" style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>{a.type}</span>
                          {a.googlePlaceId && <span className="meta">{a.googlePlaceId}</span>}
                          <span className="meta">{new Date(a.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {(!userMe?.activities || userMe.activities.length === 0) && <div className="meta">Kayıt yok.</div>}
                  </div>
                </div>
              )}
              {panelTab === 'reviews' && (
                <div className="card">
                  <div className="title">Yorumlarım</div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                    {(userMe?.reviews || []).map((r) => (
                      <div key={r._id} className="review">
                        <div className="meta-row" style={{ marginBottom: 6 }}>
                          <span>⭐ {Number(r.rating).toFixed(1)}</span>
                          {r.googlePlaceId && <span className="meta">{r.googlePlaceId}</span>}
                          <span className="meta">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <div>{r.text}</div>
                      </div>
                    ))}
                    {(!userMe?.reviews || userMe.reviews.length === 0) && <div className="meta">Yorum yok.</div>}
                  </div>
                </div>
              )}
              {panelTab === 'reservations' && (
                <div className="card">
                  <div className="title">Rezervasyonlarım</div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                    {(userMe?.reservations || []).map((r) => (
                      <div key={r._id} className="review">
                        <div className="meta-row" style={{ marginBottom: 6 }}>
                          {r.googlePlaceId && <span className="meta">{r.googlePlaceId}</span>}
                          {r.date && <span className="meta">{r.date}</span>}
                          <span className="meta">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        {r.notes && <div>{r.notes}</div>}
                      </div>
                    ))}
                    {(!userMe?.reservations || userMe.reservations.length === 0) && <div className="meta">Rezervasyon yok.</div>}
                  </div>
                </div>
              )}
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


