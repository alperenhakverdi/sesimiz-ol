# Sesimiz Ol - Kadın Hikayesi Paylaşım Platformu

Kadınların deneyimlerini anonim bir şekilde paylaştıkları, güvenli bir topluluk platformu.

## 🌟 Özellikler

### Kullanıcı Sistemi
- **Güvenli Kayıt ve Giriş**: JWT tabanlı authentication sistemi
- **Profil Fotoğrafı**: Drag & drop dosya yükleme ile profil fotoğrafı ekleme
- **Şifre Güvenliği**: bcrypt ile hash'lenen şifreler
- **Token Yenileme**: Otomatik access token yenileme sistemi

### Hikaye Paylaşımı
- **Korumalı Paylaşım**: Sadece giriş yapmış kullanıcılar hikaye paylaşabilir
- **Güvenli İçerik**: Express-validator ile giriş doğrulama
- **CRUD İşlemleri**: Hikaye oluşturma, okuma, güncelleme ve silme

### Güvenlik
- **Rate Limiting**: API isteklerine hız limiti (Authentication: 5/15dk, Genel: 100/15dk)
- **File Upload Güvenliği**: Dosya tipi ve boyut kontrolü (max 5MB)
- **JWT Security**: Access token (15dk) ve refresh token (7 gün) sistemi
- **Password Policy**: Güçlü şifre gereksinimleri

### UI/UX
- **Modern Animasyonlar**: Framer Motion ile professional geçişler
- **Responsive Design**: Mobile-first tasarım yaklaşımı
- **Accessibility**: WCAG uyumlu arayüz
- **Turkish Language**: Tam Türkçe dil desteği

## 🚀 Teknolojiler

### Backend
- **Node.js + Express**: RESTful API
- **Prisma ORM**: SQLite veritabanı yönetimi
- **JWT**: Authentication ve authorization
- **bcryptjs**: Şifre hash'leme
- **Multer + Sharp**: Dosya yükleme ve resim işleme
- **express-rate-limit**: Rate limiting
- **express-validator**: Giriş doğrulama

### Frontend
- **React 18**: Modern component yaklaşımı
- **Chakra UI**: Erişilebilir UI bileşenleri
- **React Router**: Client-side routing
- **Axios**: HTTP client ile interceptors
- **Framer Motion**: Animasyonlar ve geçişler

## 📁 Proje Yapısı

```
sesimiz-ol/
├── backend/
│   ├── src/
│   │   ├── controllers/      # İş mantığı
│   │   ├── middleware/       # Auth ve upload middleware'leri
│   │   ├── routes/          # API endpoint'leri
│   │   └── app.js          # Ana server dosyası
│   ├── prisma/
│   │   ├── schema.prisma   # Veritabanı şeması
│   │   └── migrations/     # Veritabanı migration'ları
│   └── uploads/            # Yüklenen dosyalar
│       └── avatars/        # Profil fotoğrafları
│
└── frontend/
    ├── src/
    │   ├── components/     # UI bileşenleri
    │   │   ├── animations/ # Animasyon bileşenleri
    │   │   ├── auth/       # Authentication bileşenleri
    │   │   ├── common/     # Ortak bileşenler
    │   │   └── layout/     # Layout bileşenleri
    │   ├── contexts/       # React Context'leri
    │   ├── pages/         # Sayfa bileşenleri
    │   └── App.jsx        # Ana uygulama
    └── public/            # Statik dosyalar
```

## ⚙️ Kurulum

### Ön Gereksinimler
- Node.js 18+
- npm veya yarn

### Backend Kurulumu
```bash
cd backend
npm install
npx prisma migrate deploy
npm start
```

### Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı (multipart/form-data ile avatar)
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/refresh` - Token yenileme
- `GET /api/auth/profile` - Profil bilgileri
- `PUT /api/auth/profile` - Profil güncelleme
- `PUT /api/auth/password` - Şifre değişikliği
- `DELETE /api/auth/account` - Hesap deaktivasyonu

### Stories
- `GET /api/stories` - Hikaye listesi (public)
- `GET /api/stories/:id` - Hikaye detayı
- `POST /api/stories` - Yeni hikaye (protected)
- `PUT /api/stories/:id` - Hikaye güncelleme (author only)
- `DELETE /api/stories/:id` - Hikaye silme (author only)

### Upload
- `POST /api/upload/avatar` - Avatar yükleme
- `GET /api/upload/avatars/:filename` - Avatar dosyası
- `GET /api/upload/info` - Upload limitleri

## 🔒 Güvenlik Önlemleri

### Authentication
- JWT access token (15 dakika geçerlilik)
- JWT refresh token (7 gün geçerlilik)
- Otomatik token yenileme sistemi
- bcrypt ile şifre hash'leme (salt rounds: 12)

### Input Validation
- express-validator ile tüm girişler doğrulanır
- SQL injection koruması (Prisma ORM)
- XSS koruması (Helmet middleware)

### Rate Limiting
- Authentication endpoints: 5 istek/15dk
- Upload endpoints: 10 istek/15dk  
- Genel API: 100 istek/15dk

### File Upload
- Sadece image/jpeg, image/png, image/webp
- Maksimum dosya boyutu: 5MB
- Sharp ile otomatik resize (300x300)
- WebP format'a dönüştürme

## 🎨 UI/UX Özellikleri

### Animasyonlar
- Page transitions (fade in/out)
- Button hover/click micro-interactions
- Smooth form transitions
- Loading states

### Responsive Design
- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interactions
- Optimized typography

### Accessibility
- ARIA labels ve attributes
- Keyboard navigation
- Screen reader uyumlu
- High contrast support

## 📱 Sayfa Yapısı

### Public Pages
- **Ana Sayfa**: Platform tanıtımı ve hikaye preview'ları
- **Hikayeler**: Tüm hikayelerin listelendiği sayfa
- **Hikaye Detayı**: Tek hikaye görüntüleme
- **Hakkında**: Platform hakkında bilgi
- **Gizlilik**: Gizlilik politikası

### Protected Pages
- **Kayıt Ol**: Kullanıcı kaydı sayfası
- **Hikaye Oluştur**: Yeni hikaye paylaşma
- **Ayarlar**: Profil ve hesap yönetimi

### Authentication Flow
- **Login Modal**: Mevcut kullanıcılar için giriş
- **Register Page**: Yeni kullanıcı kaydı
- **Protected Routes**: Authentication gerektiren sayfalar
- **Auto Login**: Token'lar varsa otomatik giriş

## 🔧 Konfigürasyon

### Environment Variables

#### Backend (.env)
```
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRE="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_REFRESH_EXPIRE="7d"
MAX_FILE_SIZE=5242880
NODE_ENV="development"
```

#### Frontend (.env)
```
REACT_APP_API_URL="http://localhost:3001"
```

## 📊 Veritabanı Şeması

### User Table
- `id`: Primary key
- `nickname`: Kullanıcı adı (unique, 2-20 karakter)
- `email`: Email adresi (optional, unique)
- `password`: Hash'lenmiş şifre
- `avatar`: Profil fotoğrafı URL'i
- `isActive`: Hesap durumu
- `createdAt`: Oluşturulma tarihi
- `updatedAt`: Güncellenme tarihi

### Story Table
- `id`: Primary key
- `title`: Hikaye başlığı (5-200 karakter)
- `content`: Hikaye içeriği (50-10000 karakter)
- `authorId`: Foreign key (User)
- `createdAt`: Oluşturulma tarihi
- `updatedAt`: Güncellenme tarihi

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend  
cd frontend
npm run build
```

### Docker Support (İsteğe bağlı)
```dockerfile
# Backend Dockerfile örneği
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📈 Performans Optimizasyonları

### Backend
- Connection pooling (Prisma)
- Response caching headers
- Gzip compression
- Rate limiting

### Frontend
- React.lazy() ile code splitting
- Axios interceptors ile request/response optimization
- Framer Motion ile optimized animations
- Image optimization (WebP format)

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

## 👥 Geliştirici Notları

### Kod Kalitesi
- ESLint ve Prettier kullanımı önerilir
- Commit message'ları anlamlı olmalıdır
- Her feature için ayrı branch kullanılmalıdır

### Test Coverage
- Backend için unit testler yazılmalıdır
- Frontend için component testleri eklenmelidir
- E2E testler critical path'leri kapsamalıdır

### Güvenlik Updates
- Dependency'leri düzenli olarak güncelleyin
- Security audit'leri düzenli yapın (`npm audit`)
- JWT secret'ları güçlü ve unique tutun

---

**Sesimiz Ol** - Kadınların güvenli bir şekilde deneyimlerini paylaştıkları platform.

Soru ve önerileriniz için issue açabilir veya pull request gönderebilirsiniz. 💜