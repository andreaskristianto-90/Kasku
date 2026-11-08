// Komponen kecil yang dipakai banyak halaman.
import { useEffect, useRef } from 'react'
import { formatInputNominal, formatRupiah, parseNominal, labelBulan, geserBulan } from '../lib/keuangan.js'
import { kembali } from '../lib/rute.js'
import Ikon from './Ikon.jsx'

export function Header({ judul, sub, tombolKembali = false, aksi }) {
  return (
    <header className="header">
      {tombolKembali && (
        <button className={`tombol-ikon bergaris ${tombolKembali === 'hp' ? 'hanya-hp' : ''}`} onClick={() => kembali()} aria-label="Kembali">
          <Ikon nama="kembali" />
        </button>
      )}
      <div className="header-judul">
        <h1>{judul}</h1>
        {sub && <p className="teks-redup teks-kecil">{sub}</p>}
      </div>
      <div className="header-aksi">{aksi}</div>
    </header>
  )
}

// Kartu angka utama dengan ikon dan perubahan dibanding bulan lalu.
// arahBaik: 'naik' (pemasukan, saldo) atau 'turun' (pengeluaran) — menentukan warna chip.
export function KartuStat({ ikon, label, nilai, teks, perubahan, arahBaik = 'naik', tipe, tanda = false, ket }) {
  return (
    <div className="kartu kartu-stat">
      <span className="kotak-ikon" aria-hidden="true"><Ikon nama={ikon} /></span>
      <div className="kartu-stat-isi">
        <span className="label">{label}</span>
        <div className="kartu-stat-angka">
          {teks !== undefined
            ? <span className="angka-stat">{teks}</span>
            : <Nominal nilai={nilai} tipe={tipe} tanda={tanda} className="angka-stat" />}
          <ChipPerubahan persen={perubahan} arahBaik={arahBaik} />
        </div>
        {ket && <span className="teks-kecil teks-redup">{ket}</span>}
      </div>
    </div>
  )
}

export function ChipPerubahan({ persen, arahBaik = 'naik' }) {
  if (persen === null || persen === undefined || !Number.isFinite(persen)) return null
  const bulat = Math.round(persen * 10) / 10
  if (bulat === 0) return <span className="chip-ubah netral" title="Sama dengan bulan lalu">0%</span>
  const naik = bulat > 0
  const baik = naik === (arahBaik === 'naik')
  const teks = `${naik ? '▲' : '▼'} ${Math.abs(bulat).toLocaleString('id-ID')}%`
  return (
    <span className={`chip-ubah ${baik ? 'baik' : 'buruk'}`} title="Dibanding bulan lalu">
      {teks}
      <span className="sr-only"> dibanding bulan lalu</span>
    </span>
  )
}

export function Nominal({ nilai, tipe, tanda = false, className = '' }) {
  const kelas = tipe === 'masuk' ? 'warna-masuk' : tipe === 'keluar' ? 'warna-keluar' : ''
  const n = tipe === 'keluar' ? -Math.abs(nilai) : nilai
  return <span className={`nominal ${kelas} ${className}`}>{formatRupiah(n, { tanda })}</span>
}

export function InputNominal({ nilai, onChange, autoFocus, id, besar = false, bolehNegatif = false }) {
  const ref = useRef()
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  const negatif = bolehNegatif && nilai < 0
  return (
    <div className={`input-nominal ${besar ? 'besar' : ''}`}>
      {bolehNegatif && (
        <button
          type="button"
          className={`chip ${negatif ? 'aktif' : ''}`}
          onClick={() => onChange(-nilai)}
          aria-pressed={negatif}
          title="Saldo minus (misalnya kartu kredit)"
        >
          −
        </button>
      )}
      <span className="awalan">Rp</span>
      <input
        ref={ref}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={formatInputNominal(Math.abs(nilai))}
        onChange={(e) => {
          const n = Math.min(parseNominal(e.target.value), 1_000_000_000_000)
          onChange(negatif ? -n : n)
        }}
      />
    </div>
  )
}

export function PemilihBulan({ bulan, onChange }) {
  return (
    <div className="pemilih-bulan">
      <button className="tombol-ikon" onClick={() => onChange(geserBulan(bulan, -1))} aria-label="Bulan sebelumnya"><Ikon nama="kembali" ukuran={18} /></button>
      <span className="pemilih-bulan-label"><Ikon nama="kalender" ukuran={18} />{labelBulan(bulan)}</span>
      <button className="tombol-ikon" onClick={() => onChange(geserBulan(bulan, 1))} aria-label="Bulan berikutnya"><Ikon nama="kanan" ukuran={18} /></button>
    </div>
  )
}

export function Kosong({ ikon = '🗒️', judul, children }) {
  return (
    <div className="kosong">
      <div className="kosong-ikon" aria-hidden="true">{ikon}</div>
      <p className="kosong-judul">{judul}</p>
      {children}
    </div>
  )
}

// Bottom sheet sederhana untuk form kecil (dompet, kategori).
export function Sheet({ judul, onTutup, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onTutup()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [onTutup])
  return (
    <div className="sheet-latar" onClick={onTutup}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={judul} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-kepala">
          <h2>{judul}</h2>
          <button className="tombol-ikon" onClick={onTutup} aria-label="Tutup"><Ikon nama="tutup" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
