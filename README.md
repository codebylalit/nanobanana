# Nano Banana – AI Image Generator

Create epic AI images in seconds. Turn text into visuals, transform photos, remove backgrounds, edit with text, and generate professional headshots — all powered by Google AI/Gemini. Credits never expire.

Demo/Prod: `https://nenobanana.site/`

## Features

- Text → Image generator
- Image → Image transformation
- AI headshot generator
- Background removal
- In‑browser image editor
- Prompt Helper: suggest ideas, improve prompts, beat writer's block
- Credit system: pay‑per‑generation, credits never expire
- Auth, profile, credit history

## Tech Stack

- React (Create React App), React Router, TailwindCSS
- Supabase (Edge Functions, Postgres, RLS)
- Firebase Auth (client auth + ID tokens)
- Razorpay (payments) via Supabase Edge Functions
- Google AI/Gemini (generation UX; swap in official API when ready)

## Quick Start

1. Clone and install

```bash
git clone <repo>
cd nanobanana
npm install
```

1. Create `.env` in project root

```env
REACT_APP_SUPABASE_URL=https://<your-project>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>
REACT_APP_GEMINI_API_KEY=<your-google-ai-key>

# Firebase Auth (Email/Password or providers)
REACT_APP_FIREBASE_API_KEY=<firebase-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<project-id>
REACT_APP_FIREBASE_APP_ID=<app-id>

# Payments (Razorpay)
REACT_APP_RAZORPAY_KEY_ID=<your-razorpay-key>
```

1. Run

```bash
npm start
```sql

Open `http://localhost:3000`.

## Environment & Configuration

The app expects the env vars above at build/runtime. Some defaults exist in code for local dev; always override with your own values in production.

Supabase Edge Functions (example names):

- `functions/v1/create-order` – create Razorpay order
- `functions/v1/verify` – verify payment, add credits

Update the Supabase URL in `src/services/paymentService.js` or, preferably, refactor to read from `REACT_APP_SUPABASE_URL`.

## Database (Supabase SQL)

```sql
create table if not exists public.users (
  id text primary key,
  credits integer not null default 0
);

create or replace function public.add_credits(p_user_id text, p_amount int)
returns void
language plpgsql security definer as $$
begin
  update public.users set credits = credits + p_amount where id = p_user_id;
end;
$$;

create or replace function public.consume_credits(p_user_id text, p_amount int)
returns boolean
language plpgsql security definer as $$
declare ok boolean := false;
begin
  update public.users set credits = credits - p_amount
  where id = p_user_id and credits >= p_amount;
  get diagnostics ok = row_count > 0;
  return ok;
end;
$$;
```bash

Recommended RLS (pseudocode):

- Enable RLS on `public.users`
- Policy: users can `select`/`update` their own row where `id = auth.uid()`
- Credit mutations should be done via `security definer` functions only

## Prompt Helper

- Suggests prompt ideas based on your current text
- One‑click “Improve Prompt” to enhance clarity and style
- Integrated throughout the `TextToImagePage` for quick iteration

## Payments Flow (Razorpay + Supabase)

1. User chooses a credit pack in Pricing
2. Client requests `create-order` Edge Function (auth via Firebase ID token)
3. Open Razorpay checkout with returned order id
4. On success, call `verify` Edge Function to validate and add credits via `add_credits`

Credit packs (default): 15, 45, 120. Adjust in `src/services/paymentService.js`.

## Scripts

```bash
npm start      # dev server
npm test       # tests
npm run build  # production build
```

## Deployment

- Any static host (Netlify, Vercel, Cloudflare Pages)
- Set env vars in hosting dashboard
- Ensure public URLs (SEO/OpenGraph) point to your domain in `public/index.html`

## Security Notes

- Do not commit API keys; use env vars
- Keep Supabase `anon` key public but restricted by RLS
- Use Edge Functions for any credit mutation or payment verification

## Roadmap

- Swap placeholder Gemini client with official Google AI Images API
- Replace hardcoded URLs with env‑driven config
- More editing tools and styles

## License

MIT
