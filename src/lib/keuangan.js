// Fungsi inti perhitungan keuangan. Murni (tanpa React/Supabase) agar mudah dites.

// ---------- Format angka ----------
const formatIDR = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function formatRupiah(angka, { tanda = false } = {}) {
  const n = Math.round(Number(angka) || 0)
  const teks = 'Rp ' + formatIDR.format(Math.abs(n))
  if (n < 0) return '−' + teks
  if (tanda && n > 0) return '+' + teks
  return teks
}

// "1.250.000" / "Rp 1.250.000" / "1250000" → 1250000. Selain angka diabaikan.
export function parseNominal(teks) {
  const digit = String(teks ?? '').replace(/\D/g, '')
  return digit ? Number(digit) : 0
}

// Untuk tampilan input saat mengetik: 1250000 → "1.250.000"
export function formatInputNominal(angka) {
  return angka ? formatIDR.format(angka) : ''
}

// ---------- Tanggal ----------
const pad = (n) => String(n).padStart(2, '0')

export function hariIni(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function bulanIni(d = new Date()) {
  return hariIni(d).slice(0, 7)
}

// "2026-11" + 1 → "2026-12"
export function geserBulan(bulan, n) {
  const [y, m] = bulan.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember']
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function labelBulan(bulan) {
  const [y, m] = bulan.split('-').map(Number)
  return `${NAMA_BULAN[m - 1]} ${y}`
}

export function labelTanggal(tanggal, acuan = new Date()) {
  const kini = hariIni(acuan)
  const kemarin = new Date(acuan)
  kemarin.setDate(kemarin.getDate() - 1)
  if (tanggal === kini) return 'Hari ini'
  if (tanggal === hariIni(kemarin)) return 'Kemarin'
  const [y, m, d] = tanggal.split('-').map(Number)
  const hari = NAMA_HARI[new Date(y, m - 1, d).getDay()]
  const tahun = y === acuan.getFullYear() ? '' : ` ${y}`
  return `${hari}, ${d} ${NAMA_BULAN[m - 1].slice(0, 3)}${tahun}`
}

// ---------- Saldo ----------
// Efek satu transaksi terhadap saldo dompet tertentu.
export function efekKeDompet(t, dompetId) {
  if (t.tipe === 'masuk' && t.dompet_id === dompetId) return t.nominal
  if (t.tipe === 'keluar' && t.dompet_id === dompetId) return -t.nominal
  if (t.tipe === 'transfer') {
    if (t.dompet_id === dompetId) return -t.nominal
    if (t.dompet_tujuan_id === dompetId) return t.nominal
  }
  return 0
}

export function hitungSaldo(dompet, transaksi) {
  return transaksi.reduce((s, t) => s + efekKeDompet(t, dompet.id), Number(dompet.saldo_awal) || 0)
}

// → Map dompetId → saldo
export function saldoPerDompet(daftarDompet, transaksi) {
  const saldo = new Map(daftarDompet.map((d) => [d.id, Number(d.saldo_awal) || 0]))
  for (const t of transaksi) {
    if (t.tipe === 'masuk' && saldo.has(t.dompet_id)) {
      saldo.set(t.dompet_id, saldo.get(t.dompet_id) + t.nominal)
    } else if (t.tipe === 'keluar' && saldo.has(t.dompet_id)) {
      saldo.set(t.dompet_id, saldo.get(t.dompet_id) - t.nominal)
    } else if (t.tipe === 'transfer') {
      if (saldo.has(t.dompet_id)) saldo.set(t.dompet_id, saldo.get(t.dompet_id) - t.nominal)
      if (saldo.has(t.dompet_tujuan_id)) saldo.set(t.dompet_tujuan_id, saldo.get(t.dompet_tujuan_id) + t.nominal)
    }
  }
  return saldo
}

// ---------- Ringkasan & laporan (transfer tidak dihitung) ----------
export function transaksiBulan(transaksi, bulan) {
  return transaksi.filter((t) => t.tanggal.startsWith(bulan))
}

export function ringkasan(transaksi) {
  let masuk = 0
  let keluar = 0
  for (const t of transaksi) {
    if (t.tipe === 'masuk') masuk += t.nominal
    else if (t.tipe === 'keluar') keluar += t.nominal
  }
  return { masuk, keluar, selisih: masuk - keluar }
}

export function ringkasanBulan(transaksi, bulan) {
  return ringkasan(transaksiBulan(transaksi, bulan))
}

// → [{ kategoriId, total, persen }] urut terbesar dulu. tipe: 'keluar' | 'masuk'
export function totalPerKategori(transaksi, bulan, tipe = 'keluar') {
  const total = new Map()
  let semua = 0
  for (const t of transaksiBulan(transaksi, bulan)) {
    if (t.tipe !== tipe) continue
    total.set(t.kategori_id, (total.get(t.kategori_id) || 0) + t.nominal)
    semua += t.nominal
  }
  return [...total]
    .map(([kategoriId, nilai]) => ({
      kategoriId,
      total: nilai,
      persen: semua ? (nilai / semua) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

// ---------- Riwayat ----------
// filter: { bulan, tipe, kategoriId, dompetId, cari }
export function filterTransaksi(transaksi, f = {}) {
  const cari = f.cari?.trim().toLowerCase()
  return transaksi.filter((t) => {
    if (f.bulan && !t.tanggal.startsWith(f.bulan)) return false
    if (f.tipe && t.tipe !== f.tipe) return false
    if (f.kategoriId && t.kategori_id !== f.kategoriId) return false
    if (f.dompetId && t.dompet_id !== f.dompetId && t.dompet_tujuan_id !== f.dompetId) return false
    if (cari && !(t.catatan || '').toLowerCase().includes(cari)) return false
    return true
  })
}

// → [{ tanggal, transaksi: [...], selisih }] urut tanggal terbaru dulu.
// Selisih harian tidak menghitung transfer.
export function kelompokkanPerTanggal(transaksi) {
  const grup = new Map()
  for (const t of transaksi) {
    if (!grup.has(t.tanggal)) grup.set(t.tanggal, [])
    grup.get(t.tanggal).push(t)
  }
  return [...grup]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([tanggal, isi]) => ({ tanggal, transaksi: isi, selisih: ringkasan(isi).selisih }))
}

// ---------- Validasi ----------
export const NOMINAL_MAKS = 1_000_000_000_000 // 1 triliun

// → objek error per field; kosong berarti valid.
export function validasiTransaksi(t) {
  const e = {}
  if (!['masuk', 'keluar', 'transfer'].includes(t.tipe)) e.tipe = 'Tipe transaksi tidak dikenal.'
  if (!Number.isInteger(t.nominal) || t.nominal <= 0) e.nominal = 'Nominal harus lebih dari 0.'
  else if (t.nominal > NOMINAL_MAKS) e.nominal = 'Nominal terlalu besar.'
  if (!t.dompet_id) e.dompet_id = 'Pilih dompet.'
  if (t.tipe === 'transfer') {
    if (!t.dompet_tujuan_id) e.dompet_tujuan_id = 'Pilih dompet tujuan.'
    else if (t.dompet_tujuan_id === t.dompet_id) e.dompet_tujuan_id = 'Dompet tujuan harus berbeda.'
  } else if (!t.kategori_id) {
    e.kategori_id = 'Pilih kategori.'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.tanggal || '')) e.tanggal = 'Tanggal tidak valid.'
  if ((t.catatan || '').length > 200) e.catatan = 'Catatan maksimal 200 karakter.'
  return e
}

// ---------- Ekspor ----------
function selCSV(nilai) {
  const s = String(nilai ?? '')
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function keCSV(transaksi, { dompet, kategori }) {
  const namaDompet = new Map(dompet.map((d) => [d.id, d.nama]))
  const namaKategori = new Map(kategori.map((k) => [k.id, k.nama]))
  const TIPE = { masuk: 'Pemasukan', keluar: 'Pengeluaran', transfer: 'Transfer' }
  const baris = [['Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Dompet Tujuan', 'Nominal', 'Catatan']]
  for (const t of transaksi) {
    baris.push([
      t.tanggal,
      TIPE[t.tipe],
      namaKategori.get(t.kategori_id) || '',
      namaDompet.get(t.dompet_id) || '',
      namaDompet.get(t.dompet_tujuan_id) || '',
      t.nominal,
      t.catatan || '',
    ])
  }
  return baris.map((b) => b.map(selCSV).join(',')).join('\n')
}

// ---------- Dashboard & laporan lanjutan ----------
export function labelBulanPendek(bulan) {
  const [, m] = bulan.split('-').map(Number)
  return NAMA_BULAN[m - 1].slice(0, 3)
}

// Rp 1.250.000 → "1,3 jt"; 850.000 → "850 rb"
export function formatRingkas(angka) {
  const n = Math.abs(angka)
  const tanda = angka < 0 ? '−' : ''
  const f = (x) => x.toLocaleString('id-ID', { maximumFractionDigits: 1 })
  if (n >= 1e9) return `${tanda}${f(n / 1e9)} M`
  if (n >= 1e6) return `${tanda}${f(n / 1e6)} jt`
  if (n >= 1e3) return `${tanda}${f(n / 1e3)} rb`
  return `${tanda}${n}`
}

// Persentase perubahan; null jika pembanding 0 (tidak bisa dihitung).
export function persenPerubahan(kini, lalu) {
  if (!lalu) return null
  return ((kini - lalu) / Math.abs(lalu)) * 100
}

// n bulan berakhir di `bulanAkhir` → [{ bulan, masuk, keluar, selisih }] urut lama → baru.
export function arusKasBulanan(transaksi, bulanAkhir, n = 6) {
  const daftar = Array.from({ length: n }, (_, i) => geserBulan(bulanAkhir, i - n + 1))
  const peta = new Map(daftar.map((b) => [b, { bulan: b, masuk: 0, keluar: 0 }]))
  for (const t of transaksi) {
    const p = peta.get(t.tanggal.slice(0, 7))
    if (!p) continue
    if (t.tipe === 'masuk') p.masuk += t.nominal
    else if (t.tipe === 'keluar') p.keluar += t.nominal
  }
  return daftar.map((b) => {
    const p = peta.get(b)
    return { ...p, selisih: p.masuk - p.keluar }
  })
}

// Transaksi terbesar pada bulan tertentu.
export function transaksiTerbesar(transaksi, bulan, tipe = 'keluar', n = 5) {
  return transaksiBulan(transaksi, bulan)
    .filter((t) => t.tipe === tipe)
    .sort((a, b) => b.nominal - a.nominal)
    .slice(0, n)
}

// Gabungkan kategori setelah urutan ke-(maks-1) menjadi "Lainnya".
export function ringkasKategori(baris, maks = 5) {
  if (baris.length <= maks) return baris
  const atas = baris.slice(0, maks - 1)
  const sisa = baris.slice(maks - 1)
  return [
    ...atas,
    {
      kategoriId: null,
      lainnya: sisa.length,
      total: sisa.reduce((s, b) => s + b.total, 0),
      persen: sisa.reduce((s, b) => s + b.persen, 0),
    },
  ]
}
