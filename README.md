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

## Deploy ke Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Fitur fase 1

| Halaman | Fungsi |
|---|---|
| Masuk / Daftar | Daftar, masuk, lupa password (link reset via email) |
| Onboarding | Buat dompet pertama + saldo awal; kategori bawaan dibuat otomatis |
| Beranda | Kartu statistik (saldo, pemasukan, pengeluaran, arus kas bersih + % vs bulan lalu), grafik arus kas 6 bulan, dompet, transaksi terakhir |
| Catat / Ubah transaksi | Pengeluaran, Pemasukan, Transfer; Simpan & catat lagi; Duplikat; Hapus |
| Transaksi | Per bulan, dikelompokkan per tanggal; filter tipe/kategori/dompet; cari catatan (juga dari kolom cari di atas) |
| Laporan | Kartu statistik + rasio tabungan, grafik Arus Kas 6 bulan (pemasukan/pengeluaran/keduanya), donat pengeluaran per kategori, pengeluaran terbesar, Insight & Tren otomatis |
| Dompet | Tambah, ubah, arsipkan; hapus hanya jika belum ada transaksi |
| Kategori | Tambah, ubah nama/ikon, sembunyikan; hapus hanya jika belum dipakai |
| Pengaturan | Ubah nama, ekspor CSV, keluar |

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
