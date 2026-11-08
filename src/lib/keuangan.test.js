import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatRupiah, parseNominal, geserBulan, labelTanggal, hitungSaldo, saldoPerDompet,
  ringkasanBulan, totalPerKategori, filterTransaksi, kelompokkanPerTanggal,
  validasiTransaksi, keCSV,
} from './keuangan.js'

const tunai = { id: 'tunai', nama: 'Tunai', saldo_awal: 100_000 }
const bca = { id: 'bca', nama: 'BCA', saldo_awal: 1_000_000 }
const T = [
  { id: 1, tipe: 'masuk', nominal: 5_000_000, kategori_id: 'gaji', dompet_id: 'bca', tanggal: '2026-11-01' },
  { id: 2, tipe: 'keluar', nominal: 50_000, kategori_id: 'makan', dompet_id: 'tunai', tanggal: '2026-11-02', catatan: 'Bakso' },
  { id: 3, tipe: 'transfer', nominal: 500_000, dompet_id: 'bca', dompet_tujuan_id: 'tunai', tanggal: '2026-11-02' },
  { id: 4, tipe: 'keluar', nominal: 150_000, kategori_id: 'transport', dompet_id: 'bca', tanggal: '2026-11-03' },
  { id: 5, tipe: 'keluar', nominal: 30_000, kategori_id: 'makan', dompet_id: 'tunai', tanggal: '2026-10-30' },
]

test('formatRupiah', () => {
  assert.equal(formatRupiah(1250000), 'Rp 1.250.000')
  assert.equal(formatRupiah(0), 'Rp 0')
  assert.equal(formatRupiah(-5000), '−Rp 5.000')
  assert.equal(formatRupiah(5000, { tanda: true }), '+Rp 5.000')
})

test('parseNominal', () => {
  assert.equal(parseNominal('Rp 1.250.000'), 1250000)
  assert.equal(parseNominal(''), 0)
  assert.equal(parseNominal('abc'), 0)
})

test('geserBulan melewati tahun', () => {
  assert.equal(geserBulan('2026-12', 1), '2027-01')
  assert.equal(geserBulan('2026-01', -1), '2025-12')
})

test('labelTanggal', () => {
  const acuan = new Date(2026, 10, 8)
  assert.equal(labelTanggal('2026-11-08', acuan), 'Hari ini')
  assert.equal(labelTanggal('2026-11-07', acuan), 'Kemarin')
  assert.equal(labelTanggal('2026-11-02', acuan), 'Senin, 2 Nov')
  assert.equal(labelTanggal('2025-11-02', acuan), 'Minggu, 2 Nov 2025')
})

test('saldo menghitung transfer di kedua dompet', () => {
  assert.equal(hitungSaldo(tunai, T), 100_000 - 50_000 + 500_000 - 30_000)
  assert.equal(hitungSaldo(bca, T), 1_000_000 + 5_000_000 - 500_000 - 150_000)
  const m = saldoPerDompet([tunai, bca], T)
  assert.equal(m.get('tunai'), hitungSaldo(tunai, T))
  assert.equal(m.get('bca'), hitungSaldo(bca, T))
})

test('ringkasan bulan tidak menghitung transfer', () => {
  assert.deepEqual(ringkasanBulan(T, '2026-11'), { masuk: 5_000_000, keluar: 200_000, selisih: 4_800_000 })
})

test('totalPerKategori urut dan persen', () => {
  const hasil = totalPerKategori(T, '2026-11')
  assert.deepEqual(hasil.map((h) => h.kategoriId), ['transport', 'makan'])
  assert.equal(hasil[0].persen, 75)
})

test('filterTransaksi', () => {
  assert.equal(filterTransaksi(T, { bulan: '2026-11' }).length, 4)
  assert.equal(filterTransaksi(T, { dompetId: 'tunai' }).length, 3) // termasuk transfer masuk
  assert.equal(filterTransaksi(T, { cari: 'bakso' }).length, 1)
})

test('kelompokkanPerTanggal', () => {
  const g = kelompokkanPerTanggal(filterTransaksi(T, { bulan: '2026-11' }))
  assert.deepEqual(g.map((x) => x.tanggal), ['2026-11-03', '2026-11-02', '2026-11-01'])
  assert.equal(g[1].selisih, -50_000) // transfer diabaikan
})

test('validasiTransaksi', () => {
  const dasar = { tipe: 'keluar', nominal: 1000, kategori_id: 'k', dompet_id: 'd', tanggal: '2026-11-08' }
  assert.deepEqual(validasiTransaksi(dasar), {})
  assert.ok(validasiTransaksi({ ...dasar, nominal: 0 }).nominal)
  assert.ok(validasiTransaksi({ ...dasar, kategori_id: null }).kategori_id)
  const tf = { tipe: 'transfer', nominal: 1000, dompet_id: 'a', dompet_tujuan_id: 'a', tanggal: '2026-11-08' }
  assert.ok(validasiTransaksi(tf).dompet_tujuan_id)
  assert.deepEqual(validasiTransaksi({ ...tf, dompet_tujuan_id: 'b' }), {})
})

test('keCSV meng-escape koma dan kutip', () => {
  const csv = keCSV([{ ...T[1], catatan: 'Bakso, "enak"' }], {
    dompet: [tunai], kategori: [{ id: 'makan', nama: 'Makan' }],
  })
  assert.equal(csv.split('\n')[1], '2026-11-02,Pengeluaran,Makan,Tunai,,50000,"Bakso, ""enak"""')
})
