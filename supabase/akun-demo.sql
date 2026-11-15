-- Kasku — akun demo bersama (test@gmail.com / test123)
-- Sudah dijalankan di project "Kasku" sebagai migration `kasku_akun_demo`.
--
-- 1. lindungi_akun_demo: trigger yang mengunci password, email, dan nama akun demo,
--    agar pengunjung tidak bisa mengambil alih akun yang dipakai bersama.
-- 2. reset_akun_demo(): hapus semua data akun demo, isi ulang contoh data 3 bulan
--    (relatif terhadap tanggal hari ini), dan kembalikan password + nama.
-- 3. pg_cron menjalankan reset setiap hari pukul 17.00 UTC (00.00 WIB).

create extension if not exists pg_cron;

-- ============ 1. Kunci akun demo ============
create or replace function public.lindungi_akun_demo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(old.email) = 'test@gmail.com'
     and coalesce(current_setting('kasku.reset_demo', true), '') <> 'on' then
    new.encrypted_password := old.encrypted_password;
    new.email := old.email;
    new.raw_user_meta_data := old.raw_user_meta_data;
    new.email_change := old.email_change;
    new.email_change_token_new := old.email_change_token_new;
    new.email_change_token_current := old.email_change_token_current;
  end if;
  return new;
end;
$$;

revoke execute on function public.lindungi_akun_demo() from public, anon, authenticated;

drop trigger if exists lindungi_akun_demo on auth.users;
create trigger lindungi_akun_demo
  before update on auth.users
  for each row execute function public.lindungi_akun_demo();

-- ============ 2. Reset + contoh data ============
create or replace function public.reset_akun_demo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_tunai uuid;
  v_bca uuid;
  v_gopay uuid;
begin
  select id into v_uid from auth.users where lower(email) = 'test@gmail.com';
  if v_uid is null then
    raise notice 'reset_akun_demo: akun demo tidak ditemukan';
    return;
  end if;

  -- Izinkan perubahan password/nama hanya di dalam fungsi ini (lihat lindungi_akun_demo).
  perform set_config('kasku.reset_demo', 'on', true);

  delete from public.transaksi where user_id = v_uid;
  delete from public.dompet    where user_id = v_uid;
  delete from public.kategori  where user_id = v_uid;

  insert into public.kategori (user_id, nama, tipe, ikon) values
    (v_uid, 'Makan & Minum', 'keluar', '🍜'), (v_uid, 'Transportasi', 'keluar', '🚗'),
    (v_uid, 'Belanja', 'keluar', '🛒'),       (v_uid, 'Tagihan', 'keluar', '🧾'),
    (v_uid, 'Rumah', 'keluar', '🏠'),         (v_uid, 'Kesehatan', 'keluar', '💊'),
    (v_uid, 'Hiburan', 'keluar', '🎬'),       (v_uid, 'Pendidikan', 'keluar', '📚'),
    (v_uid, 'Hadiah & Donasi', 'keluar', '🎁'), (v_uid, 'Lainnya', 'keluar', '🏷️'),
    (v_uid, 'Gaji', 'masuk', '💼'),           (v_uid, 'Bonus', 'masuk', '💰'),
    (v_uid, 'Investasi', 'masuk', '📈'),      (v_uid, 'Hadiah', 'masuk', '🎁'),
    (v_uid, 'Lainnya', 'masuk', '🏷️');

  insert into public.dompet (user_id, nama, saldo_awal) values (v_uid, 'Tunai', 750000)  returning id into v_tunai;
  insert into public.dompet (user_id, nama, saldo_awal) values (v_uid, 'BCA', 4500000)   returning id into v_bca;
  insert into public.dompet (user_id, nama, saldo_awal) values (v_uid, 'GoPay', 150000)  returning id into v_gopay;

  -- Pola transaksi bulanan untuk 2 bulan lalu, bulan lalu, dan bulan ini (sampai hari ini).
  -- m = berapa bulan yang lalu; kolom bulan_ke membatasi baris ke bulan tertentu (null = setiap bulan).
  insert into public.transaksi (user_id, tipe, nominal, kategori_id, dompet_id, dompet_tujuan_id, tanggal, catatan)
  select v_uid, p.tipe, p.nominal + p.naik * m.m,
         case when p.tipe = 'transfer' then null
              else (select k.id from public.kategori k where k.user_id = v_uid and k.nama = p.kategori and k.tipe = p.tipe) end,
         case p.dari when 'tunai' then v_tunai when 'bca' then v_bca else v_gopay end,
         case p.ke when 'tunai' then v_tunai when 'bca' then v_bca when 'gopay' then v_gopay else null end,
         (date_trunc('month', current_date) - make_interval(months => m.m))::date + (p.hari - 1),
         p.catatan
  from (values (0), (1), (2)) as m(m)
  cross join (values
    ( 1, 'masuk',    8500000, 0,     'Gaji',          'bca',   null,    'Gaji bulanan',        null),
    ( 2, 'keluar',   1500000, 0,     'Rumah',         'bca',   null,    'Sewa kos',            null),
    ( 3, 'transfer', 1000000, 0,     null,            'bca',   'tunai', 'Tarik tunai',         null),
    ( 5, 'keluar',    350000, 0,     'Tagihan',       'bca',   null,    'Listrik & internet',  null),
    ( 6, 'keluar',     85000, 5000,  'Makan & Minum', 'tunai', null,    'Makan siang',         null),
    ( 9, 'keluar',    450000, 40000, 'Belanja',       'bca',   null,    'Belanja bulanan',     null),
    (12, 'keluar',    120000, 0,     'Transportasi',  'tunai', null,    'Bensin',              null),
    (14, 'transfer',  200000, 0,     null,            'bca',   'gopay', 'Isi saldo GoPay',     null),
    (15, 'keluar',     65000, 0,     'Transportasi',  'gopay', null,    'Ojek online',         null),
    (18, 'keluar',    250000, 0,     'Hiburan',       'bca',   null,    'Nonton & makan',      2),
    (18, 'keluar',    275000, 0,     'Hiburan',       'bca',   null,    'Konser',              0),
    (20, 'keluar',     95000, 0,     'Makan & Minum', 'tunai', null,    'Kopi & camilan',      null),
    (22, 'keluar',    300000, 0,     'Kesehatan',     'bca',   null,    'Vitamin & obat',      1),
    (25, 'masuk',     750000, 0,     'Bonus',         'bca',   null,    'Bonus proyek',        1),
    (27, 'keluar',    180000, 10000, 'Makan & Minum', 'tunai', null,    'Makan keluarga',      null)
  ) as p(hari, tipe, nominal, naik, kategori, dari, ke, catatan, bulan_ke)
  where (p.bulan_ke is null or p.bulan_ke = m.m)
    and (date_trunc('month', current_date) - make_interval(months => m.m))::date + (p.hari - 1) <= current_date;

  update auth.users
     set encrypted_password = extensions.crypt('test123', extensions.gen_salt('bf')),
         raw_user_meta_data = jsonb_build_object('nama', 'Pengguna Demo')
   where id = v_uid;
end;
$$;

revoke execute on function public.reset_akun_demo() from public, anon, authenticated;

-- ============ 3. Jadwal harian ============
select cron.unschedule(jobid) from cron.job where jobname = 'reset-akun-demo';
select cron.schedule('reset-akun-demo', '0 17 * * *', 'select public.reset_akun_demo()');

-- Isi data contoh sekarang juga.
select public.reset_akun_demo();
