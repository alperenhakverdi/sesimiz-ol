# Sesimiz Ol

Kadınların hikâyelerini güvenle paylaşabildiği, dayanışma odaklı anonim dijital platform.

## ✨ Özellikler
- **Hikâye Paylaşımı & Beğeniler** – Anonim hikâyeler, kalp ikonu ile destekleme ve yorumlaşma.
- **Rol Bazlı Deneyim** – Standart kullanıcılar, moderasyon yetkili yöneticiler; admin paneliyle içerik onayı ve analitik.
- **Gerçek Zamanlı Mesajlaşma** – Kullanıcı profillerine tıklayarak özel mesaj başlatma, sohbet içi profil bağlantıları.
- **Profil & Hikâye Yönetimi** – “Hikayelerim” sekmesinden düzenle/sil akışı, kişisel ayarlar, avatar yönetimi.
- **STK Dizini** – Kadın odaklı kurumları ikonlarla tanıtan kürasyon, API yoksa otomatik fallback.
- **Erişilebilir Tasarım** – Chakra UI tabanlı temalar, koyu mod optimizasyonu, mobil uyumlu arayüz.

## 🧰 Teknoloji Yığını
- **Frontend:** React 18, Vite, Chakra UI, SWR, Socket.IO client
- **Backend:** Node.js (Express), Prisma ORM, SQLite/PostgreSQL uyumlu
- **Realtime & Yardımcılar:** Socket.IO, Firebase (opsiyonel), JWT kimlik doğrulama
- **Container:** Docker, docker-compose (opsiyonel ters proxy için Nginx)

## 🚀 Hızlı Başlangıç (Geliştirme)
> Gereksinimler: Node.js 20+, npm, SQLite veya PostgreSQL (varsayılan seed SQLite ile gelir)

1. **Depoyu klonla & bağımlılıkları yükle**
   ```bash
   git clone <repo-url>
   cd sesimiz-ol
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

2. **Ortamlara hazırlık**
   ```bash
   # Backend
   cp .env.example .env
   # Frontend
   cd frontend && cp .env.example .env && cd ..
   ```
   > Varsayılan `.env` PostgreSQL içindir; geliştirmede Prisma, SQLite dosyası (`dev.db`) üzerinden çalışabilir.

3. **Veritabanı şemasını kur & seed et**
   ```bash
   cd backend
   npx prisma migrate dev
   npm run seed
   ```

4. **Geliştirme sunucularını başlat**
   ```bash
   cd ..
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001/api`

5. **Demo hesaplar** (seed sonrası)
   | Kullanıcı | Giriş Bilgisi |
   |-----------|---------------|
   | Fatma     | `fatma@example.com` / `demo123` |
   | Diğer kullanıcılar | `*.example.com` / `12345678` (bkz. `backend/src/seedDatabase.js`)

## 🐳 Docker ile Çalıştırma
1. Ortak `.env` dosyanı doldur (özellikle `JWT_SECRET`, `DATABASE_URL`).
2. Servisleri ayağa kaldır:
   ```bash
   docker compose up --build
   ```
3. Opsiyonel – ilk migration & seed (container içinde):
   ```bash
   docker compose exec backend npx prisma migrate deploy
   docker compose exec backend npm run seed
   ```
4. Erişim URL’leri: Frontend `http://localhost`, Backend `http://localhost:3001/api`

> Not: Varsayılan `docker-compose.yml` backend’i SQLite ile, frontend’i Nginx üzerinden sunar. PostgreSQL kullanmak istersen `DATABASE_URL`’ı güncelle.

## 🧪 Test & Kalite
- **Lint (frontend):** `cd frontend && npm run lint`
- **Backend Jest testleri:** `cd backend && npm test`
- **Prisma Studio (opsiyonel):** `cd backend && npx prisma studio`

## 📁 Proje Yapısı
```
backend/   -> Express API, Prisma şeması, seed scriptleri
frontend/  -> React + Vite istemcisi
functions/ -> Firebase Functions (isteğe bağlı dağıtım)
shared/    -> Ortak tipler ve varlıklar
scripts/   -> CLI yardımcıları (ör. make-admin, seed scriptleri)
```

### Faydalı Komutlar
| Komut | Açıklama |
|-------|----------|
| `cd backend && npm run seed` | Demo kullanıcılar/hikâyelerle veritabanını doldur |
| `node backend/scripts/make-admin.js <email>` | Var olan kullanıcıyı admin’e çevir |
| `npm run build` (root) | Frontend production build |

## 🔐 Güvenlik Notları
- `.env` dosyalarını **kesinlikle** commit etme.
- `JWT_SECRET` ve `JWT_REFRESH_SECRET` değerlerini üretimde değiştir.
- Dosya yüklemeleri `backend/uploads` klasörüne yazılır; Docker deploy’larında volume’ya bağla.

## 🗺️ Yol Haritası / Admin Paneli
- `/admin/dashboard` altında analitik, inceleme ve feature flag yönetimi (admin rolü gerektirir).
- Active STK listesi `/stklar` üzerinden ikonlu kartlarla sunulur.
- Profil sayfası (`/profil/:id`) hikâye geçmişi, “Hikâyelerim” sekmesi ve düzenleme akışını içerir.
- Gerçek zamanlı mesajlaşma `/mesajlar` ekranında, profil bağlantılarıyla entegre.

## 📜 Lisans
MIT License — katkılarınızı memnuniyetle karşılarız!

