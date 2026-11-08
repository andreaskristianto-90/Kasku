import { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { PILIHAN_IKON } from '../lib/kategoriBawaan.js'
import { useToast } from '../components/Toast.jsx'
import { Header, Sheet } from '../components/Umum.jsx'

export default function Kategori() {
  const { kategori, transaksi } = useData()
  const [tipe, setTipe] = useState('keluar')
  const [edit, setEdit] = useState(null)
  const jumlahPakai = new Map()
  transaksi.forEach((t) => t.kategori_id && jumlahPakai.set(t.kategori_id, (jumlahPakai.get(t.kategori_id) || 0) + 1))

  const daftar = kategori.filter((k) => k.tipe === tipe)
  const aktif = daftar.filter((k) => !k.disembunyikan)
  const sembunyi = daftar.filter((k) => k.disembunyikan)

  const Baris = ({ k }) => (
    <button className="item-transaksi" onClick={() => setEdit(k)}>
      <span className="item-ikon" aria-hidden="true">{k.ikon}</span>
      <span className="item-teks">
        <span className="item-judul">{k.nama}</span>
        <span className="item-sub">{jumlahPakai.get(k.id) || 0} transaksi</span>
      </span>
    </button>
  )

  return (
    <main className="halaman sedang">
      <Header
        judul="Kategori"
        sub="Atur kategori pemasukan dan pengeluaran"
        tombolKembali="hp"
        aksi={<button className="tombol kecil utama" onClick={() => setEdit({ tipe })}>+ Tambah</button>}
      />
      <div className="segmen" role="tablist">
        <button role="tab" aria-selected={tipe === 'keluar'} className={`segmen-item segmen-keluar ${tipe === 'keluar' ? 'aktif' : ''}`} onClick={() => setTipe('keluar')}>Pengeluaran</button>
        <button role="tab" aria-selected={tipe === 'masuk'} className={`segmen-item segmen-masuk ${tipe === 'masuk' ? 'aktif' : ''}`} onClick={() => setTipe('masuk')}>Pemasukan</button>
      </div>
      <div className="kartu daftar">{aktif.map((k) => <Baris key={k.id} k={k} />)}</div>
      {sembunyi.length > 0 && (
        <>
          <h2 className="judul-kecil">Disembunyikan</h2>
          <div className="kartu daftar redup">{sembunyi.map((k) => <Baris key={k.id} k={k} />)}</div>
        </>
      )}
      {edit && <FormKategori kategori={edit} dipakai={(jumlahPakai.get(edit.id) || 0) > 0} onTutup={() => setEdit(null)} />}
    </main>
  )
}

function FormKategori({ kategori: k, dipakai, onTutup }) {
  const { kategori, simpanKategori, hapusKategori } = useData()
  const toast = useToast()
  const baru = !k.id
  const [nama, setNama] = useState(k.nama || '')
  const [ikon, setIkon] = useState(k.ikon || '🏷️')
  const [proses, setProses] = useState(false)
  const [error, setError] = useState('')

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
    const n = nama.trim()
    if (!n) return setError('Beri nama kategori.')
    const kembar = kategori.some((x) => x.id !== k.id && x.tipe === k.tipe && x.nama.toLowerCase() === n.toLowerCase())
    if (kembar) return setError('Nama kategori ini sudah ada.')
    jalankan(
      () => simpanKategori({ ...k, nama: n, ikon, disembunyikan: k.disembunyikan ?? false }),
      baru ? 'Kategori ditambahkan' : 'Kategori disimpan',
    )
  }

  return (
    <Sheet judul={baru ? `Kategori ${k.tipe === 'masuk' ? 'pemasukan' : 'pengeluaran'} baru` : 'Ubah kategori'} onTutup={onTutup}>
      <form className="form" onSubmit={simpan}>
        <label className="field">
          <span>Nama</span>
          <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={30} autoFocus={baru} />
        </label>
        <fieldset className="field">
          <legend>Ikon</legend>
          <div className="grid-ikon">
            {PILIHAN_IKON.map((i) => (
              <button key={i} type="button" className={`chip-ikon ${ikon === i ? 'aktif' : ''}`} aria-pressed={ikon === i} onClick={() => setIkon(i)}>
                {i}
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p className="teks-error" role="alert">{error}</p>}
        <div className="aksi-form">
          <button className="tombol utama penuh" disabled={proses}>Simpan</button>
          {!baru && (
            <button
              type="button"
              className="tombol penuh"
              disabled={proses}
              onClick={() =>
                jalankan(
                  () => simpanKategori({ ...k, disembunyikan: !k.disembunyikan }),
                  k.disembunyikan ? 'Kategori ditampilkan lagi' : 'Kategori disembunyikan',
                )
              }
            >
              {k.disembunyikan ? 'Tampilkan lagi' : 'Sembunyikan'}
            </button>
          )}
          {!baru && !dipakai && (
            <button
              type="button"
              className="tombol bahaya penuh"
              disabled={proses}
              onClick={() => window.confirm(`Hapus kategori "${k.nama}"?`) && jalankan(() => hapusKategori(k.id), 'Kategori dihapus')}
            >
              Hapus kategori
            </button>
          )}
          {dipakai && <p className="teks-kecil teks-redup">Kategori yang sudah dipakai tidak bisa dihapus. Sembunyikan agar tidak muncul saat mencatat; transaksi lamanya tetap aman.</p>}
        </div>
      </form>
    </Sheet>
  )
}
