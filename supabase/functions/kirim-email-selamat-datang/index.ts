// Edge Function: kirim email "Selamat datang di Kasku" lewat Resend.
// Dipanggil oleh trigger database (lihat supabase/email-selamat-datang.sql) saat akun terkonfirmasi.
//
// Secret yang dibutuhkan (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  (wajib)  API key dari resend.com
//   EMAIL_FROM      (opsional) mis. "Kasku <halo@domainmu.com>"; bawaan: Kasku <onboarding@resend.dev>
//   APP_URL         (opsional) bawaan: https://kasku-app.pages.dev
//
// Aman dipanggil publik: hanya mengirim ke user yang ada, sudah terkonfirmasi,
// dibuat ≤ 7 hari lalu, dan belum pernah dikirimi (ditandai di app_metadata).
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Kasku <onboarding@resend.dev>'
const APP_URL = Deno.env.get('APP_URL') || 'https://kasku-app.pages.dev'
const BATAS_UMUR_AKUN_MS = 7 * 24 * 60 * 60 * 1000
const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function jawab(status: number, isi: Record<string, unknown>) {
  return new Response(JSON.stringify(isi), { status, headers: { 'Content-Type': 'application/json' } })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function isiEmail(nama: string) {
  const n = escapeHtml(nama)
  const html = `<!doctype html><html lang="id"><body style="margin:0;background:#f6f6f4;font-family:Arial,Helvetica,sans-serif;color:#121212">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e7e7e3;border-radius:16px">
<tr><td style="padding:28px 28px 8px">
<div style="display:inline-block;width:40px;height:40px;line-height:40px;text-align:center;border-radius:10px;background:#2f8a35;color:#fff;font-weight:bold">Rp</div>
<h1 style="font-size:22px;margin:16px 0 8px">Selamat datang di Kasku, ${n}!</h1>
<p style="font-size:15px;line-height:1.6;color:#45453f;margin:0">Akunmu sudah aktif. Kasku membantumu mencatat pemasukan dan pengeluaran, melihat saldo semua dompet, dan tahu ke mana uangmu pergi setiap bulan.</p>
</td></tr>
<tr><td style="padding:16px 28px">
<p style="font-size:15px;font-weight:bold;margin:0 0 8px">Mulai dalam 3 langkah:</p>
<ol style="font-size:15px;line-height:1.7;color:#45453f;margin:0;padding-left:20px">
<li>Buat dompet pertama (mis. Tunai atau rekening bank) beserta saldonya.</li>
<li>Catat setiap transaksi lewat tombol <b>+</b>, cukup beberapa detik.</li>
<li>Buka <b>Laporan</b> di akhir bulan untuk melihat arus kas dan kategori terbesar.</li>
</ol>
</td></tr>
<tr><td style="padding:8px 28px 28px">
<a href="${APP_URL}" style="display:inline-block;background:#2f8a35;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Buka Kasku</a>
</td></tr>
</table>
<p style="font-size:12px;color:#686862;margin:16px 0 0">Kamu menerima email ini karena baru saja membuat akun Kasku.</p>
</td></tr></table></body></html>`
  const text = `Selamat datang di Kasku, ${nama}!

Akunmu sudah aktif. Mulai dalam 3 langkah:
1. Buat dompet pertama beserta saldonya.
2. Catat setiap transaksi lewat tombol +.
3. Buka Laporan di akhir bulan untuk melihat arus kas dan kategori terbesar.

Buka Kasku: ${APP_URL}`
  return { html, text }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jawab(405, { error: 'Gunakan POST' })

  let userId = ''
  try {
    userId = String((await req.json())?.user_id ?? '')
  } catch {
    return jawab(400, { error: 'Body harus JSON berisi user_id' })
  }
  if (!POLA_UUID.test(userId)) return jawab(400, { error: 'user_id tidak valid' })

  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data?.user) return jawab(404, { error: 'User tidak ditemukan' })
  const user = data.user

  if (!user.email || !user.email_confirmed_at) return jawab(200, { status: 'dilewati', alasan: 'email belum terkonfirmasi' })
  if (user.app_metadata?.email_selamat_datang_terkirim) return jawab(200, { status: 'dilewati', alasan: 'sudah pernah dikirim' })
  if (Date.now() - new Date(user.created_at).getTime() > BATAS_UMUR_AKUN_MS) {
    return jawab(200, { status: 'dilewati', alasan: 'akun lebih lama dari 7 hari' })
  }
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY belum diatur di Edge Function Secrets')
    return jawab(500, { error: 'RESEND_API_KEY belum diatur' })
  }

  const meta = user.user_metadata ?? {}
  const nama = String(meta.nama || meta.full_name || meta.name || user.email.split('@')[0]).slice(0, 60)
  const { html, text } = isiEmail(nama)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Mencegah email ganda jika trigger terpanggil dua kali berdekatan.
      'Idempotency-Key': `selamat-datang-${user.id}`,
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [user.email], subject: 'Selamat datang di Kasku 👋', html, text }),
  })
  const hasil = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Resend menolak:', res.status, JSON.stringify(hasil))
    return jawab(502, { error: 'Gagal mengirim lewat Resend', status_resend: res.status, detail: hasil })
  }

  // Tandai agar tidak terkirim dua kali. app_metadata hanya bisa diubah dari server.
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, email_selamat_datang_terkirim: new Date().toISOString() },
  })
  console.log('Email selamat datang terkirim', user.id, hasil?.id)
  return jawab(200, { status: 'terkirim', id_resend: hasil?.id })
})
