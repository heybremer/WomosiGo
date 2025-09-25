const express = require('express');
const Campsite = require('../models/Campsite');
const { appendSignatureParam } = require('../utils/googleSign');

const router = express.Router();

// GET /api/campsites/photo?photoRef=...&maxWidth=400
// Proxies Google Places Photo through the server to avoid client-side key restrictions
router.get('/photo', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const photoRef = (req.query.photoRef || '').toString();
    const maxWidth = parseInt(req.query.maxWidth || '400', 10);
    if (!apiKey) return res.status(500).json({ message: 'GOOGLE_MAPS_API_KEY eksik' });
    if (!photoRef) return res.status(400).json({ message: 'photoRef zorunludur' });

    const params = new URLSearchParams({
      maxwidth: String(Math.max(100, Math.min(maxWidth || 400, 1600))),
      photo_reference: photoRef,
      key: apiKey,
    });
    const url = `https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`;
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(502).json({ message: 'Google Photo isteği başarısız', status: resp.status, body: text });
    }
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const arrayBuf = await resp.arrayBuffer();
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(arrayBuf));
  } catch (err) {
    console.error('photo proxy error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/campsites/google?lat=..&lng=..&radius=..&keyword=..
// Google Places Nearby Search üzerinden kamp alanlarını getirir
router.get('/google', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(parseInt(req.query.radius || '5000', 10), 50000); // meters
    const keyword = (req.query.keyword || 'campground caravan rv kamp karavan').toString();
    const store = String(req.query.store || 'false').toLowerCase() === 'true';
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GOOGLE_MAPS_API_KEY eksik' });
    }
    if (!isFinite(lat) || !isFinite(lng)) {
      return res.status(400).json({ message: 'lat ve lng zorunludur' });
    }

    const results = [];
    let pageToken = '';
    let pageCount = 0;

    do {
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        type: 'campground',
        keyword,
        key: apiKey,
      });
      if (pageToken) params.set('pagetoken', pageToken);

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
      let signedUrl = url;
      if (process.env.GOOGLE_URL_SIGNING_SECRET) {
        signedUrl = appendSignatureParam(url, process.env.GOOGLE_URL_SIGNING_SECRET);
      }
      const resp = await fetch(signedUrl);
      const json = await resp.json();
      if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        return res.status(502).json({ message: 'Google Places hatası', status: json.status, error_message: json.error_message });
      }
      const batch = (json.results || []).map((r) => ({
        name: r.name,
        address: r.vicinity || r.formatted_address || '',
        googlePlaceId: r.place_id,
        location: {
          type: 'Point',
          coordinates: [r.geometry?.location?.lng, r.geometry?.location?.lat],
        },
        photoRef: Array.isArray(r.photos) && r.photos[0]?.photo_reference ? r.photos[0].photo_reference : undefined,
        rating: typeof r.rating === 'number' ? r.rating : undefined,
        userRatingsTotal: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : undefined,
        openNow: typeof r.opening_hours?.open_now === 'boolean' ? r.opening_hours.open_now : undefined,
      }));
      results.push(...batch);

      pageToken = json.next_page_token || '';
      pageCount += 1;
      if (pageToken && pageCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        pageToken = '';
      }
    } while (pageToken && pageCount < 3);

    if (store && results.length > 0) {
      for (const c of results) {
        if (typeof c.location?.coordinates?.[0] === 'number' && typeof c.location?.coordinates?.[1] === 'number') {
          await Campsite.updateOne(
            { googlePlaceId: c.googlePlaceId },
            {
              $setOnInsert: {
                name: c.name,
                address: c.address,
                googlePlaceId: c.googlePlaceId,
                location: c.location,
                photoRef: c.photoRef,
              },
              $set: {
                name: c.name,
                address: c.address,
                location: c.location,
                photoRef: c.photoRef,
              },
            },
            { upsert: true }
          );
        }
      }
    }

    return res.json(results);
  } catch (err) {
    console.error('google nearby error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/campsites/details?placeId=...
// Google Place Details: telefon vb. bilgileri getirir
router.get('/details', async (req, res) => {
  try {
    const placeId = (req.query.placeId || '').toString();
    const reviewsLimit = Math.max(1, Math.min(10, parseInt(req.query.reviewsLimit || '10', 10)));
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GOOGLE_MAPS_API_KEY eksik' });
    }
    if (!placeId) {
      return res.status(400).json({ message: 'placeId zorunludur' });
    }

    const fields = [
      'formatted_phone_number',
      'international_phone_number',
      'name',
      'formatted_address',
      'geometry/location',
      'photos',
      'rating',
      'user_ratings_total',
      'website',
      'opening_hours',
      'current_opening_hours',
      'reviews',
      'editorial_summary',
    ].join(',');
    const params = new URLSearchParams({ place_id: placeId, key: apiKey, fields });
    let url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
    if (process.env.GOOGLE_URL_SIGNING_SECRET) {
      url = appendSignatureParam(url, process.env.GOOGLE_URL_SIGNING_SECRET);
    }
    const resp = await fetch(url);
    const json = await resp.json();
    if (json.status && json.status !== 'OK') {
      return res
        .status(502)
        .json({ message: 'Google Place Details hatası', status: json.status, error_message: json.error_message });
    }
    const r = json.result || {};
    const photoRefs = Array.isArray(r.photos)
      ? r.photos.map((p) => p.photo_reference).filter(Boolean)
      : [];
    let reviews = Array.isArray(r.reviews)
      ? r.reviews.map((rv) => ({
          authorName: rv.author_name,
          rating: rv.rating,
          text: rv.text,
          relativeTime: rv.relative_time_description,
          profilePhotoUrl: rv.profile_photo_url,
          time: rv.time,
        }))
      : [];
    // Sort newest first and apply limit
    reviews.sort((a, b) => (Number(b.time || 0) - Number(a.time || 0)));
    reviews = reviews.slice(0, reviewsLimit);
    // Heuristic busy score based on opening hours and time-of-day (no official API for live popular times)
    let busyScore = 0; // 0..100
    let busyLevel;
    try {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const dow = now.getDay(); // 0=Sun..6=Sat
      const openNow = Boolean(r.opening_hours?.open_now || r.current_opening_hours?.open_now);

      function parseHHMM(hhmm) {
        if (!hhmm || typeof hhmm !== 'string' || hhmm.length < 3) return null;
        const h = Number(hhmm.slice(0, 2));
        const m = Number(hhmm.slice(2));
        if (!isFinite(h) || !isFinite(m)) return null;
        return h * 60 + m;
      }

      const periods = (r.current_opening_hours?.periods || r.opening_hours?.periods || []).filter(Boolean);
      let matchedWindow = null;
      for (const p of periods) {
        const oDay = typeof p.open?.day === 'number' ? p.open.day : null;
        const cDay = typeof p.close?.day === 'number' ? p.close.day : oDay;
        const oMin = parseHHMM(p.open?.time);
        const cMinRaw = parseHHMM(p.close?.time);
        if (oDay == null || oMin == null || cMinRaw == null) continue;
        // Normalize to same-day minutes span, handling overnight
        let spanStart = oMin;
        let spanEnd = cMinRaw;
        let dayDelta = 0;
        if (cDay != null && cDay !== oDay) {
          // Overnight close -> add 24h
          spanEnd += 24 * 60;
        }
        // Map to today's window if the open day matches today, or yesterday for overnight
        if (oDay === dow) {
          matchedWindow = { start: spanStart, end: spanEnd, overnight: cDay !== oDay };
        } else if (((oDay + 1) % 7) === dow && spanEnd > 24 * 60) {
          // Window opened yesterday and closes today after midnight
          matchedWindow = { start: spanStart - 24 * 60, end: spanEnd - 24 * 60, overnight: true };
        }
        if (matchedWindow) break;
      }

      if (openNow && matchedWindow && nowMinutes >= matchedWindow.start && nowMinutes <= matchedWindow.end) {
        const duration = matchedWindow.end - matchedWindow.start;
        const elapsed = nowMinutes - matchedWindow.start;
        const progress = Math.max(0, Math.min(1, duration > 0 ? elapsed / duration : 0));
        // Triangular curve: low at edges, peak in the middle
        const peakShape = 1 - Math.abs(2 * progress - 1); // 0..1
        // Time-of-day bumps for lunch/dinner
        const hour = now.getHours();
        let bump = 0;
        if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) bump = 0.15;
        else if ((hour >= 9 && hour < 11) || (hour > 14 && hour <= 18)) bump = 0.07;
        // Weekend multiplier (Fri evening + Sat + Sun)
        const weekend = dow === 0 || dow === 6 || (dow === 5 && hour >= 17);
        const weekendMul = weekend ? 1.15 : 1.0;
        busyScore = Math.round(Math.max(0, Math.min(100, (15 + 85 * (peakShape + bump)) * weekendMul)));
      } else if (openNow) {
        // Open but no precise hours -> coarse buckets
        const hour = now.getHours();
        let base = 25;
        if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) base = 75;
        else if ((hour >= 9 && hour < 11) || (hour > 14 && hour <= 18)) base = 50;
        busyScore = base;
      } else {
        busyScore = 0;
      }

      if (!isFinite(busyScore)) busyScore = 0;
      if (busyScore >= 60) busyLevel = 'yüksek';
      else if (busyScore >= 30) busyLevel = 'orta';
      else if (busyScore > 0) busyLevel = 'az';
      else busyLevel = 'kapalı';
    } catch (_) {}

    const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    return res.json({
      name: r.name,
      address: r.formatted_address,
      phone: r.international_phone_number || r.formatted_phone_number || '',
      location: r.geometry?.location,
      photoRef: Array.isArray(r.photos) && r.photos[0]?.photo_reference ? r.photos[0].photo_reference : undefined,
      photoRefs,
      rating: typeof r.rating === 'number' ? r.rating : undefined,
      userRatingsTotal: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : undefined,
      website: r.website,
      openingHours: r.opening_hours,
      currentOpeningHours: r.current_opening_hours,
      openNow: Boolean(r.opening_hours?.open_now || r.current_opening_hours?.open_now),
      busyLevel,
      busyScore,
      mapsUrl,
      description: r.editorial_summary?.overview,
      reviews,
    });
  } catch (err) {
    console.error('place details error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/campsites/search?query=istanbul&radius=10000&store=false
// Metinsel şehir/bölge aramasını geocode edip kamp alanlarını döndürür
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.query || '').toString().trim();
    const radius = Math.min(parseInt(req.query.radius || '5000', 10), 50000);
    const store = String(req.query.store || 'false').toLowerCase() === 'true';
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'GOOGLE_MAPS_API_KEY eksik' });
    if (!query) return res.status(400).json({ message: 'query zorunludur' });

    // 1) Geocode: text -> lat,lng
    const geoParams = new URLSearchParams({ address: query, key: apiKey });
    let geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?${geoParams.toString()}`;
    if (process.env.GOOGLE_URL_SIGNING_SECRET) {
      geoUrl = appendSignatureParam(geoUrl, process.env.GOOGLE_URL_SIGNING_SECRET);
    }
    const geoResp = await fetch(geoUrl);
    const geo = await geoResp.json();
    if (!geo.results || !geo.results[0]) {
      return res.json({ center: null, results: [] });
    }
    const loc = geo.results[0].geometry?.location;
    const lat = Number(loc?.lat);
    const lng = Number(loc?.lng);
    if (!isFinite(lat) || !isFinite(lng)) {
      return res.json({ center: null, results: [] });
    }

    // 2) Places Nearby Search: fetch campgrounds around center
    const results = [];
    let pageToken = '';
    let pageCount = 0;
    do {
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        type: 'campground',
        keyword: 'campground caravan rv karavan kamp',
        key: apiKey,
      });
      if (pageToken) params.set('pagetoken', pageToken);
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
      if (process.env.GOOGLE_URL_SIGNING_SECRET) {
        url = appendSignatureParam(url, process.env.GOOGLE_URL_SIGNING_SECRET);
      }
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        return res.status(502).json({ message: 'Google Places hatası', status: json.status, error_message: json.error_message });
      }
      const batch = (json.results || []).map((r) => ({
        name: r.name,
        address: r.vicinity || r.formatted_address || '',
        googlePlaceId: r.place_id,
        location: { type: 'Point', coordinates: [r.geometry?.location?.lng, r.geometry?.location?.lat] },
        photoRef: Array.isArray(r.photos) && r.photos[0]?.photo_reference ? r.photos[0].photo_reference : undefined,
        rating: typeof r.rating === 'number' ? r.rating : undefined,
        userRatingsTotal: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : undefined,
        openNow: typeof r.opening_hours?.open_now === 'boolean' ? r.opening_hours.open_now : undefined,
      }));
      results.push(...batch);
      pageToken = json.next_page_token || '';
      pageCount += 1;
      if (pageToken && pageCount < 2) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        pageToken = '';
      }
    } while (pageToken && pageCount < 2);

    // 3) Optional store
    if (store && results.length > 0) {
      for (const c of results) {
        if (typeof c.location?.coordinates?.[0] === 'number' && typeof c.location?.coordinates?.[1] === 'number') {
          await Campsite.updateOne(
            { googlePlaceId: c.googlePlaceId },
            { $setOnInsert: { name: c.name, address: c.address, googlePlaceId: c.googlePlaceId, location: c.location, photoRef: c.photoRef, rating: c.rating, userRatingsTotal: c.userRatingsTotal }, $set: { name: c.name, address: c.address, location: c.location, photoRef: c.photoRef, rating: c.rating, userRatingsTotal: c.userRatingsTotal } },
            { upsert: true }
          );
        }
      }
    }

    return res.json({ center: { lat, lng }, results });
  } catch (err) {
    console.error('search error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/campsites/count?country=Germany&query=campground
// Text Search ile sayfa sayfa gezerek yaklaşık toplam sayıyı döndürür
router.get('/count', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'GOOGLE_MAPS_API_KEY eksik' });
    const country = (req.query.country || '').toString().trim();
    const baseQuery = (req.query.query || 'campground').toString().trim();
    if (!country) return res.status(400).json({ message: 'country zorunludur' });

    const q = `${baseQuery} in ${country}`;
    const seen = new Set();
    let pageToken = '';
    let pages = 0;

    do {
      const params = new URLSearchParams({ query: q, key: apiKey });
      if (pageToken) params.set('pagetoken', pageToken);
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
      if (process.env.GOOGLE_URL_SIGNING_SECRET) {
        url = appendSignatureParam(url, process.env.GOOGLE_URL_SIGNING_SECRET);
      }
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        return res.status(502).json({ message: 'Google Text Search hatası', status: json.status, error_message: json.error_message });
      }
      for (const r of json.results || []) {
        if (r.place_id) seen.add(r.place_id);
      }
      pageToken = json.next_page_token || '';
      pages += 1;
      if (pageToken && pages < 5) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        pageToken = '';
      }
    } while (pageToken && pages < 5);

    return res.json({ country, query: q, pages, count: seen.size });
  } catch (err) {
    console.error('count error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/campsites/nearby?lat=..&lng=..&radius=..
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(parseInt(req.query.radius || '5000', 10), 50000); // meters
    if (!isFinite(lat) || !isFinite(lng)) {
      return res.status(400).json({ message: 'lat ve lng zorunludur' });
    }
    // Mongo bağlantısı yoksa boş dizi döndür (frontend Google fallback yapacak)
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const results = await Campsite.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    })
      .limit(50)
      .lean();
    res.json(results);
  } catch (err) {
    console.error('nearby error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


