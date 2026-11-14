-- Kasku — trigger email "Selamat datang" (Resend lewat Edge Function kirim-email-selamat-datang)
-- Sudah dijalankan di project "Kasku" sebagai migration `kasku_email_selamat_datang`
-- dan `kasku_pg_net_ke_schema_extensions`.
--
-- Saat akun terkonfirmasi (daftar email → klik link konfirmasi; daftar Google → langsung),
-- database memanggil Edge Function secara asinkron lewat pg_net. Pendaftaran tidak pernah
-- gagal karena email: semua error di sini hanya dicatat sebagai warning.

create extension if not exists pg_net with schema extensions;

create or replace function public.kirim_email_selamat_datang()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    perform net.http_post(
      url := 'https://fqpayovldqxjllxehvua.supabase.co/functions/v1/kirim-email-selamat-datang',
      body := jsonb_build_object('user_id', new.id),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 5000
    );
  end if;
  return new;
exception when others then
  raise warning 'kirim_email_selamat_datang gagal: %', sqlerrm;
  return new;
end;
$$;

-- Fungsi trigger tidak boleh dipanggil langsung lewat API.
revoke execute on function public.kirim_email_selamat_datang() from public, anon, authenticated;

drop trigger if exists on_auth_user_terkonfirmasi on auth.users;
create trigger on_auth_user_terkonfirmasi
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.kirim_email_selamat_datang();
