// Grafik batang berpasangan: pemasukan vs pengeluaran per bulan.
import { useEffect, useRef, useState } from 'react'
import { formatRingkas, formatRupiah, labelBulan, labelBulanPendek } from '../lib/keuangan.js'

const KIRI = 52 // ruang label sumbu Y
const BAWAH = 28 // ruang label bulan
const ATAS = 12

// Batas atas sumbu yang "rapi": 1, 2, 2.5, 5 × 10^n
function batasRapi(maks) {
  if (maks <= 0) return 100_000
  const pangkat = 10 ** Math.floor(Math.log10(maks))
  for (const k of [1, 2, 2.5, 5, 10]) if (k * pangkat >= maks) return k * pangkat
  return 10 * pangkat
}

// Batang dengan sudut atas membulat 4px, menempel di garis dasar.
function jalurBatang(x, y, w, h) {
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

export default function GrafikArusKas({ data, tampil = 'keduanya', bulanAktif, onPilihBulan, tinggi: TINGGI = 260 }) {
  const wadah = useRef()
  const [lebar, setLebar] = useState(600)
  const [sorot, setSorot] = useState(null)

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLebar(Math.max(280, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const seri = tampil === 'keduanya' ? ['masuk', 'keluar'] : [tampil]
  const maks = batasRapi(Math.max(0, ...data.flatMap((d) => seri.map((s) => d[s]))))
  const tick = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maks)
  const plotW = lebar - KIRI
  const plotH = TINGGI - ATAS - BAWAH
  const grupW = plotW / data.length
  const celah = 2
  const batangW = Math.min(36, (grupW * 0.64 - celah * (seri.length - 1)) / seri.length)
  const y = (v) => ATAS + plotH - (v / maks) * plotH

  const aktif = sorot ?? data.findIndex((d) => d.bulan === bulanAktif)
  const d = data[aktif]

  return (
    <div className="grafik" ref={wadah}>
      <svg width={lebar} height={TINGGI} role="img" aria-label={`Pemasukan dan pengeluaran ${data.length} bulan terakhir`}>
        {/* Garis bantu & label sumbu Y */}
        {tick.map((t) => (
          <g key={t}>
            <line x1={KIRI} x2={lebar} y1={y(t)} y2={y(t)} className={t === 0 ? 'garis-dasar' : 'garis-bantu'} />
            <text x={KIRI - 8} y={y(t)} dy="0.32em" textAnchor="end" className="label-sumbu">
              {formatRingkas(t)}
            </text>
          </g>
        ))}

        {data.map((b, i) => {
          const gx = KIRI + i * grupW
          const totalW = seri.length * batangW + (seri.length - 1) * celah
          const x0 = gx + (grupW - totalW) / 2
          const dipilih = b.bulan === bulanAktif
          return (
            <g key={b.bulan}>
              {(dipilih || sorot === i) && (
                <rect x={gx + 4} y={ATAS} width={grupW - 8} height={plotH} rx="8" className={dipilih ? 'pita-aktif' : 'pita-sorot'} />
              )}
              {seri.map((s, j) => {
                const h = (b[s] / maks) * plotH
                return <path key={s} d={jalurBatang(x0 + j * (batangW + celah), ATAS + plotH - h, batangW, h)} className={`batang batang-${s}`} />
              })}
              <text x={gx + grupW / 2} y={TINGGI - 8} textAnchor="middle" className={`label-sumbu ${dipilih ? 'tebal' : ''}`}>
                {labelBulanPendek(b.bulan).toUpperCase()}
              </text>
              {/* Area sentuh lebih besar dari batang */}
              <rect
                x={gx}
                y={0}
                width={grupW}
                height={TINGGI}
                fill="transparent"
                style={{ cursor: onPilihBulan ? 'pointer' : 'default' }}
                onMouseEnter={() => setSorot(i)}
                onMouseLeave={() => setSorot(null)}
                onClick={() => onPilihBulan?.(b.bulan)}
              >
                <title>{`${labelBulan(b.bulan)} — Pemasukan ${formatRupiah(b.masuk)}, Pengeluaran ${formatRupiah(b.keluar)}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>

      {sorot !== null && d && (
        <div
          className="tooltip"
          style={{
            left: Math.min(Math.max(KIRI + (sorot + 0.5) * grupW, 90), lebar - 90),
            top: 0,
          }}
          role="status"
        >
          <strong>{labelBulan(d.bulan)}</strong>
          <span><i className="titik titik-masuk" /> Pemasukan <b>{formatRupiah(d.masuk)}</b></span>
          <span><i className="titik titik-keluar" /> Pengeluaran <b>{formatRupiah(d.keluar)}</b></span>
          <span className="tooltip-selisih">Selisih <b>{formatRupiah(d.selisih, { tanda: true })}</b></span>
        </div>
      )}
    </div>
  )
}
