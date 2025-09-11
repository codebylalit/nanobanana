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
import { serve } from "<https://deno.land/std@0.168.0/http/server.ts>";
import { createClient } from "<https://esm.sh/@supabase/supabase-js@2>";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Credit packages configuration
const CREDIT_PACKAGES = {
  "0d1fe4fa-e8c5-4d0c-8db1-e24c65165615": {
    name: "Starter Pack",
    credits: 15,
    price: 400,
    currency: "USD",
    description: "15 credits = 15 images"
  },
  "3022ce85-ceb2-4fae-9729-a82cf949bcb7": {
    name: "Basic Pack",
    credits: 45,
    price: 900,
    currency: "USD",
    description: "45 credits = 45 images"
  },
  "4917da3b-46a3-41d2-b231-41e17ab1dd7d": {
    name: "Premium Pack",
    credits: 120,
    price: 1700,
    currency: "USD",
    description: "120 credits = 120 images"
  }
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // Initialize Supabase client with service role key for backend operations
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // Get the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(JSON.stringify({
        error: "Invalid JSON in request body"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { productId, userId } = requestBody;
    // Debug logging
    console.log("Request body:", requestBody);
    console.log("Product ID:", productId);
    console.log("User ID:", userId);
    // Validate input
    if (!productId || !userId) {
      return new Response(JSON.stringify({
        error: "Missing required fields: productId, userId"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Get package info
    const packageInfo = CREDIT_PACKAGES[productId];
    if (!packageInfo) {
      return new Response(JSON.stringify({
        error: "Invalid product ID"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Create Razorpay order using their API
    const razorpayResponse = await fetch("<https://api.razorpay.com/v1/orders>", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get("RAZORPAY_KEY_SECRET")}`)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: packageInfo.price,
        currency: packageInfo.currency,
        receipt: `rcpt_${userId.slice(-8)}_${Date.now().toString().slice(-8)}`,
        notes: {
          user_id: userId,
          product_id: productId,
          credits: packageInfo.credits
        }
      })
    });
    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error("Razorpay order creation failed:", errorData);
      return new Response(JSON.stringify({
        error: "Failed to create payment order"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const orderData = await razorpayResponse.json();
    // Store order in database for tracking
    const { error: dbError } = await supabaseClient.from("orders").insert({
      id: orderData.id,
      user_id: userId,
      product_id: productId,
      amount: packageInfo.price,
      currency: packageInfo.currency,
      credits: packageInfo.credits,
      status: "created",
      razorpay_order_id: orderData.id,
      created_at: new Date().toISOString()
    });
    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({
        error: "Failed to store order"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Return order data to frontend
    return new Response(JSON.stringify({
      success: true,
      order: {
        id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        packageInfo
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
