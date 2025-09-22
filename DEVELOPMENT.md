# Development Setup Guide

Bu rehber, Sesimiz Ol projesinin yerel geliştirme ortamında çalıştırılması için gerekli adımları açıklar.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js (v18+)
- PostgreSQL (v13+)
- Git

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd sesimiz-ol
```

### 2. PostgreSQL Kurulumu ve Veritabanı Oluşturma
```bash
# PostgreSQL servisini başlatın
sudo service postgresql start

# Veritabanı oluşturun
createdb -U postgres sesimiz_ol
```

### 3. Backend Kurulumu
```bash
cd backend

# Bağımlılıkları yükleyin
npm install

# Environment variables'ı ayarlayın (.env dosyası zaten konfigüre edilmiş)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sesimiz_ol

# Prisma migration ve seed
npx prisma db push
node scripts/seed-development.js

# Backend'i başlatın (port 3002)
npm run dev
```

### 4. Frontend Kurulumu
```bash
cd ../frontend

# Bağımlılıkları yükleyin
npm install

# Environment variables zaten konfigüre edilmiş (port 3002 için)
# VITE_API_BASE_URL=http://localhost:3002/api

# Frontend'i başlatın (otomatik port: 5175)
npm run dev
```

## 📊 Demo Veriler

Development seed script ile otomatik olarak oluşturulan veriler:

### Kullanıcılar (Şifre: `demo123`)
- **user1@example.com** - Ayşe (USER)
- **user2@example.com** - Fatma (USER)
- **org1@example.com** - STK Temsilcisi (MODERATOR)
- **admin@example.com** - Admin (ADMIN)

### Hikayeler
- 3 adet onaylanmış hikaye
- Farklı görüntülenme sayıları

### STK'lar
- Kadın Dayanışma Vakfı
- Toplumsal Cinsiyet Eşitliği Derneği

### Duyurular
- Platform güncellemeleri
- Hoş geldin mesajları

## 🔗 Erişim URL'leri

- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:3002/api
- **Health Check**: http://localhost:3002/health
- **API Docs**: http://localhost:3002/api-docs

## 🛠️ Geliştirme Komutları

### Backend
```bash
# Development server
npm run dev

# Prisma commands
npx prisma db push      # Schema'yı veritabanına push et
npx prisma generate     # Client'ı yeniden generate et
npx prisma studio       # Veritabanı GUI

# Seed data
node scripts/seed-development.js
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Port Konfigürasyonu

| Servis | Port | URL |
|--------|------|-----|
| Frontend | 5175 | http://localhost:5175 |
| Backend | 3002 | http://localhost:3002 |
| PostgreSQL | 5432 | localhost:5432 |

## 📝 Notlar

- Backend .env dosyası development için hazır konfigüre edilmiştir
- Veritabanı bağlantısı otomatik olarak çalışır
- Seed data ile test verileriniz hazır gelir
- CORS ayarları localhost için yapılandırılmıştır
- Security headers development mode için optimize edilmiştir

## 🐛 Sorun Giderme

### PostgreSQL Bağlantı Sorunu
```bash
# PostgreSQL servisini kontrol edin
sudo service postgresql status

# Eğer çalışmıyorsa başlatın
sudo service postgresql start
```

### Port Kullanımda Hatası
```bash
# Port 3002'yi kullanıcı processları kontrol edin
lsof -i :3002

# Gerekirse process'i durdurun
kill -9 <PID>
```

### Prisma Sync Sorunu
```bash
# Client'ı yeniden generate edin
npx prisma generate

# Schema'yı yeniden push edin
npx prisma db push
```

## ✅ Başarılı Kurulum Kontrolü

1. ✅ Backend http://localhost:3002/health 200 OK dönmeli
2. ✅ API http://localhost:3002/api/stories hikayeler listesini dönmeli
3. ✅ Frontend http://localhost:5175 açılmalı ve 500 hatası olmamalı
4. ✅ Console'da API bağlantı hataları olmamalı

---

**🎉 Kurulum tamamlandı! Artık geliştirme yapabilirsiniz.**