import { useState } from 'react'
import * as api from '../lib/api.js'
import { useData } from '../lib/DataContext.jsx'
import { hariIni, keCSV } from '../lib/keuangan.js'
import { buatHref } from '../lib/rute.js'
import { useToast } from '../components/Toast.jsx'
import { Header } from '../components/Umum.jsx'
import Ikon from '../components/Ikon.jsx'

async function konfirmasiKeluar(toast) {
  if (!window.confirm('Keluar dari akun?')) return
  try {
    await api.keluar()
  } catch (err) {
    toast(err.message, 'error')
  }
}

function labelMetode(user) {
  if (api.modeDemo) return 'Mode Demo'
  const nama = { email: 'Email & password', google: 'Google' }
  return user.metode.map((m) => nama[m] || m).join(' + ') || 'Email'
}

export function Lainnya({ user }) {
  const { dompet, kategori } = useData()
  const toast = useToast()
  return (
    <main className="halaman">
      <Header judul="Lainnya" />
      <a className="kartu kartu-profil" href={buatHref('/pengaturan')}>
        <span className="avatar besar" aria-hidden="true">{(user.nama || user.email || '?').slice(0, 1).toUpperCase()}</span>
        <span className="item-teks">
          <span className="item-judul">{user.nama || 'Pengguna'}</span>
          <span className="item-sub">{user.email}</span>
          <span className="item-sub">Masuk dengan {labelMetode(user)}</span>
        </span>
        <Ikon nama="kanan" className="panah" />
      </a>
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
          <span className="item-teks"><span className="item-judul">Pengaturan</span><span className="item-sub">Profil, password, ekspor data</span></span>
          <Ikon nama="kanan" className="panah" />
        </a>
      </nav>
      <button className="tombol bahaya penuh tombol-keluar" onClick={() => konfirmasiKeluar(toast)}>
        <Ikon nama="keluar" ukuran={18} /> Keluar dari akun
      </button>
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


  return (
    <main className="halaman">
      <Header judul="Pengaturan" sub="Profil, data, dan akun" tombolKembali="hp" />

      {api.modeDemo && (
        <div className="banner-demo">
          <strong>Mode Demo.</strong> Data hanya tersimpan di perangkat ini. Jika data browser dihapus atau kamu berganti perangkat, catatanmu tidak ikut terbawa.
        </div>
      )}

      <div className="grid-dua">
        <form className="kartu form" onSubmit={simpanNama}>
          <h2>Profil</h2>
          <label className="field">
            <span>Nama tampilan</span>
            <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={40} />
          </label>
          <p className="teks-kecil teks-redup">Email: {user.email} · Masuk dengan {labelMetode(user)}</p>
          <button className="tombol" disabled={proses || nama.trim() === (user.nama || '')}>Simpan nama</button>
        </form>

        <section className="kartu form">
          <h2>Data</h2>
          <p className="teks-kecil teks-redup">Unduh semua transaksi ({data.transaksi.length}) sebagai file CSV yang bisa dibuka di Excel atau Google Sheets.</p>
          <button className="tombol" onClick={ekspor} disabled={data.transaksi.length === 0}>
            <Ikon nama="unduh" ukuran={18} /> Ekspor CSV
          </button>
        </section>
      </div>

      <KartuPassword user={user} onUserBerubah={onUserBerubah} />

      <section className="kartu baris-akun">
        <div>
          <h2>Akun</h2>
          <p className="teks-kecil teks-redup">Keluar dari Kasku di perangkat ini.</p>
        </div>
        <button className="tombol bahaya" onClick={() => konfirmasiKeluar(toast)}><Ikon nama="keluar" ukuran={18} /> Keluar</button>
      </section>
    </main>
  )
}

// Ganti password (akun email) atau buat password (akun yang daftar lewat Google).
function KartuPassword({ user, onUserBerubah }) {
  const toast = useToast()
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [lihat, setLihat] = useState(false)
  const [error, setError] = useState('')
  const [proses, setProses] = useState(false)
  const buat = !user.punyaPassword

  async function simpan(e) {
    e.preventDefault()
    setError('')
    if (!buat && !lama) return setError('Isi password saat ini.')
    if (baru.length < 8) return setError('Password baru minimal 8 karakter.')
    if (baru !== ulang) return setError('Ulangi password baru dengan sama persis.')
    if (!buat && baru === lama) return setError('Password baru harus berbeda dari password lama.')
    setProses(true)
    try {
      onUserBerubah(await api.aturPassword({ user, passwordLama: lama, passwordBaru: baru }))
      setLama('')
      setBaru('')
      setUlang('')
      toast(buat ? 'Password dibuat' : 'Password diganti')
    } catch (err) {
      setError(err.message)
    } finally {
      setProses(false)
    }
  }

  const tipe = lihat ? 'text' : 'password'
  return (
    <form className="kartu form form-password" onSubmit={simpan}>
      <div>
        <h2>{buat ? 'Buat password' : 'Ganti password'}</h2>
        <p className="teks-kecil teks-redup">
          {api.modeDemo
            ? 'Tidak tersedia di Mode Demo.'
            : buat
              ? 'Akunmu masuk lewat Google. Buat password agar bisa juga masuk dengan email dan password.'
              : 'Minimal 8 karakter. Gunakan kombinasi huruf dan angka yang tidak kamu pakai di tempat lain.'}
        </p>
      </div>
      {/* Bantu pengelola password mengenali akun yang sedang diubah. */}
      <input type="email" autoComplete="username" value={user.email} readOnly hidden />
      {!buat && (
        <label className="field">
          <span>Password saat ini</span>
          <input type={tipe} value={lama} onChange={(e) => setLama(e.target.value)} autoComplete="current-password" disabled={api.modeDemo} />
        </label>
      )}
      <div className="baris-dua">
        <label className="field">
          <span>Password baru</span>
          <input type={tipe} value={baru} onChange={(e) => setBaru(e.target.value)} autoComplete="new-password" minLength={8} disabled={api.modeDemo} />
        </label>
        <label className="field">
          <span>Ulangi password baru</span>
          <input type={tipe} value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" disabled={api.modeDemo} />
        </label>
      </div>
      <label className="centang">
        <input type="checkbox" checked={lihat} onChange={(e) => setLihat(e.target.checked)} disabled={api.modeDemo} />
        Tampilkan password
      </label>
      {error && <p className="teks-error" role="alert">{error}</p>}
      <div>
        <button className="tombol utama" disabled={proses || api.modeDemo}>
          {proses ? 'Menyimpan…' : buat ? 'Buat password' : 'Simpan password'}
        </button>
      </div>
    </form>
  )
}
