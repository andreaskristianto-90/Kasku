import { test } from 'node:test'
import assert from 'node:assert/strict'
import { arusKasBulanan, formatRingkas, persenPerubahan, ringkasKategori, transaksiTerbesar } from './keuangan.js'
import { buatInsight } from './insight.js'

const T = [
  { tipe: 'masuk', nominal: 10_000_000, kategori_id: 'gaji', dompet_id: 'a', tanggal: '2026-10-01' },
  { tipe: 'keluar', nominal: 500_000, kategori_id: 'makan', dompet_id: 'a', tanggal: '2026-10-05' },
  { tipe: 'keluar', nominal: 1_000_000, kategori_id: 'hiburan', dompet_id: 'a', tanggal: '2026-10-06' },
  { tipe: 'masuk', nominal: 10_000_000, kategori_id: 'gaji', dompet_id: 'a', tanggal: '2026-11-01' },
  { tipe: 'keluar', nominal: 1_500_000, kategori_id: 'makan', dompet_id: 'a', tanggal: '2026-11-03' },
  { tipe: 'transfer', nominal: 9_000_000, dompet_id: 'a', dompet_tujuan_id: 'b', tanggal: '2026-11-04' },
]
const kat = new Map([['gaji', { nama: 'Gaji', ikon: '💼' }], ['makan', { nama: 'Makan', ikon: '🍜' }], ['hiburan', { nama: 'Hiburan', ikon: '🎬' }]])

test('arusKasBulanan mengisi bulan kosong dan melewati tahun', () => {
  const a = arusKasBulanan(T, '2027-01', 4)
  assert.deepEqual(a.map((x) => x.bulan), ['2026-10', '2026-11', '2026-12', '2027-01'])
  assert.deepEqual(a[1], { bulan: '2026-11', masuk: 10_000_000, keluar: 1_500_000, selisih: 8_500_000 })
  assert.equal(a[2].masuk, 0)
})

test('persenPerubahan', () => {
  assert.equal(persenPerubahan(150, 100), 50)
  assert.equal(persenPerubahan(50, 100), -50)
  assert.equal(persenPerubahan(5, 0), null)
})

test('formatRingkas', () => {
  assert.equal(formatRingkas(1_250_000), '1,3 jt')
  assert.equal(formatRingkas(850_000), '850 rb')
  assert.equal(formatRingkas(0), '0')
})

test('transaksiTerbesar & ringkasKategori', () => {
  assert.equal(transaksiTerbesar(T, '2026-10')[0].nominal, 1_000_000)
  const baris = [5, 4, 3, 2, 1, 1].map((total, i) => ({ kategoriId: 'k' + i, total, persen: total * 10 }))
  const r = ringkasKategori(baris, 5)
  assert.equal(r.length, 5)
  assert.deepEqual(r[4], { kategoriId: null, lainnya: 2, total: 2, persen: 20 })
})

test('buatInsight: tabungan, kenaikan, penurunan, proyeksi', () => {
  const hasil = buatInsight(T, '2026-11', kat, new Date(2026, 10, 10))
  const judul = hasil.map((h) => h.judul)
  assert.match(judul[0], /85% pemasukan/)
  assert.ok(judul.some((j) => /Makan naik Rp 1\.000\.000 \(\+200%\)/.test(j)))
  assert.ok(judul.some((j) => /Hiburan turun Rp 1\.000\.000/.test(j)))
  assert.ok(judul.some((j) => /Perkiraan pengeluaran Rp 4\.500\.000/.test(j)))
})

test('buatInsight kosong jika tidak ada transaksi', () => {
  assert.deepEqual(buatInsight(T, '2025-01', kat), [])
})
