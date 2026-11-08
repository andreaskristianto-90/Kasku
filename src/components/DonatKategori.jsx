// Donat porsi pengeluaran per kategori. Satu warna (kuning/amber), makin besar makin pekat;
// identitas kategori dibaca dari legenda yang mencantumkan nama, nominal, dan persen.
import { useState } from 'react'
import { formatRingkas, formatRupiah } from '../lib/keuangan.js'

const R = 70
const TEBAL = 22
const UKURAN = (R + TEBAL / 2) * 2 + 4

function busur(mulai, akhir) {
  // sudut dalam radian, 0 = atas, searah jarum jam
  const t = (a) => [UKURAN / 2 + R * Math.sin(a), UKURAN / 2 - R * Math.cos(a)]
  const [x1, y1] = t(mulai)
  const [x2, y2] = t(akhir)
  const besar = akhir - mulai > Math.PI ? 1 : 0
  return `M${x1},${y1}A${R},${R} 0 ${besar} 1 ${x2},${y2}`
}

// baris: [{ kategoriId, total, persen, nama, ikon, href }] urut terbesar dulu (maks 5)
export default function DonatKategori({ baris, total, labelTotal = 'Total' }) {
  const [sorot, setSorot] = useState(null)
  let sudut = 0
  const celah = baris.length > 1 ? 0.03 : 0 // celah antar segmen (radian)
  const segmen = baris.map((b, i) => {
    const lebar = (b.total / total) * Math.PI * 2
    const s = { ...b, i, mulai: sudut + celah / 2, akhir: sudut + lebar - celah / 2 }
    sudut += lebar
    return s
  })
  const tampil = sorot !== null ? baris[sorot] : null

  return (
    <div className="donat">
      <svg width={UKURAN} height={UKURAN} viewBox={`0 0 ${UKURAN} ${UKURAN}`} role="img" aria-label="Porsi pengeluaran per kategori">
        <circle cx={UKURAN / 2} cy={UKURAN / 2} r={R} className="donat-jalur" strokeWidth={TEBAL} fill="none" />
        {segmen.map((s) =>
          baris.length === 1 ? (
            <circle key={s.i} cx={UKURAN / 2} cy={UKURAN / 2} r={R} fill="none" strokeWidth={TEBAL} className={`donat-seg ramp-${s.i + 1}`} />
          ) : (
            <path
              key={s.i}
              d={busur(s.mulai, Math.max(s.akhir, s.mulai + 0.001))}
              fill="none"
              strokeWidth={sorot === s.i ? TEBAL + 4 : TEBAL}
              className={`donat-seg ramp-${s.i + 1}`}
              onMouseEnter={() => setSorot(s.i)}
              onMouseLeave={() => setSorot(null)}
            >
              <title>{`${s.nama}: ${formatRupiah(s.total)} (${Math.round(s.persen)}%)`}</title>
            </path>
          ),
        )}
        <text x="50%" y="46%" textAnchor="middle" className="donat-label">{tampil ? tampil.nama : labelTotal}</text>
        <text x="50%" y="58%" textAnchor="middle" className="donat-angka">
          {tampil ? `${Math.round(tampil.persen)}%` : formatRingkas(total)}
        </text>
      </svg>

      <ul className="legenda">
        {baris.map((b, i) => (
          <li key={b.kategoriId ?? 'lainnya'} onMouseEnter={() => setSorot(i)} onMouseLeave={() => setSorot(null)} className={sorot === i ? 'sorot' : ''}>
            <a href={b.href}>
              <span className={`legenda-titik ramp-${i + 1}`} aria-hidden="true" />
              <span className="legenda-nama"><span aria-hidden="true">{b.ikon}</span> {b.nama}</span>
              <span className="legenda-nilai">{formatRupiah(b.total)}</span>
              <span className="legenda-persen">{Math.round(b.persen)}%</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
