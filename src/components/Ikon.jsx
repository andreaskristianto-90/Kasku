// Ikon garis sederhana (24×24, stroke currentColor).
const PATH = {
  beranda: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5.5v-6h-5v6H4a1 1 0 01-1-1z',
  transaksi: 'M7 4h10a1 1 0 011 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 011-1zM9 9h6M9 13h4',
  laporan: 'M12 3a9 9 0 109 9h-9zM15 3.5A9 9 0 0120.5 9H15z',
  dompet: 'M4 7a2 2 0 012-2h11v4M4 7v11a2 2 0 002 2h13a1 1 0 001-1v-9a1 1 0 00-1-1H6a2 2 0 01-2-2zM16 14h.01',
  kategori: 'M3 12V4a1 1 0 011-1h8l9 9-9 9zM8 8h.01',
  pengaturan: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  lainnya: 'M5 12h.01M12 12h.01M19 12h.01',
  menu: 'M5 4h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM15 4h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5a1 1 0 011-1zM5 14h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4a1 1 0 011-1zM15 14h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4a1 1 0 011-1z',
  filter: 'M4 6h16M7 12h10M10 18h4',
  tambah: 'M12 5v14M5 12h14',
  cari: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-3.5-3.5',
  keluar: 'M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l-5-5 5-5M5 12h11',
  masuk: 'M12 19V5M5 12l7 7 7-7',
  pengeluaran: 'M12 5v14M5 12l7-7 7 7',
  arus: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  tabungan: 'M12 3v18M17 7H9.5a3 3 0 000 6h5a3 3 0 010 6H6',
  kembali: 'M15 18l-6-6 6-6',
  kanan: 'M9 6l6 6-6 6',
  kalender: 'M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4',
  unduh: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  tutup: 'M6 6l12 12M18 6L6 18',
}

export default function Ikon({ nama, ukuran = 20, tebal = 1.8, className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={ukuran} height={ukuran} aria-hidden="true">
      <path d={PATH[nama]} fill="none" stroke="currentColor" strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
