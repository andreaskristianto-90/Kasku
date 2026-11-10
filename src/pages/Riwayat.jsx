import { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import {
  bulanIni, filterTransaksi, kelompokkanPerTanggal, labelTanggal, ringkasan,
} from '../lib/keuangan.js'
import { usePencarian } from '../lib/pencarian.jsx'
import { buatHref } from '../lib/rute.js'
import Ikon from '../components/Ikon.jsx'
import ItemTransaksi from '../components/ItemTransaksi.jsx'
import { Header, Kosong, Nominal, PemilihBulan, Sheet } from '../components/Umum.jsx'

export default function Riwayat({ query }) {
  const { transaksi, kategori, dompet, kategoriById, dompetById } = useData()
  const { cari, setCari } = usePencarian()
  const [sheetFilter, setSheetFilter] = useState(false)
  const [f, setF] = useState({
    bulan: query.bulan || bulanIni(),
    tipe: query.tipe || '',
    kategoriId: query.kategori || '',
    dompetId: query.dompet || '',
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
        bulan: baru.bulan, tipe: baru.tipe, kategori: baru.kategoriId, dompet: baru.dompetId,
      })
      window.history.replaceState(null, '', url)
      return baru
    })
  }
  const hapusFilter = () => {
    set('tipe', '')
    set('kategoriId', '')
    set('dompetId', '')
    setCari('')
  }

  const hasil = filterTransaksi(transaksi, { ...f, cari }, { kategoriById, dompetById })
  const grup = kelompokkanPerTanggal(hasil)
  const r = ringkasan(hasil)
  const jumlahFilter = [f.tipe, f.kategoriId, f.dompetId].filter(Boolean).length
  const adaFilter = jumlahFilter > 0 || cari.trim() !== ''
  const pilihanKategori = kategori.filter((k) => !f.tipe || k.tipe === f.tipe)

  const kontrolFilter = (
    <>
      <label className="field">
        <span>Tipe</span>
        <select value={f.tipe} onChange={(e) => set('tipe', e.target.value)}>
          <option value="">Semua tipe</option>
          <option value="keluar">Pengeluaran</option>
          <option value="masuk">Pemasukan</option>
          <option value="transfer">Transfer</option>
        </select>
      </label>
      <label className="field">
        <span>Kategori</span>
        <select value={f.kategoriId} onChange={(e) => set('kategoriId', e.target.value)} disabled={f.tipe === 'transfer'}>
          <option value="">Semua kategori</option>
          {pilihanKategori.map((k) => (
            <option key={k.id} value={k.id}>{k.ikon} {k.nama}{!f.tipe ? ` (${k.tipe === 'masuk' ? 'masuk' : 'keluar'})` : ''}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Dompet</span>
        <select value={f.dompetId} onChange={(e) => set('dompetId', e.target.value)}>
          <option value="">Semua dompet</option>
          {dompet.map((d) => <option key={d.id} value={d.id}>{d.nama}{d.diarsipkan ? ' (arsip)' : ''}</option>)}
        </select>
      </label>
    </>
  )

  return (
    <main className="halaman">
      <Header
        judul="Transaksi"
        sub="Semua catatan pemasukan, pengeluaran, dan transfer"
        aksi={<PemilihBulan bulan={f.bulan} onChange={(b) => set('bulan', b)} />}
      />

      {/* Desktop/tablet: filter berjajar. HP: satu tombol Filter yang membuka panel. */}
      <div className="kartu filter">
        <div className="filter-baris">{kontrolFilter}</div>
        <button className="tombol tombol-filter" onClick={() => setSheetFilter(true)}>
          <Ikon nama="filter" ukuran={18} /> Filter
          {jumlahFilter > 0 && <span className="lencana">{jumlahFilter}</span>}
        </button>
        {cari.trim() && <span className="chip-cari">Hasil untuk “{cari.trim()}”</span>}
        {adaFilter && <button className="tautan" onClick={hapusFilter}>Hapus filter</button>}
      </div>

      {sheetFilter && (
        <Sheet judul="Filter transaksi" onTutup={() => setSheetFilter(false)}>
          <div className="form">
            {kontrolFilter}
            <div className="aksi-form">
              <button className="tombol utama penuh" onClick={() => setSheetFilter(false)}>
                Tampilkan {hasil.length} transaksi
              </button>
              {jumlahFilter > 0 && (
                <button className="tombol penuh" onClick={() => { set('tipe', ''); set('kategoriId', ''); set('dompetId', '') }}>
                  Reset filter
                </button>
              )}
            </div>
          </div>
        </Sheet>
      )}

      {hasil.length > 0 && (
        <div className="ringkasan-strip">
          <span>{hasil.length} transaksi</span>
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
