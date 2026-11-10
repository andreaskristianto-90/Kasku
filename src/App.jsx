import { useEffect, useState } from 'react'
import * as api from './lib/api.js'
import { DataProvider, useData } from './lib/DataContext.jsx'
import { useRute } from './lib/rute.js'
import { ToastProvider } from './components/Toast.jsx'
import Kerangka from './components/Kerangka.jsx'
import { Kosong } from './components/Umum.jsx'
import Masuk, { GantiPassword } from './pages/Masuk.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Beranda from './pages/Beranda.jsx'
import FormTransaksi from './pages/FormTransaksi.jsx'
import Riwayat from './pages/Riwayat.jsx'
import Laporan from './pages/Laporan.jsx'
import Dompet from './pages/Dompet.jsx'
import Kategori from './pages/Kategori.jsx'
import { Lainnya, Pengaturan } from './pages/Lainnya.jsx'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = sedang memeriksa sesi
  const [pemulihan, setPemulihan] = useState(false)

  useEffect(() => {
    api.ambilUser().then(setUser)
    return api.dengarkanAuth((event, u) => {
      if (event === 'PASSWORD_RECOVERY') setPemulihan(true)
      setUser(u)
    })
  }, [])

  let isi
  if (user === undefined) isi = <div className="layar-tengah"><div className="pemuat" aria-label="Memuat" /></div>
  else if (pemulihan) isi = <GantiPassword onSelesai={() => setPemulihan(false)} />
  else if (!user) isi = <Masuk />
  else {
    isi = (
      // key: muat ulang data saat berganti akun
      <DataProvider key={user.id}>
        <Aplikasi user={user} onUserBerubah={setUser} />
      </DataProvider>
    )
  }
  return <ToastProvider>{isi}</ToastProvider>
}

function Aplikasi({ user, onUserBerubah }) {
  const { dompet } = useData()
  const { path, query } = useRute()

  if (dompet.length === 0) return <Onboarding nama={user.nama} />

  const cocokTransaksi = path.match(/^\/transaksi\/([^/]+)$/)
  let halaman
  let nav = true
  if (cocokTransaksi) {
    const id = cocokTransaksi[1]
    halaman = <FormTransaksi id={id === 'baru' ? undefined : id} query={query} />
    nav = false
  } else {
    switch (path) {
      case '/': halaman = <Beranda user={user} />; break
      case '/riwayat': halaman = <Riwayat key={JSON.stringify(query)} query={query} />; break
      case '/laporan': halaman = <Laporan query={query} />; break
      case '/lainnya': halaman = <Lainnya user={user} />; break
      case '/dompet': halaman = <Dompet />; break
      case '/kategori': halaman = <Kategori />; break
      case '/pengaturan': halaman = <Pengaturan user={user} onUserBerubah={onUserBerubah} />; break
      default:
        halaman = (
          <main className="halaman">
            <Kosong ikon="🧭" judul="Halaman tidak ditemukan"><a className="tombol" href="#/">Ke Beranda</a></Kosong>
          </main>
        )
    }
  }

  return (
    <Kerangka path={path} user={user} navHp={nav}>
      {halaman}
    </Kerangka>
  )
}
