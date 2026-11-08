import { useState } from 'react'
import * as api from '../lib/api.js'

// mode: 'masuk' | 'daftar' | 'lupa'
export default function Masuk() {
  const [mode, setMode] = useState('masuk')
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [proses, setProses] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  function gantiMode(m) {
    setMode(m)
    setError('')
    setInfo('')
  }

  async function kirim(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (mode !== 'lupa' && !api.modeDemo && password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    setProses(true)
    try {
      if (mode === 'masuk') {
        await api.masuk({ email, password })
      } else if (mode === 'daftar') {
        const { perluKonfirmasi } = await api.daftar({ nama: nama.trim(), email, password })
        if (perluKonfirmasi) {
          setInfo(`Kami mengirim link konfirmasi ke ${email}. Klik link itu, lalu masuk.`)
          setMode('masuk')
        }
      } else {
        await api.kirimResetPassword(email)
        setInfo(`Jika ${email} terdaftar, link untuk membuat password baru sudah dikirim.`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setProses(false)
    }
  }

  const JUDUL = { masuk: 'Masuk', daftar: 'Buat akun', lupa: 'Lupa password' }
  const TOMBOL = { masuk: 'Masuk', daftar: 'Daftar', lupa: 'Kirim link reset' }

  return (
    <main className="halaman-auth">
      <div className="merek">
        <div className="merek-logo" aria-hidden="true">Rp</div>
        <div>
          <div className="merek-nama">Kasku</div>
          <div className="merek-slogan">Catat uang masuk & keluar, tanpa ribet.</div>
        </div>
      </div>

      {api.modeDemo && (
        <div className="banner-demo">
          <strong>Mode Demo.</strong> Supabase belum disambungkan, jadi data hanya tersimpan di browser ini.
          Isi email & password apa saja untuk mencoba.
        </div>
      )}

      <form className="kartu form" onSubmit={kirim}>
        <h1>{JUDUL[mode]}</h1>
        {mode === 'daftar' && (
          <label className="field">
            <span>Nama</span>
            <input value={nama} onChange={(e) => setNama(e.target.value)} required maxLength={40} autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        {mode !== 'lupa' && (
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'}
            />
          </label>
        )}
        {error && <p className="teks-error" role="alert">{error}</p>}
        {info && <p className="teks-info">{info}</p>}
        <button className="tombol utama penuh" disabled={proses}>{proses ? 'Memproses…' : TOMBOL[mode]}</button>

        <div className="auth-tautan">
          {mode === 'masuk' && (
            <>
              <button type="button" className="tautan" onClick={() => gantiMode('lupa')}>Lupa password?</button>
              <span>Belum punya akun? <button type="button" className="tautan" onClick={() => gantiMode('daftar')}>Daftar</button></span>
            </>
          )}
          {mode !== 'masuk' && (
            <button type="button" className="tautan" onClick={() => gantiMode('masuk')}>← Kembali ke Masuk</button>
          )}
        </div>
      </form>
    </main>
  )
}

export function GantiPassword({ onSelesai }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [proses, setProses] = useState(false)

  async function kirim(e) {
    e.preventDefault()
    if (password.length < 6) return setError('Password minimal 6 karakter.')
    setProses(true)
    try {
      await api.gantiPassword(password)
      onSelesai()
    } catch (err) {
      setError(err.message)
      setProses(false)
    }
  }

  return (
    <main className="halaman-auth">
      <form className="kartu form" onSubmit={kirim}>
        <h1>Buat password baru</h1>
        <label className="field">
          <span>Password baru</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required autoFocus />
        </label>
        {error && <p className="teks-error" role="alert">{error}</p>}
        <button className="tombol utama penuh" disabled={proses}>{proses ? 'Menyimpan…' : 'Simpan password'}</button>
      </form>
    </main>
  )
}
