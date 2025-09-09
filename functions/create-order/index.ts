// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Credit packages configuration
const CREDIT_PACKAGES = {
  "0d1fe4fa-e8c5-4d0c-8db1-e24c65165615": {
    name: "Starter Pack",
    credits: 15,
    price: 20, // Price in cents ($0.20) - test
    currency: "USD",
    description: "15 credits = 15 images",
  },
  "3022ce85-ceb2-4fae-9729-a82cf949bcb7": {
    name: "Basic Pack",
    credits: 45,
    price: 900, // Price in cents ($9.00)
    currency: "USD",
    description: "45 credits = 45 images",
  },
  "4917da3b-46a3-41d2-b231-41e17ab1dd7d": {
    name: "Premium Pack",
    credits: 120,
    price: 1700, // Price in cents ($17.00)
    currency: "USD",
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

    const { productId, userId } = requestBody;

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

    // Create Razorpay order using their API
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
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
        amount: packageInfo.price,
        currency: packageInfo.currency,
        receipt: `rcpt_${userId.slice(-8)}_${Date.now().toString().slice(-8)}`,
        notes: {
          user_id: userId,
          product_id: productId,
          credits: packageInfo.credits,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error("Razorpay order creation failed:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
