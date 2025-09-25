import React, { useEffect, useRef, useState } from 'react'

let cachedKey = ''
async function getApiKey() {
  if (cachedKey) return cachedKey
  try {
    const res = await fetch('http://localhost:5001/api/config')
    const j = await res.json()
    cachedKey = j?.googleMapsApiKey || ''
  } catch (_) {
    cachedKey = ''
  }
  return cachedKey
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    let finalSrc = src
    if (!finalSrc.includes('v=')) finalSrc += (finalSrc.includes('?') ? '&' : '?') + 'v=weekly'
    if (!finalSrc.includes('loading=')) finalSrc += (finalSrc.includes('?') ? '&' : '?') + 'loading=async'
    const existing = document.querySelector(`script[src="${finalSrc}"]`)
    if (existing) {
      if (window.google && window.google.maps) return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const s = document.createElement('script')
    s.src = finalSrc
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export default function Map({ center = { lat: 41.015137, lng: 28.97953 }, markers = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerObjsRef = useRef([])
  const [error, setError] = useState('')

  const DARK_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3C7680' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
    { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023e58' }] },
    { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
  ]

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const apiKey = await getApiKey()
        if (!apiKey) {
          setError('VITE_GOOGLE_MAPS_API_KEY eksik')
          return
        }
        await loadScript(`https://maps.googleapis.com/maps/api/js?key=${apiKey}`)
        if (!window.google || !window.google.maps) {
          setError('Google Maps yüklenemedi')
          return
        }
        // Yeni async loader: sınıfları modülden al
        let GMap
        // AdvancedMarkerElement, mapId olmadan uyarı çıkarabildiği için kullanmayacağız
        if (typeof window.google.maps.importLibrary === 'function') {
          const mapsMod = await window.google.maps.importLibrary('maps')
          await window.google.maps.importLibrary('marker')
          GMap = mapsMod && mapsMod.Map
        }
        if (cancelled) return
        const el = containerRef.current
        if (!el) {
          // Container hazır değilse sessizce çık
          return
        }
        if (!mapRef.current) {
          const MapClass = GMap || window.google.maps.Map
          if (typeof MapClass !== 'function') {
            setError('Google Maps yüklenemedi (Map)')
            return
          }
          mapRef.current = new MapClass(el, {
            center,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: DARK_STYLE,
          })
        } else {
          mapRef.current.setCenter(center)
        }
        // Eski markerları temizle
        markerObjsRef.current.forEach((mm) => mm.setMap(null))
        markerObjsRef.current = []
        let validCount = 0
        markers.forEach((m) => {
          if (typeof m.lat === 'number' && typeof m.lng === 'number') {
            if (typeof window.google.maps.Marker === 'function') {
              const mk = new window.google.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map: mapRef.current, title: m.title || '' })
              markerObjsRef.current.push(mk)
              validCount += 1
            }
          }
        })
        // Fit bounds to markers if available
        if (validCount > 0) {
          const bounds = new window.google.maps.LatLngBounds()
          markers.forEach((m) => {
            if (typeof m.lat === 'number' && typeof m.lng === 'number') {
              bounds.extend(new window.google.maps.LatLng(m.lat, m.lng))
            }
          })
          try { mapRef.current.fitBounds(bounds) } catch (_) {}
        }
      } catch (e) {
        // Container null hatasını kullanıcıya göstermeyelim
        const msg = e?.message || 'Harita başlatılamadı'
        if (!String(msg).includes('mapDiv of type HTMLElement')) {
          setError(msg)
        }
      }
    }
    init()
    return () => {
      cancelled = true
      markerObjsRef.current.forEach((mm) => mm.setMap(null))
      markerObjsRef.current = []
      // map örneğini bırak
      mapRef.current = null
    }
  }, [center.lat, center.lng, markers])

  if (error) {
    return (
      <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, color: '#a33' }}>
        Harita yüklenemedi: {error}
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: 360, borderRadius: 8, border: '1px solid #eee' }} />
}
