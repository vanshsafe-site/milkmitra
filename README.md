# MilkMitra

Smart milk collection, fair payment for every farmer. Operators register farmers (auto ID + QR), record each
collection (litres, fat, SNF), the rate and amount are calculated automatically, and dues are tracked and paid.

**Stack:** React 18 + Vite, React Router, Recharts, qrcode.react · Supabase (Postgres, Auth, Row Level Security)

## Setup
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it.
3. (Dev convenience) **Authentication > Providers > Email**: turn off "Confirm email" to log in right after sign up.
4. `cp .env.example .env` and fill in your Project URL and anon key (Project Settings > API).
5. `npm install` then `npm run dev`
6. Open the app, **Get Started > Create an account**, then Settings (optional rates), Farmers, Collection.

## Pages
| Route | Purpose |
|---|---|
| `/` | Landing page, live centre stats when logged in |
| `/dashboard` | KPIs, 7-day morning/evening chart, recent collections |
| `/farmers` | Register farmer, unique ID `SMCC0001…`, QR code, farmer list |
| `/collection` | Entry form, auto rate `Fat% × 7 + SNF% × 1.6`, amount = litres × rate |
| `/records` | Full history, All/Paid/Pending filter, farmer search, click a status to toggle |
| `/payments` | Pending dues grouped by farmer, one-click settle |
| `/settings` | Centre name and fat/SNF prices |

## Deploy
Vercel: import the repo, add the two `VITE_SUPABASE_*` env vars. `vercel.json` handles SPA routing.

## Security notes
All tables use RLS (`owner_id = auth.uid()`), so each operator only sees their own centre. Bank account numbers are
stored in plain text columns protected by RLS; for production consider Supabase Vault or column encryption.
