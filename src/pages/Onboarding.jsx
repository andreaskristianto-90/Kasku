import { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { InputNominal } from '../components/Umum.jsx'

export default function Onboarding({ nama }) {
  const { siapkanAkunBaru } = useData()
  const [namaDompet, setNamaDompet] = useState('Tunai')
  const [saldoAwal, setSaldoAwal] = useState(0)
  const [proses, setProses] = useState(false)
  const [error, setError] = useState('')

  async function kirim(e) {
    e.preventDefault()
    if (!namaDompet.trim()) return setError('Beri nama dompet.')
    setProses(true)
    try {
      await siapkanAkunBaru({ namaDompet: namaDompet.trim(), saldoAwal })
    } catch (err) {
      setError(err.message)
      setProses(false)
    }
  }

  return (
    <main className="halaman-auth">
      <form className="kartu form" onSubmit={kirim}>
        <h1>Halo{nama ? `, ${nama}` : ''} 👋</h1>
        <p className="teks-redup">
          Mulai dengan satu dompet, misalnya uang tunai di saku atau rekening bank utama. Dompet lain bisa ditambah nanti.
        </p>
        <label className="field">
          <span>Nama dompet</span>
          <input value={namaDompet} onChange={(e) => setNamaDompet(e.target.value)} maxLength={40} />
        </label>
        <div className="field">
          <label htmlFor="saldo-awal">Saldo saat ini</label>
          <InputNominal id="saldo-awal" nilai={saldoAwal} onChange={setSaldoAwal} />
        </div>
        {error && <p className="teks-error" role="alert">{error}</p>}
        <button className="tombol utama penuh" disabled={proses}>{proses ? 'Menyiapkan…' : 'Mulai mencatat'}</button>
        <p className="teks-kecil teks-redup">Kategori bawaan (Makan, Transportasi, Gaji, dll.) akan dibuat otomatis.</p>
      </form>
    </main>
  )
}
