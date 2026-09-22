-- ============================================================================
-- ROW LEVEL SECURITY POLİTİKALARI
-- ============================================================================

-- Yardımcı fonksiyon: mevcut kullanıcı admin mi?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
create policy "Kullanıcı kendi profilini görür" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "Kullanıcı kendi profilini günceller" on profiles
  for update using (auth.uid() = id or is_admin());
create policy "Admin profil ekleyebilir" on profiles
  for insert with check (is_admin() or auth.uid() = id);

-- ----------------------------------------------------------------------------
alter table student_groups enable row level security;
create policy "Herkes grupları görür" on student_groups for select using (true);
create policy "Sadece admin grup yönetir" on student_groups for all using (is_admin());

alter table student_group_members enable row level security;
create policy "Öğrenci kendi üyeliğini görür" on student_group_members
  for select using (student_id = auth.uid() or is_admin());
create policy "Sadece admin üyelik yönetir" on student_group_members
  for all using (is_admin());

-- ----------------------------------------------------------------------------
alter table lessons enable row level security;
create policy "Öğrenci kendi derslerini görür" on lessons
  for select using (student_id = auth.uid() or is_admin());
create policy "Sadece admin ders yönetir" on lessons
  for insert with check (is_admin());
create policy "Sadece admin ders günceller" on lessons
  for update using (is_admin());
create policy "Sadece admin ders siler" on lessons
  for delete using (is_admin());

-- ----------------------------------------------------------------------------
alter table topics_progress enable row level security;
create policy "Öğrenci kendi ilerlemesini görür" on topics_progress
  for select using (student_id = auth.uid() or is_admin());
create policy "Sadece admin ilerleme yazar" on topics_progress
  for insert with check (is_admin());
create policy "Sadece admin ilerleme günceller" on topics_progress
  for update using (is_admin());

-- ----------------------------------------------------------------------------
alter table questions enable row level security;
create policy "Öğrenci kendi sorularını görür" on questions
  for select using (student_id = auth.uid() or is_admin());
create policy "Öğrenci soru açabilir" on questions
  for insert with check (student_id = auth.uid());
create policy "İlgili taraf günceller" on questions
  for update using (student_id = auth.uid() or is_admin());

alter table question_messages enable row level security;
create policy "İlgili taraf mesajları görür" on question_messages
  for select using (
    is_admin() or exists (
      select 1 from questions q where q.id = question_id and q.student_id = auth.uid()
    )
  );
create policy "İlgili taraf mesaj yazar" on question_messages
  for insert with check (
    sender_id = auth.uid() and (
      is_admin() or exists (
        select 1 from questions q where q.id = question_id and q.student_id = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------------------
alter table assignments enable row level security;
create policy "Hedeflenen öğrenci ödevi görür" on assignments
  for select using (
    is_admin() or exists (
      select 1 from assignment_targets t where t.assignment_id = id and t.student_id = auth.uid()
    )
  );
create policy "Sadece admin ödev yönetir" on assignments
  for all using (is_admin());

alter table assignment_targets enable row level security;
create policy "İlgili taraf hedefi görür" on assignment_targets
  for select using (student_id = auth.uid() or is_admin());
create policy "Sadece admin hedef atar" on assignment_targets
  for all using (is_admin());

alter table submissions enable row level security;
create policy "Öğrenci kendi teslimini görür" on submissions
  for select using (student_id = auth.uid() or is_admin());
create policy "Öğrenci teslim yapar" on submissions
  for insert with check (student_id = auth.uid());
create policy "İlgili taraf teslimi günceller" on submissions
  for update using (student_id = auth.uid() or is_admin());

-- ----------------------------------------------------------------------------
alter table announcements enable row level security;
create policy "Hedeflenen öğrenci duyuruyu görür" on announcements
  for select using (
    is_admin() or target_group_id is null or exists (
      select 1 from student_group_members m
      where m.group_id = target_group_id and m.student_id = auth.uid()
    )
  );
create policy "Sadece admin duyuru yönetir" on announcements
  for insert with check (is_admin());

alter table announcement_reads enable row level security;
create policy "Öğrenci kendi okumasını yönetir" on announcement_reads
  for all using (student_id = auth.uid() or is_admin());

-- ----------------------------------------------------------------------------
alter table notifications enable row level security;
create policy "Kullanıcı kendi bildirimini görür" on notifications
  for select using (recipient_id = auth.uid() or is_admin());
create policy "Kullanıcı kendi bildirimini günceller" on notifications
  for update using (recipient_id = auth.uid());
create policy "Sistem bildirim ekler" on notifications
  for insert with check (true);

-- ----------------------------------------------------------------------------
alter table contact_requests enable row level security;
create policy "Herkes iletişim formu gönderebilir" on contact_requests
  for insert with check (true);
create policy "Sadece admin talepleri görür" on contact_requests
  for select using (is_admin());
create policy "Sadece admin talepleri günceller" on contact_requests
  for update using (is_admin());

-- ----------------------------------------------------------------------------
alter table pages enable row level security;
create policy "Herkes yayınlanan sayfayı görür" on pages
  for select using (status = 'published' or is_admin());
create policy "Sadece admin sayfa yönetir" on pages
  for insert with check (is_admin());
create policy "Sadece admin sayfa günceller" on pages
  for update using (is_admin());

-- ----------------------------------------------------------------------------
alter table blog_posts enable row level security;
create policy "Herkes yayınlanan yazıyı görür" on blog_posts
  for select using (status = 'published' or is_admin());
create policy "Sadece admin yazı yönetir" on blog_posts
  for insert with check (is_admin());
create policy "Sadece admin yazı günceller" on blog_posts
  for update using (is_admin());
create policy "Sadece admin yazı siler" on blog_posts
  for delete using (is_admin());

alter table blog_categories enable row level security;
create policy "Herkes kategorileri görür" on blog_categories for select using (true);
create policy "Sadece admin kategori yönetir" on blog_categories for all using (is_admin());

alter table blog_post_categories enable row level security;
create policy "Herkes ilişkiyi görür" on blog_post_categories for select using (true);
create policy "Sadece admin ilişki yönetir" on blog_post_categories for all using (is_admin());

-- ----------------------------------------------------------------------------
alter table instagram_posts enable row level security;
create policy "Herkes instagram gönderilerini görür" on instagram_posts for select using (true);
create policy "Sadece admin instagram önbelleği yazar" on instagram_posts for all using (is_admin());

-- ----------------------------------------------------------------------------
alter table products enable row level security;
create policy "Herkes aktif ürünleri görür" on products
  for select using (is_active = true or is_admin());
create policy "Sadece admin ürün yönetir" on products
  for insert with check (is_admin());
create policy "Sadece admin ürün günceller" on products
  for update using (is_admin());

alter table discount_codes enable row level security;
create policy "Sadece admin kod görür" on discount_codes for select using (is_admin());
create policy "Sadece admin kod yönetir" on discount_codes for all using (is_admin());

alter table orders enable row level security;
create policy "Öğrenci kendi siparişini görür" on orders
  for select using (student_id = auth.uid() or is_admin());
create policy "Herkes sipariş oluşturabilir" on orders
  for insert with check (true);
create policy "Sadece admin sipariş günceller" on orders
  for update using (is_admin());
