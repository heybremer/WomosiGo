# WomosiGO Deployment Guide

Bu rehber, WomosiGO web uygulamasını canlıya almak için gerekli adımları içerir.

## 🚀 Hızlı Deployment Seçenekleri

### 1. Vercel (Önerilen - Frontend)

**Frontend için Vercel:**
1. [Vercel.com](https://vercel.com) hesabı oluşturun
2. GitHub repository'nizi bağlayın
3. Build settings:
   - Framework Preset: `Vite`
   - Build Command: `cd WomosiGo/WomosiGo-app && npm run build`
   - Output Directory: `WomosiGo/WomosiGo-app/dist`
   - Install Command: `cd WomosiGo/WomosiGo-app && npm install`

**Environment Variables:**
```
VITE_API_URL=https://your-backend-url.herokuapp.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 2. Netlify (Alternatif - Frontend)

**Frontend için Netlify:**
1. [Netlify.com](https://netlify.com) hesabı oluşturun
2. GitHub repository'nizi bağlayın
3. Build settings:
   - Build Command: `cd WomosiGo/WomosiGo-app && npm run build`
   - Publish Directory: `WomosiGo/WomosiGo-app/dist`

### 3. Heroku (Backend)

**Backend için Heroku:**
1. [Heroku.com](https://heroku.com) hesabı oluşturun
2. Heroku CLI kurun
3. Repository'yi Heroku'ya deploy edin:

```bash
# Heroku CLI kurulumu (Windows)
# https://devcenter.heroku.com/articles/heroku-cli

# Heroku'ya login
heroku login

# Heroku app oluştur
heroku create womosigo-backend

# Environment variables ayarla
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set WEB_ORIGIN=https://your-frontend-url.vercel.app

# Deploy
git push heroku master
```

### 4. MongoDB Atlas (Database)

**Database için MongoDB Atlas:**
1. [MongoDB Atlas](https://cloud.mongodb.com) hesabı oluşturun
2. Cluster oluşturun
3. Database user oluşturun
4. Connection string'i alın
5. Heroku environment variables'a ekleyin

## 📋 Adım Adım Deployment

### Adım 1: GitHub Repository Oluştur
1. GitHub'da yeni repository oluşturun
2. Repository'yi local'e bağlayın:

```bash
git remote add origin https://github.com/yourusername/womosigo.git
git push -u origin master
```

### Adım 2: Backend Deploy (Heroku)
```bash
# Heroku CLI kur
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# App oluştur
heroku create womosigo-api

# Environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/womosigo
heroku config:set JWT_SECRET=your_super_secret_jwt_key
heroku config:set WEB_ORIGIN=https://your-frontend.vercel.app

# Deploy
git push heroku master
```

### Adım 3: Frontend Deploy (Vercel)
1. Vercel'e gidin ve GitHub'ı bağlayın
2. Repository'yi seçin
3. Build settings:
   - Framework: Vite
   - Root Directory: `WomosiGo/WomosiGo-app`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables:
   - `VITE_API_URL`: `https://womosigo-api.herokuapp.com`
   - `VITE_GOOGLE_MAPS_API_KEY`: `your_google_maps_key`

### Adım 4: Domain Ayarları
- Vercel'de custom domain ekleyebilirsiniz
- Heroku'da custom domain ekleyebilirsiniz

## 🔧 Production Optimizasyonları

### Backend Optimizasyonları
- MongoDB connection pooling
- Rate limiting
- CORS ayarları
- Error handling
- Logging

### Frontend Optimizasyonları
- Code splitting
- Image optimization
- Caching
- CDN kullanımı

## 📊 Monitoring

### Backend Monitoring
- Heroku metrics
- MongoDB Atlas monitoring
- Application logs

### Frontend Monitoring
- Vercel analytics
- Google Analytics
- Error tracking

## 🚨 Troubleshooting

### Yaygın Sorunlar
1. **CORS Hatası**: Backend'de WEB_ORIGIN environment variable'ını kontrol edin
2. **Database Bağlantı Hatası**: MongoDB Atlas connection string'ini kontrol edin
3. **Build Hatası**: Node.js version'ını kontrol edin (18+ önerilir)

### Log Kontrolü
```bash
# Heroku logs
heroku logs --tail

# Vercel logs
vercel logs
```

## 📞 Destek

Deployment sırasında sorun yaşarsanız:
1. README.md dosyasını kontrol edin
2. Environment variables'ları kontrol edin
3. Log dosyalarını inceleyin
4. GitHub Issues'da sorun bildirin

---

**WomosiGO** - Kamp alanları için modern web uygulaması! 🏕️
