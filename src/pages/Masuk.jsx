import { useEffect, useState } from 'react'
import * as api from '../lib/api.js'
import PratinjauApp from '../components/PratinjauApp.jsx'

// mode: 'masuk' | 'daftar' | 'lupa'
export default function Masuk() {
  const [mode, setMode] = useState('masuk')
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [proses, setProses] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [googleAktif, setGoogleAktif] = useState(false)
  const [prosesGoogle, setProsesGoogle] = useState(false)

  useEffect(() => {
    let aktif = true
    api.loginGoogleAktif().then((v) => aktif && setGoogleAktif(v))
    return () => { aktif = false }
  }, [])

  function gantiMode(m) {
    setMode(m)
    setError('')
    setInfo('')
  }

  async function kirim(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (mode === 'daftar' && !api.modeDemo && password.length < 8) {
      setError('Password minimal 8 karakter.')
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

  async function lewatGoogle() {
    setError('')
    setProsesGoogle(true)
    try {
      await api.masukGoogle() // browser pindah ke halaman Google
    } catch (err) {
      setError(err.message)
      setProsesGoogle(false)
    }
  }

  const JUDUL = { masuk: 'Masuk', daftar: 'Buat akun', lupa: 'Lupa password' }
  const TOMBOL = { masuk: 'Masuk', daftar: 'Daftar', lupa: 'Kirim link reset' }

  return (
    <main className="halaman-auth auth-dua">
      <div className="auth-kolom">
      <div className="merek">
        <div className="merek-logo" aria-hidden="true">Rp</div>
        <div>
          <div className="merek-nama">Kasku</div>
          <div className="merek-slogan">Catat uang masuk & keluar, tanpa ribet.</div>
        </div>
      </div>
      <p className="auth-manfaat">
        Catat setiap pengeluaran dalam hitungan detik, lihat saldo semua dompetmu di satu tempat,
        dan ketahui ke mana uangmu pergi setiap bulan.
      </p>

      {api.modeDemo && (
        <div className="banner-demo">
          <strong>Mode Demo.</strong> Data hanya tersimpan di perangkat ini. Masuk dengan email dan password apa saja untuk mencoba.
        </div>
      )}

      <form className="kartu form" onSubmit={kirim}>
        <h1>{JUDUL[mode]}</h1>
        {googleAktif && mode !== 'lupa' && (
          <>
            <button type="button" className="tombol penuh tombol-google" onClick={lewatGoogle} disabled={prosesGoogle}>
              <LogoGoogle />
              {prosesGoogle ? 'Membuka Google…' : 'Lanjutkan dengan Google'}
            </button>
            <div className="pemisah" role="separator"><span>atau dengan email</span></div>
          </>
        )}
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
      </div>
      <PratinjauApp />
    </main>
  )
}

export function GantiPassword({ onSelesai }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [proses, setProses] = useState(false)

  async function kirim(e) {
    e.preventDefault()
    if (password.length < 8) return setError('Password minimal 8 karakter.')
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

// Logo "G" resmi Google (warna standar), dipakai di tombol masuk.
function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
