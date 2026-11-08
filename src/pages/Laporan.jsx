import { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import {
  arusKasBulanan, bulanIni, formatRupiah, geserBulan, labelBulan, labelBulanPendek,
  persenPerubahan, ringkasKategori, ringkasanBulan, totalPerKategori, transaksiTerbesar,
} from '../lib/keuangan.js'
import { buatInsight } from '../lib/insight.js'
import { buatHref } from '../lib/rute.js'
import GrafikArusKas from '../components/GrafikArusKas.jsx'
import DonatKategori from '../components/DonatKategori.jsx'
import { Header, KartuStat, Kosong, Nominal, PemilihBulan } from '../components/Umum.jsx'

const PILIHAN_SERI = [
  { id: 'masuk', label: 'Pemasukan' },
  { id: 'keluar', label: 'Pengeluaran' },
  { id: 'keduanya', label: 'Keduanya' },
]

export default function Laporan({ query }) {
  const { transaksi, kategoriById, dompetById } = useData()
  const [bulan, setBulan] = useState(query.bulan || bulanIni())
  const [seri, setSeri] = useState('keduanya')
  const [semuaKategori, setSemuaKategori] = useState(false)

  const r = ringkasanBulan(transaksi, bulan)
  const rLalu = ringkasanBulan(transaksi, geserBulan(bulan, -1))
  const rasio = r.masuk ? Math.round((r.selisih / r.masuk) * 100) : null
  const rasioLalu = rLalu.masuk ? Math.round((rLalu.selisih / rLalu.masuk) * 100) : null

  const arus = arusKasBulanan(transaksi, bulan, 6)
  const adaArus = arus.some((a) => a.masuk || a.keluar)
  const bulanBerisi = arus.filter((a) => a.masuk || a.keluar)
  const rata = (k) => (bulanBerisi.length ? Math.round(bulanBerisi.reduce((s, a) => s + a[k], 0) / bulanBerisi.length) : 0)
  const terbaik = bulanBerisi.reduce((x, a) => (!x || a.selisih > x.selisih ? a : x), null)
  const masukTertinggi = bulanBerisi.reduce((x, a) => (!x || a.masuk > x.masuk ? a : x), null)

  const perKategori = totalPerKategori(transaksi, bulan, 'keluar').map((b) => {
    const k = kategoriById.get(b.kategoriId)
    return { ...b, nama: k?.nama ?? 'Tanpa kategori', ikon: k?.ikon ?? '🏷️', href: buatHref('/riwayat', { bulan, tipe: 'keluar', kategori: b.kategoriId }) }
  })
  const donat = ringkasKategori(perKategori, 5).map((b) =>
    b.kategoriId === null ? { ...b, nama: `Lainnya (${b.lainnya})`, ikon: '•••', href: buatHref('/riwayat', { bulan, tipe: 'keluar' }) } : b,
  )

  const terbesar = transaksiTerbesar(transaksi, bulan, 'keluar', 5)
  const insight = buatInsight(transaksi, bulan, kategoriById)

  return (
    <main className="halaman lebar">
      <Header
        judul="Laporan"
        sub="Ringkasan keuanganmu per bulan"
        aksi={<PemilihBulan bulan={bulan} onChange={setBulan} />}
      />

      <section className="grid-stat" aria-label="Ringkasan bulan">
        <KartuStat ikon="masuk" label="Pemasukan" nilai={r.masuk} perubahan={persenPerubahan(r.masuk, rLalu.masuk)} />
        <KartuStat ikon="pengeluaran" label="Pengeluaran" nilai={r.keluar} perubahan={persenPerubahan(r.keluar, rLalu.keluar)} arahBaik="turun" />
        <KartuStat ikon="arus" label="Arus kas bersih" nilai={r.selisih} tanda perubahan={persenPerubahan(r.selisih, rLalu.selisih)} />
        <KartuStat
          ikon="tabungan"
          label="Rasio tabungan"
          teks={rasio === null ? '–' : `${rasio}%`}
          ket={rasio === null ? 'Belum ada pemasukan' : rasioLalu === null ? 'dari pemasukan' : `Bulan lalu ${rasioLalu}%`}
        />
      </section>

      <div className="grid-laporan">
        <section className="kartu kartu-grafik" aria-labelledby="judul-arus">
          <div className="kartu-kepala">
            <div>
              <h2 id="judul-arus">Arus Kas</h2>
              <p className="teks-kecil teks-redup">Pemasukan vs pengeluaran 6 bulan terakhir · ketuk bulan untuk memilih</p>
            </div>
            <div className="segmen kecil" role="tablist" aria-label="Seri yang ditampilkan">
              {PILIHAN_SERI.map((p) => (
                <button key={p.id} role="tab" aria-selected={seri === p.id} className={`segmen-item ${seri === p.id ? 'aktif' : ''}`} onClick={() => setSeri(p.id)}>
                  {p.id !== 'keduanya' && <i className={`titik titik-${p.id}`} aria-hidden="true" />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="legenda-angka">
            {seri !== 'keluar' && <span><i className="titik titik-masuk" /> Pemasukan {labelBulanPendek(bulan)} <b>{formatRupiah(r.masuk)}</b></span>}
            {seri !== 'masuk' && <span><i className="titik titik-keluar" /> Pengeluaran {labelBulanPendek(bulan)} <b>{formatRupiah(r.keluar)}</b></span>}
          </div>
          {adaArus ? (
            <GrafikArusKas data={arus} tampil={seri} bulanAktif={bulan} onPilihBulan={setBulan} />
          ) : (
            <Kosong ikon="📊" judul="Belum ada transaksi dalam 6 bulan terakhir" />
          )}
          <dl className="strip-stat">
            <div><dt><i className="titik titik-masuk" /> Rata-rata pemasukan</dt><dd>{formatRupiah(rata('masuk'))}</dd></div>
            <div><dt><i className="titik titik-keluar" /> Rata-rata pengeluaran</dt><dd>{formatRupiah(rata('keluar'))}</dd></div>
            <div><dt>Bulan terbaik</dt><dd>{terbaik ? <>{labelBulan(terbaik.bulan)}<small>Selisih {formatRupiah(terbaik.selisih, { tanda: true })}</small></> : '–'}</dd></div>
            <div><dt>Pemasukan tertinggi</dt><dd>{masukTertinggi?.masuk ? formatRupiah(masukTertinggi.masuk) : '–'}</dd></div>
          </dl>
        </section>

        <section className="kartu" aria-labelledby="judul-kategori">
          <div className="kartu-kepala">
            <div>
              <h2 id="judul-kategori">Pengeluaran per Kategori</h2>
              <p className="teks-kecil teks-redup">{labelBulan(bulan)}</p>
            </div>
          </div>
          {perKategori.length === 0 ? (
            <Kosong ikon="🍩" judul="Belum ada pengeluaran" />
          ) : (
            <>
              <DonatKategori baris={donat} total={r.keluar} labelTotal="Total keluar" />
              {perKategori.length > 5 && (
                <button className="tautan" onClick={() => setSemuaKategori((x) => !x)}>
                  {semuaKategori ? 'Sembunyikan' : `Lihat semua ${perKategori.length} kategori`}
                </button>
              )}
              {semuaKategori && (
                <ol className="bar-kategori">
                  {perKategori.map((b) => (
                    <li key={b.kategoriId}>
                      <a href={b.href}>
                        <span className="bar-label"><span aria-hidden="true">{b.ikon}</span> {b.nama}</span>
                        <span className="bar-nilai">{formatRupiah(b.total)} <span className="teks-redup">{Math.round(b.persen)}%</span></span>
                        <span className="bar-jalur" aria-hidden="true"><span className="bar-isi" style={{ width: `${Math.max((b.total / perKategori[0].total) * 100, 1.5)}%` }} /></span>
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </section>
      </div>

      <div className="grid-dua">
        <section className="kartu" aria-labelledby="judul-terbesar">
          <div className="kartu-kepala">
            <div>
              <h2 id="judul-terbesar">Pengeluaran Terbesar</h2>
              <p className="teks-kecil teks-redup">Transaksi dengan nominal paling besar bulan ini</p>
            </div>
            <a className="tombol kecil" href={buatHref('/riwayat', { bulan, tipe: 'keluar' })}>Lihat semua</a>
          </div>
          {terbesar.length === 0 ? (
            <Kosong ikon="🧾" judul="Belum ada pengeluaran" />
          ) : (
            <ol className="daftar-peringkat">
              {terbesar.map((t, i) => {
                const k = kategoriById.get(t.kategori_id)
                return (
                  <li key={t.id}>
                    <a href={buatHref(`/transaksi/${t.id}`)}>
                      <span className="peringkat">{i + 1}</span>
                      <span className="item-ikon" aria-hidden="true">{k?.ikon ?? '🏷️'}</span>
                      <span className="item-teks">
                        <span className="item-judul">{t.catatan || k?.nama || 'Pengeluaran'}</span>
                        <span className="item-sub">{k?.nama} · {dompetById.get(t.dompet_id)?.nama}</span>
                      </span>
                      <span className="peringkat-nilai">
                        <Nominal nilai={t.nominal} tipe="keluar" />
                        <span className="bar-jalur kecil" aria-hidden="true"><span className="bar-isi keluar" style={{ width: `${(t.nominal / terbesar[0].nominal) * 100}%` }} /></span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section className="kartu" aria-labelledby="judul-insight">
          <div className="kartu-kepala">
            <div>
              <h2 id="judul-insight">Insight &amp; Tren</h2>
              <p className="teks-kecil teks-redup">Pengamatan otomatis dari catatanmu</p>
            </div>
          </div>
          {insight.length === 0 ? (
            <Kosong ikon="💡" judul="Catat beberapa transaksi untuk melihat insight" />
          ) : (
            <ul className="daftar-insight">
              {insight.map((x, i) => (
                <li key={i} className={`insight insight-${x.jenis}`}>
                  <span className="insight-label">
                    <span className="insight-ikon" aria-hidden="true">{x.jenis === 'positif' ? '✓' : x.jenis === 'perhatian' ? '!' : 'i'}</span>
                    {x.label}
                    <span className="insight-jenis">{x.jenis === 'positif' ? 'Bagus' : x.jenis === 'perhatian' ? 'Perhatian' : 'Info'}</span>
                  </span>
                  <strong>{x.judul}</strong>
                  <p>{x.teks}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <p className="teks-kecil teks-redup catatan-kaki">Transfer antar dompet tidak dihitung sebagai pemasukan atau pengeluaran.</p>
    </main>
  )
}
