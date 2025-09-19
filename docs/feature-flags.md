# Feature Flag Yönetimi

Bu döküman, Faz 2 geçişlerinde kullanılan feature flag (özellik bayrağı)
infrastrüktürünü açıklar.

## Varsayılan Bayraklar

| Bayrak                 | Açıklama                                                     | Varsayılan |
| ---------------------- | ------------------------------------------------------------- | ---------- |
| `messaging`            | Mesajlaşma ve sesli paylaşımları etkinleştirir               | `.env`     |
| `adminPanel`           | Yönetici paneli ve ilgili API uçlarını açar                  | `.env`     |
| `emailNotifications`   | Sistem/güvenlik e-posta bildirimlerini gönderir             | `.env`     |
| `migrationMode`        | Kademeli geçiş senaryolarında yeni akışları aktive eder      | `.env`     |
| `passwordResetV2`      | OTP tabanlı yeni şifre sıfırlamayı devreye alır              | `true`     |
| `authLegacySessions`   | Legacy auth çerezlerini paralel olarak kabul etmeye devam eder | `true`     |

Bayrak değerleri PostgreSQL'de `feature_flags` tablosunda saklanır. Çalışma
zamanında `services/featureFlags.js` üzerinden cachelenir.

## CLI

```
cd backend
npm run feature-flags list
npm run feature-flags enable passwordResetV2
npm run feature-flags disable migrationMode
```

## Admin API

- `GET /api/admin/feature-flags`
- `PATCH /api/admin/feature-flags/:key`

Bu uçlar `adminPanel` feature flag'i açık olan ve `ADMIN` role sahip kullanıcılar
ile kullanılabilir.

## Bildirimler

Bir feature flag değiştirildiğinde tüm admin kullanıcılara `notifications`
tablosu üzerinden sistem bildirimi düşer. Ayrıca `FEATURE_FLAG_UPDATED`
şeklinde bir security event loglanır.

## Rollout / Rollback

- Yeni özellikler önce flag devre dışı (false) halde deploy edilir.
- Rollout için flag `enable` edilir. Geri almanız gerekirse CLI veya Admin panel
  üzerinden tekrar `disable` edebilirsiniz.
- `passwordResetV2` kapatıldığında yeni OTP akışı devre dışı kalır ve istemci
  eski işleyişe yönlendirilir.
- `authLegacySessions` flag'i ile migration sürecinde eski auth oturumlarının
  kabul edilme süresini kontrol edebilirsiniz.

## Otomatik Yenileme

Flag durumları varsayılan olarak her 5 dakikada bir bellekte tazelenir
(`FEATURE_FLAG_REFRESH_INTERVAL_MS`). Admin paneli veya CLI ile yapılan
herhangi bir güncelleme sonrasında cache zorunlu olarak yenilenir.
