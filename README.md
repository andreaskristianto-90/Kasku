# Kasku — personal finance tracker

**English** · [Bahasa Indonesia](README.id.md)

Kasku is a mobile-first web app for recording income, expenses, and transfers between wallets, then seeing where your money goes each month. The interface is in Indonesian and all amounts are in Rupiah (IDR).

**Live app:** https://kasku-app.pages.dev

Built with React + Vite, backed by Supabase (Postgres, Auth, Edge Functions), and deployed on Cloudflare Pages.

## Features

| Page | What it does |
|---|---|
| Sign in / Sign up | Email + password, password reset by email, and Google sign-in (shown once the provider is enabled) |
| Onboarding | Create the first wallet with its starting balance; default categories are created automatically |
| Home (*Beranda*) | Stat cards (balance, income, expenses, net cash flow, each with % change vs last month), 6-month cash flow chart, wallets, recent transactions |
| Record / edit transaction | Expense, income, or transfer; "save & add another"; duplicate; delete |
| Transactions (*Transaksi*) | Monthly list grouped by day; filter by type, category, wallet; one search box in the top bar matches notes, category, and wallet names |
| Reports (*Laporan*) | Stat cards + savings rate, 6-month cash flow chart, expense breakdown by category, largest expenses, and rule-based insights |
| Wallets (*Dompet*) | Add, edit, archive; delete only when unused |
| Categories (*Kategori*) | Add, rename, change icon, hide; delete only when unused |
| More (*Lainnya*, mobile) | Profile card, links to wallets/categories/settings, sign out |
| Settings (*Pengaturan*) | Display name, change password (or create one for Google accounts), CSV export, sign out |
| Welcome email | Sent through Resend once a new account is confirmed |

Business rules:
- A transfer moves money between two wallets and is **not** counted as income or expense.
- Wallet balance = starting balance + income − expenses ± transfers.
- Amounts are whole Rupiah, from 1 up to 1 trillion.

## Architecture

```
Developer ──git push──▶ GitHub ──auto build──▶ Cloudflare Pages ──static files──▶ Browser
                                                                                   │
                                     ┌─────────────────────────────────────────────┤
                                     ▼                                             ▼
                              Supabase Auth                               Supabase REST API
                       (email, Google OAuth, tokens)                              │
                                     │                                             ▼
                     on confirm: trigger ──pg_net──▶ Edge Function        Postgres + RLS
                                                      │                 (dompet, kategori,
                                                      ▼                     transaksi)
                                                   Resend
```

- **All app logic runs in the browser.** Cloudflare only serves the built files; it stores no data.
- **The browser talks to Supabase directly** using the publishable key plus the signed-in user's token. Row Level Security makes sure each user can only read and write their own rows.
- **Server-only work** (sending the welcome email) runs in a Supabase Edge Function, so the Resend API key never reaches the browser.

Inside the React app the code is layered:

| Layer | Files | Role |
|---|---|---|
| Entry & routing | `src/App.jsx`, `src/lib/rute.js` | Checks the session, picks the page from the `#/…` hash URL |
| Pages & components | `src/pages/`, `src/components/` | UI; `Kerangka.jsx` is the shell (sidebar, top bar, mobile nav) |
| State | `src/lib/DataContext.jsx` | Loads all data once, keeps it in memory, exposes save/delete actions |
| Data access | `src/lib/api.js`, `src/lib/supabase.js` | Single gateway to Supabase, or to `localStorage` in Demo Mode |
| Pure logic | `src/lib/keuangan.js`, `src/lib/insight.js` | Balances, monthly summaries, reports, validation, CSV, insights; covered by tests |

## Getting started

Requires **Node.js 20.19+**.

```bash
npm install
npm run dev
```

Open http://localhost:5180 (the dev server is pinned to port 5180).

**Demo Mode:** if no Supabase variables are set, the app runs entirely in the browser. You can sign in with any email and password, and data is stored only in that browser's `localStorage`. Handy for trying the UI without a backend.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server on port 5180 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit tests for the finance logic (Node's built-in test runner) |

### Environment variables

Copy `.env.example` to `.env.local` (git-ignored) and fill in:

| Variable | Example | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` | The **publishable** (anon) key. It is meant to be public; never put a secret or service-role key here |

Leave both empty to use Demo Mode.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `dompet` (wallets), `kategori` (categories), and `transaksi` (transactions) tables with:
   - Row Level Security: signed-in users can only access rows where `user_id = auth.uid()`
   - composite foreign keys, so a transaction can only reference the user's own wallets and categories
   - CHECK constraints for amounts and transfer rules, plus indexes
3. Copy the project URL and publishable key into `.env.local`, then restart `npm run dev`.
4. In **Authentication → URL Configuration**, set:
   - **Site URL:** your production URL (e.g. `https://kasku-app.pages.dev`)
   - **Redirect URLs:** `https://kasku-app.pages.dev/**` and `http://localhost:5180/**`

   Confirmation and password-reset links redirect here.
5. Recommended: keep **Confirm email** on (Authentication → Providers → Email) and enable **leaked password protection** where your plan allows it.

## Google sign-in

The **Lanjutkan dengan Google** ("Continue with Google") button appears automatically once the Google provider is enabled in Supabase. No code change or redeploy is needed.

**A. Google Cloud Console**
1. Create or select a project at https://console.cloud.google.com.
2. **Google Auth Platform → Get started**: app name, support email, audience **External**.
3. **Audience → Test users**: add the Google accounts that may sign in while the app is in *Testing*, or click **Publish app** to open it to everyone (only basic email/profile scopes are used).
4. **Clients → Create client** → *Web application*:
   - Authorized JavaScript origins: `https://kasku-app.pages.dev`, `http://localhost:5180`
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client secret**.

**B. Supabase**
1. **Authentication → Providers → Google** → enable.
2. Paste the Client ID and Client secret → **Save**.

A Google account whose email matches an existing email account is linked to it automatically by Supabase.

## Welcome email (Resend)

When an account becomes **confirmed** (email sign-up after clicking the confirmation link, or a Google sign-up right away), the user receives a "Selamat datang di Kasku" (Welcome to Kasku) email via [Resend](https://resend.com).

How it works:
1. The trigger `on_auth_user_terkonfirmasi` on `auth.users` ([`supabase/email-selamat-datang.sql`](supabase/email-selamat-datang.sql)) calls the Edge Function asynchronously through `pg_net`. Sign-up never fails because of email.
2. The Edge Function [`kirim-email-selamat-datang`](supabase/functions/kirim-email-selamat-datang/index.ts) only sends to a user who exists, is confirmed, was created within the last 7 days, and has not been emailed yet. It then stamps `app_metadata.email_selamat_datang_terkirim`, and also sends an idempotency key to Resend, so each user gets the email once. This makes the public function URL safe against abuse.

Edge Function secrets (Supabase → Edge Functions → **Secrets**):

| Secret | Required | Value |
|---|---|---|
| `RESEND_API_KEY` | Yes | API key from resend.com |
| `EMAIL_FROM` | No | Sender, e.g. `Kasku <hello@yourdomain.com>`. Default: `Kasku <onboarding@resend.dev>` |
| `APP_URL` | No | Link used in the email button. Default: `https://kasku-app.pages.dev` |

> The default sender `onboarding@resend.dev` can only deliver to the Resend account owner's address. To email all users, verify your own domain in Resend (Domains → Add domain) and set `EMAIL_FROM` to an address on that domain.

Deploy or update the function with the Supabase CLI:

```bash
supabase functions deploy kirim-email-selamat-datang --no-verify-jwt
```

Delivery can be checked in Supabase → Edge Functions → `kirim-email-selamat-datang` → **Logs**, or in the Resend dashboard → **Emails**.

## Deployment (Cloudflare Pages)

Connect the GitHub repository in Cloudflare → Workers & Pages → Create → Pages → *Connect to Git*, then use:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (type *Text*) |

Every push to `main` triggers a new build. Routing uses `#/…` URLs, so no redirect rules are needed.

## Security notes

- **Public by design:** the Supabase project URL and publishable key appear in the browser bundle. Data protection comes from Row Level Security, not from hiding these values.
- **Secrets live only on servers:** the Resend API key and Google client secret are stored in Supabase; the service-role key is injected by Supabase into the Edge Function at runtime. None of them are in this repository or in the site bundle.
- `.env.local`, `.env`, and `dist/` are git-ignored.

## Project structure

```
├── index.html
├── public/                     # favicon
├── src/
│   ├── App.jsx                 # session check + page routing
│   ├── main.jsx
│   ├── index.css               # design tokens (light/dark), layout, components
│   ├── components/             # Kerangka (app shell), charts, stat cards, inputs, sheet, toast…
│   ├── pages/                  # one file per page
│   └── lib/
│       ├── api.js              # data/auth gateway (Supabase or Demo Mode)
│       ├── supabase.js         # Supabase client from env vars
│       ├── DataContext.jsx     # in-memory app state + actions
│       ├── keuangan.js         # finance logic (pure functions)
│       ├── insight.js          # rule-based insights
│       ├── pencarian.jsx       # shared search keyword
│       ├── rute.js             # tiny hash router
│       └── *.test.js           # unit tests
└── supabase/
    ├── schema.sql              # tables, RLS, indexes, hardening
    ├── email-selamat-datang.sql
    └── functions/kirim-email-selamat-datang/index.ts
```

## Roadmap (phase 2)

Monthly budgets per category, recurring transactions, and multi-month trends.
