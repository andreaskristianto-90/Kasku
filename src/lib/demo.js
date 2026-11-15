// Akun demo bersama: siapa pun bisa mencoba Kasku tanpa mendaftar.
// Kredensial ini memang publik. Di database, password/email/nama akun ini dikunci dan
// datanya direset otomatis setiap hari (lihat supabase/akun-demo.sql).
export const AKUN_DEMO = {
  email: 'test@gmail.com',
  password: 'test123',
}

export const JAM_RESET_DEMO = '00.00 WIB'

export function adalahAkunDemo(user) {
  return Boolean(user?.email) && user.email.toLowerCase() === AKUN_DEMO.email
}
