# Kasku — pencatat keuangan pribadi (fase 1)

Aplikasi web (mobile-first) untuk mencatat pemasukan, pengeluaran, dan transfer antar dompet.
Dibangun dengan React + Vite, Supabase (database + login), siap di-deploy ke Cloudflare Pages.

## Menjalankan

Butuh Node.js 20.19 atau lebih baru (`node -v`).

```bash
npm install
npm run dev
```

Buka alamat yang muncul (`http://localhost:5180`).

Tanpa konfigurasi Supabase, aplikasi berjalan dalam **Mode Demo**: login dengan email/password apa saja, dan data hanya tersimpan di browser itu (localStorage). Cocok untuk mencoba tampilan.

## Menyambungkan Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor → New query**, tempel isi [`supabase/schema.sql`](supabase/schema.sql), lalu **Run**. Ini membuat tabel `dompet`, `kategori`, `transaksi` beserta Row Level Security (setiap user hanya bisa melihat datanya sendiri).
3. Buka **Project Settings → API**, salin *Project URL* dan *anon public key*.
4. Salin `.env.example` menjadi `.env.local`, lalu isi:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Di **Authentication → URL Configuration**, isi *Site URL* dengan alamat aplikasi (mis. `http://localhost:5180` saat pengembangan, lalu alamat Cloudflare Pages saat produksi). Link konfirmasi email dan reset password akan kembali ke alamat ini.
6. Jalankan ulang `npm run dev`.

Secara bawaan Supabase mewajibkan konfirmasi email saat daftar. Untuk mencoba lebih cepat, matikan di **Authentication → Providers → Email → Confirm email**.

## Mengaktifkan login Google

Tombol **Lanjutkan dengan Google** di halaman Masuk otomatis muncul setelah provider Google aktif di Supabase. Langkahnya:

**A. Google Cloud Console — buat OAuth client**
1. Buka https://console.cloud.google.com → pilih/buat project (mis. `Kasku`).
2. Menu **Google Auth Platform** (atau *APIs & Services → OAuth consent screen*) → **Get started**:
   - App name: `Kasku`, User support email: email kamu
   - Audience: **External**
   - Contact information: email kamu → setujui kebijakan → **Create**
3. **Audience** → bagian *Test users* → **Add users** → masukkan email Google yang akan dipakai mencoba. Selama status aplikasi *Testing*, hanya akun di daftar ini yang bisa masuk. Untuk dibuka ke semua orang, tekan **Publish app** (scope yang dipakai hanya email & profil dasar).
4. **Clients** → **Create client**:
   - Application type: **Web application**, Name: `Kasku Web`
   - Authorized JavaScript origins: `https://kasku-app.pages.dev` dan `http://localhost:5180`
   - Authorized redirect URIs: `https://fqpayovldqxjllxehvua.supabase.co/auth/v1/callback`
   - **Create** → salin **Client ID** dan **Client secret** (jangan dibagikan; secret hanya ditempel di Supabase).

**B. Supabase — aktifkan provider Google**
1. Buka https://supabase.com/dashboard/project/fqpayovldqxjllxehvua/auth/providers
2. Klik **Google** → aktifkan **Enable Sign in with Google**.
3. Tempel **Client ID** dan **Client Secret** dari langkah A.4 → **Save**.
4. Pastikan *Authentication → URL Configuration* berisi Site URL `https://kasku-app.pages.dev` dan Redirect URLs `https://kasku-app.pages.dev/**` serta `http://localhost:5180/**` (sudah diatur).

**C. Coba**
Buka https://kasku-app.pages.dev (muat ulang) → tombol Google muncul → pilih akun → kembali ke Kasku dan langsung masuk. Akun Google dengan email yang sama dengan akun email yang sudah ada akan digabung otomatis oleh Supabase.

Tidak perlu mengubah kode atau Cloudflare: aplikasi membaca status provider langsung dari Supabase.

## Email selamat datang (Resend)

Saat akun **terkonfirmasi** (daftar email → klik link konfirmasi; daftar Google → langsung), user menerima email "Selamat datang di Kasku" lewat [Resend](https://resend.com).

Cara kerjanya:
1. Trigger `on_auth_user_terkonfirmasi` di tabel `auth.users` ([supabase/email-selamat-datang.sql](supabase/email-selamat-datang.sql)) memanggil Edge Function secara asinkron lewat `pg_net`. Pendaftaran tidak pernah gagal karena email.
2. Edge Function [`kirim-email-selamat-datang`](supabase/functions/kirim-email-selamat-datang/index.ts) memeriksa user (harus ada, terkonfirmasi, dibuat ≤ 7 hari, belum pernah dikirimi), mengirim lewat Resend, lalu menandai `app_metadata.email_selamat_datang_terkirim` agar tidak terkirim dua kali.
3. API key Resend hanya ada di server (Edge Function Secrets), tidak pernah di kode browser.

Pengaturan (Supabase → Edge Functions → **Secrets**):

| Secret | Wajib | Isi |
|---|---|---|
| `RESEND_API_KEY` | Ya | API key dari resend.com |
| `EMAIL_FROM` | Tidak | Pengirim, mis. `Kasku <halo@domainmu.com>`. Bawaan: `Kasku <onboarding@resend.dev>` |
| `APP_URL` | Tidak | Link tombol di email. Bawaan: `https://kasku-app.pages.dev` |

Catatan Resend: pengirim bawaan `onboarding@resend.dev` hanya bisa mengirim ke email pemilik akun Resend. Agar email sampai ke semua user, verifikasi domain sendiri di Resend (Domains → Add domain, tambahkan record DNS), lalu isi `EMAIL_FROM` dengan alamat di domain itu.

Memeriksa pengiriman: Supabase → Edge Functions → `kirim-email-selamat-datang` → **Logs**, atau dashboard Resend → **Emails**.

## Deploy ke Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Fitur fase 1

| Halaman | Fungsi |
|---|---|
| Masuk / Daftar | Daftar, masuk, lupa password (link reset via email), login Google (jika diaktifkan) |
| Onboarding | Buat dompet pertama + saldo awal; kategori bawaan dibuat otomatis |
| Beranda | Kartu statistik (saldo, pemasukan, pengeluaran, arus kas bersih + % vs bulan lalu), grafik arus kas 6 bulan, dompet, transaksi terakhir |
| Catat / Ubah transaksi | Pengeluaran, Pemasukan, Transfer; Simpan & catat lagi; Duplikat; Hapus |
| Transaksi | Per bulan, dikelompokkan per tanggal; filter tipe/kategori/dompet; cari catatan (juga dari kolom cari di atas) |
| Laporan | Kartu statistik + rasio tabungan, grafik Arus Kas 6 bulan (pemasukan/pengeluaran/keduanya), donat pengeluaran per kategori, pengeluaran terbesar, Insight & Tren otomatis |
| Dompet | Tambah, ubah, arsipkan; hapus hanya jika belum ada transaksi |
| Kategori | Tambah, ubah nama/ikon, sembunyikan; hapus hanya jika belum dipakai |
| Lainnya (HP) | Kartu profil, menu Dompet/Kategori/Pengaturan, tombol Keluar |
| Pengaturan | Ubah nama, ganti atau buat password, ekspor CSV, keluar |

Aturan penting:
- Transfer memindahkan saldo antar dompet dan **tidak** dihitung sebagai pemasukan/pengeluaran.
- Saldo dompet = saldo awal + pemasukan − pengeluaran ± transfer.
- Semua nominal dalam Rupiah, bilangan bulat.

## Struktur

| Lokasi | Isi |
|---|---|
| `src/lib/keuangan.js` | Fungsi inti: format Rupiah, saldo, ringkasan, laporan per kategori, filter, validasi, CSV |
| `src/lib/insight.js` | Insight otomatis berbasis aturan (tabungan, kenaikan/penurunan kategori, proyeksi) |
| `src/lib/*.test.js` | Tes untuk fungsi inti (`npm test`) |
| `src/lib/api.js` | Lapisan data: Supabase, atau localStorage di Mode Demo |
| `src/lib/DataContext.jsx` | State data aplikasi + aksi simpan/hapus |
| `src/lib/rute.js` | Router sederhana berbasis hash (`#/riwayat`) |
| `src/pages/` | Satu file per halaman |
| `src/components/` | Komponen bersama: `Kerangka` (sidebar, topbar, nav HP), grafik, kartu statistik, input nominal, sheet, toast |
| `supabase/schema.sql` | Skema database + Row Level Security |

## Fase 2 (belum dikerjakan)

Anggaran per kategori, transaksi berulang, tren beberapa bulan.
