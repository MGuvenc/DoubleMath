-- ============================================================================
-- MATEMATİK ÖZEL DERS PLATFORMU - VERİTABANI ŞEMASI
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- ENUM TİPLERİ
-- ----------------------------------------------------------------------------
create type user_role as enum ('admin', 'student');
create type lesson_status as enum ('scheduled', 'completed', 'cancelled', 'reschedule_requested');
create type assignment_status as enum ('pending', 'submitted', 'late', 'graded');
create type question_status as enum ('open', 'answered', 'closed');
create type order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type product_type as enum ('lesson_package', 'book', 'other');
create type page_status as enum ('draft', 'published');
create type notification_channel as enum ('in_app', 'email', 'push');

-- ----------------------------------------------------------------------------
-- PROFİLLER (auth.users ile 1-1)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  grade_level text, -- örn: "10. Sınıf", "YKS", "LGS"
  parent_name text,
  parent_phone text,
  notes text, -- admin'in öğrenci hakkında özel notları
  is_active boolean not null default true,
  push_subscription jsonb, -- web push subscription objesi
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on profiles(role);

-- ----------------------------------------------------------------------------
-- ÖĞRENCİ GRUPLARI (duyuru/ödev hedeflemek için)
-- ----------------------------------------------------------------------------
create table student_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table student_group_members (
  group_id uuid not null references student_groups(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  primary key (group_id, student_id)
);

-- ----------------------------------------------------------------------------
-- DERSLER
-- ----------------------------------------------------------------------------
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Matematik Dersi',
  topic text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meeting_url text, -- Zoom/Meet linki
  status lesson_status not null default 'scheduled',
  reschedule_reason text,
  teacher_notes text, -- ders sonrası admin notu
  reminder_24h_sent boolean not null default false,
  reminder_1h_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lessons_student on lessons(student_id);
create index idx_lessons_starts_at on lessons(starts_at);
create index idx_lessons_reminders on lessons(starts_at, reminder_24h_sent, reminder_1h_sent) where status = 'scheduled';

-- ----------------------------------------------------------------------------
-- KONU İLERLEME TAKİBİ
-- ----------------------------------------------------------------------------
create table topics_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  topic text not null,
  mastery_level smallint not null default 0 check (mastery_level between 0 and 100),
  comment text,
  created_at timestamptz not null default now()
);
create index idx_topics_progress_student on topics_progress(student_id);

-- ----------------------------------------------------------------------------
-- ÖĞRETMENE SOR (soru-cevap / mesajlaşma)
-- ----------------------------------------------------------------------------
create table questions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  status question_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_questions_student on questions(student_id);

create table question_messages (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references questions(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);
create index idx_question_messages_question on question_messages(question_id);

-- ----------------------------------------------------------------------------
-- ÖDEVLER
-- ----------------------------------------------------------------------------
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  attachment_url text, -- öğretmenin verdiği PDF/dosya
  due_at timestamptz not null,
  target_group_id uuid references student_groups(id) on delete set null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table assignment_targets (
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  primary key (assignment_id, student_id)
);

create table submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  file_url text,
  note text,
  status assignment_status not null default 'pending',
  grade numeric(5,2),
  feedback text,
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index idx_submissions_student on submissions(student_id);

-- ----------------------------------------------------------------------------
-- DUYURULAR
-- ----------------------------------------------------------------------------
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  target_group_id uuid references student_groups(id) on delete set null, -- null = herkese
  send_email boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table announcement_reads (
  announcement_id uuid not null references announcements(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, student_id)
);

-- ----------------------------------------------------------------------------
-- BİLDİRİMLER (uygulama içi)
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  channel notification_channel not null default 'in_app',
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_id, is_read);

-- ----------------------------------------------------------------------------
-- İLETİŞİM FORMU (yeni öğrenci talepleri)
-- ----------------------------------------------------------------------------
create table contact_requests (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text not null,
  phone text,
  grade_level text,
  message text,
  is_handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CMS: ANASAYFA / SAYFA İÇERİKLERİ
-- ----------------------------------------------------------------------------
create table pages (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique, -- 'home', 'about', 'faq' vs.
  title text not null,
  content_json jsonb not null default '{}', -- Tiptap/Lexical rich content, section bazlı
  status page_status not null default 'draft',
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- BLOG
-- ----------------------------------------------------------------------------
create table blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  excerpt text,
  cover_image_url text,
  content_html text not null,
  status page_status not null default 'draft',
  seo_title text,
  seo_description text,
  author_id uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_blog_posts_status on blog_posts(status, published_at desc);

create table blog_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique
);

create table blog_post_categories (
  post_id uuid not null references blog_posts(id) on delete cascade,
  category_id uuid not null references blog_categories(id) on delete cascade,
  primary key (post_id, category_id)
);

-- ----------------------------------------------------------------------------
-- INSTAGRAM GÖNDERİ ÖNBELLEĞİ
-- ----------------------------------------------------------------------------
create table instagram_posts (
  id text primary key, -- instagram media id
  media_type text,
  media_url text,
  permalink text,
  caption text,
  timestamp timestamptz,
  cached_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ÜRÜNLER (ders paketleri + kitaplar) & SİPARİŞLER & İNDİRİM KODLARI
-- ----------------------------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  type product_type not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  currency text not null default 'TRY',
  lesson_count integer, -- lesson_package tipi için
  image_url text,
  stock integer, -- book tipi için, null = sınırsız
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table discount_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  amount numeric(10,2) not null,
  max_uses integer,
  used_count integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references profiles(id) on delete set null,
  product_id uuid not null references products(id),
  discount_code_id uuid references discount_codes(id),
  amount numeric(10,2) not null,
  currency text not null default 'TRY',
  status order_status not null default 'pending',
  payment_provider text, -- 'iyzico', 'paytr'
  provider_ref text, -- provider işlem/transaction id
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index idx_orders_student on orders(student_id);

-- ----------------------------------------------------------------------------
-- updated_at otomatik güncelleme trigger'ı
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_lessons_updated_at before update on lessons
  for each row execute function set_updated_at();
create trigger trg_questions_updated_at before update on questions
  for each row execute function set_updated_at();
create trigger trg_blog_posts_updated_at before update on blog_posts
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Yeni auth.users kaydı oluşunca otomatik profile satırı aç
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
