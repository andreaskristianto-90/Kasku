// Router sederhana berbasis hash: #/riwayat?bulan=2026-11
import { useEffect, useState } from 'react'

function baca() {
  const h = window.location.hash.replace(/^#/, '') || '/'
  const [path, qs = ''] = h.split('?')
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) }
}

export function useRute() {
  const [rute, setRute] = useState(baca)
  useEffect(() => {
    const ubah = () => {
      setRute(baca())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', ubah)
    return () => window.removeEventListener('hashchange', ubah)
  }, [])
  return rute
}

export function buatHref(path, query = {}) {
  const qs = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString()
  return '#' + path + (qs ? '?' + qs : '')
}

export function pergi(path, query) {
  window.location.hash = buatHref(path, query)
}

export function kembali(cadangan = '/') {
  if (window.history.length > 1) window.history.back()
  else pergi(cadangan)
}
