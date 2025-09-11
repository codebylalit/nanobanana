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
} as const;

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

    // Debug logging
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

    // Get package info
    const packageInfo = CREDIT_PACKAGES[productId];
    if (!packageInfo) {
      return new Response(JSON.stringify({ error: "Invalid product ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine currency preference
    // priority: explicit currency -> currencyPreference -> AUTO
    const availableCurrencies = ["USD", "INR"] as Array<"USD" | "INR">;
    const preferredCurrency = ((): "USD" | "INR" => {
      const upper = (currency as string | undefined)?.toUpperCase();
      if (upper && (availableCurrencies as readonly string[]).includes(upper)) {
        return upper as "USD" | "INR";
      }
      const prefUpper = (
        currencyPreference as string | undefined
      )?.toUpperCase();
      if (prefUpper === "USD" || prefUpper === "INR") return prefUpper;
      return availableCurrencies.includes("USD") ? "USD" : "INR";
    })();

    // Fetch USD->INR FX rate when needed
    async function getUsdToInrRate(): Promise<number> {
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
      // Fallback default if API fails
      return 83.0;
    }

    async function tryCreateOrder(chosenCurrency: "USD" | "INR") {
      let amount: number;
      if (chosenCurrency === "USD") {
        amount = packageInfo.prices.USD;
      } else {
        const usdCents = packageInfo.prices.USD;
        const rate = await getUsdToInrRate();
        // Convert USD cents to INR paise
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
      return { ok: response.ok, response } as const;
    }

    // Try preferred currency, then fallback to INR if allowed
    let selectedCurrency: "USD" | "INR" = preferredCurrency;
    let orderData: any = null;
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
      if (
        canFallback &&
        availableCurrencies.includes(fallbackCurrency as any)
      ) {
        console.log(
          "Retrying order creation with fallback currency:",
          fallbackCurrency
        );
        selectedCurrency = fallbackCurrency as any;
        attempt = await tryCreateOrder(selectedCurrency);
      }
    }

    if (!attempt.ok) {
      // Final failure
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
