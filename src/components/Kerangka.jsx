// Tata letak aplikasi: sidebar (desktop), topbar dengan pencarian, navigasi bawah (HP).
import { useState } from 'react'
import * as api from '../lib/api.js'
import { buatHref, pergi } from '../lib/rute.js'
import Ikon from './Ikon.jsx'

const MENU_UTAMA = [
  { path: '/', label: 'Beranda', ikon: 'beranda' },
  { path: '/riwayat', label: 'Transaksi', ikon: 'transaksi' },
  { path: '/laporan', label: 'Laporan', ikon: 'laporan' },
  { path: '/dompet', label: 'Dompet', ikon: 'dompet' },
]
const MENU_KELOLA = [
  { path: '/kategori', label: 'Kategori', ikon: 'kategori' },
  { path: '/pengaturan', label: 'Pengaturan', ikon: 'pengaturan' },
]

function Logo() {
  return (
    <a href={buatHref('/')} className="logo">
      <span className="logo-tanda" aria-hidden="true">Rp</span>
      <span className="logo-nama">Kasku</span>
    </a>
  )
}

function ItemMenu({ m, path }) {
  const aktif = path === m.path
  return (
    <a href={buatHref(m.path)} className={`menu-item ${aktif ? 'aktif' : ''}`} aria-current={aktif ? 'page' : undefined}>
      <Ikon nama={m.ikon} />
      <span>{m.label}</span>
    </a>
  )
}

function Sidebar({ path, user }) {
  async function keluar() {
    if (window.confirm('Keluar dari akun?')) await api.keluar()
  }
  return (
    <aside className="sidebar">
      <Logo />
      <a className="tombol utama penuh" href={buatHref('/transaksi/baru')}>
        <Ikon nama="tambah" /> Catat transaksi
      </a>
      <nav aria-label="Menu utama">
        <p className="menu-judul">Menu utama</p>
        {MENU_UTAMA.map((m) => <ItemMenu key={m.path} m={m} path={path} />)}
        <p className="menu-judul">Kelola</p>
        {MENU_KELOLA.map((m) => <ItemMenu key={m.path} m={m} path={path} />)}
      </nav>
      <div className="sidebar-bawah">
        {api.modeDemo && (
          <div className="kartu-demo">
            <strong>Mode Demo</strong>
            <span>Data hanya tersimpan di browser ini. Sambungkan Supabase agar aman.</span>
          </div>
        )}
        <div className="profil">
          <span className="avatar" aria-hidden="true">{(user.nama || user.email || '?').slice(0, 1).toUpperCase()}</span>
          <span className="profil-teks">
            <span className="profil-nama">{user.nama || 'Pengguna'}</span>
            <span className="profil-email">{user.email}</span>
          </span>
          <button className="tombol-ikon" onClick={keluar} aria-label="Keluar" title="Keluar">
            <Ikon nama="keluar" ukuran={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function Topbar() {
  const [cari, setCari] = useState('')
  return (
    <div className="topbar">
      <div className="topbar-logo"><Logo /></div>
      <form
        className="kolom-cari"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          pergi('/riwayat', { cari: cari.trim() })
          setCari('')
        }}
      >
        <Ikon nama="cari" ukuran={18} />
        <input type="search" placeholder="Cari transaksi…" value={cari} onChange={(e) => setCari(e.target.value)} aria-label="Cari transaksi" />
      </form>
    </div>
  )
}

const NAV_HP = [
  { path: '/', label: 'Beranda', ikon: 'beranda' },
  { path: '/riwayat', label: 'Transaksi', ikon: 'transaksi' },
  null,
  { path: '/laporan', label: 'Laporan', ikon: 'laporan' },
  { path: '/lainnya', label: 'Lainnya', ikon: 'lainnya', juga: ['/dompet', '/kategori', '/pengaturan'] },
]

function NavBawah({ path }) {
  return (
    <nav className="nav-bawah" aria-label="Navigasi utama">
      {NAV_HP.map((m) =>
        m === null ? (
          <a key="catat" className="nav-catat" href={buatHref('/transaksi/baru')} aria-label="Catat transaksi">
            <Ikon nama="tambah" ukuran={26} tebal={2.4} />
          </a>
        ) : (
          <a
            key={m.path}
            href={buatHref(m.path)}
            className={`nav-item ${path === m.path || m.juga?.includes(path) ? 'aktif' : ''}`}
            aria-current={path === m.path ? 'page' : undefined}
          >
            <Ikon nama={m.ikon} ukuran={22} />
            <span>{m.label}</span>
          </a>
        ),
      )}
    </nav>
  )
}

export default function Kerangka({ path, user, navHp = true, children }) {
  return (
    <div className={`app ${navHp ? 'dengan-nav' : ''}`}>
      <Sidebar path={path} user={user} />
      <div className="konten">
        <Topbar />
        {api.modeDemo && <div className="pita-demo">Mode Demo · data hanya di browser ini</div>}
        {children}
      </div>
      {navHp && <NavBawah path={path} />}
    </div>
  )
}
