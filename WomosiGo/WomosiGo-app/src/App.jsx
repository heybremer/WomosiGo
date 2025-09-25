import React, { useEffect, useRef, useState, useMemo } from 'react'
import Map from './Map.jsx'
import AdminPanel from './views/AdminPanel.jsx'
import UserPanel from './views/UserPanel.jsx'
import RegisterView from './views/RegisterView.jsx'
import AdminTaskDetail from './views/AdminTaskDetail.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import AdminNotifications from './views/AdminNotifications.jsx'

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isRegisterView, setIsRegisterView] = useState(() => window.location.hash === '#register')
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPhoneCountry, setRegPhoneCountry] = useState('+49')
  const [regState, setRegState] = useState('')
  const [regRegion, setRegRegion] = useState('')
  const [regCarBrand, setRegCarBrand] = useState('')
  const [regCarModel, setRegCarModel] = useState('')
  const [regCarYear, setRegCarYear] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regMessage, setRegMessage] = useState('')

  const GERMAN_STATES = [
    'Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern',
    'Niedersachsen','Nordrhein-Westfalen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen'
  ]
  const REGIONS_BY_STATE = {
    'Bayern': ['Oberbayern','Niederbayern','Oberpfalz','Oberfranken','Mittelfranken','Unterfranken','Schwaben'],
    'Baden-Württemberg': ['Freiburg','Karlsruhe','Stuttgart','Tübingen'],
    'Nordrhein-Westfalen': ['Köln','Düsseldorf','Münster','Detmold','Arnsberg'],
  }
  const PHONE_CODES = [
    { code: '+49', label: 'Germany (+49)' },
    { code: '+90', label: 'Türkiye (+90)' },
    { code: '+43', label: 'Austria (+43)' },
    { code: '+41', label: 'Switzerland (+41)' },
    { code: '+31', label: 'Netherlands (+31)' },
  ]
  const CAR_BRANDS = ['Hymer','Knaus','Dethleffs','Weinsberg','Adria','Hobby','Carado','Sunlight','Volkswagen','Mercedes-Benz','Fiat','Ford','Diğer']
  const YEARS = Array.from({ length: (new Date().getFullYear() - 1980 + 1) }, (_, i) => String(1980 + i)).reverse()

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [nearby, setNearby] = useState([])
  const [promotedList, setPromotedList] = useState([])
  const [fetchingNearby, setFetchingNearby] = useState(false)
  const [nearbyMsg, setNearbyMsg] = useState('')
  const autoFetchedRef = useRef(false)
  const [phones, setPhones] = useState({})
  const [query, setQuery] = useState('')
  const [photos, setPhotos] = useState({})
  const [ratings, setRatings] = useState({})
  const [detail, setDetail] = useState(null)
  const [lightbox, setLightbox] = useState({ open: false, list: [], index: 0 })
  const [isAdminView, setIsAdminView] = useState(() => {
    const h = window.location.hash || ''
    return h === '#admin' || h.startsWith('#admin/')
  })
  const [isUserView, setIsUserView] = useState(() => window.location.hash === '#panel')
  const [routeHash, setRouteHash] = useState(() => window.location.hash || '')
  const [userMe, setUserMe] = useState(null)
  const [userMeError, setUserMeError] = useState('')
  const [userMeLoading, setUserMeLoading] = useState(false)
  const [favDetails, setFavDetails] = useState([])
  const [panelTab, setPanelTab] = useState('favorites') // favorites | activities | reviews | reservations
  const [adminStats, setAdminStats] = useState(null)
  const [adminError, setAdminError] = useState('')
  const [adminTab, setAdminTab] = useState('overview') // overview | users | businesses | reviews | reservations | activities
  const [adminJwt, setAdminJwt] = useState(() => {
    try { return localStorage.getItem('acc_token') || localStorage.getItem('token') || '' } catch (_) { return '' }
  })
  const [adminLoading, setAdminLoading] = useState(false)
  
  const [favSet, setFavSet] = useState(() => new Set())
  const [visibleCount, setVisibleCount] = useState(10)
  const accToken = typeof window !== 'undefined' ? localStorage.getItem('acc_token') : null
  const [sortBy, setSortBy] = useState('nearest') // nearest | most_reviews | top_rated | none
  const radiusStepsKm = [1, 3, 5, 10, 30, 50, 100, 200, 400, 800]
  const [radiusIndex, setRadiusIndex] = useState(5) // default 50 km
  const [loggedIn, setLoggedIn] = useState(() => {
    try { return Boolean(localStorage.getItem('token')) } catch (_) { return false }
  })
  const [role, setRole] = useState(() => {
    try {
      const t = localStorage.getItem('token')
      if (!t) return ''
      const p = JSON.parse(atob(t.split('.')[1] || ''))
      return p?.role || ''
    } catch (_) { return '' }
  })
  
  // Helpers to collect and update registration values as an object for RegisterView
  function getRegValues() {
    return {
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
    }
  }
  function setRegValues(updater) {
    const prev = getRegValues()
    const next = typeof updater === 'function' ? updater(prev) : updater
    if (next.regFirstName !== undefined && next.regFirstName !== prev.regFirstName) setRegFirstName(next.regFirstName)
    if (next.regLastName !== undefined && next.regLastName !== prev.regLastName) setRegLastName(next.regLastName)
    if (next.regEmail !== undefined && next.regEmail !== prev.regEmail) setRegEmail(next.regEmail)
    if (next.regPassword !== undefined && next.regPassword !== prev.regPassword) setRegPassword(next.regPassword)
    if (next.regPassword2 !== undefined && next.regPassword2 !== prev.regPassword2) setRegPassword2(next.regPassword2)
    if (next.regPhoneCountry !== undefined && next.regPhoneCountry !== prev.regPhoneCountry) setRegPhoneCountry(next.regPhoneCountry)
    if (next.regPhone !== undefined && next.regPhone !== prev.regPhone) setRegPhone(next.regPhone)
    if (next.regState !== undefined && next.regState !== prev.regState) setRegState(next.regState)
    if (next.regRegion !== undefined && next.regRegion !== prev.regRegion) setRegRegion(next.regRegion)
    if (next.regCarBrand !== undefined && next.regCarBrand !== prev.regCarBrand) setRegCarBrand(next.regCarBrand)
    if (next.regCarModel !== undefined && next.regCarModel !== prev.regCarModel) setRegCarModel(next.regCarModel)
    if (next.regCarYear !== undefined && next.regCarYear !== prev.regCarYear) setRegCarYear(next.regCarYear)
  }
  

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Login failed')
      setMessage('Giriş başarılı')
      localStorage.setItem('token', data.token)
      setLoggedIn(true)
      const r = data?.user?.role || (() => { try { return JSON.parse(atob(data.token.split('.')[1]||''))?.role } catch(_) { return '' } })()
      setRole(r || '')
      if (r === 'admin') {
        try { localStorage.setItem('acc_token', data.token) } catch (_) {}
        // Proactively yükle
        try { await loadAdminStats() } catch (_) {}
      }
      window.location.hash = (r === 'admin') ? '#admin' : '#panel'
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setRegLoading(true)
    setRegMessage('')
    try {
      if (regPassword !== regPassword2) {
        throw new Error('Şifreler eşleşmiyor')
      }
      const phoneFormatted = regPhone ? (regPhoneCountry + String(regPhone).replace(/\D/g, '')) : undefined
      const res = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: `${regFirstName} ${regLastName}`.trim(),
          email: regEmail,
          password: regPassword,
          phone: phoneFormatted,
          countryCode: regPhoneCountry || undefined,
          state: regState || undefined,
          region: regRegion || undefined,
          carBrand: regCarBrand || undefined,
          carModel: regCarModel || undefined,
          carYear: regCarYear || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Kayıt başarısız')
      // Kayıt başarılı -> otomatik giriş dene
      try {
        const resLogin = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, password: regPassword }),
        })
        const loginData = await resLogin.json().catch(() => ({}))
        if (resLogin.ok && loginData?.token) {
          localStorage.setItem('token', loginData.token)
          setRegMessage('Kayıt ve giriş başarılı')
          setLoggedIn(true)
          const r = loginData?.user?.role || (() => { try { return JSON.parse(atob(loginData.token.split('.')[1]||''))?.role } catch(_) { return '' } })()
          setRole(r || '')
          setMessage('Giriş başarılı')
          window.location.hash = (r === 'admin') ? '#admin' : '#panel'
        } else {
          setRegMessage('Kayıt başarılı, lütfen giriş yapın')
        }
      } catch (_) {
        setRegMessage('Kayıt başarılı, lütfen giriş yapın')
      }
    } catch (err) {
      setRegMessage(err?.message || 'Bir hata oluştu')
    } finally {
      setRegLoading(false)
    }
  }

  async function handleLocate() {
    setNearbyMsg('')
    if (!('geolocation' in navigator)) {
      setNearbyMsg('Geolocation desteklenmiyor')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLat(String(latitude))
        setLng(String(longitude))
      },
      (err) => setNearbyMsg(err.message || 'Konum alınamadı'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function fetchNearby(e) {
    e?.preventDefault?.()
    setNearbyMsg('')
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (!isFinite(latNum) || !isFinite(lngNum)) {
      setNearbyMsg('Geçerli lat/lng girin veya konumunuzu alın')
      return
    }
    setFetchingNearby(true)
    try {
      const radiusKm = radiusStepsKm[Math.max(0, Math.min(radiusIndex, radiusStepsKm.length - 1))]
      const radiusMeters = Math.max(100, Math.min(Math.round(radiusKm * 1000), 50000))
      // Önce veritabanından ara
      const urlDb = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/nearby?lat=${latNum}&lng=${lngNum}&radius=${radiusMeters}`
      const resDb = await fetch(urlDb)
      const dataDb = await resDb.json()
      if (!resDb.ok) throw new Error(dataDb?.message || 'Liste alınamadı')

      let results = Array.isArray(dataDb) ? dataDb : []
      // DB boşsa Google Places üzerinden dene (anahtar/izin gerekir)
      if (results.length === 0) {
        const urlG = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/google?lat=${latNum}&lng=${lngNum}&radius=${radiusMeters}&keyword=campground&store=false`
        const resG = await fetch(urlG)
        const dataG = await resG.json()
        if (!resG.ok) throw new Error(dataG?.error_message || dataG?.message || 'Google Places isteği başarısız')
        results = Array.isArray(dataG) ? dataG : []
      }

      setNearby(results)
      setVisibleCount(10)
      setNearbyMsg(`Bulunan kamp sayısı: ${results.length}`)
    } catch (err) {
      setNearbyMsg(err.message)
    } finally {
      setFetchingNearby(false)
    }
  }

  

  // Sayfa yüklenince otomatik konum al
  useEffect(() => {
    // Otomatik olarak kullanıcının konumunu iste
    handleLocate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Koordinatlar geldiyse bir kez otomatik listele
  useEffect(() => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (isFinite(latNum) && isFinite(lngNum) && !autoFetchedRef.current && !fetchingNearby) {
      autoFetchedRef.current = true
      fetchNearby()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  // Yarıçap değişince otomatik listele (debounce)
  useEffect(() => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (!isFinite(latNum) || !isFinite(lngNum)) return
    const t = setTimeout(() => {
      if (!fetchingNearby) fetchNearby()
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusIndex])

  function toRad(v) {
    return (v * Math.PI) / 180
  }
  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const sortedNearby = useMemo(() => {
    if (!Array.isArray(nearby) || nearby.length === 0) return []
    const myLat = parseFloat(lat)
    const myLng = parseFloat(lng)
    const hasMy = isFinite(myLat) && isFinite(myLng)
    const withMetrics = nearby.map((c) => {
      const coords = Array.isArray(c?.location?.coordinates) ? c.location.coordinates : []
      const cLng = typeof coords?.[0] === 'number' ? coords[0] : undefined
      const cLat = typeof coords?.[1] === 'number' ? coords[1] : undefined
      const r = ratings[c.googlePlaceId] || {}
      const effRating = typeof c.rating === 'number' ? c.rating : r.rating
      const effReviews = typeof c.userRatingsTotal === 'number' ? c.userRatingsTotal : r.userRatingsTotal
      const dist = hasMy && typeof cLat === 'number' && typeof cLng === 'number'
        ? distanceKm(myLat, myLng, cLat, cLng)
        : Number.POSITIVE_INFINITY
      return { c, effRating: Number(effRating) || 0, effReviews: Number(effReviews) || 0, dist }
    })
    switch (sortBy) {
      case 'nearest':
        return withMetrics.sort((a, b) => a.dist - b.dist).map((x) => x.c)
      case 'most_reviews':
        return withMetrics
          .sort((a, b) => (b.effReviews - a.effReviews) || (b.effRating - a.effRating))
          .map((x) => x.c)
      case 'top_rated':
        return withMetrics
          .sort((a, b) => (b.effRating - a.effRating) || (b.effReviews - a.effReviews))
          .map((x) => x.c)
      default:
        return nearby
    }
  }, [nearby, sortBy, lat, lng, ratings])

  const matchedPremium = useMemo(() => {
    if (!Array.isArray(promotedList) || promotedList.length === 0) return []
    const byId = new Map()
    nearby.forEach((n) => {
      if (n?.googlePlaceId) byId.set(n.googlePlaceId, n)
    })
    return promotedList
      .map((p) => {
        if (!p?.googlePlaceId) return null
        const base = byId.get(p.googlePlaceId)
        if (!base) return null
        return { ...p, ...base }
      })
      .filter(Boolean)
  }, [promotedList, nearby])

  async function fetchPhone(camp) {
    try {
      if (!camp?.googlePlaceId) return
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/details?placeId=${encodeURIComponent(camp.googlePlaceId)}&reviewsLimit=10`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error_message || 'Telefon alınamadı')
      if (data?.phone) {
        setPhones((p) => ({ ...p, [camp.googlePlaceId]: data.phone }))
      } else {
        alert('Telefon bilgisi bulunamadı')
      }
    } catch (err) {
      alert(err.message)
    }
  }

  async function fetchPhoto(camp) {
    try {
      if (!camp?.googlePlaceId) return
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/details?placeId=${encodeURIComponent(camp.googlePlaceId)}&reviewsLimit=10`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error_message || 'Fotoğraf alınamadı')
      if (data?.photoRef) {
        setPhotos((p) => ({ ...p, [camp.googlePlaceId]: data.photoRef }))
      }
      if (typeof data?.rating === 'number' || typeof data?.userRatingsTotal === 'number') {
        setRatings((p) => ({ ...p, [camp.googlePlaceId]: { rating: data.rating, userRatingsTotal: data.userRatingsTotal } }))
      }
    } catch (_) {}
  }

  async function toggleFavoriteFromList(camp) {
    try {
      const placeId = camp?.googlePlaceId
      if (!placeId) { alert('Geçersiz öğe'); return }
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) { alert('Favori eklemek için lütfen giriş yapın'); return }
      const resp = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ googlePlaceId: placeId }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || 'İşlem başarısız')
      setFavSet(new Set(Array.isArray(data?.favorites) ? data.favorites : []))
      const added = Array.isArray(data?.favorites) && data.favorites.includes(placeId)
      alert(added ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı')
      try {
        await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: added ? 'favorite_add' : 'favorite_remove', googlePlaceId: placeId }),
        })
      } catch (_) {}
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function openDetails(camp) {
    // Open the modal immediately with available data; enrich from backend if possible
    const initial = {
      placeId: camp?.googlePlaceId,
      name: camp?.name,
      address: camp?.address,
      phone: undefined,
      openNow: typeof camp?.openNow === 'boolean' ? camp.openNow : undefined,
      busyLevel: undefined,
      busyScore: undefined,
      rating: typeof camp?.rating === 'number' ? camp.rating : undefined,
      userRatingsTotal: typeof camp?.userRatingsTotal === 'number' ? camp.userRatingsTotal : undefined,
      website: undefined,
      mapsUrl: camp?.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${camp.googlePlaceId}` : undefined,
      openingHours: undefined,
      currentOpeningHours: undefined,
      photoRefs: Array.isArray(camp?.photoRefs) ? camp.photoRefs : (camp?.photoRef ? [camp.photoRef] : []),
      reviews: [],
      reviewDraft: { rating: 5, text: '' },
      reservationDraft: { date: '', notes: '' },
    }
    setDetail(initial)
    try {
      if (!camp?.googlePlaceId) {
        return
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/details?placeId=${encodeURIComponent(camp.googlePlaceId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error_message || 'Detay alınamadı')
      setDetail({
        placeId: camp.googlePlaceId,
        name: data?.name || camp.name,
        address: data?.address || camp.address,
        phone: data?.phone,
        openNow: typeof data?.openNow === 'boolean' ? data.openNow : initial.openNow,
        busyLevel: data?.busyLevel,
        busyScore: typeof data?.busyScore === 'number' ? data.busyScore : undefined,
        rating: typeof data?.rating === 'number' ? data.rating : initial.rating,
        userRatingsTotal: typeof data?.userRatingsTotal === 'number' ? data.userRatingsTotal : initial.userRatingsTotal,
        website: data?.website,
        mapsUrl: data?.mapsUrl || initial.mapsUrl,
        openingHours: data?.openingHours,
        currentOpeningHours: data?.currentOpeningHours,
        photoRefs: Array.isArray(data?.photoRefs) ? data.photoRefs : initial.photoRefs,
        reviews: Array.isArray(data?.reviews) ? data.reviews : [],
        reviewDraft: { rating: 5, text: '' },
        reservationDraft: { date: '', notes: '' },
      })
    } catch (err) {
      // Keep modal open with initial data if backend fails
      console.warn(err && err.message ? err.message : err)
    }
  }

  async function submitReview() {
    try {
      if (!detail?.placeId) {
        alert('Detay yüklenmemiş')
        return
      }
      const acc = localStorage.getItem('acc_token')
      if (!acc) {
        alert('Lütfen admin token girin (üstteki alana)')
        return
      }
      const rating = Number(detail?.reviewDraft?.rating || 0)
      const text = String(detail?.reviewDraft?.text || '')
      if (!isFinite(rating) || rating < 1) {
        alert('Geçerli bir puan seçin')
        return
      }
      const resp = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` },
        body: JSON.stringify({ googlePlaceId: detail.placeId, rating, text }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || 'Gönderilemedi')
      setDetail((prev) => ({
        ...prev,
        reviews: [
          { authorName: 'Siz', rating, text, relativeTime: 'now' },
          ...(Array.isArray(prev?.reviews) ? prev.reviews : []),
        ],
        reviewDraft: { rating: 5, text: '' },
      }))
      alert('Yorum gönderildi')
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function submitReservation() {
    try {
      if (!detail?.placeId) {
        alert('Detay yüklenmemiş')
        return
      }
      const acc = localStorage.getItem('acc_token')
      if (!acc) {
        alert('Lütfen admin token girin (üstteki alana)')
        return
      }
      const date = String(detail?.reservationDraft?.date || '')
      const notes = String(detail?.reservationDraft?.notes || '')
      if (!date) {
        alert('Tarih seçin')
        return
      }
      const resp = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc}` },
        body: JSON.stringify({ googlePlaceId: detail.placeId, date, notes }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || 'Gönderilemedi')
      alert('Rezervasyon isteği gönderildi')
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  async function handleSearch(e) {
    e?.preventDefault?.()
    if (!query.trim()) return
    setNearbyMsg('')
    setFetchingNearby(true)
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/search?query=${encodeURIComponent(query)}&radius=8000&store=false`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error_message || 'Arama başarısız')
      if (data?.center?.lat && data?.center?.lng) {
        setLat(String(data.center.lat))
        setLng(String(data.center.lng))
      }
      setNearby(Array.isArray(data?.results) ? data.results : [])
      setVisibleCount(10)
      setNearbyMsg(`Bulunan kamp sayısı: ${Array.isArray(data?.results) ? data.results.length : 0}`)
      // Log activity: search (if account token present)
      const accToken = localStorage.getItem('acc_token')
      if (accToken && query.trim()) {
        try {
          await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accToken}` },
            body: JSON.stringify({ type: 'search', googlePlaceId: undefined, meta: { query } }),
          })
        } catch (_) {}
      }
    } catch (err) {
      setNearbyMsg(err.message)
    } finally {
      setFetchingNearby(false)
    }
  }
  // Debounce: yazarken otomatik arama
  useEffect(() => {
    const q = query.trim()
    if (!q) return
    const t = setTimeout(() => {
      handleSearch()
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Liste değişince eksik foto/puan bilgisi olan ilk birkaç kamp için detaydan çek
  useEffect(() => {
    const missing = nearby
      .filter((c) => c.googlePlaceId)
      .filter((c) => (!c.photoRef && !photos[c.googlePlaceId]) || (typeof c.rating !== 'number' || typeof c.userRatingsTotal !== 'number') || (typeof c.openNow !== 'boolean'))
      .slice(0, 8)
    if (missing.length === 0) return
    missing.forEach((c) => fetchPhoto(c))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/businesses')
        const data = await res.json()
        if (res.ok && Array.isArray(data)) {
          setPromotedList(data)
        }
      } catch (_) {}
    })()
  }, [])

  // Log a lightweight view activity for the first batch of results
  useEffect(() => {
    const accToken = localStorage.getItem('acc_token')
    if (!accToken || !Array.isArray(nearby) || nearby.length === 0) return
    const first = nearby.slice(0, 10).map((c) => c.googlePlaceId).filter(Boolean)
    if (first.length === 0) return
    ;(async () => {
      try {
        await Promise.all(
          first.map((pid) =>
            fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accToken}` },
              body: JSON.stringify({ type: 'view', googlePlaceId: pid }),
            })
          )
        )
      } catch (_) {}
    })()
  }, [nearby])

  // Hash routing (#admin, #register)
  useEffect(() => {
    const onHash = () => {
      let h = window.location.hash
      if (h === '#admin') {
        window.location.hash = '#admin/overview'
        return
      }
      setRouteHash(h)
      // Adminler kullanıcı paneline erişemez
      if (role === 'admin' && h === '#panel') {
        window.location.hash = '#admin/overview'
        return
      }
      setIsAdminView(h.startsWith('#admin'))
      setIsRegisterView(h === '#register')
      setIsUserView(h === '#panel' && role !== 'admin')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [role])

  // Admin rolü için yanlış rota (#panel) gelirse düzelt
  useEffect(() => {
    if (role === 'admin' && window.location.hash === '#panel') {
      window.location.hash = '#admin/overview'
    }
  }, [role])

  // On mount: detect role from token but do not auto-redirect; allow homepage to open
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (t) {
        const p = JSON.parse(atob(t.split('.')[1] || ''))
        const r = p?.role
        setRole(r || '')
        if (r === 'admin') {
          try { localStorage.setItem('acc_token', t) } catch (_) {}
        }
      }
    } catch (_) {}
  }, [])

  // (moved earlier) admin auto-load effect is defined above before any early return

  function handleLogout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('acc_token')
    } catch (_) {}
    setLoggedIn(false)
    setRole('')
    window.location.hash = ''
  }

  // Auto-load admin stats when admin view opens and token exists (single definition)
  useEffect(() => {
    if (!isAdminView) return
    try {
      const t = localStorage.getItem('acc_token') || localStorage.getItem('token') || adminJwt
      if (t) {
        localStorage.setItem('acc_token', t)
        if (!adminStats && !adminLoading) loadAdminStats()
      }
    } catch (_) {}
  }, [isAdminView, adminJwt, adminLoading])

  async function loadUserMe() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setUserMe(null)
      setUserMeError('Oturum bulunamadı')
        return
      }
    setUserMeLoading(true)
    setUserMeError('')
    try {
      const res = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Yüklenemedi')
      setUserMe(data)
    } catch (err) {
      setUserMeError(err?.message || 'Bir hata oluştu')
    } finally {
      setUserMeLoading(false)
    }
  }

  async function toggleFavorite(placeId) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) { alert('Giriş yapın'); return }
      const res = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ googlePlaceId: placeId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Favori güncellenemedi')
      setUserMe((prev) => prev ? { ...prev, account: { ...(prev.account||{}), favorites: data.favorites || [] } } : prev)
    } catch (err) {
      alert(err?.message || 'Bir hata oluştu')
    }
  }

  // Favorites → fetch rich details similar to homepage cards
  useEffect(() => {
    const pids = userMe?.account?.favorites || []
    if (!Array.isArray(pids) || pids.length === 0) {
      setFavDetails([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const results = await Promise.all(
          pids.map(async (pid) => {
            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/details?placeId=${encodeURIComponent(pid)}&reviewsLimit=0`)
              const data = await res.json().catch(() => ({}))
              if (!res.ok) throw new Error()
              return {
                googlePlaceId: pid,
                name: data?.name,
                address: data?.address,
                photoRef: Array.isArray(data?.photoRefs) ? data.photoRefs[0] : data?.photoRef,
                rating: data?.rating,
                userRatingsTotal: data?.userRatingsTotal,
                openNow: typeof data?.openNow === 'boolean' ? data.openNow : undefined,
                location: (typeof data?.location?.lat === 'number' && typeof data?.location?.lng === 'number')
                  ? { coordinates: [data.location.lng, data.location.lat] }
                  : undefined,
              }
            } catch (_) {
              return { googlePlaceId: pid }
            }
          })
        )
        if (!cancelled) setFavDetails(results)
      } catch (_) {}
    })()
    return () => { cancelled = true }
  }, [userMe])

  // Helper: render register page content
  const renderRegister = () => (
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
        <form onSubmit={handleRegister} className="register-form" style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
          <div className="form-grid">
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Ad</span>
              <input value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} placeholder="Ad" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Soyad</span>
              <input value={regLastName} onChange={(e) => setRegLastName(e.target.value)} placeholder="Soyad" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>E-posta</span>
              <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} type="email" placeholder="rep@firma.com" required className="input" />
            </label>
            <div style={{ display: 'grid', gap: 6 }}>
              <span>Telefon</span>
              <div className="row" style={{ gap: 8 }}>
                <select className="input" value={regPhoneCountry} onChange={(e) => setRegPhoneCountry(e.target.value)} style={{ width: 140 }}>
                  {PHONE_CODES.map((p) => (<option key={p.code} value={p.code}>{p.label}</option>))}
                </select>
                <input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="Mobil telefon" className="input" style={{ flex: 1 }} />
              </div>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Şifre</span>
              <input value={regPassword} onChange={(e) => setRegPassword(e.target.value)} type="password" placeholder="••••••••" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Şifre (tekrar)</span>
              <input value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)} type="password" placeholder="••••••••" required className="input" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Eyalet</span>
              <select className="input" value={regState} onChange={(e) => { setRegState(e.target.value); setRegRegion(''); }}>
                <option value="">Seçiniz</option>
                {GERMAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Bölge</span>
              <select className="input" value={regRegion} onChange={(e) => setRegRegion(e.target.value)} disabled={!regState}>
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
                <select className="input" value={regCarBrand} onChange={(e) => setRegCarBrand(e.target.value)}>
                  <option value="">Seçiniz</option>
                  {CAR_BRANDS.map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Model</span>
                <input value={regCarModel} onChange={(e) => setRegCarModel(e.target.value)} placeholder="Model" className="input" />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Yıl</span>
                <select className="input" value={regCarYear} onChange={(e) => setRegCarYear(e.target.value)}>
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

  // Removed obsolete early-return block for user page (replaced with renderUser helper)

  // Helper: render admin page
  const renderAdmin = () => (
    <div className="container">
        <div className="header">
          <div className="brand">
            <div className="brand-logo" />
            <div className="brand-title">WomosiGo</div>
          </div>
          <div className="row">
            <button type="button" className="btn secondary" onClick={() => (window.location.hash = '')}>Anasayfa</button>
            <button type="button" className="btn" onClick={handleLogout}>Çıkış Yap</button>
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
              <button className={`navlink ${adminTab==='overview' ? 'active' : ''}`} onClick={() => setAdminTab('overview')}>Genel</button>
              <button className={`navlink ${adminTab==='users' ? 'active' : ''}`} onClick={() => setAdminTab('users')}>Kullanıcılar</button>
              <button className={`navlink ${adminTab==='businesses' ? 'active' : ''}`} onClick={() => setAdminTab('businesses')}>İşletmeler</button>
              <button className={`navlink ${adminTab==='reviews' ? 'active' : ''}`} onClick={() => setAdminTab('reviews')}>Yorumlar</button>
              <button className={`navlink ${adminTab==='reservations' ? 'active' : ''}`} onClick={() => setAdminTab('reservations')}>Rezervasyonlar</button>
              <button className={`navlink ${adminTab==='activities' ? 'active' : ''}`} onClick={() => setAdminTab('activities')}>Aktiviteler</button>
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
              {adminTab !== 'overview' && (
                <div className="card"><div className="meta">Bu bölüm için yönetim sayfalarını ekleyebiliriz.</div></div>
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
  // Helper: render user page
  const renderUser = () => (
    <div className="container">
        <div className="header">
          <div className="brand">
            <div className="brand-logo" />
            <div className="brand-title">WomosiGo</div>
          </div>
          <div className="row">
            <button type="button" className="btn secondary" onClick={() => (window.location.hash = '')}>Anasayfa</button>
            <button type="button" className="btn" onClick={handleLogout}>Çıkış Yap</button>
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
                    const imgUrl = c.photoRef
                      ? `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/photo?photoRef=${encodeURIComponent(c.photoRef)}&maxWidth=400`
                      : null
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
                            <a
                              className="icon-btn"
                              href={`https://www.google.com/maps/place/?q=place_id:${c.googlePlaceId}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Haritada Aç"
                              title="Haritada Aç"
                            >
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

  async function loadAdminStats() {
    try {
      setAdminError('')
      setAdminStats(null)
      setAdminLoading(true)
      const accToken = localStorage.getItem('acc_token') || localStorage.getItem('token')
      if (!accToken) {
        setAdminError('Lütfen admin token girin')
        return
      }
      const res = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/stats', { headers: { Authorization: `Bearer ${accToken}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Yüklenemedi')
      setAdminStats(data)
    } catch (err) {
      setAdminError(err.message)
    } finally {
      setAdminLoading(false)
    }
  }

  // Compose view: helper to choose which page to render (no hooks inside)
  function renderPage() {
    if (isRegisterView) return (
      <RegisterView
        GERMAN_STATES={GERMAN_STATES}
        REGIONS_BY_STATE={REGIONS_BY_STATE}
        PHONE_CODES={PHONE_CODES}
        CAR_BRANDS={CAR_BRANDS}
        YEARS={YEARS}
        values={getRegValues()}
        setValues={setRegValues}
        onSubmit={handleRegister}
        regLoading={regLoading}
        regMessage={regMessage}
      />
    )
    if (isAdminView) {
      const h = routeHash || window.location.hash || ''
      if (h.startsWith('#admin/task/')) {
        const taskId = h.replace('#admin/task/', '')
        return (
          <AdminTaskDetail
            taskId={taskId}
            onBack={() => { window.location.hash = '#admin/tasks'; }}
          />
        )
      }
      if (h === '#admin/notifications') {
        return (
          <AdminNotifications onLogout={handleLogout} />
        )
      }
      return (
        <AdminPanel
          routeHash={routeHash}
          adminStats={adminStats}
          adminError={adminError}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          adminJwt={adminJwt}
          setAdminJwt={setAdminJwt}
          loadAdminStats={loadAdminStats}
          onLogout={handleLogout}
        />
      )
    }
    if (isUserView && role !== 'admin') return (
      <UserPanel
        userMe={userMe}
        userMeError={userMeError}
        userMeLoading={userMeLoading}
        loadUserMe={loadUserMe}
        panelTab={panelTab}
        setPanelTab={setPanelTab}
        favDetails={favDetails}
        toggleFavorite={toggleFavorite}
        onLogout={handleLogout}
      />
    )
    return renderHomepage()
  }

  // Auto-load admin stats when admin view opens and token exists (single definition)
  useEffect(() => {
    if (!isAdminView) return
    try {
      const t = localStorage.getItem('acc_token') || localStorage.getItem('token') || adminJwt
      if (t) {
        localStorage.setItem('acc_token', t)
        if (!adminStats && !adminLoading) loadAdminStats()
      }
    } catch (_) {}
  }, [isAdminView, adminJwt, adminLoading])

  

  // Homepage renderer (formerly a stray block)
  function renderHomepage() {
    return (
      <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brand-logo" />
          <div className="brand-title">WomosiGo</div>
        </div>
        <div className="row">
          <NotificationBell />
        </div>
        {!loggedIn && (
        <form onSubmit={handleLogin} className="row" style={{ maxWidth: 480 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>E-posta</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="ornek@firma.com"
              required
              className="input"
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Şifre</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
              required
              className="input"
          />
        </label>
        <button disabled={loading} type="submit" className="btn">
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
        {message && (
          <div role="status" aria-live="polite" className="meta">
            {message}
          </div>
        )}
        </form>
        )}
        <div className="row">
          {loggedIn ? (
            <>
              <button type="button" className="btn secondary" onClick={() => (window.location.hash = '#panel')}>Panel</button>
              <button type="button" className="btn" onClick={handleLogout}>Çıkış Yap</button>
            </>
          ) : (
            <button type="button" className="btn secondary" onClick={() => (window.location.hash = '#register')}>Kayıt Ol</button>
          )}
        </div>
      </div>

      <section className="panel">
        <h2>Yakındaki Kamp Alanları</h2>
        <div className="row">
          <form onSubmit={handleSearch} className="row searchbar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Şehir veya bölge ara (örn. İstanbul, Antalya)"
              className="input"
            />
            <button type="submit" className="btn">Ara</button>
          </form>
          <button type="button" onClick={handleLocate} className="btn secondary">
            Konumumu Al
          </button>
          <label className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="meta">Sırala</span>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 200 }}>
              <option value="nearest">En yakın</option>
              <option value="most_reviews">En çok yorum alan</option>
              <option value="top_rated">En beğenilen</option>
              <option value="none">Önemsiz</option>
            </select>
          </label>
          <label className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="meta">Yarıçap</span>
            <input
              type="range"
              min={0}
              max={9}
              step={1}
              value={radiusIndex}
              onChange={(e) => setRadiusIndex(Number(e.target.value))}
            />
            <span className="meta">{radiusStepsKm[radiusIndex]} km</span>
          </label>
          <form onSubmit={fetchNearby} className="row">
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              inputMode="decimal"
              placeholder="lat"
              className="input"
              style={{ width: 140 }}
            />
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              inputMode="decimal"
              placeholder="lng"
              className="input"
              style={{ width: 140 }}
            />
            <button disabled={fetchingNearby} type="submit" className="btn">
              {fetchingNearby ? 'Yükleniyor…' : 'Yakındakileri Getir'}
            </button>
            
          </form>
        </div>
        {nearbyMsg && <div className="meta" style={{ marginTop: 8 }}>{nearbyMsg}</div>}

        <div className="grid-h2">
        <div className="grid">
          {sortedNearby.slice(0, visibleCount).map((c) => {
            const photoRef = c.photoRef || photos[c.googlePlaceId]
            const r = ratings[c.googlePlaceId] || {}
            const effRating = typeof c.rating === 'number' ? c.rating : r.rating
            const effReviews = typeof c.userRatingsTotal === 'number' ? c.userRatingsTotal : r.userRatingsTotal
            const imgUrl = photoRef
              ? `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/photo?photoRef=${encodeURIComponent(photoRef)}&maxWidth=400`
              : null
            return (
              <div key={c._id || `${c.googlePlaceId}-${c.name}`} className="card">
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
                    <div className="title">{c.name || 'İsimsiz kamp'}</div>
                   
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
                  {(() => {
                    const coords = c?.location?.coordinates
                    const hasCoords = Array.isArray(coords) && coords.length === 2
                    const myLat = parseFloat(lat)
                    const myLng = parseFloat(lng)
                    if (!hasCoords || !isFinite(myLat) || !isFinite(myLng)) return null
                    const d = distanceKm(myLat, myLng, coords[1], coords[0])
                    return <div className="meta">Mesafe: {d.toFixed(2)} km</div>
                  })()}
                  <div className="actions">
                    {!phones[c.googlePlaceId] ? (
                      <button
                        type="button"
                        onClick={() => fetchPhone(c)}
                        className="icon-btn"
                        aria-label="Ara"
                        title="Ara"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 01.98-.26c1.08.27 2.23.41 3.41.41a1 1 0 011 1V21a1 1 0 01-1 1C10.85 22 2 13.15 2 2a1 1 0 011-1h3.67a1 1 0 011 1c0 1.18.14 2.33.41 3.41a1 1 0 01-.26.98l-2.2 2.2z"/>
                        </svg>
                      </button>
                    ) : (
                      <a
                        href={`tel:${phones[c.googlePlaceId]}`}
                        className="icon-btn"
                        aria-label={`Ara: ${phones[c.googlePlaceId]}`}
                        title={phones[c.googlePlaceId]}
                        onClick={() => {
                          const accToken = localStorage.getItem('acc_token')
                          if (accToken && c.googlePlaceId) {
                            fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/activities', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accToken}` },
                              body: JSON.stringify({ type: 'call', googlePlaceId: c.googlePlaceId }),
                            }).catch(() => {})
                          }
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 01.98-.26c1.08.27 2.23.41 3.41.41a1 1 0 011 1V21a1 1 0 01-1 1C10.85 22 2 13.15 2 2a1 1 0 011-1h3.67a1 1 0 011 1c0 1.18.14 2.33.41 3.41a1 1 0 01-.26.98l-2.2 2.2z"/>
                        </svg>
                      </a>
                    )}
                    {Array.isArray(c?.location?.coordinates) && c.location.coordinates.length === 2 && typeof c.location.coordinates[0] === 'number' && typeof c.location.coordinates[1] === 'number' && (
                      <a
                        className="icon-btn"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${c.location.coordinates[1]},${c.location.coordinates[0]}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Yol Tarifi"
                        title="Yol Tarifi"
                      onClick={() => {
                        const accToken = localStorage.getItem('acc_token')
                        if (accToken && c.googlePlaceId) {
                          fetch('${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/user/activities', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accToken}` },
                            body: JSON.stringify({ type: 'directions', googlePlaceId: c.googlePlaceId }),
                          }).catch(() => {})
                        }
                      }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M17.27 6.73L3 12l7.1 1.9L12 21l5.27-14.27z"/>
                        </svg>
                      </a>
                    )}
                    <button type="button" onClick={() => openDetails(c)} className="btn secondary">
                      Detay
                    </button>
                    <button type="button" className="btn" onClick={() => toggleFavoriteFromList(c)}>
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {nearby.length === 0 && (
            <div className="meta">Sonuç yok. Konumunuzu alın ve tekrar deneyin.</div>
          )}
        </div>
          <div>
            <div className="card">
              <div className="title" style={{ marginBottom: 8 }}>Onaylanan Premium İşletmeler</div>
              <div className="meta">Admin panelde onaylanan seçkin kamp işletmeleri</div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr', marginTop: 12 }}>
              {matchedPremium.length === 0 && <div className="meta">Onaylanan premium işletme bulunamadı.</div>}
              {matchedPremium.map((b) => {
                const photoRef = b.photoRef || photos[b.googlePlaceId]
                const img = photoRef
                  ? `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/photo?photoRef=${encodeURIComponent(photoRef)}&maxWidth=350`
                  : null
                const effRating = typeof b.rating === 'number' ? b.rating : undefined
                const effReviews = typeof b.userRatingsTotal === 'number' ? b.userRatingsTotal : undefined
                return (
                  <div key={b._id || b.googlePlaceId} className="card">
                    {img && <img src={img} alt={b.name || ''} className="thumb" style={{ height: 140 }} loading="lazy" />}
                    <div className="title-row">
                      <div className="title">{b.name || 'Premium Kamp'}</div>
                    </div>
                    {b.address && <div className="sub">{b.address}</div>}
                    <div className="meta" style={{ fontSize: 12 }}>Google Place ID: {b.googlePlaceId}</div>
                    {typeof effRating === 'number' && (
                      <div className="rating">
                        <span className="value">{effRating.toFixed(1)}</span>
                        <span className="count">({effReviews || 0})</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {nearby.length > visibleCount && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setVisibleCount((n) => Math.min(n + 10, nearby.length))}
            >
              Daha fazla göster
            </button>
          </div>
        )}
      </section>
      <div className="map">
        <Map
          center={{ lat: parseFloat(lat) || 41.015137, lng: parseFloat(lng) || 28.97953 }}
          markers={nearby.map((c) => ({
            lat: c?.location?.coordinates?.[1],
            lng: c?.location?.coordinates?.[0],
            title: c?.name,
          }))}
        />
      </div>
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{detail.name}</div>
                {typeof detail.rating === 'number' && (
                  <div className="chip">⭐ {detail.rating.toFixed(1)} ({detail.userRatingsTotal || 0})</div>
                )}
                {typeof detail.openNow === 'boolean' && (
                  <span className={`badge ${detail.openNow ? 'success' : 'danger'}`}>
                    {detail.openNow ? 'Şu an açık' : 'Şu an kapalı'}
                  </span>
                )}
                {detail.busyLevel && (
                  <span className={`badge ${detail.busyLevel === 'yüksek' ? 'danger' : detail.busyLevel === 'orta' ? 'warn' : 'success'}`}>
                    Yoğunluk: {detail.busyLevel}{typeof detail.busyScore === 'number' ? ` (${detail.busyScore}%)` : ''}
                  </span>
                )}
              </div>
              <button className="btn secondary" onClick={() => setDetail(null)}>Kapat</button>
            </div>
            <div className="modal-body">
              <div>
                <div className="meta-row" style={{ marginBottom: 8 }}>
                  {detail.address && <span>{detail.address}</span>}
                  {detail.phone && (
                    <a
                      href={`tel:${detail.phone}`}
                      className="icon-btn"
                      aria-label={`Ara: ${detail.phone}`}
                      title={detail.phone}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 01.98-.26c1.08.27 2.23.41 3.41.41a1 1 0 011 1V21a1 1 0 01-1 1C10.85 22 2 13.15 2 2a1 1 0 011-1h3.67a1 1 0 011 1c0 1.18.14 2.33.41 3.41a1 1 0 01-.26.98l-2.2 2.2z"/>
                      </svg>
                    </a>
                  )}
                  {detail.website && (
                    <a
                      href={detail.website}
                      target="_blank"
                      rel="noreferrer"
                      className="icon-btn"
                      aria-label="Web"
                      title={detail.website}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.93 9h-3.18a15.6 15.6 0 00-.93-4.07A8.03 8.03 0 0119.93 11zM12 4c1.38 0 2.66 1.73 3.38 5H8.62C9.34 5.73 10.62 4 12 4zM7.18 6.93A15.6 15.6 0 006.11 11H2.07a8.03 8.03 0 015.11-4.07zM2.07 13h4.04c.21 1.43.62 2.87 1.11 4.07A8.03 8.03 0 012.07 13zM12 20c-1.38 0-2.66-1.73-3.38-5h6.76C14.66 18.27 13.38 20 12 20zm4.82-2.93A15.6 15.6 0 0017.89 13h4.04a8.03 8.03 0 01-5.11 4.07zM17.89 11c-.21-1.43-.62-2.87-1.11-4.07A8.03 8.03 0 0121.93 11h-4.04zM6.11 13c.21 1.43.62 2.87 1.11 4.07A8.03 8.03 0 012.07 13h4.04z"/>
                      </svg>
                    </a>
                  )}
                  {typeof detail?.location?.lat === 'number' && typeof detail?.location?.lng === 'number' && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(detail.location.lat + ',' + detail.location.lng)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="icon-btn"
                      aria-label="Yol Tarifi"
                      title="Yol Tarifi"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M21.71 10.29l-8-8a1 1 0 00-1.42 0l-8 8a1 1 0 000 1.42l8 8a1 1 0 001.42 0l8-8a1 1 0 000-1.42zM12 20.59L3.41 12 12 3.41 20.59 12 12 20.59z"/>
                        <path d="M12 7a1 1 0 00-1 1v3H8a1 1 0 000 2h4a1 1 0 001-1V8a1 1 0 00-1-1z"/>
                      </svg>
                    </a>
                  )}
                </div>
                {detail.currentOpeningHours?.weekday_text && (
                  <div className="hours">
                    {detail.currentOpeningHours.weekday_text.map((t, i) => {
                      const [d, ...rest] = String(t).split(': ')
                      const txt = rest.join(': ')
                      const today = new Date().getDay() // 0=Sun..6=Sat
                      const dayMap = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
                      const todayTRMap = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi']
                      const isToday = (d && (d.toLowerCase().startsWith(todayTRMap[today].toLowerCase()) || d.toLowerCase().startsWith(dayMap[today].toLowerCase())))
                      return (
                        <div key={i} className={`hours-row ${isToday ? 'today' : ''}`}>
                          <div className="hours-day">{d}</div>
                          <div className="hours-time">{txt}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {/* Review form */}
                <div className="row" style={{ marginTop: 8 }}>
                  <select
                    className="input"
                    value={detail?.reviewDraft?.rating || 5}
                    onChange={(e) => setDetail((prev) => ({ ...prev, reviewDraft: { ...(prev?.reviewDraft||{}), rating: Number(e.target.value) } }))}
                    style={{ width: 80 }}
                  >
                    {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    className="input"
                    placeholder="Yorumunuz"
                    value={detail?.reviewDraft?.text || ''}
                    onChange={(e) => setDetail((prev) => ({ ...prev, reviewDraft: { ...(prev?.reviewDraft||{}), text: e.target.value } }))}
                    style={{ width: 280 }}
                  />
                  <button type="button" className="btn" onClick={submitReview}>Gönder</button>
                </div>
                <h3 style={{ marginTop: 12 }}>Yorumlar {detail.mapsUrl && (<a href={detail.mapsUrl} target="_blank" rel="noreferrer" className="link-ghost">Google’da tümünü gör</a>)}</h3>
                <div className="reviews">
                  {detail.reviews.length === 0 && (
                    <div className="meta">Yorum bulunamadı.</div>
                  )}
                  {detail.reviews.map((r, i) => (
                    <div key={i} className="review">
                      <div className="meta-row" style={{ marginBottom: 6 }}>
                        {r.profilePhotoUrl && <img src={r.profilePhotoUrl} alt="" style={{ width: 24, height: 24, borderRadius: 999 }} />}
                        <span style={{ fontWeight: 600 }}>{r.authorName || 'Ziyaretçi'}</span>
                        {typeof r.rating === 'number' && <span>⭐ {r.rating.toFixed(1)}</span>}
                        {r.relativeTime && <span className="meta">{r.relativeTime}</span>}
                      </div>
                      <div>{r.text}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3>Fotoğraflar</h3>
                <div className="gallery">
                  {detail.photoRefs.length === 0 && <div className="meta">Fotoğraf yok.</div>}
                  {detail.photoRefs.map((pr, i) => (
                    <img
                      key={i}
                      alt=""
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/photo?photoRef=${encodeURIComponent(pr)}&maxWidth=400`}
                      onClick={() => setLightbox({ open: true, list: detail.photoRefs, index: i })}
                      style={{ cursor: 'zoom-in' }}
                    />
                  ))}
                </div>
                <h3 style={{ marginTop: 12 }}>Yer ayırtma</h3>
                <div className="row">
                  <input
                    type="date"
                    className="input"
                    value={detail?.reservationDraft?.date || ''}
                    onChange={(e) => setDetail((prev) => ({ ...prev, reservationDraft: { ...(prev?.reservationDraft||{}), date: e.target.value } }))}
                  />
                  <input
                    className="input"
                    placeholder="Notlar"
                    value={detail?.reservationDraft?.notes || ''}
                    onChange={(e) => setDetail((prev) => ({ ...prev, reservationDraft: { ...(prev?.reservationDraft||{}), notes: e.target.value } }))}
                    style={{ width: 260 }}
                  />
                  <button type="button" className="btn" onClick={submitReservation}>Gönder</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {lightbox.open && (
        <div className="lightbox-backdrop" onClick={() => setLightbox({ open: false, list: [], index: 0 })}>
          <button className="lightbox-btn lightbox-close" onClick={() => setLightbox({ open: false, list: [], index: 0 })}>✕</button>
          <div className="lightbox-controls">
            <div style={{ paddingLeft: 12 }}>
              <button
                className="lightbox-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((lb) => ({ ...lb, index: (lb.index - 1 + lb.list.length) % lb.list.length }))
                }}
              >‹</button>
            </div>
            <div style={{ paddingRight: 12 }}>
              <button
                className="lightbox-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((lb) => ({ ...lb, index: (lb.index + 1) % lb.list.length }))
                }}
              >›</button>
            </div>
          </div>
          <img
            className="lightbox-img"
            alt=""
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/campsites/photo?photoRef=${encodeURIComponent(lightbox.list[lightbox.index])}&maxWidth=1200`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
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

  return (
    <>{renderPage()}</>
  )
}