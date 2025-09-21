# Sesimiz Ol

Kadınların hikâyelerini güvenle paylaşabilecekleri anonim bir platform.

## 🚀 Hızlı Başlangıç

### Docker ile Çalıştırma
```bash
# Veritabanını başlat
docker compose up -d database

# Backend migrations
cd backend && npm run prisma:migrate

# Tüm servisleri başlat
docker compose up
```

**Erişim:** Frontend `http://localhost:5173` | Backend `http://localhost:3001`

### Manuel Kurulum
```bash
# Bağımlılıkları yükle
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Veritabanı kurulumu
createdb sesimizol
cd backend && npm run prisma:migrate && npm run prisma:seed

# Geliştirme sunucusu
npm run dev
```

## 📋 Özellikler

- **Anonim Hikâye Paylaşımı** - Güvenli ve gizli ortam
- **STK Entegrasyonu** - Organizasyon desteği
- **Etkileşim** - Beğeni, yorum, takip sistemi
- **Responsive Tasarım** - Mobil uyumlu arayüz

## 🛠️ Teknolojiler

- **Frontend:** React 18 + Vite + Chakra UI
- **Backend:** Node.js + Express + PostgreSQL
- **Container:** Docker + PostgreSQL
- **Authentication:** JWT

## 📚 Dokümantasyon

- [API Dokümantasyonu](docs/API_DOCUMENTATION.md)
- [Geliştirici Rehberi](docs/DEVELOPER_GUIDE.md)
- [Kullanıcı Rehberi](docs/USER_GUIDE.md)

## 🔧 Yapılandırma

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değişkenleri ayarlayın.

## 📄 Lisans

MIT License