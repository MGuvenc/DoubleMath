# Matematik Özel Ders Platformu

Next.js 14 (App Router) + Supabase + Tailwind CSS ile geliştirilmiş, matematik özel ders veren
öğretmen için tam özellikli web platformu.

## 🚀 Kurulum

### 1) Bağımlılıkları yükle
```bash
npm install
```

### 2) Supabase projesi oluştur
1. [supabase.com](https://supabase.com) üzerinden yeni proje oluştur.
2. Proje ayarlarından `Project URL`, `anon public key` ve `service_role key` değerlerini al.
3. SQL Editor'de sırasıyla şu dosyaları çalıştır:
   - `supabase/migrations/0001_init.sql` (tüm tablolar)
   - `supabase/migrations/0002_rls.sql` (güvenlik politikaları)
4. **Authentication → Providers**'da Email/Password'ün açık olduğundan emin ol.
5. **Storage**'da şu bucket'ları oluştur (public/private ayarlarına dikkat et):
   - `avatars` (public)
   - `assignments` (admin'in ödev dosyaları için, public okuma)
   - `submissions` (öğrenci teslimleri için, private — sadece ilgili kullanıcı ve admin okur)
   - `blog-images` (public)

### 3) İlk admin kullanıcısını oluştur
1. Sitede `/register` üzerinden normal kayıt ol (bu otomatik `student` rolüyle oluşur).
2. Supabase Dashboard → Table Editor → `profiles` tablosunda kendi satırını bulup
   `role` alanını `admin` olarak değiştir.

### 4) Ortam değişkenlerini ayarla
`.env.example` dosyasını `.env.local` olarak kopyala ve değerleri doldur:
```bash
cp .env.example .env.local
```

### 5) Geliştirme sunucusunu başlat
```bash
npm run dev
```
`http://localhost:3000` adresinden erişebilirsin.

### 6) Veritabanı tiplerini üret (opsiyonel ama önerilir)
```bash
npx supabase login
npx supabase gen types typescript --project-id <PROJECT_ID> > lib/supabase/database.types.ts
```

---

## 📦 GitHub + Vercel'e Deploy

```bash
git init
git add .
git commit -m "İlk commit: proje iskeleti"
git branch -M main
git remote add origin <GITHUB_REPO_URL>
git push -u origin main
```

Sonra [vercel.com](https://vercel.com) üzerinden:
1. "New Project" → GitHub reponu seç.
2. Environment Variables kısmına `.env.local` içeriğindeki tüm değişkenleri gir.
3. Deploy et.
4. Vercel Cron otomatik olarak `vercel.json`'daki `/api/cron/lesson-reminders` işini
   10 dakikada bir tetikleyecektir (Vercel Pro planında sınırsız, Hobby planda bazı kısıtlar olabilir —
   gerekirse cron.org gibi harici bir servisle de tetiklenebilir).

---

## 🗂️ Proje Yapısı

```
app/
  (auth)/login, register          → Giriş/kayıt sayfaları
  (marketing)/                    → Genel pazarlama bileşenleri (opsiyonel route group)
  admin/                          → Admin paneli (rol korumalı)
    dashboard, students, lessons, assignments,
    questions, announcements, pages (CMS), blog,
    discounts, orders, settings
  student/                        → Öğrenci paneli (rol korumalı)
    dashboard, lessons, assignments, questions, progress, announcements
  api/
    contact/                      → İletişim formu → DB + email
    cron/lesson-reminders/        → Otomatik ders hatırlatma (Vercel Cron)
    webhooks/payment/             → Ödeme sağlayıcı webhook'u (Faz 2)
    instagram/                    → Instagram post senkronizasyonu (Faz 4)
  blog/[slug]/                    → Blog yazı detay sayfası
  pricing/                        → Ücretlendirme + ürün satış sayfası
  contact/                        → İletişim sayfası
  instagram/                      → Instagram grid sayfası

components/
  admin/, student/, marketing/, ui/

lib/supabase/
  client.ts    → Browser client
  server.ts    → Server Component / Server Action client + admin (service_role) client
  database.types.ts → Supabase tip tanımları (gen types ile üretilecek)

supabase/migrations/
  0001_init.sql  → Tüm tablolar, enum'lar, trigger'lar
  0002_rls.sql   → Row Level Security politikaları
```

## 🔐 Roller ve Güvenlik
- `profiles.role`: `admin` veya `student`.
- `middleware.ts` rol bazlı yönlendirme yapar (`/admin/*` sadece admin, `/student/*` giriş yapan herkes).
- Tüm tablolarda RLS aktif — öğrenci sadece kendi verisini görür, admin her şeyi görür/yönetir.
- **ÖNEMLİ:** `SUPABASE_SERVICE_ROLE_KEY` asla client tarafına sızdırılmamalı, sadece
  `lib/supabase/server.ts` içindeki `createAdminClient()` server-side kod yollarında kullanılmalı.

## ✅ Tamamlanan (Faz 1 — Temel)
- Proje iskeleti, Tailwind, SEO metadata yapısı
- Supabase şeması: tüm modüller için tablolar + RLS (dersler, ödevler, sorular, duyurular,
  blog, CMS sayfaları, ürünler/siparişler/indirim kodları, Instagram önbelleği)
- Auth (kayıt/giriş), middleware ile rol koruması
- Anasayfa (CMS'ten `pages` tablosuna bağlı, düzenlenebilir yapıda)
- İletişim formu (DB kaydı + admin'e email)
- Öğrenci paneli: layout, sidebar (responsive), dashboard (yaklaşan ders + bekleyen ödev özeti)
- Admin paneli: layout, sidebar, dashboard (istatistik kartları)
- Otomatik ders hatırlatma: 24 saat ve 1 saat kala email + uygulama içi bildirim (Vercel Cron)

## 🔜 Sırada (Faz 2, 3, 4)
**Faz 2 — Ders Yönetimi Derinleştirme + Ödeme**
- [ ] Admin: ders programı oluşturma/düzenleme UI (takvim görünümü)
- [ ] Öğrenci: ders erteleme talebi akışı
- [ ] Iyzico/PayTR ödeme entegrasyonu + webhook
- [ ] Ücretlendirme sayfası + ders paketi/kitap satın alma akışı
- [ ] Web push bildirimleri (service worker + push subscription)

**Faz 3 — Etkileşim Modülleri**
- [ ] Ödev oluşturma/teslim/notlandırma tam akışı (dosya yükleme dahil)
- [ ] Öğretmene Sor: gerçek zamanlı mesajlaşma (Supabase Realtime)
- [ ] Duyuru gönderme UI + email entegrasyonu
- [ ] İndirim kodu oluşturma/uygulama akışı
- [ ] Öğrenci grupları yönetimi

**Faz 4 — İçerik ve Büyüme**
- [ ] Zengin metin editörü (Tiptap) ile anasayfa/blog düzenleme UI
- [ ] Blog listeleme + detay sayfaları + kategori filtresi
- [ ] Instagram Graph API senkronizasyonu + grid sayfası
- [ ] Analitik dashboard (gelir, aktif öğrenci, en çok satan paket)
- [ ] Yorum/referans onay sistemi
- [ ] WhatsApp buton entegrasyonu

## 🛠️ Kullanılan Teknolojiler
- **Next.js 14** (App Router, Server Components, ISR)
- **Supabase** (Postgres, Auth, Storage, RLS, Realtime — ileride)
- **Tailwind CSS**
- **Resend** (transactional email)
- **Vercel** (hosting + Cron Jobs)
- **Tiptap** (zengin metin editörü — Faz 4)
