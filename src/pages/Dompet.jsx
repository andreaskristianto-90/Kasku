import { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { Header, InputNominal, Nominal, Sheet } from '../components/Umum.jsx'
import Ikon from '../components/Ikon.jsx'

export default function Dompet() {
  const { dompet, saldo, totalSaldo } = useData()
  const [edit, setEdit] = useState(null) // null | {} (baru) | dompet
  const aktif = dompet.filter((d) => !d.diarsipkan)
  const arsip = dompet.filter((d) => d.diarsipkan)

  const Baris = ({ d }) => (
    <button className="item-transaksi" onClick={() => setEdit(d)}>
      <span className="item-ikon" aria-hidden="true"><Ikon nama="dompet" /></span>
      <span className="item-teks"><span className="item-judul">{d.nama}</span></span>
      <Nominal nilai={saldo.get(d.id)} className="item-nominal" />
    </button>
  )

  return (
    <main className="halaman">
      <Header
        judul="Dompet"
        sub="Saldo setiap rekening, e-wallet, dan uang tunai"
        tombolKembali="hp"
        aksi={<button className="tombol kecil utama" onClick={() => setEdit({})}>+ Tambah</button>}
      />
      <div className="kartu baris-total">
        <span className="label">Total saldo dompet aktif</span>
        <Nominal nilai={totalSaldo} className="angka-besar" />
      </div>
      <div className="kartu daftar">{aktif.map((d) => <Baris key={d.id} d={d} />)}</div>
      {arsip.length > 0 && (
        <>
          <h2 className="judul-kecil">Diarsipkan</h2>
          <div className="kartu daftar redup">{arsip.map((d) => <Baris key={d.id} d={d} />)}</div>
        </>
      )}
      {edit && <FormDompet dompet={edit} onTutup={() => setEdit(null)} />}
    </main>
  )
}

function FormDompet({ dompet: d, onTutup }) {
  const { transaksi, dompetAktif, simpanDompet, hapusDompet } = useData()
  const toast = useToast()
  const baru = !d.id
  const [nama, setNama] = useState(d.nama || '')
  const [saldoAwal, setSaldoAwal] = useState(d.saldo_awal || 0)
  const [proses, setProses] = useState(false)
  const [error, setError] = useState('')
  const dipakai = !baru && transaksi.some((t) => t.dompet_id === d.id || t.dompet_tujuan_id === d.id)
  const satuSatunya = !baru && !d.diarsipkan && dompetAktif.length === 1

  async function jalankan(fn, pesan) {
    setProses(true)
    try {
      await fn()
      toast(pesan)
      onTutup()
    } catch (err) {
      setError(err.message)
      setProses(false)
    }
  }

  function simpan(e) {
    e.preventDefault()
    if (!nama.trim()) return setError('Beri nama dompet.')
    jalankan(
      () => simpanDompet({ ...d, nama: nama.trim(), saldo_awal: saldoAwal, diarsipkan: d.diarsipkan ?? false }),
      baru ? 'Dompet ditambahkan' : 'Dompet disimpan',
    )
  }

  return (
    <Sheet judul={baru ? 'Tambah dompet' : 'Ubah dompet'} onTutup={onTutup}>
      <form className="form" onSubmit={simpan}>
        <label className="field">
          <span>Nama</span>
          <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={40} placeholder="mis. BCA, GoPay, Tunai" autoFocus={baru} />
        </label>
        <div className="field">
          <label htmlFor="saldo-awal-dompet">Saldo awal</label>
          <InputNominal id="saldo-awal-dompet" nilai={saldoAwal} onChange={setSaldoAwal} bolehNegatif />
          <p className="teks-kecil teks-redup">
            {baru
              ? 'Saldo dompet ini sekarang, sebelum ada transaksi yang dicatat.'
              : 'Saldo sebelum transaksi pertama. Mengubahnya akan menggeser saldo saat ini.'}
          </p>
        </div>
        {error && <p className="teks-error" role="alert">{error}</p>}
        <div className="aksi-form">
          <button className="tombol utama penuh" disabled={proses}>Simpan</button>
          {!baru && (
            <button
              type="button"
              className="tombol penuh"
              disabled={proses || satuSatunya}
              title={satuSatunya ? 'Minimal harus ada satu dompet aktif' : undefined}
              onClick={() =>
                jalankan(
                  () => simpanDompet({ ...d, diarsipkan: !d.diarsipkan }),
                  d.diarsipkan ? 'Dompet diaktifkan lagi' : 'Dompet diarsipkan',
                )
              }
            >
              {d.diarsipkan ? 'Aktifkan lagi' : 'Arsipkan'}
            </button>
          )}
          {!baru && !dipakai && !satuSatunya && (
            <button
              type="button"
              className="tombol bahaya penuh"
              disabled={proses}
              onClick={() => window.confirm(`Hapus dompet "${d.nama}"?`) && jalankan(() => hapusDompet(d.id), 'Dompet dihapus')}
            >
              Hapus dompet
            </button>
          )}
          {dipakai && <p className="teks-kecil teks-redup">Dompet yang sudah punya transaksi tidak bisa dihapus, tapi bisa diarsipkan. Saldo dompet arsip tidak dihitung di total.</p>}
          {satuSatunya && <p className="teks-kecil teks-redup">Ini satu-satunya dompet aktif, jadi tidak bisa diarsipkan.</p>}
        </div>
      </form>
    </Sheet>
  )
}
