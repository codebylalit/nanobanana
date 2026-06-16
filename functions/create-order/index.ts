// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Credit packages configuration with USD base pricing
// Amounts are in the smallest unit (USD cents). INR is computed from FX at runtime.
const CREDIT_PACKAGES = {
  "0d1fe4fa-e8c5-4d0c-8db1-e24c65165615": {
    name: "Starter Pack",
    credits: 15,
    prices: { USD: 400 },
    description: "15 credits = 15 images",
  },
  "3022ce85-ceb2-4fae-9729-a82cf949bcb7": {
    name: "Basic Pack",
    credits: 45,
    prices: { USD: 900 },
    description: "45 credits = 45 images",
  },
  "4917da3b-46a3-41d2-b231-41e17ab1dd7d": {
    name: "Premium Pack",
    credits: 120,
    prices: { USD: 1700 },
    description: "120 credits = 120 images",
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for backend operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── Supabase JWT verification (replaces Firebase token verification) ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: authError } =
      await supabaseClient.auth.getUser(token);

    if (authError || !authUser) {
      console.error("Supabase auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authenticatedUserId = authUser.id;
    console.log("Supabase user verified:", authenticatedUserId);
    // ─────────────────────────────────────────────────────────────────────

    // Get the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { productId, userId, currency, currencyPreference } = requestBody;

    console.log("Request body:", requestBody);
    console.log("Product ID:", productId);
    console.log("User ID:", userId);

    // Validate input
    if (!productId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: productId, userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Security: ensure userId matches the authenticated Supabase user
    if (userId !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "User ID mismatch - unauthorized access" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get package info
    const packageInfo = CREDIT_PACKAGES[productId];
    if (!packageInfo) {
      return new Response(JSON.stringify({ error: "Invalid product ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine currency preference
    const availableCurrencies = ["USD", "INR"];
    const preferredCurrency = (() => {
      const upper = currency?.toUpperCase();
      if (upper && availableCurrencies.includes(upper)) return upper;
      const prefUpper = currencyPreference?.toUpperCase();
      if (prefUpper === "USD" || prefUpper === "INR") return prefUpper;
      return "USD";
    })();

    // Fetch USD->INR FX rate when needed
    async function getUsdToInrRate() {
      try {
        const apiKey = Deno.env.get("FX_API_KEY");
        const url = apiKey
          ? `https://api.exchangerate.host/live?access_key=${apiKey}`
          : "https://api.exchangerate.host/live";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`FX http ${res.status}`);
        const data = await res.json();
        const rate = data?.quotes?.USDINR;
        if (typeof rate === "number" && rate > 0) return rate;
      } catch (_) {}
      return 83.0; // Fallback
    }

    async function tryCreateOrder(chosenCurrency) {
      let amount;
      if (chosenCurrency === "USD") {
        amount = packageInfo.prices.USD;
      } else {
        const usdCents = packageInfo.prices.USD;
        const rate = await getUsdToInrRate();
        amount = Math.round(usdCents * rate);
      }
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            `${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get(
              "RAZORPAY_KEY_SECRET"
            )}`
          )}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: chosenCurrency,
          receipt: `rcpt_${userId.slice(-8)}_${Date.now()
            .toString()
            .slice(-8)}`,
          notes: {
            user_id: userId,
            product_id: productId,
            credits: packageInfo.credits,
          },
        }),
      });
      return { ok: response.ok, response };
    }

    // Try preferred currency, fallback to INR if allowed
    let selectedCurrency = preferredCurrency;
    let orderData = null;
    let attempt = await tryCreateOrder(selectedCurrency);

    if (!attempt.ok) {
      const errorText = await attempt.response.text();
      console.error(
        "Razorpay order creation failed (",
        selectedCurrency,
        "):",
        errorText
      );
      const canFallback =
        !currency &&
        (!currencyPreference || currencyPreference.toUpperCase() === "AUTO");
      const fallbackCurrency = selectedCurrency === "USD" ? "INR" : "USD";
      if (canFallback && availableCurrencies.includes(fallbackCurrency)) {
        console.log("Retrying with fallback currency:", fallbackCurrency);
        selectedCurrency = fallbackCurrency;
        attempt = await tryCreateOrder(selectedCurrency);
      }
    }

    if (!attempt.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    orderData = await attempt.response.json();

    // Store order in database for tracking
    const { error: dbError } = await supabaseClient.from("orders").insert({
      id: orderData.id,
      user_id: userId,
      product_id: productId,
      amount: orderData.amount,
      currency: orderData.currency,
      credits: packageInfo.credits,
      status: "created",
      razorpay_order_id: orderData.id,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to store order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return order data to frontend
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          receipt: orderData.receipt,
          packageInfo,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
