# Database Schema - Sesimiz Ol Platform

**Platform**: SQLite (local development)
**ORM**: Prisma
**Generated**: 2025-09-25

---

## 🏗️ Genel Mimari

Bu platform **kadın hikaye paylaşım sistemi** için tasarlanmış kapsamlı bir veritabanı şemasıdır.

### Ana Bileşenler:
- **Kullanıcı Yönetimi** - Kayıt, authentication, profil
- **İçerik Sistemi** - Hikayeler, yorumlar, moderasyon
- **Sosyal Özellikler** - Takip, mesajlaşma, favoriler
- **Organizasyon Yönetimi** - STK'lar ve üyelikler
- **Güvenlik** - Oturum yönetimi, şifre sıfırlama
- **Sistem** - Bildirimler, duyurular, ayarlar

---

## 📊 Tablo Detayları

### 🔐 Kullanıcı Tabloları

#### `users`
**Amaç**: Ana kullanıcı bilgileri ve kimlik doğrulaması
```sql
- id (Primary Key)
- nickname (Unique) - Kullanıcı adı
- email (Unique, Optional) - E-posta adresi
- password - Hash'lenmiş şifre
- role (Enum) - USER/MODERATOR/ADMIN
- isActive, isBanned, emailVerified - Durum bilgileri
- failedLoginCount, lockedUntil - Güvenlik önlemleri
- avatar, bio - Profil bilgileri
- createdAt, updatedAt, lastLoginAt - Zaman damgaları
```

#### `user_settings`
**Amaç**: Kullanıcı kişiselleştirme ayarları
```sql
- profileVisibility - PUBLIC/COMMUNITY/PRIVATE
- commentPermission - EVERYONE/FOLLOWERS/NONE
- searchVisibility - Arama sonuçlarında görünürlük
- theme - SYSTEM/LIGHT/DARK
- fontSize - SMALL/MEDIUM/LARGE
- reducedMotion - Erişilebilirlik ayarı
```

### 📝 İçerik Tabloları

#### `stories`
**Amaç**: Ana hikaye içeriği ve moderasyon durumu
```sql
- title, content - Hikaye başlık ve içeriği
- authorId - Yazar referansı
- status - PENDING/APPROVED/REJECTED
- approvedById, rejectedById - Moderatör bilgileri
- rejectionReason - Red sebebi
- viewCount - Görüntülenme sayısı
```

#### `comments`
**Amaç**: Hikaye yorumları (hiyerarşik yapı destekli)
```sql
- content - Yorum içeriği
- authorId, storyId - İlişki referansları
- parentId - Alt yorum desteği için
- reportedAt - Şikayet durumu
```

#### `comment_reactions`
**Amaç**: Yorumlara tepkiler (kalp, beğeni vb.)
```sql
- userId, commentId - İlişki referansları
- reactionType - Tepki türü (varsayılan: "heart")
```

### 🏢 Organizasyon Tabloları

#### `organizations`
**Amaç**: STK ve sivil toplum kuruluşları
```sql
- name, slug - Organizasyon adı ve URL slug
- type - NGO/FOUNDATION/ASSOCIATION/COOPERATIVE
- status - PENDING/ACTIVE/SUSPENDED/REJECTED
- description, longDescription - Açıklamalar
- location, address - Konum bilgileri
- website, email, phone - İletişim
- memberCount, foundedYear - İstatistikler
- activities (JSON) - Faaliyet alanları
```

#### `organization_members`
**Amaç**: STK üyelikleri
```sql
- organizationId, userId - İlişki referansları
- role - Üye rolü (varsayılan: "member")
```

### 💬 Sosyal Etkileşim Tabloları

#### `messages`
**Amaç**: Kullanıcılar arası özel mesajlaşma
```sql
- senderId, receiverId - Gönderen ve alıcı
- content - Mesaj içeriği
- readAt, reportedAt, deletedAt - Durum zaman damgaları
```

#### `user_follows`
**Amaç**: Kullanıcı takip sistemi
```sql
- followerId - Takip eden kullanıcı
- followingId - Takip edilen kullanıcı
```

#### `bookmarks`
**Amaç**: Hikaye favoriler sistemi
```sql
- userId, storyId - Kullanıcı ve hikaye referansı
```

#### `blocked_users`
**Amaç**: Kullanıcı engelleme sistemi
```sql
- blockerId - Engelleyen kullanıcı
- blockedId - Engellenen kullanıcı
```

### 🔒 Güvenlik Tabloları

#### `user_sessions`
**Amaç**: JWT refresh token yönetimi ve oturum takibi
```sql
- refreshTokenHash - Hash'lenmiş refresh token
- userAgent, ipAddress, geolocation - Güvenlik bilgileri
- expiresAt, revokedAt - Süre ve iptal durumu
- replacedBySessionId - Token yenileme zinciri
```

#### `password_reset_tokens`
**Amaç**: Güvenli şifre sıfırlama
```sql
- tokenHash, otpHash - Hash'lenmiş tokenlar
- expiresAt, consumedAt - Süre ve kullanım durumu
- attemptCount - Deneme sayısı
- verifiedAt - Doğrulama zamanı
```

### 🚨 Moderasyon Tabloları

#### `story_reports`
**Amaç**: Hikaye şikayetleri
```sql
- reporterId, storyId - Şikayet eden ve şikayet edilen
- reason, description - Şikayet sebebi ve detayı
- status - Şikayet durumu (varsayılan: "pending")
```

#### `user_reports`
**Amaç**: Kullanıcı şikayetleri
```sql
- reporterId, reportedUserId - Şikayet eden ve edilen
- reason, description - Şikayet detayları
```

### 🔔 Sistem Tabloları

#### `notifications`
**Amaç**: Kullanıcı bildirimleri
```sql
- type - Bildirim türü (varsayılan: "SYSTEM")
- title, message - Bildirim başlık ve içeriği
- data (JSON) - Ek veri
- priority - LOW/NORMAL/HIGH/URGENT
- read, readAt - Okunma durumu
```

#### `announcements`
**Amaç**: Sistem duyuruları
```sql
- title, body - Duyuru başlık ve içeriği
- type - GENERAL/USER/ORGANIZATION/ADMIN
- visibility - PUBLIC/AUTHENTICATED/ADMIN
- startsAt, endsAt - Görünürlük tarihleri
```

#### `feature_flags`
**Amaç**: Özellik açma/kapama kontrolü
```sql
- key - Özellik anahtarı
- name, description - Açıklama bilgileri
- enabled - Aktif/pasif durumu
- rolloutStatus, metadata - Dağıtım bilgileri
```

---

## 🔗 İlişki Haritası

### Ana İlişkiler:
```
User (1) ←→ (N) Stories
User (1) ←→ (N) Comments
User (1) ←→ (N) Messages (Sender)
User (1) ←→ (N) Messages (Receiver)
User (1) ←→ (N) OrganizationMember
User (1) ←→ (1) UserSettings

Story (1) ←→ (N) Comments
Story (1) ←→ (N) Bookmarks
Story (1) ←→ (N) StoryReports

Comment (1) ←→ (N) Comments (Self-referencing)
Comment (1) ←→ (N) CommentReactions

Organization (1) ←→ (N) OrganizationMember
```

### Güvenlik İlişkileri:
```
User (1) ←→ (N) UserSession
User (1) ←→ (N) PasswordResetToken
User (1) ←→ (N) UserReport (Rapor eden)
User (1) ←→ (N) UserReport (Rapor edilen)
```

---

## 🎯 Önemli Özellikler

### ✅ Güvenlik Önlemleri:
- **Hash'lenmiş şifreler** - bcrypt ile güvenli depolama
- **Başarısız giriş takibi** - Brute force koruması
- **Oturum yönetimi** - JWT refresh token sistemi
- **IP ve geolocation takibi** - Güvenlik denetimi

### ✅ Moderasyon Sistemi:
- **Üç aşamalı onay** - PENDING → APPROVED/REJECTED
- **Şikayet sistemi** - Hem kullanıcı hem içerik için
- **Rol tabanlı erişim** - USER/MODERATOR/ADMIN

### ✅ Sosyal Özellikler:
- **Takip sistemi** - Kullanıcı takibi
- **Mesajlaşma** - Özel mesaj sistemi
- **Favoriler** - Hikaye yer imleri
- **Engelleme** - İstenmeyen etkileşim koruması

### ✅ Esneklik:
- **JSON alanlar** - Genişletilebilir veri depolama
- **Feature flags** - Runtime özellik kontrolü
- **Hiyerarşik yorumlar** - Alt yorum desteği
- **Çoklu organizasyon üyeliği** - STK bağlantıları

---

## 📈 Performans Notları

### İndeksler:
```sql
- users: nickname (unique), email (unique)
- stories: authorId, status
- comments: authorId, storyId, parentId, createdAt
- user_sessions: userId, refreshTokenHash, expiresAt
- notifications: userId+read, userId+readAt, createdAt
- bookmarks: userId+storyId (unique)
```

### SQLite Optimizasyonları:
- Compound indeksler sosyal sorguları için
- Foreign key constraints veri bütünlüğü için
- Cascade deletes uygun tablolarda

---

*Bu dokümantasyon SQLite şeması temel alınarak oluşturulmuştur ve geliştirme ortamı için optimize edilmiştir.*