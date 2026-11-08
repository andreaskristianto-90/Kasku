import { useData } from '../lib/DataContext.jsx'
import { arusKasBulanan, bulanIni, geserBulan, labelBulan, persenPerubahan, ringkasanBulan } from '../lib/keuangan.js'
import { buatHref, pergi } from '../lib/rute.js'
import GrafikArusKas from '../components/GrafikArusKas.jsx'
import Ikon from '../components/Ikon.jsx'
import ItemTransaksi from '../components/ItemTransaksi.jsx'
import { Header, KartuStat, Kosong, Nominal } from '../components/Umum.jsx'

export default function Beranda({ user }) {
  const { dompetAktif, saldo, totalSaldo, transaksi } = useData()
  const bulan = bulanIni()
  const r = ringkasanBulan(transaksi, bulan)
  const rLalu = ringkasanBulan(transaksi, geserBulan(bulan, -1))
  // Saldo di akhir bulan lalu ≈ saldo sekarang dikurangi arus kas bersih bulan ini.
  const saldoBulanLalu = totalSaldo - r.selisih
  const arus = arusKasBulanan(transaksi, bulan, 6)
  const terakhir = transaksi.slice(0, 6)

  return (
    <main className="halaman lebar">
      <Header
        judul={`Halo${user.nama ? `, ${user.nama}` : ''} 👋`}
        sub={`Ringkasan keuanganmu · ${labelBulan(bulan)}`}
        aksi={<a className="tombol bergaris sembunyi-hp" href={buatHref('/laporan')}><Ikon nama="laporan" ukuran={18} /> Lihat laporan</a>}
      />

      <section className="grid-stat" aria-label="Ringkasan">
        <KartuStat ikon="dompet" label="Total saldo" nilai={totalSaldo} perubahan={persenPerubahan(totalSaldo, saldoBulanLalu)} />
        <KartuStat ikon="masuk" label="Pemasukan bulan ini" nilai={r.masuk} perubahan={persenPerubahan(r.masuk, rLalu.masuk)} />
        <KartuStat ikon="pengeluaran" label="Pengeluaran bulan ini" nilai={r.keluar} perubahan={persenPerubahan(r.keluar, rLalu.keluar)} arahBaik="turun" />
        <KartuStat ikon="arus" label="Arus kas bersih" nilai={r.selisih} tanda perubahan={persenPerubahan(r.selisih, rLalu.selisih)} />
      </section>

      <div className="grid-laporan">
        <section className="kartu kartu-grafik" aria-labelledby="judul-arus">
          <div className="kartu-kepala">
            <div>
              <h2 id="judul-arus">Arus Kas</h2>
              <p className="teks-kecil teks-redup">6 bulan terakhir · ketuk bulan untuk membuka laporannya</p>
            </div>
            <div className="legenda-angka">
              <span><i className="titik titik-masuk" /> Pemasukan</span>
              <span><i className="titik titik-keluar" /> Pengeluaran</span>
            </div>
          </div>
          {arus.some((a) => a.masuk || a.keluar) ? (
            <GrafikArusKas data={arus} bulanAktif={bulan} onPilihBulan={(b) => pergi('/laporan', { bulan: b })} />
          ) : (
            <Kosong ikon="📊" judul="Grafik muncul setelah ada transaksi" />
          )}
        </section>

        <section className="kartu" aria-labelledby="judul-dompet">
          <div className="kartu-kepala">
            <div>
              <h2 id="judul-dompet">Dompet</h2>
              <p className="teks-kecil teks-redup">{dompetAktif.length} dompet aktif</p>
            </div>
            <a href={buatHref('/dompet')} className="tombol kecil">Kelola</a>
          </div>
          <ul className="daftar-dompet">
            {dompetAktif.map((d) => {
              const s = saldo.get(d.id)
              const porsi = totalSaldo > 0 && s > 0 ? (s / totalSaldo) * 100 : 0
              return (
                <li key={d.id}>
                  <a href={buatHref('/riwayat', { dompet: d.id })}>
                    <span className="item-ikon" aria-hidden="true"><Ikon nama="dompet" /></span>
                    <span className="item-teks">
                      <span className="item-judul">{d.nama}</span>
                      <span className="bar-jalur kecil" aria-hidden="true"><span className="bar-isi" style={{ width: `${porsi}%` }} /></span>
                    </span>
                    <Nominal nilai={s} className="item-nominal" />
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="kartu" aria-labelledby="judul-terakhir">
        <div className="kartu-kepala">
          <div>
            <h2 id="judul-terakhir">Transaksi Terakhir</h2>
            <p className="teks-kecil teks-redup">Catatan terbaru dari semua dompet</p>
          </div>
          {transaksi.length > 0 && <a href={buatHref('/riwayat')} className="tombol kecil">Lihat semua</a>}
        </div>
        {terakhir.length === 0 ? (
          <Kosong ikon="✍️" judul="Belum ada transaksi">
            <a className="tombol utama" href={buatHref('/transaksi/baru')}><Ikon nama="tambah" ukuran={18} /> Catat transaksi pertama</a>
          </Kosong>
        ) : (
          <div className="daftar rapat">
            {terakhir.map((t) => <ItemTransaksi key={t.id} t={t} tampilTanggal />)}
          </div>
        )}
      </section>
    </main>
  )
}
