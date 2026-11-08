import { useData } from '../lib/DataContext.jsx'
import { buatHref } from '../lib/rute.js'
import { labelTanggal } from '../lib/keuangan.js'
import { Nominal } from './Umum.jsx'

export default function ItemTransaksi({ t, tampilTanggal = false }) {
  const { dompetById, kategoriById } = useData()
  const dompet = dompetById.get(t.dompet_id)
  let ikon, judul, sub
  if (t.tipe === 'transfer') {
    ikon = '🔁'
    judul = 'Transfer'
    sub = `${dompet?.nama ?? '?'} → ${dompetById.get(t.dompet_tujuan_id)?.nama ?? '?'}`
  } else {
    const k = kategoriById.get(t.kategori_id)
    ikon = k?.ikon ?? '🏷️'
    judul = k?.nama ?? 'Tanpa kategori'
    sub = dompet?.nama ?? ''
  }
  return (
    <a className="item-transaksi" href={buatHref(`/transaksi/${t.id}`)}>
      <span className="item-ikon" aria-hidden="true">{ikon}</span>
      <span className="item-teks">
        <span className="item-judul">{judul}</span>
        <span className="item-sub">{[t.catatan, sub, tampilTanggal && labelTanggal(t.tanggal)].filter(Boolean).join(' · ')}</span>
      </span>
      <Nominal nilai={t.nominal} tipe={t.tipe} tanda={t.tipe === 'masuk'} className="item-nominal" />
    </a>
  )
}
