import { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import {
  bulanIni, filterTransaksi, kelompokkanPerTanggal, labelTanggal, ringkasan,
} from '../lib/keuangan.js'
import { buatHref } from '../lib/rute.js'
import ItemTransaksi from '../components/ItemTransaksi.jsx'
import { Header, Kosong, Nominal, PemilihBulan } from '../components/Umum.jsx'

export default function Riwayat({ query }) {
  const { transaksi, kategori, dompet } = useData()
  const [f, setF] = useState({
    bulan: query.bulan || bulanIni(),
    tipe: query.tipe || '',
    kategoriId: query.kategori || '',
    dompetId: query.dompet || '',
    cari: query.cari || '',
  })
  const set = (k, v) => {
    setF((x) => {
      const baru = { ...x, [k]: v }
      // Kategori harus sesuai tipe yang dipilih.
      if (k === 'tipe' && baru.kategoriId) {
        const kat = kategori.find((c) => c.id === baru.kategoriId)
        if (v === 'transfer' || (v && kat?.tipe !== v)) baru.kategoriId = ''
      }
      // Sinkronkan ke URL tanpa menambah riwayat browser.
      const url = buatHref('/riwayat', {
        bulan: baru.bulan, tipe: baru.tipe, kategori: baru.kategoriId, dompet: baru.dompetId, cari: baru.cari,
      })
      window.history.replaceState(null, '', url)
      return baru
    })
  }

  const hasil = filterTransaksi(transaksi, f)
  const grup = kelompokkanPerTanggal(hasil)
  const r = ringkasan(hasil)
  const adaFilter = f.tipe || f.kategoriId || f.dompetId || f.cari
  const pilihanKategori = kategori.filter((k) => !f.tipe || k.tipe === f.tipe)

  return (
    <main className="halaman sedang">
      <Header
        judul="Transaksi"
        sub="Semua catatan pemasukan, pengeluaran, dan transfer"
        aksi={<PemilihBulan bulan={f.bulan} onChange={(b) => set('bulan', b)} />}
      />

      <div className="kartu filter">
        <input
          type="search"
          placeholder="Cari catatan…"
          value={f.cari}
          onChange={(e) => set('cari', e.target.value)}
          aria-label="Cari catatan"
        />
        <div className="filter-baris">
          <select value={f.tipe} onChange={(e) => set('tipe', e.target.value)} aria-label="Filter tipe">
            <option value="">Semua tipe</option>
            <option value="keluar">Pengeluaran</option>
            <option value="masuk">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            value={f.kategoriId}
            onChange={(e) => set('kategoriId', e.target.value)}
            aria-label="Filter kategori"
            disabled={f.tipe === 'transfer'}
          >
            <option value="">Semua kategori</option>
            {pilihanKategori.map((k) => (
              <option key={k.id} value={k.id}>{k.ikon} {k.nama}{!f.tipe ? ` (${k.tipe === 'masuk' ? 'masuk' : 'keluar'})` : ''}</option>
            ))}
          </select>
          <select value={f.dompetId} onChange={(e) => set('dompetId', e.target.value)} aria-label="Filter dompet">
            <option value="">Semua dompet</option>
            {dompet.map((d) => <option key={d.id} value={d.id}>{d.nama}{d.diarsipkan ? ' (arsip)' : ''}</option>)}
          </select>
        </div>
        {adaFilter && (
          <button
            className="tautan"
            onClick={() => {
              set('tipe', '')
              set('kategoriId', '')
              set('dompetId', '')
              set('cari', '')
            }}
          >
            Hapus filter
          </button>
        )}
      </div>

      {hasil.length > 0 && (
        <div className="ringkasan-strip">
          <span>Masuk <Nominal nilai={r.masuk} tipe="masuk" /></span>
          <span>Keluar <Nominal nilai={r.keluar} tipe="keluar" /></span>
        </div>
      )}

      {grup.length === 0 ? (
        <Kosong ikon="🗂️" judul={adaFilter ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi di bulan ini'} />
      ) : (
        grup.map((g) => (
          <section key={g.tanggal} className="grup-tanggal">
            <div className="grup-kepala">
              <h2>{labelTanggal(g.tanggal)}</h2>
              <Nominal nilai={g.selisih} tanda className="teks-redup" />
            </div>
            <div className="kartu daftar">
              {g.transaksi.map((t) => <ItemTransaksi key={t.id} t={t} />)}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
