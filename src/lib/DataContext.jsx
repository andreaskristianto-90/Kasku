import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from './api.js'
import { saldoPerDompet } from './keuangan.js'

const DataContext = createContext(null)

const urutTransaksi = (a, b) =>
  b.tanggal.localeCompare(a.tanggal) || b.dibuat_pada.localeCompare(a.dibuat_pada)

function ganti(daftar, baris) {
  const ada = daftar.some((x) => x.id === baris.id)
  return ada ? daftar.map((x) => (x.id === baris.id ? baris : x)) : [...daftar, baris]
}

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const muat = useCallback(async () => {
    setError('')
    try {
      setData(await api.ambilSemuaData())
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  const aksi = useMemo(() => ({
    muat,
    async siapkanAkunBaru(input) {
      await api.siapkanAkunBaru(input)
      await muat()
    },
    async simpanTransaksi(t) {
      const hasil = await api.simpanTransaksi(t)
      setData((d) => ({ ...d, transaksi: ganti(d.transaksi, hasil).sort(urutTransaksi) }))
      return hasil
    },
    async hapusTransaksi(id) {
      await api.hapusTransaksi(id)
      setData((d) => ({ ...d, transaksi: d.transaksi.filter((t) => t.id !== id) }))
    },
    async simpanDompet(x) {
      const hasil = await api.simpanDompet(x)
      setData((d) => ({ ...d, dompet: ganti(d.dompet, hasil) }))
      return hasil
    },
    async hapusDompet(id) {
      await api.hapusDompet(id)
      setData((d) => ({ ...d, dompet: d.dompet.filter((x) => x.id !== id) }))
    },
    async simpanKategori(x) {
      const hasil = await api.simpanKategori(x)
      setData((d) => ({ ...d, kategori: ganti(d.kategori, hasil) }))
      return hasil
    },
    async hapusKategori(id) {
      await api.hapusKategori(id)
      setData((d) => ({ ...d, kategori: d.kategori.filter((x) => x.id !== id) }))
    },
  }), [muat])

  const nilai = useMemo(() => {
    if (!data) return null
    const saldo = saldoPerDompet(data.dompet, data.transaksi)
    const dompetAktif = data.dompet.filter((d) => !d.diarsipkan)
    return {
      ...data,
      saldo,
      dompetAktif,
      totalSaldo: dompetAktif.reduce((s, d) => s + saldo.get(d.id), 0),
      dompetById: new Map(data.dompet.map((d) => [d.id, d])),
      kategoriById: new Map(data.kategori.map((k) => [k.id, k])),
      ...aksi,
    }
  }, [data, aksi])

  if (error) {
    return (
      <div className="layar-tengah">
        <p className="teks-error">Gagal memuat data: {error}</p>
        <button className="tombol" onClick={muat}>Coba lagi</button>
      </div>
    )
  }
  if (!nilai) return <div className="layar-tengah"><div className="pemuat" aria-label="Memuat" /></div>

  return <DataContext.Provider value={nilai}>{children}</DataContext.Provider>
}

export function useData() {
  return useContext(DataContext)
}
