// Cuplikan tampilan Beranda untuk halaman login. Dibangun dari komponen asli dengan data contoh,
// sehingga tetap tajam di semua layar, ikut mode gelap, dan selalu sama dengan tampilan terbaru.
import GrafikArusKas from './GrafikArusKas.jsx'
import Ikon from './Ikon.jsx'
import { KartuStat } from './Umum.jsx'

const CONTOH_ARUS = [
  { bulan: '2026-06', masuk: 8_000_000, keluar: 3_900_000 },
  { bulan: '2026-07', masuk: 10_500_000, keluar: 3_800_000 },
  { bulan: '2026-08', masuk: 8_500_000, keluar: 4_100_000 },
  { bulan: '2026-09', masuk: 8_500_000, keluar: 5_600_000 },
  { bulan: '2026-10', masuk: 8_500_000, keluar: 5_300_000 },
  { bulan: '2026-11', masuk: 8_500_000, keluar: 4_200_000 },
].map((b) => ({ ...b, selisih: b.masuk - b.keluar }))

const CONTOH_TRANSAKSI = [
  { ikon: '🍜', judul: 'Makan & Minum', sub: 'Makan siang · Tunai', nominal: '−Rp 35.000', tipe: 'keluar' },
  { ikon: '💼', judul: 'Gaji', sub: 'Gaji November · BCA', nominal: '+Rp 8.500.000', tipe: 'masuk' },
]

export default function PratinjauApp() {
  return (
    <figure className="pratinjau">
      <div className="pratinjau-jendela" aria-hidden="true">
        <div className="pratinjau-bar">
          <span /><span /><span />
          <em>kasku · Beranda</em>
        </div>
        <div className="pratinjau-isi">
          <div className="pratinjau-stat">
            <KartuStat ikon="dompet" label="Total saldo" nilai={12_450_000} perubahan={8.2} />
            <KartuStat ikon="pengeluaran" label="Pengeluaran bulan ini" nilai={4_200_000} perubahan={-12.5} arahBaik="turun" />
          </div>
          <div className="kartu pratinjau-grafik">
            <div className="kartu-kepala">
              <h2>Arus Kas</h2>
              <div className="legenda-angka">
                <span><i className="titik titik-masuk" /> Pemasukan</span>
                <span><i className="titik titik-keluar" /> Pengeluaran</span>
              </div>
            </div>
            <GrafikArusKas data={CONTOH_ARUS} bulanAktif="2026-11" tinggi={190} />
          </div>
          <div className="kartu daftar">
            {CONTOH_TRANSAKSI.map((t) => (
              <div key={t.judul} className="item-transaksi">
                <span className="item-ikon">{t.ikon}</span>
                <span className="item-teks">
                  <span className="item-judul">{t.judul}</span>
                  <span className="item-sub">{t.sub}</span>
                </span>
                <span className={`nominal item-nominal warna-${t.tipe}`}>{t.nominal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="teks-kecil teks-redup">
        <Ikon nama="laporan" ukuran={16} /> Contoh tampilan Beranda dengan data rekaan
      </figcaption>
    </figure>
  )
}
