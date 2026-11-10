import { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { hariIni, validasiTransaksi } from '../lib/keuangan.js'
import { kembali, pergi } from '../lib/rute.js'
import { useToast } from '../components/Toast.jsx'
import { Header, InputNominal, Kosong } from '../components/Umum.jsx'

const TIPE = [
  { id: 'keluar', label: 'Pengeluaran' },
  { id: 'masuk', label: 'Pemasukan' },
  { id: 'transfer', label: 'Transfer' },
]
const KUNCI_DOMPET_TERAKHIR = 'kasku-dompet-terakhir'

function dompetTerakhir() {
  try {
    return localStorage.getItem(KUNCI_DOMPET_TERAKHIR)
  } catch {
    return null
  }
}

function formKosong(tipe, dompetAktif) {
  const terakhir = dompetTerakhir()
  const dompet_id = dompetAktif.some((d) => d.id === terakhir) ? terakhir : dompetAktif[0]?.id
  return {
    tipe: TIPE.some((t) => t.id === tipe) ? tipe : 'keluar',
    nominal: 0,
    kategori_id: null,
    dompet_id,
    dompet_tujuan_id: null,
    tanggal: hariIni(),
    catatan: '',
  }
}

// id: undefined → transaksi baru. duplikat: salin transaksi id sebagai transaksi baru hari ini.
export default function FormTransaksi({ id, query }) {
  const data = useData()
  const asal = id ? data.transaksi.find((t) => t.id === id) : null
  const duplikat = Boolean(asal && query.duplikat)
  const ubah = Boolean(asal && !duplikat)

  if (id && !asal) {
    return (
      <main className="halaman">
        <Header judul="Transaksi" tombolKembali />
        <Kosong ikon="🔍" judul="Transaksi tidak ditemukan">
          <a className="tombol" href="#/riwayat">Ke Riwayat</a>
        </Kosong>
      </main>
    )
  }

  const awal = asal
    ? {
        ...asal,
        catatan: asal.catatan || '',
        ...(duplikat ? { id: undefined, tanggal: hariIni() } : {}),
      }
    : formKosong(query.tipe, data.dompetAktif)

  return (
    <IsiForm
      key={`${id}-${duplikat}`}
      awal={awal}
      ubah={ubah}
      judul={ubah ? 'Ubah transaksi' : duplikat ? 'Duplikat transaksi' : 'Catat transaksi'}
    />
  )
}

function IsiForm({ awal, ubah, judul }) {
  const { kategori, dompet, dompetAktif, simpanTransaksi, hapusTransaksi } = useData()
  const toast = useToast()
  const [f, setF] = useState(awal)
  const [error, setError] = useState({})
  const [proses, setProses] = useState(false)
  const [kunciFokus, setKunciFokus] = useState(0)

  const set = (kunci, nilai) => {
    setF((x) => ({ ...x, [kunci]: nilai }))
    setError((e) => ({ ...e, [kunci]: undefined }))
  }

  function gantiTipe(tipe) {
    setF((x) => ({
      ...x,
      tipe,
      kategori_id: kategori.find((k) => k.id === x.kategori_id)?.tipe === tipe ? x.kategori_id : null,
      dompet_tujuan_id: tipe === 'transfer' ? x.dompet_tujuan_id : null,
    }))
    setError({})
  }

  // Tampilkan kategori aktif; ikut sertakan kategori tersembunyi yang sedang dipakai.
  const pilihanKategori = kategori.filter(
    (k) => k.tipe === f.tipe && (!k.disembunyikan || k.id === f.kategori_id),
  )
  // Dompet aktif; ikut sertakan dompet arsip yang sedang dipakai transaksi ini.
  const pilihanDompet = dompet.filter(
    (d) => !d.diarsipkan || d.id === f.dompet_id || d.id === f.dompet_tujuan_id,
  )

  async function simpan(lagi) {
    const t = {
      ...f,
      catatan: f.catatan.trim() || null,
      kategori_id: f.tipe === 'transfer' ? null : f.kategori_id,
      dompet_tujuan_id: f.tipe === 'transfer' ? f.dompet_tujuan_id : null,
    }
    const e = validasiTransaksi(t)
    if (Object.keys(e).length) {
      setError(e)
      return
    }
    setProses(true)
    try {
      await simpanTransaksi(t)
      try {
        localStorage.setItem(KUNCI_DOMPET_TERAKHIR, t.dompet_id)
      } catch { /* tidak penting */ }
      toast(ubah ? 'Perubahan disimpan' : 'Transaksi dicatat')
      if (lagi) {
        setF({ ...formKosong(t.tipe, dompetAktif), dompet_id: t.dompet_id, tanggal: t.tanggal })
        setKunciFokus((k) => k + 1)
        setProses(false)
      } else {
        kembali()
      }
    } catch (err) {
      toast(err.message, 'error')
      setProses(false)
    }
  }

  async function hapus() {
    if (!window.confirm('Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan.')) return
    setProses(true)
    try {
      await hapusTransaksi(f.id)
      toast('Transaksi dihapus')
      kembali()
    } catch (err) {
      toast(err.message, 'error')
      setProses(false)
    }
  }

  return (
    <main className="halaman">
      <Header
        judul={judul}
        tombolKembali
        aksi={ubah && (
          <button className="tombol kecil" onClick={() => pergi(`/transaksi/${f.id}`, { duplikat: 1 })}>
            Duplikat
          </button>
        )}
      />

      <form
        className="kartu form form-transaksi"
        onSubmit={(e) => {
          e.preventDefault()
          simpan(false)
        }}
      >
        <div className="segmen" role="tablist" aria-label="Tipe transaksi">
          {TIPE.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={f.tipe === t.id}
              className={`segmen-item segmen-${t.id} ${f.tipe === t.id ? 'aktif' : ''}`}
              onClick={() => gantiTipe(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="nominal">Nominal</label>
          <InputNominal key={kunciFokus} id="nominal" besar nilai={f.nominal} onChange={(n) => set('nominal', n)} autoFocus={!ubah} />
          {error.nominal && <p className="teks-error">{error.nominal}</p>}
        </div>

        {f.tipe !== 'transfer' && (
          <fieldset className="field">
            <legend>Kategori</legend>
            <div className="grid-kategori">
              {pilihanKategori.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className={`chip-kategori ${f.kategori_id === k.id ? 'aktif' : ''}`}
                  aria-pressed={f.kategori_id === k.id}
                  onClick={() => set('kategori_id', k.id)}
                >
                  <span aria-hidden="true">{k.ikon}</span>
                  <span>{k.nama}</span>
                </button>
              ))}
            </div>
            {error.kategori_id && <p className="teks-error">{error.kategori_id}</p>}
          </fieldset>
        )}

        <div className={f.tipe === 'transfer' ? 'baris-dua' : ''}>
          <label className="field">
            <span>{f.tipe === 'transfer' ? 'Dari dompet' : 'Dompet'}</span>
            <select value={f.dompet_id || ''} onChange={(e) => set('dompet_id', e.target.value)}>
              {pilihanDompet.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
            </select>
            {error.dompet_id && <p className="teks-error">{error.dompet_id}</p>}
          </label>
          {f.tipe === 'transfer' && (
            <label className="field">
              <span>Ke dompet</span>
              <select value={f.dompet_tujuan_id || ''} onChange={(e) => set('dompet_tujuan_id', e.target.value || null)}>
                <option value="">Pilih…</option>
                {pilihanDompet.filter((d) => d.id !== f.dompet_id).map((d) => (
                  <option key={d.id} value={d.id}>{d.nama}</option>
                ))}
              </select>
              {error.dompet_tujuan_id && <p className="teks-error">{error.dompet_tujuan_id}</p>}
            </label>
          )}
        </div>
        {f.tipe === 'transfer' && dompetAktif.length < 2 && (
          <p className="teks-info">Transfer butuh minimal 2 dompet. <a className="tautan" href="#/dompet">Tambah dompet</a></p>
        )}

        <label className="field">
          <span>Tanggal</span>
          <input type="date" value={f.tanggal} max="9999-12-31" onChange={(e) => set('tanggal', e.target.value)} required />
          {error.tanggal && <p className="teks-error">{error.tanggal}</p>}
        </label>

        <label className="field">
          <span>Catatan <span className="teks-redup">(opsional)</span></span>
          <input value={f.catatan} maxLength={200} onChange={(e) => set('catatan', e.target.value)} placeholder="mis. Makan siang dengan tim" />
        </label>

        <div className="aksi-form">
          <button className="tombol utama penuh" disabled={proses}>{ubah ? 'Simpan perubahan' : 'Simpan'}</button>
          {!ubah && (
            <button type="button" className="tombol penuh" disabled={proses} onClick={() => simpan(true)}>
              Simpan & catat lagi
            </button>
          )}
          {ubah && (
            <button type="button" className="tombol bahaya penuh" disabled={proses} onClick={hapus}>
              Hapus transaksi
            </button>
          )}
        </div>
      </form>
    </main>
  )
}
