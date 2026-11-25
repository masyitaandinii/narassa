-- ============================================================================
--  NARASSA — SKEMA DATABASE LENGKAP & RELASI + DATA AWAL SUPABASE
-- ============================================================================
--  CARA PAKAI (CUKUP SEKALI RUN):
--    1. Buka https://supabase.com -> Project Anda (Free Tier).
--    2. Masuk ke menu: SQL Editor -> New Query.
--    3. Tempel SELURUH isi file ini -> klik RUN.
--
--  YANG DILAKUKAN OLEH FILE INI SECARA OTOMATIS:
--    ✓ Membuat 16 tabel lengkap dengan Primary Key dan Relasi Foreign Key.
--    ✓ Mengaktifkan Row Level Security (RLS) untuk perlindungan data.
--    ✓ Memasang fungsi sinkronisasi atomik `sync_collection()`.
--    ✓ Memasukkan seluruh DUMMY DATA awal (users, donasi, kegiatan, transaksi, dll).
--    ✓ Memperbarui cache skema Supabase PostgREST.
-- ============================================================================

begin;

-- ============================================================================
-- 1. TABEL UTAMA (Independen)
-- ============================================================================

-- 1.1 PENGGUNA
create table if not exists public.users (
  id             text primary key,
  name           text not null,
  email          text not null unique,
  phone          text,
  "passwordHash" text not null,
  role           text not null default 'user',  -- 'user' | 'admin'
  avatar         text,
  city           text,
  bio            text,
  "volunteerId"  text,
  "createdAt"    text
);

-- 1.2 PROGRAM DONASI
create table if not exists public.donations (
  id               text primary key,
  title            text not null,
  category         text,
  organizer        text,
  "organizerAvatar" text,
  image            text,
  description      text,
  collected        bigint not null default 0,
  target           bigint not null default 0,
  "donorsCount"    bigint not null default 0,
  "endDate"        text,
  verified         boolean not null default false,
  featured         boolean not null default false,
  urgent           boolean not null default false,
  "createdAt"      text
);

-- 1.3 KEGIATAN RELAWAN
create table if not exists public.activities (
  id            text primary key,
  title         text not null,
  category      text,
  location      text,
  type          text,                              -- 'On-site' | 'Remote'
  organizer     text,
  verified      boolean not null default false,
  urgent        boolean not null default false,
  date          text,                              -- tanggal pelaksanaan
  deadline      text,                              -- batas pendaftaran
  quota         bigint not null default 0,
  registered    bigint not null default 0,
  image         text,
  requirements  jsonb not null default '[]'::jsonb,
  perks         jsonb not null default '[]'::jsonb,
  description   text,
  "createdAt"   text,
  "absenCode"   text                               -- kode unik absensi harian
);

create index if not exists idx_activities_date on public.activities (date);
create index if not exists idx_activities_deadline on public.activities (deadline);

-- 1.4 BLOG / BERITA & ISU
create table if not exists public.blog (
  id          text primary key,
  title       text not null,
  slug        text not null unique,
  excerpt     text,
  content     text,
  image       text,
  category    text,
  author      text,
  "createdAt" text
);

-- 1.5 FEED / KABAR TERBARU
create table if not exists public.feed (
  id          text primary key,
  title       text,
  body        text,
  image       text,
  tag         text,
  "createdAt" text
);

-- 1.6 CSR (Kemitraan Perusahaan)
create table if not exists public.csr (
  id            text primary key,
  "companyName" text,
  "picName"     text,
  phone         text,
  email         text,
  type          text,
  note          text,
  status        text not null default 'Menunggu Verifikasi Kontrak',
  "createdAt"   text
);

-- 1.7 KODE OTP
create table if not exists public.otps (
  contact     text primary key,
  code        text,
  "expiresAt" bigint
);

-- 1.8 PENGATURAN ADMIN (Key-Value)
create table if not exists public.settings (
  key   text primary key,
  value jsonb
);

-- ============================================================================
-- 2. TABEL DENGAN RELASI FOREIGN KEY
-- ============================================================================

-- 2.1 TRANSAKSI DONASI
create table if not exists public.txs (
  id           text primary key,
  "donationId" text not null references public.donations(id) on delete cascade,
  "userId"     text references public.users(id) on delete set null,
  "donorName"  text,
  amount       bigint not null default 0,
  method       text,
  anon         boolean not null default false,
  note         text,
  "createdAt"  text,
  status       text not null default 'Menunggu Verifikasi', -- 'Menunggu Verifikasi' | 'Dikonfirmasi' | 'Ditolak'
  bukti        text,                                       -- gambar bukti transfer
  reference    text
);

create index if not exists idx_txs_donation on public.txs ("donationId");
create index if not exists idx_txs_user on public.txs ("userId");

-- 2.2 PENDAFTARAN RELAWAN (Applications / Candidates)
create table if not exists public.applications (
  id             text primary key,
  "activityId"   text not null references public.activities(id) on delete cascade,
  "activityTitle" text,
  "userId"       text references public.users(id) on delete cascade,
  name           text,
  email          text,
  phone          text,
  motivation     text,
  status         text not null default 'Menunggu', -- 'Menunggu' | 'Diterima' | 'Ditolak'
  "appliedDate"  text
);

create index if not exists idx_applications_activity on public.applications ("activityId");
create index if not exists idx_applications_user on public.applications ("userId");

-- 2.3 SERTIFIKAT RELAWAN
create table if not exists public.certificates (
  id                 text primary key,
  "userId"           text not null references public.users(id) on delete cascade,
  "recipientName"    text,
  "activityTitle"    text,
  organizer          text,
  "dateIssued"       text,
  "hoursCount"       bigint not null default 0,
  role               text,
  "verificationCode" text
);

create index if not exists idx_certificates_user on public.certificates ("userId");

-- 2.4 ABSENSI RELAWAN
create table if not exists public.attendance (
  id           text primary key,
  "userId"     text not null references public.users(id) on delete cascade,
  "activityId" text not null references public.activities(id) on delete cascade,
  "checkInAt"  text
);

create index if not exists idx_attendance_user on public.attendance ("userId");
create index if not exists idx_attendance_activity on public.attendance ("activityId");

-- 2.5 NOTIFIKASI
create table if not exists public.notifications (
  id          text primary key,
  "userId"    text not null references public.users(id) on delete cascade,
  title       text,
  body        text,
  type        text,                                -- 'donasi' | 'relawan' | 'sistem'
  read        boolean not null default false,
  "createdAt" text
);

create index if not exists idx_notifications_user on public.notifications ("userId");

-- 2.6 PENGAJUAN GALANG DANA
create table if not exists public.fundraising (
  id             text primary key,
  "userId"       text references public.users(id) on delete set null,
  "organizerName" text,
  "orgType"      text,
  title          text,
  category       text,
  target         bigint not null default 0,
  deadline       text,
  phone          text,
  email          text,
  description    text,
  status         text not null default 'Menunggu',
  "createdAt"    text
);

create index if not exists idx_fundraising_user on public.fundraising ("userId");

-- 2.7 DONASI RUTIN
create table if not exists public.recurring (
  id          text primary key,
  "userId"    text references public.users(id) on delete cascade,
  amount      bigint not null default 0,
  period      text,                                -- 'Mingguan' | 'Bulanan'
  method      text,
  "campaignId" text references public.donations(id) on delete cascade,
  active      boolean not null default true,
  "createdAt" text
);

create index if not exists idx_recurring_user on public.recurring ("userId");

-- 2.8 SUPPORTER
create table if not exists public.supporters (
  id          text primary key,
  "userId"    text references public.users(id) on delete set null,
  name        text,
  email       text,
  tier        text,
  message     text,
  "createdAt" text
);

create index if not exists idx_supporters_user on public.supporters ("userId");

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'users','donations','txs','activities','applications','certificates',
    'attendance','notifications','blog','feed','fundraising','recurring',
    'supporters','csr','otps','settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ============================================================================
-- 4. FUNGSI SINKRONISASI ATOMIK (sync_collection)
-- ============================================================================
create or replace function public.sync_collection(p_table text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pk     text;
  v_update text;
begin
  if p_table is null or p_table not in (
    'users','donations','txs','activities','applications','certificates',
    'attendance','notifications','blog','feed','fundraising','recurring',
    'supporters','csr','otps','settings'
  ) then
    raise exception 'Tabel tidak diizinkan: %', coalesce(p_table, '(null)');
  end if;

  select a.attname into v_pk
  from pg_index i
  join pg_attribute a
    on a.attrelid = i.indrelid
   and a.attnum   = any (i.indkey)
  where i.indrelid = (quote_ident(p_table))::regclass
    and i.indisprimary;

  if v_pk is null then
    raise exception 'Primary key tidak ditemukan untuk tabel %', p_table;
  end if;

  select string_agg(format('%I = excluded.%I', column_name, column_name), ', '
                     order by ordinal_position)
    into v_update
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = p_table
    and column_name  <> v_pk;

  execute format(
    'insert into public.%I
       select * from jsonb_populate_recordset(null::public.%I, $1)
     on conflict (%I) do update set %s',
    p_table, p_table, v_pk, v_update
  ) using p_rows;

  execute format(
    'delete from public.%I t
      where not exists (
        select 1 from jsonb_array_elements($1) e
         where e ->> %L = t.%I
      )',
    p_table, v_pk, v_pk
  ) using p_rows;
end $$;

revoke all on function public.sync_collection(text, jsonb) from public, anon, authenticated;
grant execute on function public.sync_collection(text, jsonb) to service_role;

-- ============================================================================
-- 5. DUMMY DATA AWAL (SEED) LENGKAP DENGAN RELASI
-- ============================================================================

-- 5.1 DATA PENGGUNA
insert into public.users ("id", "name", "email", "phone", "passwordHash", "role", "avatar", "city", "bio", "volunteerId", "createdAt") values
  ('u-admin', 'Tim Admin NARASSA', 'admin@narassa.id', '081290008000', '$2b$10$Pbuts3Zh.riSxFQOH0VtM..TIPISd30ypWA30NRKaaY1yW6OBHWra', 'admin', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80', 'Jakarta', 'Administrator resmi platform NARASSA.', 'NRS-VOL-00001', '2025-10-14'),
  ('u-demo', 'Rizky Ramadhan', 'relawan@narassa.id', '081299887766', '$2b$10$DX2Tn6UvbWyR.jOgvmK2K.sJ7SarsezXoVc/NY/mmuGv1iGf6R77K', 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', 'Jakarta Utara', 'Relawan kemanusiaan & pencinta lingkungan.', 'NRS-VOL-99201', '2026-04-12'),
  ('u-user2', 'Budi Santoso', 'budi.santoso@yahoo.com', '085712345678', '$2b$10$DX2Tn6UvbWyR.jOgvmK2K.sJ7SarsezXoVc/NY/mmuGv1iGf6R77K', 'user', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 'Jakarta Barat', 'Pecinta alam & konservasi mangrove.', 'NRS-VOL-88123', '2026-05-22'),
  ('u-user3', 'Amanda Putri', 'amanda.p@gmail.com', '081345678901', '$2b$10$DX2Tn6UvbWyR.jOgvmK2K.sJ7SarsezXoVc/NY/mmuGv1iGf6R77K', 'user', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', 'Bandung', 'Digital volunteer & UI/UX enthusiast.', 'NRS-VOL-77456', '2026-06-21')
on conflict ("id") do update set "name" = excluded."name", "email" = excluded."email", "phone" = excluded."phone", "passwordHash" = excluded."passwordHash", "role" = excluded."role", "avatar" = excluded."avatar", "city" = excluded."city", "bio" = excluded."bio", "volunteerId" = excluded."volunteerId", "createdAt" = excluded."createdAt";

-- 5.2 DATA PROGRAM DONASI
insert into public.donations ("id", "title", "category", "organizer", "organizerAvatar", "image", "description", "collected", "target", "donorsCount", "endDate", "verified", "featured", "urgent", "createdAt") values
  ('dn-1', 'Bantuan Darurat Logistik & Medis Banjir Demak-Grobogan', 'Bencana Alam', 'Yayasan Peduli Sesama', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80', 'Penyediaan dapur umum darurat, perahu karet, popok bayi, dan posko kesehatan gratis bagi 1.200 kepala keluarga terdampak banjir.', 124500000, 150000000, 428, '2026-11-21', true, true, true, '2026-11-09'),
  ('dn-2', 'Beasiswa Pendidikan 100 Anak Pesisir Muara Angke', 'Pendidikan', 'Gerakan Sahabat Anak Nusantara', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80', 'Bantuan biaya perlengkapan sekolah, seragam, buku cerita, dan SPP 1 tahun untuk anak nelayan kurang mampu.', 48200000, 60000000, 215, '2026-11-23', true, true, true, '2026-11-04'),
  ('dn-3', 'Operasi Jantung Balita Ghaisan (1.5 Tahun)', 'Medis & Kesehatan', 'Komunitas Kasih Bunda', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80', 'Dik Ghaisan membutuhkan operasi penutupan kebocoran sekum jantung tahap kedua di RS Harapan Kita.', 165000000, 180000000, 680, '2026-11-22', true, true, true, '2026-10-28'),
  ('dn-4', 'Revitalisasi Terumbu Karang & Mangrove Kepulauan Seribu', 'Lingkungan', 'EcoNusantara Foundation', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&q=80', 'Penanaman 2.000 bibit mangrove dan rehabilitasi media tanam terumbu karang di Pulau Pari.', 22800000, 40000000, 142, '2026-12-01', true, false, false, '2026-11-12'),
  ('dn-5', 'Renovasi Rumah Singgah Yatim Dhuafa Cirebon', 'Panti & Yatim', 'Rumah Cahaya Yatim', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80', 'Perbaikan atap, kamar tidur, dan ruang belajar untuk 35 anak yatim penghuni rumah singgah.', 31500000, 75000000, 96, '2026-12-16', true, false, false, '2026-11-14'),
  ('dn-6', 'Pembangunan Menara & Tempat Wudhu Masjid Al-Ikhlas', 'Rumah Ibadah', 'Panitia Masjid Al-Ikhlas', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=600&q=80', 'Kelanjutan pembangunan menara setinggi 18 meter dan renovasi aula wudhu untuk jamaah 500 KK.', 87300000, 200000000, 310, '2027-01-02', true, false, false, '2026-11-07'),
  ('dn-7', 'Satwa Terluka: Perawatan Rusa & Elang Jalak Lawu', 'Menolong Hewan', 'Nusantara Wildlife Care', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?auto=format&fit=crop&w=600&q=80', 'Biaya operasi, pakan, dan kandang rehabilitasi untuk 12 satwa liar hasil perdagangan ilegal.', 12750000, 25000000, 88, '2026-12-06', true, false, false, '2026-11-15'),
  ('dn-8', 'Zakat & Wakaf Produktif untuk Petani Kecil NTT', 'Zakat & Wakaf', 'Lembaga Amil Zakat Bina Umat', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80', 'Pendanaan bibit, pupuk, dan alat tani produktif untuk 200 keluarga petani di Sumba dan Flores.', 64000000, 100000000, 254, '2026-12-23', true, true, false, '2026-11-02'),
  ('dn-9', 'Paket Sembako Lansia Terlantar Surabaya', 'Sosial', 'Komunitas Peduli Lansia', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=600&q=80', 'Distribusi paket sembako bulanan dan pemeriksaan kesehatan gratis untuk 150 lansia terlantar.', 9400000, 18000000, 67, '2026-12-10', true, false, false, '2026-11-16')
on conflict ("id") do update set "title" = excluded."title", "category" = excluded."category", "organizer" = excluded."organizer", "organizerAvatar" = excluded."organizerAvatar", "image" = excluded."image", "description" = excluded."description", "collected" = excluded."collected", "target" = excluded."target", "donorsCount" = excluded."donorsCount", "endDate" = excluded."endDate", "verified" = excluded."verified", "featured" = excluded."featured", "urgent" = excluded."urgent", "createdAt" = excluded."createdAt";

-- 5.3 DATA KEGIATAN RELAWAN
insert into public.activities ("id", "title", "category", "location", "type", "organizer", "verified", "urgent", "date", "deadline", "quota", "registered", "image", "requirements", "perks", "description", "createdAt") values
  ('ac-1', 'Relawan Sabtu Ceria: Pengajar Anak Pesisir', 'Anak', 'Muara Angke, Jakarta Utara', 'On-site', 'Gerakan Sahabat Anak Nusantara', true, true, '2026-11-26', '2026-11-21', 20, 16, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80', '["Minimal usia 18 tahun (Mahasiswa/Umum)","Menyukai aktivitas mengajar & mendongeng","Dapat hadir full-day pada hari Sabtu"]'::jsonb, '["E-Sertifikat Resmi","Konsumsi Makan Siang","Kaos Relawan NARASSA","Uang Transportasi"]'::jsonb, 'Kegiatan mengajar literasi dasar, mendongeng interaktif, dan kelas kerajinan tangan untuk anak-anak pemukiman nelayan.', '2026-11-06'),
  ('ac-2', 'Aksi Bersih Pantai & Penanaman 1.000 Mangrove', 'Lingkungan', 'Pulau Pari, Kepulauan Seribu', 'On-site', 'EcoNusantara Foundation', true, true, '2026-11-29', '2026-11-23', 30, 28, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', '["Sehat fisik & dapat berenang dasar","Membawa botol minum pribadi (Tumblr)"]'::jsonb, '["E-Sertifikat 16 Jam Kerja","Kapal Penyeberangan Pulang-Pergi","Konsumsi 2x"]'::jsonb, 'Aksi kolaboratif relawan dalam pengumpulan sampah plastik pantai dan pemasangan bibit mangrove muda.', '2026-11-08'),
  ('ac-3', 'Digital Relawan: UI/UX & Content Creator Kampanye', 'Pendidikan', 'Indonesia (Work From Anywhere)', 'Remote', 'NARASSA Digital Media Hub', true, false, '2026-12-03', '2026-11-26', 5, 4, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', '["Menguasai Canva, Figma, atau Adobe Illustrator","Memiliki portofolio desain visual / microblog"]'::jsonb, '["E-Sertifikat Digital Professional","Portofolio Project Terverifikasi"]'::jsonb, 'Membantu membuat konten infografis dan desain media sosial untuk mendukung transparansi penggalangan dana darurat.', '2026-11-11'),
  ('ac-4', 'Pendampingan Psikososial Pasca Bencana Banjir', 'Bencana', 'Demak, Jawa Tengah', 'On-site', 'Yayasan Peduli Sesama', true, true, '2026-11-24', '2026-11-20', 15, 11, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80', '["Latar belakang Psikologi/Konseling disukai","Bersedia menginap di posko relawan 2 hari"]'::jsonb, '["E-Sertifikat Tanggap Darurat","Akomodasi & Posko","Konsumsi Penuh"]'::jsonb, 'Pemberian trauma healing ringan, permainan anak, serta pendampingan moral untuk keluarga pengungsi.', '2026-11-10'),
  ('ac-5', 'Bedah Rumah Lansia Dhuafa bersama Komunitas RW 04', 'Lansia', 'Bekasi Selatan, Jawa Barat', 'On-site', 'Komunitas Peduli Lansia', true, false, '2026-12-07', '2026-11-30', 25, 9, 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80', '["Usia minimal 17 tahun","Bersedia bekerja fisik (gotong royong)"]'::jsonb, '["E-Sertifikat Bakti Sosial","Konsumsi","Transportasi Lokasi"]'::jsonb, 'Perbaikan atap dan dinding rumah tidak layak huni milik 5 lansia dhuafa.', '2026-11-13'),
  ('ac-6', 'Kelas Literasi Digital untuk Siswa SMP Nusantara', 'Pendidikan', 'SMP Nusantara, Tangerang', 'On-site', 'NARASSA Volunteer Network', true, false, '2026-12-14', '2026-12-05', 12, 3, 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80', '["Paham dasar komputer & internet aman","Sabar mengajar remaja"]'::jsonb, '["E-Sertifikat Pengajar","Konsumsi","Merchandise NARASSA"]'::jsonb, 'Workshop keamanan digital, membuat CV, dan presentasi untuk 60 siswa kelas 9.', '2026-11-16')
on conflict ("id") do update set "title" = excluded."title", "category" = excluded."category", "location" = excluded."location", "type" = excluded."type", "organizer" = excluded."organizer", "verified" = excluded."verified", "urgent" = excluded."urgent", "date" = excluded."date", "deadline" = excluded."deadline", "quota" = excluded."quota", "registered" = excluded."registered", "image" = excluded."image", "requirements" = excluded."requirements", "perks" = excluded."perks", "description" = excluded."description", "createdAt" = excluded."createdAt";

-- 5.4 DATA TRANSAKSI (Relasi ke donations & users)
insert into public.txs ("id", "donationId", "userId", "donorName", "amount", "method", "anon", "note", "createdAt", "status") values
  ('tx-1', 'dn-1', 'u-demo', 'Rizky Ramadhan', 100000, 'QRIS', false, 'Semoga bermanfaat', '2026-11-16', 'Dikonfirmasi'),
  ('tx-2', 'dn-3', NULL, 'Donatur Anonim', 500000, 'BCA Virtual Account', true, '', '2026-11-17', 'Dikonfirmasi')
on conflict ("id") do update set "donationId" = excluded."donationId", "userId" = excluded."userId", "donorName" = excluded."donorName", "amount" = excluded."amount", "method" = excluded."method", "anon" = excluded."anon", "note" = excluded."note", "createdAt" = excluded."createdAt", "status" = excluded."status";

-- 5.5 DATA PENDAFTARAN RELAWAN (Relasi ke activities & users)
insert into public.applications ("id", "activityId", "activityTitle", "userId", "name", "email", "phone", "motivation", "status", "appliedDate") values
  ('ap-1', 'ac-1', 'Relawan Sabtu Ceria: Pengajar Anak Pesisir', 'u-demo', 'Rizky Ramadhan', 'relawan@narassa.id', '081299887766', 'Saya memiliki pengalaman 1 tahun mengajar bimbel anak dan sangat tertarik berbagi ilmu di Muara Angke.', 'Diterima', '2026-11-12'),
  ('ap-2', 'ac-2', 'Aksi Bersih Pantai & Penanaman 1.000 Mangrove', 'u-user2', 'Budi Santoso', 'budi.santoso@yahoo.com', '085712345678', 'Aktif di UKM Pencinta Alam dan ingin ambil bagian langsung penanaman mangrove.', 'Diterima', '2026-11-13'),
  ('ap-3', 'ac-3', 'Digital Relawan: UI/UX & Content Creator Kampanye', 'u-user3', 'Amanda Putri', 'amanda.p@gmail.com', '081345678901', 'UI/UX Designer junior yang bersedia menyumbangkan keahlian visual untuk kemanusiaan.', 'Menunggu', '2026-11-15')
on conflict ("id") do update set "activityId" = excluded."activityId", "activityTitle" = excluded."activityTitle", "userId" = excluded."userId", "name" = excluded."name", "email" = excluded."email", "phone" = excluded."phone", "motivation" = excluded."motivation", "status" = excluded."status", "appliedDate" = excluded."appliedDate";

-- 5.6 DATA SERTIFIKAT (Relasi ke users)
insert into public.certificates ("id", "userId", "recipientName", "activityTitle", "organizer", "dateIssued", "hoursCount", "role", "verificationCode") values
  ('CERT-NRS-2026-088', 'u-demo', 'Rizky Ramadhan', 'Aksi Tanggap Darurat Logistik Banjir Demak', 'NARASSA Volunteer Network', '19 September 2026', 18, 'Relawan Tim Logistik Posko Utama', 'NRS-VER-994812'),
  ('CERT-NRS-2025-142', 'u-demo', 'Rizky Ramadhan', 'Festival Edukasi Literasi & Kebudayaan Anak Pesisir', 'Gerakan Sahabat Anak Nusantara', '20 Desember 2025', 12, 'Fasilitator Studio Mendongeng', 'NRS-VER-332109')
on conflict ("id") do update set "userId" = excluded."userId", "recipientName" = excluded."recipientName", "activityTitle" = excluded."activityTitle", "organizer" = excluded."organizer", "dateIssued" = excluded."dateIssued", "hoursCount" = excluded."hoursCount", "role" = excluded."role", "verificationCode" = excluded."verificationCode";

-- 5.7 DATA NOTIFIKASI (Relasi ke users)
insert into public.notifications ("id", "userId", "title", "body", "type", "read", "createdAt") values
  ('nt-1', 'u-demo', 'Aplikasi Diterima', 'Selamat! Pendaftaran relawan "Aksi Bersih Pantai & Penanaman 1.000 Mangrove" disetujui.', 'relawan', false, '2026-11-14'),
  ('nt-2', 'u-demo', 'Penyaluran Donasi', 'Donasi Banjir Demak tahap 1 telah disalurkan ke lokasi bencana.', 'donasi', false, '2026-11-16'),
  ('nt-3', 'u-demo', 'E-Sertifikat Terbit', 'Sertifikat keikutsertaan kegiatan Anda telah diterbitkan dan siap diunduh.', 'sistem', true, '2026-11-17')
on conflict ("id") do update set "userId" = excluded."userId", "title" = excluded."title", "body" = excluded."body", "type" = excluded."type", "read" = excluded."read", "createdAt" = excluded."createdAt";

-- 5.8 DATA ARTIKEL BLOG
insert into public.blog ("id", "title", "slug", "excerpt", "content", "image", "category", "author", "createdAt") values
  ('bl-1', '5 Cara Memilih Galang Dana yang Transparan & Terpercaya', 'cara-pilih-galang-dana-transparan', 'Donasi online makin mudah, tapi kehati-hatian tetap perlu. Kenali ciri penggalangan dana yang sehat.', 'Dalam memilih galang dana, pertama pastikan lembaganya terdaftar resmi dan memiliki laporan penyaluran rutin. Kedua, cek rincian penggunaan dana — nominal besar tanpa rincian adalah tanda bahaya. Ketiga, baca update terbaru dari penggalang; kampanye hidup biasanya memperbarui progres mingguan. Keempat, gunakan kanal pembayaran resmi yang terverifikasi, jukan transfer ke rekening pribadi. Kelima, manfaatkan fitur donasi berkala agar bantuan Anda berkelanjutan tanpa perlu transfer manual setiap bulan.

Di NARASSA, setiap program donasi melewati verifikasi dokumen legalitas, rekening bank, dan identitas penggalang sebelum tayang. Laporan penyaluran juga dapat diakses publik melalui halaman dampak.', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=600&q=80', 'Tips Donasi', 'Tim Editorial NARASSA', '2026-11-13'),
  ('bl-2', 'Pengalaman Relawan: 3 Hari di Posko Banjir Demak', 'pengalaman-relawan-posko-demak', 'Catatan lapangan salah satu relawan NARASSA saat bergabung dalam aksi tanggap darurat.', 'Hari pertama dimulai dengan pendataan pengungsi dan distribusi paket kebersihan. Dapur umum bekerja dua shift, dan relawan lokal ternyata jadi kunci koordinasi.

Hari kedua, fokus bergeser ke posko kesehatan. Tim medis menangani ratusan pemeriksaan, sementara relawan non-medis mendampingi anak-anak trauma healing.

Hari terakhir, kami membantu evakuasi perabot warga dan bersih-bersih lumpur. Yang paling berkesan: warga yang datang mengantar kopi meski rumahnya masih terendam. Aksi sosial bukan soal jumlah, melainkan kehadiran.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80', 'Cerita Lapangan', 'Rizky Ramadhan', '2026-11-06'),
  ('bl-3', 'CSR Berdampak: Bagi Perusahaan yang Ingin Mulai', 'csr-berdampak-panduan-perusahaan', 'Program CSR tidak harus mahal. Yang penting terukur, berkelanjutan, dan melibatkan karyawan.', 'Langkah pertama tentukan fokus isu yang selaras dengan bisnis — misalnya pendidikan bagi perusahaan teknologi, atau lingkungan bagi manufaktur.

Langkah kedua, ukur baseline sebelum program berjalan tanpa data awal, dampak akan sulit dibuktikan.

Langkah ketiga, libatkan karyawan lewat volunteerism. Program CSR yang melibatkan partisipasi langsung terbukti meningkatkan retensi dan kebanggaan tim.

NARASSA menyediakan skema kemitraan CSR dengan kontrak awal, pelaporan dampak berkala, dan opsi penempatan relawan perusahaan.', 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80', 'Mitra CSR', 'Divisi Kemitraan NARASSA', '2026-10-30'),
  ('bl-4', 'Zakat, Wakaf, dan Donasi Produktif: Memahami Bedanya', 'zakat-wakaf-donasi-produktif', 'Tiga instrumen kebajikan dengan karakter berbeda. Mana yang paling sesuai untuk Anda?', 'Zakat adalah kewajiban dengan nisab dan golongan penerima yang sudah ditetapkan. Wakaf bersifat abadi — pokoknya tidak boleh habis, hanya hasilnya yang disalurkan.

Donasi produktif, seperti modal kerja petani atau alat usaha mikro, berpotensi menghasilkan efek berganda: penerima menjadi mandiri dan tidak kembali bergantung pada bantuan.

Kombinasi ketiganya memberi keseimbangan: zakat memenuhi kebutuhan dasar, wakaf membangun aset umat jangka panjang, dan donasi produktif membuka jalan keluar dari kemiskinan struktural.', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80', 'Edukasi', 'Divisi Edukasi NARASSA', '2026-10-23')
on conflict ("id") do update set "title" = excluded."title", "slug" = excluded."slug", "excerpt" = excluded."excerpt", "content" = excluded."content", "image" = excluded."image", "category" = excluded."category", "author" = excluded."author", "createdAt" = excluded."createdAt";

-- 5.9 DATA KABAR TERBARU (FEED)
insert into public.feed ("id", "title", "body", "image", "tag", "createdAt") values
  ('fd-1', 'Penyaluran tahap 1 banjir Demak telah sampai di 6 desa', 'Tim lapangan NARASSA beserta Yayasan Peduli Sesama menyalurkan 400 paket sembako dan 2 unit perahu karet di Kecamatan Bonang.', 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80', 'Laporan Penyaluran', '2026-11-17'),
  ('fd-2', '18 relawan baru resmi bergabung minggu ini', 'Selamat kepada 18 relawan yang telah menyelesaikan orientasi digital NARASSA. Sertifikat keanggotaan dapat diunduh di menu profil.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', 'Komunitas', '2026-11-15'),
  ('fd-3', 'Program beasiswa pesisir tembus 80% dari target', 'Terima kasih 215 donatur! Beasiswa untuk 100 anak nelayan Muara Angke kini telah mengumpulkan Rp48,2 juta dari target Rp60 juta.', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80', 'Kabar Donasi', '2026-11-13')
on conflict ("id") do update set "title" = excluded."title", "body" = excluded."body", "image" = excluded."image", "tag" = excluded."tag", "createdAt" = excluded."createdAt";

-- 5.10 DATA PENGGALANGAN DANA (Relasi ke users)
insert into public.fundraising ("id", "userId", "organizerName", "orgType", "title", "category", "target", "deadline", "phone", "email", "description", "status", "createdAt") values
  ('fr-1', 'u-demo', 'Rizky Ramadhan', 'Komunitas', 'Perpustakaan Keliling Anak Pesisir', 'Pendidikan', 25000000, '2027-01-17', '081299887766', 'relawan@narassa.id', 'Membangun 3 unit perpustakaan keliling sepeda motor untuk anak pesisir Jakarta Utara.', 'Menunggu', '2026-11-16')
on conflict ("id") do update set "userId" = excluded."userId", "organizerName" = excluded."organizerName", "orgType" = excluded."orgType", "title" = excluded."title", "category" = excluded."category", "target" = excluded."target", "deadline" = excluded."deadline", "phone" = excluded."phone", "email" = excluded."email", "description" = excluded."description", "status" = excluded."status", "createdAt" = excluded."createdAt";

-- 5.11 DATA DONASI RUTIN (Relasi ke users & donations)
insert into public.recurring ("id", "userId", "amount", "period", "method", "campaignId", "active", "createdAt") values
  ('rc-1', 'u-demo', 50000, 'Bulanan', 'QRIS', 'dn-2', true, '2026-10-19')
on conflict ("id") do update set "userId" = excluded."userId", "amount" = excluded."amount", "period" = excluded."period", "method" = excluded."method", "campaignId" = excluded."campaignId", "active" = excluded."active", "createdAt" = excluded."createdAt";

-- 5.12 DATA SUPPORTER (Relasi ke users)
insert into public.supporters ("id", "userId", "name", "email", "tier", "message", "createdAt") values
  ('sp-1', 'u-demo', 'Rizky Ramadhan', 'relawan@narassa.id', 'Kawan Baik', 'Terus berkarya untuk Nusantara!', '2026-10-29')
on conflict ("id") do update set "userId" = excluded."userId", "name" = excluded."name", "email" = excluded."email", "tier" = excluded."tier", "message" = excluded."message", "createdAt" = excluded."createdAt";

-- 5.13 DATA CSR
insert into public.csr ("id", "companyName", "picName", "phone", "email", "type", "note", "status", "createdAt") values
  ('cs-1', 'PT Sahabat Kebaikan Indonesia', 'Hendra Wijaya', '081290001111', 'csr@sahabatkebaikan.co.id', 'CSR Donasi', 'Ingin bekerja sama program beasiswa 2027.', 'Menunggu Verifikasi Kontrak', '2026-11-14')
on conflict ("id") do update set "companyName" = excluded."companyName", "picName" = excluded."picName", "phone" = excluded."phone", "email" = excluded."email", "type" = excluded."type", "note" = excluded."note", "status" = excluded."status", "createdAt" = excluded."createdAt";

-- 5.14 PENGATURAN REKENING TRANSFER DONASI
insert into public.settings ("key", "value") values
  ('payment_accounts', '[{"method":"QRIS","number":"9182000123456789","owner":"PT NARASSA INDONESIA"},{"method":"BCA","number":"123456789012","owner":"PT NARASSA INDONESIA"},{"method":"Mandiri","number":"141001234567890","owner":"PT NARASSA INDONESIA"},{"method":"BNI","number":"0123456789","owner":"PT NARASSA INDONESIA"},{"method":"BRI","number":"123450001234","owner":"PT NARASSA INDONESIA"},{"method":"GoPay","number":"081290008000","owner":"NARASSA INDONESIA"},{"method":"OVO","number":"081290008000","owner":"NARASSA INDONESIA"},{"method":"ShopeePay","number":"081290008000","owner":"NARASSA INDONESIA"}]'::jsonb)
on conflict ("key") do update set "value" = excluded."value";

commit;

-- Reload Supabase PostgREST schema cache
notify pgrst, 'reload schema';
