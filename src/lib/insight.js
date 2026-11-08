// Pengamatan otomatis berbasis aturan (bukan AI) untuk halaman Laporan.
import {
  formatRupiah, geserBulan, hariIni, labelBulan, ringkasanBulan, totalPerKategori,
} from './keuangan.js'

const AMBANG_NAIK = 50_000 // perubahan kategori di bawah ini dianggap tidak penting

// → [{ jenis: 'positif' | 'perhatian' | 'info', label, judul, teks }]
export function buatInsight(transaksi, bulan, kategoriById, acuan = new Date()) {
  const hasil = []
  const r = ringkasanBulan(transaksi, bulan)
  const lalu = geserBulan(bulan, -1)
  const rLalu = ringkasanBulan(transaksi, lalu)
  const namaKat = (id) => {
    const k = kategoriById.get(id)
    return k ? `${k.ikon} ${k.nama}` : 'Tanpa kategori'
  }

  if (r.masuk === 0 && r.keluar === 0) return hasil

  // 1. Rasio menabung
  if (r.masuk > 0) {
    const rasio = Math.round((r.selisih / r.masuk) * 100)
    if (rasio >= 20) {
      hasil.push({ jenis: 'positif', label: 'Tabungan', judul: `Kamu menyisihkan ${rasio}% pemasukan`, teks: `Sisa ${formatRupiah(r.selisih)} dari pemasukan ${labelBulan(bulan)}. Target umum adalah 20%.` })
    } else if (rasio >= 0) {
      hasil.push({ jenis: 'info', label: 'Tabungan', judul: `Tabungan ${rasio}% dari pemasukan`, teks: `Masih di bawah target umum 20%. Coba cek kategori pengeluaran terbesar.` })
    } else {
      hasil.push({ jenis: 'perhatian', label: 'Arus kas', judul: 'Pengeluaran melebihi pemasukan', teks: `Defisit ${formatRupiah(-r.selisih)} di ${labelBulan(bulan)}.` })
    }
  }

  // 2. Kategori naik/turun paling besar dibanding bulan lalu
  const kini = new Map(totalPerKategori(transaksi, bulan).map((b) => [b.kategoriId, b.total]))
  const sebelum = new Map(totalPerKategori(transaksi, lalu).map((b) => [b.kategoriId, b.total]))
  if (sebelum.size > 0) {
    const ids = new Set([...kini.keys(), ...sebelum.keys()])
    const selisih = [...ids]
      .map((id) => ({ id, beda: (kini.get(id) || 0) - (sebelum.get(id) || 0), lalu: sebelum.get(id) || 0 }))
      .sort((a, b) => b.beda - a.beda)
    const naik = selisih[0]
    if (naik && naik.beda >= AMBANG_NAIK) {
      const persen = naik.lalu ? ` (+${Math.round((naik.beda / naik.lalu) * 100)}%)` : ''
      hasil.push({ jenis: 'perhatian', label: 'Pengeluaran', judul: `${namaKat(naik.id)} naik ${formatRupiah(naik.beda)}${persen}`, teks: `Dibanding ${labelBulan(lalu)}. Kategori dengan kenaikan terbesar bulan ini.` })
    }
    const turun = selisih[selisih.length - 1]
    if (turun && -turun.beda >= AMBANG_NAIK) {
      hasil.push({ jenis: 'positif', label: 'Hemat', judul: `${namaKat(turun.id)} turun ${formatRupiah(-turun.beda)}`, teks: `Lebih hemat dibanding ${labelBulan(lalu)}.` })
    }
  }

  // 3. Proyeksi akhir bulan (hanya untuk bulan berjalan)
  const kiniStr = hariIni(acuan)
  if (kiniStr.startsWith(bulan) && r.keluar > 0) {
    const hari = acuan.getDate()
    const jumlahHari = new Date(acuan.getFullYear(), acuan.getMonth() + 1, 0).getDate()
    if (hari < jumlahHari) {
      const proyeksi = Math.round((r.keluar / hari) * jumlahHari)
      const banding = rLalu.keluar
        ? ` ${proyeksi > rLalu.keluar ? 'Lebih tinggi' : 'Lebih rendah'} dari total ${labelBulan(lalu)} (${formatRupiah(rLalu.keluar)}).`
        : ''
      hasil.push({ jenis: 'info', label: 'Proyeksi', judul: `Perkiraan pengeluaran ${formatRupiah(proyeksi)}`, teks: `Rata-rata ${formatRupiah(Math.round(r.keluar / hari))} per hari sampai tanggal ${hari}.${banding}` })
    }
  }

  return hasil
}
