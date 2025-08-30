# Sesimiz Ol - Dijital Hikâye Anlatıcılığı Platformu

"Sesimiz Ol" Türkiye'de kadınların paylaşmaya çekindiği hikâyelerini (istismar, zorluklar, başarılar) güvenle aktarabilecekleri, anonim bir dijital platform.

## Proje Yapısı

- `frontend/` - React + Vite + Chakra UI frontend uygulaması
- `backend/` - Node.js + Express + Prisma backend API
- `shared/` - Ortak tipler ve utilities
- `docs/` - Proje dokümantasyonu

## MVP Özellikleri

- ✅ Takma isimle anonim kullanıcı kaydı
- ✅ Yazılı hikâye paylaşımı (başlık + içerik)
- ✅ Hikâye listeleme & detay görüntüleme
- ✅ Basit profil sayfası (kendi hikâyelerini görme)
- ✅ Hakkında/Destek sayfası

## Teknoloji Stack

### Frontend
- React 18+ (Vite)
- Chakra UI (Design System)
- React Router v6
- Axios (API calls)

### Backend
- Node.js + Express.js
- Prisma ORM
- SQLite (MVP) → PostgreSQL (Production)
- JWT Authentication

## Geliştirme

Detaylı kurulum ve geliştirme talimatları için `docs/` klasörüne bakın.

## Güvenlik & Gizlilik

- Minimum veri toplama (sadece nickname ve avatar)
- Kişisel veri (e-posta, telefon, TC) alınmaz
- KVKV uyumlu anonimlik koruması
- Session-based authentication

## Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.