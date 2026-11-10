// Satu kata kunci pencarian untuk seluruh aplikasi: diisi dari kotak cari di topbar,
// dibaca oleh halaman Transaksi untuk menyaring daftar secara langsung.
import { createContext, useContext, useState } from 'react'

const PencarianContext = createContext({ cari: '', setCari: () => {} })

export function PencarianProvider({ awal = '', children }) {
  const [cari, setCari] = useState(awal)
  return <PencarianContext.Provider value={{ cari, setCari }}>{children}</PencarianContext.Provider>
}

export const usePencarian = () => useContext(PencarianContext)
