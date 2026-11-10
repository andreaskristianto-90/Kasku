// Lapisan data: satu API yang sama untuk Supabase dan Mode Demo (localStorage).
import { supabase, modeDemo, supabaseUrl, supabaseKey } from './supabase.js'
import { KATEGORI_BAWAAN } from './kategoriBawaan.js'

export { modeDemo }

// ---------------------------------------------------------------------------
// Mode Demo: data disimpan di localStorage browser ini saja.
// ---------------------------------------------------------------------------
const KUNCI_DEMO = 'kasku-demo-v1'
const pendengarDemo = new Set()

function bacaDemo() {
  try {
    const isi = JSON.parse(localStorage.getItem(KUNCI_DEMO))
    if (isi) return isi
  } catch { /* abaikan, mulai kosong */ }
  return { sesi: null, dompet: [], kategori: [], transaksi: [] }
}

function tulisDemo(isi) {
  try {
    localStorage.setItem(KUNCI_DEMO, JSON.stringify(isi))
  } catch {
    throw new Error('Penyimpanan browser tidak tersedia.')
  }
}

function idBaru() {
  return crypto.randomUUID()
}

function ubahSesiDemo(sesi) {
  const isi = bacaDemo()
  isi.sesi = sesi
  tulisDemo(isi)
  pendengarDemo.forEach((fn) => fn('SIGNED_IN', sesi))
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
function keUser(u) {
  if (!u) return null
  const meta = u.user_metadata || {}
  // Metode login yang terhubung ke akun, mis. ['email'], ['google'], atau keduanya.
  const metode = u.app_metadata?.providers || (u.id === 'demo' ? ['email'] : [])
  return {
    id: u.id,
    email: u.email,
    nama: meta.nama || meta.full_name || meta.name || u.nama || '',
    metode,
    punyaPassword: metode.includes('email'),
  }
}

function pesanError(error) {
  const m = error?.message || String(error)
  if (/Invalid login credentials/i.test(m)) return 'Email atau password salah.'
  if (/already registered/i.test(m)) return 'Email ini sudah terdaftar. Silakan masuk.'
  if (/Email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk email kamu.'
  if (/Password should be at least/i.test(m)) return 'Password minimal 6 karakter.'
  if (/rate limit/i.test(m)) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
  if (/Failed to fetch/i.test(m)) return 'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  if (/different from the old password|same_password/i.test(m)) return 'Password baru harus berbeda dari password lama.'
  if (/provider is not enabled|Unsupported provider/i.test(m)) return 'Login Google belum diaktifkan.'
  if (/reauthentication|nonce/i.test(m)) return 'Demi keamanan, keluar lalu masuk lagi sebelum mengganti password.'
  return m
}

async function jalankan(promise) {
  const { data, error } = await promise
  if (error) throw new Error(pesanError(error))
  return data
}

export async function ambilUser() {
  if (modeDemo) return keUser(bacaDemo().sesi)
  const { data } = await supabase.auth.getSession()
  return keUser(data.session?.user)
}

// fn(event, user). Event 'PASSWORD_RECOVERY' berarti user datang dari link reset password.
export function dengarkanAuth(fn) {
  if (modeDemo) {
    const p = (event, sesi) => fn(event, keUser(sesi))
    pendengarDemo.add(p)
    return () => pendengarDemo.delete(p)
  }
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Tunda agar tidak memanggil Supabase di dalam callback-nya sendiri.
    setTimeout(() => fn(event, keUser(session?.user)), 0)
  })
  return () => data.subscription.unsubscribe()
}

export async function daftar({ nama, email, password }) {
  if (modeDemo) {
    ubahSesiDemo({ id: 'demo', email, nama })
    return { perluKonfirmasi: false }
  }
  const data = await jalankan(
    supabase.auth.signUp({
      email,
      password,
      options: { data: { nama }, emailRedirectTo: window.location.origin },
    }),
  )
  // Jika konfirmasi email aktif, belum ada sesi sampai user klik link di email.
  return { perluKonfirmasi: !data.session }
}

export async function masuk({ email, password }) {
  if (modeDemo) {
    const lama = bacaDemo().sesi
    ubahSesiDemo({ id: 'demo', email, nama: lama?.nama || email.split('@')[0] })
    return
  }
  await jalankan(supabase.auth.signInWithPassword({ email, password }))
}

export async function keluar() {
  if (modeDemo) {
    const isi = bacaDemo()
    isi.sesi = null
    tulisDemo(isi)
    pendengarDemo.forEach((fn) => fn('SIGNED_OUT', null))
    return
  }
  await jalankan(supabase.auth.signOut())
}

// Login Google: browser diarahkan ke Google, lalu kembali ke Kasku dengan sesi aktif.
export async function masukGoogle() {
  if (modeDemo) throw new Error('Login Google tidak tersedia di Mode Demo.')
  await jalankan(
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
    }),
  )
}

// Cek apakah provider Google sudah diaktifkan di Supabase (Authentication → Providers).
export async function loginGoogleAktif() {
  if (modeDemo) return false
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseKey } })
    const json = await res.json()
    return Boolean(json?.external?.google)
  } catch {
    return false
  }
}

export async function kirimResetPassword(email) {
  if (modeDemo) return
  await jalankan(
    supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
  )
}

// Dipakai dari link reset password (user belum tahu password lamanya).
export async function gantiPassword(password) {
  if (modeDemo) return
  await jalankan(supabase.auth.updateUser({ password }))
}

// Dari Pengaturan. Jika akun sudah punya password, password lama dicek dulu.
// Akun Google tanpa password bisa membuat password baru, agar bisa juga masuk dengan email.
export async function aturPassword({ user, passwordLama, passwordBaru }) {
  if (modeDemo) throw new Error('Mengatur password tidak tersedia di Mode Demo.')
  if (user.punyaPassword) {
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: passwordLama })
    if (error) throw new Error(/Invalid login credentials/i.test(error.message) ? 'Password saat ini salah.' : pesanError(error))
  }
  const data = await jalankan(supabase.auth.updateUser({ password: passwordBaru }))
  // Setelah password dibuat, akun Google juga punya metode 'email'.
  const u = keUser(data.user)
  return { ...u, metode: [...new Set([...u.metode, 'email'])], punyaPassword: true }
}

export async function ubahNama(nama) {
  if (modeDemo) {
    const isi = bacaDemo()
    isi.sesi = { ...isi.sesi, nama }
    tulisDemo(isi)
    return keUser(isi.sesi)
  }
  const data = await jalankan(supabase.auth.updateUser({ data: { nama } }))
  return keUser(data.user)
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const urutTransaksi = (a, b) =>
  b.tanggal.localeCompare(a.tanggal) || b.dibuat_pada.localeCompare(a.dibuat_pada)

// Supabase membatasi 1000 baris per permintaan, jadi ambil bertahap.
async function ambilSemuaBaris(tabel) {
  const ukuran = 1000
  let semua = []
  for (let dari = 0; ; dari += ukuran) {
    const data = await jalankan(
      supabase.from(tabel).select('*').order('dibuat_pada').range(dari, dari + ukuran - 1),
    )
    semua = semua.concat(data)
    if (data.length < ukuran) return semua
  }
}

export async function ambilSemuaData() {
  if (modeDemo) {
    const { dompet, kategori, transaksi } = bacaDemo()
    return { dompet, kategori, transaksi: [...transaksi].sort(urutTransaksi) }
  }
  const [dompet, kategori, transaksi] = await Promise.all([
    ambilSemuaBaris('dompet'),
    ambilSemuaBaris('kategori'),
    ambilSemuaBaris('transaksi'),
  ])
  return { dompet, kategori, transaksi: transaksi.sort(urutTransaksi) }
}

// Dipanggil sekali saat user baru: buat dompet pertama + kategori bawaan.
export async function siapkanAkunBaru({ namaDompet, saldoAwal }) {
  const dompet = { nama: namaDompet, saldo_awal: saldoAwal, diarsipkan: false }
  const kategori = KATEGORI_BAWAAN.map((k) => ({ ...k, disembunyikan: false }))
  if (modeDemo) {
    const isi = bacaDemo()
    const kini = new Date().toISOString()
    isi.dompet.push({ ...dompet, id: idBaru(), dibuat_pada: kini })
    if (isi.kategori.length === 0) {
      kategori.forEach((k) => isi.kategori.push({ ...k, id: idBaru(), dibuat_pada: kini }))
    }
    tulisDemo(isi)
    return
  }
  await jalankan(supabase.from('dompet').insert(dompet))
  const { count } = await supabase.from('kategori').select('id', { count: 'exact', head: true })
  if (!count) await jalankan(supabase.from('kategori').insert(kategori))
}

// Simpan (tambah jika belum ada id, ubah jika ada id). Mengembalikan baris tersimpan.
async function simpan(tabel, baris) {
  const { id, user_id, dibuat_pada, ...nilai } = baris
  if (modeDemo) {
    const isi = bacaDemo()
    const daftar = isi[tabel]
    let hasil
    if (id) {
      const i = daftar.findIndex((x) => x.id === id)
      if (i < 0) throw new Error('Data tidak ditemukan.')
      hasil = { ...daftar[i], ...nilai }
      daftar[i] = hasil
    } else {
      hasil = { ...nilai, id: idBaru(), dibuat_pada: new Date().toISOString() }
      daftar.push(hasil)
    }
    tulisDemo(isi)
    return hasil
  }
  const kueri = id
    ? supabase.from(tabel).update(nilai).eq('id', id)
    : supabase.from(tabel).insert(nilai)
  return jalankan(kueri.select().single())
}

async function hapus(tabel, id) {
  if (modeDemo) {
    const isi = bacaDemo()
    isi[tabel] = isi[tabel].filter((x) => x.id !== id)
    tulisDemo(isi)
    return
  }
  await jalankan(supabase.from(tabel).delete().eq('id', id))
}

export const simpanTransaksi = (t) => simpan('transaksi', t)
export const hapusTransaksi = (id) => hapus('transaksi', id)
export const simpanDompet = (d) => simpan('dompet', d)
export const hapusDompet = (id) => hapus('dompet', id)
export const simpanKategori = (k) => simpan('kategori', k)
export const hapusKategori = (id) => hapus('kategori', id)
