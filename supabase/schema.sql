-- Kasku — skema database fase 1
-- Jalankan sekali di Supabase: SQL Editor → New query → tempel seluruh isi file ini → Run.
-- (Project Supabase "Kasku" sudah menjalankan ini sebagai migration `kasku_skema_awal`.)

-- ============ DOMPET ============
-- Rekening, e-wallet, atau uang tunai milik user. Saldo saat ini dihitung di aplikasi:
-- saldo_awal + pemasukan − pengeluaran ± transfer.
create table if not exists public.dompet (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nama        text not null check (length(trim(nama)) between 1 and 40),
  saldo_awal  bigint not null default 0,              -- boleh minus (mis. kartu kredit)
  diarsipkan  boolean not null default false,          -- dompet bertransaksi diarsipkan, bukan dihapus
  dibuat_pada timestamptz not null default now(),
  unique (id, user_id)                                 -- target foreign key gabungan di bawah
);

-- ============ KATEGORI ============
create table if not exists public.kategori (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nama           text not null check (length(trim(nama)) between 1 and 30),
  tipe           text not null check (tipe in ('masuk', 'keluar')),
  ikon           text not null default '🏷️',
  disembunyikan  boolean not null default false,       -- kategori terpakai disembunyikan, bukan dihapus
  dibuat_pada    timestamptz not null default now(),
  unique (id, user_id)
);

-- ============ TRANSAKSI ============
create table if not exists public.transaksi (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipe              text not null check (tipe in ('masuk', 'keluar', 'transfer')),
  nominal           bigint not null check (nominal > 0 and nominal <= 1000000000000), -- Rupiah, bulat
  kategori_id       uuid,
  dompet_id         uuid not null,
  dompet_tujuan_id  uuid,
  tanggal           date not null default current_date,
  catatan           text check (catatan is null or length(catatan) <= 200),
  dibuat_pada       timestamptz not null default now(),

  -- Dompet & kategori yang dirujuk harus milik user yang sama.
  foreign key (dompet_id, user_id)        references public.dompet (id, user_id)   on delete restrict,
  foreign key (dompet_tujuan_id, user_id) references public.dompet (id, user_id)   on delete restrict,
  foreign key (kategori_id, user_id)      references public.kategori (id, user_id) on delete restrict,

  -- Transfer: tanpa kategori, wajib dompet tujuan yang berbeda.
  -- Masuk/keluar: wajib kategori, tanpa dompet tujuan.
  check (
    (tipe = 'transfer' and kategori_id is null and dompet_tujuan_id is not null and dompet_tujuan_id <> dompet_id)
    or
    (tipe in ('masuk', 'keluar') and kategori_id is not null and dompet_tujuan_id is null)
  )
);

-- ============ INDEX ============
-- Riwayat & laporan selalu memfilter per user lalu tanggal.
create index if not exists transaksi_user_tanggal_idx on public.transaksi (user_id, tanggal desc);
-- Index untuk setiap foreign key (cek saat hapus dompet/kategori, dan RLS per user).
create index if not exists transaksi_dompet_idx        on public.transaksi (dompet_id, user_id);
create index if not exists transaksi_dompet_tujuan_idx on public.transaksi (dompet_tujuan_id, user_id) where dompet_tujuan_id is not null;
create index if not exists transaksi_kategori_idx      on public.transaksi (kategori_id, user_id) where kategori_id is not null;
create index if not exists dompet_user_idx             on public.dompet (user_id);
create index if not exists kategori_user_idx           on public.kategori (user_id);

-- ============ ROW LEVEL SECURITY ============
-- Hanya user yang login, dan hanya untuk barisnya sendiri. Pengunjung tanpa login tidak bisa apa-apa.
-- (select auth.uid()) dievaluasi sekali per kueri, bukan per baris.
alter table public.dompet    enable row level security;
alter table public.kategori  enable row level security;
alter table public.transaksi enable row level security;

drop policy if exists "dompet milik sendiri" on public.dompet;
create policy "dompet milik sendiri" on public.dompet
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "kategori milik sendiri" on public.kategori;
create policy "kategori milik sendiri" on public.kategori
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "transaksi milik sendiri" on public.transaksi;
create policy "transaksi milik sendiri" on public.transaksi
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
