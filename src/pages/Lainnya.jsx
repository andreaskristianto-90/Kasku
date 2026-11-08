import { useState } from 'react'
import * as api from '../lib/api.js'
import { useData } from '../lib/DataContext.jsx'
import { hariIni, keCSV } from '../lib/keuangan.js'
import { buatHref } from '../lib/rute.js'
import { useToast } from '../components/Toast.jsx'
import { Header } from '../components/Umum.jsx'
import Ikon from '../components/Ikon.jsx'

export function Lainnya() {
  const { dompet, kategori } = useData()
  return (
    <main className="halaman sedang">
      <Header judul="Lainnya" />
      <nav className="kartu daftar">
        <a className="item-transaksi" href={buatHref('/dompet')}>
          <span className="item-ikon" aria-hidden="true"><Ikon nama="dompet" /></span>
          <span className="item-teks"><span className="item-judul">Dompet</span><span className="item-sub">{dompet.length} dompet</span></span>
          <Ikon nama="kanan" className="panah" />
        </a>
        <a className="item-transaksi" href={buatHref('/kategori')}>
          <span className="item-ikon" aria-hidden="true"><Ikon nama="kategori" /></span>
          <span className="item-teks"><span className="item-judul">Kategori</span><span className="item-sub">{kategori.length} kategori</span></span>
          <Ikon nama="kanan" className="panah" />
        </a>
        <a className="item-transaksi" href={buatHref('/pengaturan')}>
          <span className="item-ikon" aria-hidden="true"><Ikon nama="pengaturan" /></span>
          <span className="item-teks"><span className="item-judul">Pengaturan</span><span className="item-sub">Profil, ekspor data, keluar</span></span>
          <Ikon nama="kanan" className="panah" />
        </a>
      </nav>
    </main>
  )
}

export function Pengaturan({ user, onUserBerubah }) {
  const data = useData()
  const toast = useToast()
  const [nama, setNama] = useState(user.nama || '')
  const [proses, setProses] = useState(false)

  async function simpanNama(e) {
    e.preventDefault()
    setProses(true)
    try {
      onUserBerubah(await api.ubahNama(nama.trim()))
      toast('Nama disimpan')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setProses(false)
    }
  }

  function ekspor() {
    const csv = keCSV(data.transaksi, data)
    // BOM agar Excel membaca UTF-8 (emoji & huruf khusus) dengan benar.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kasku-transaksi-${hariIni()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function keluar() {
    if (!window.confirm('Keluar dari akun?')) return
    try {
      await api.keluar()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <main className="halaman sedang">
      <Header judul="Pengaturan" sub="Profil, data, dan akun" tombolKembali="hp" />

      <form className="kartu form" onSubmit={simpanNama}>
        <h2>Profil</h2>
        <label className="field">
          <span>Nama tampilan</span>
          <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={40} />
        </label>
        <p className="teks-kecil teks-redup">Email: {user.email}</p>
        <button className="tombol" disabled={proses || nama.trim() === (user.nama || '')}>Simpan nama</button>
      </form>

      <section className="kartu form">
        <h2>Data</h2>
        <p className="teks-kecil teks-redup">Unduh semua transaksi ({data.transaksi.length}) sebagai file CSV yang bisa dibuka di Excel atau Google Sheets.</p>
        <button className="tombol" onClick={ekspor} disabled={data.transaksi.length === 0}>Ekspor CSV</button>
      </section>

      {api.modeDemo && (
        <div className="banner-demo">
          <strong>Mode Demo.</strong> Data tersimpan di browser ini saja. Sambungkan Supabase (lihat README) agar data aman dan bisa dibuka dari perangkat lain.
        </div>
      )}

      <button className="tombol bahaya penuh" onClick={keluar}>Keluar</button>
    </main>
  )
}
