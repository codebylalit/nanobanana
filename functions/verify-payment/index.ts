// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Verify Razorpay signature using HMAC-SHA256
async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const body = orderId + "|" + paymentId;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signature === expectedSignature;
}

serve(async (req) => {
  console.log("=== VERIFY PAYMENT CALLED ===", new Date().toISOString());

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
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

    // Parse request body
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

    const { orderId, paymentId, signature, userId } = requestBody;
    console.log("Request body parsed:", {
      orderId,
      paymentId,
      signature: signature?.substring(0, 10) + "...",
      userId,
    });

    // Validate input
    if (!orderId || !paymentId || !signature || !userId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: orderId, paymentId, signature, userId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Security: ensure userId in body matches the authenticated Supabase user
    if (userId !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "User ID mismatch - unauthorized access" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get order from database
    console.log("Looking for order:", { orderId, userId });
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", orderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", { orderError, orderId, userId });
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Order found:", {
      orderId: order.id,
      credits: order.credits,
      status: order.status,
    });

    // Already processed?
    if (order.status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already processed",
          credits: order.credits,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify Razorpay signature
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const isValidSignature = await verifySignature(
      orderId,
      paymentId,
      signature,
      razorpaySecret
    );

    if (!isValidSignature) {
      console.error("Signature verification failed for:", { orderId, paymentId });
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Signature verification successful");

    // Verify payment with Razorpay API
    console.log("Calling Razorpay API to verify payment:", paymentId);
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(
            `${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get(
              "RAZORPAY_KEY_SECRET"
            )}`
          )}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Razorpay API response status:", razorpayResponse.status);

    let paymentData: any = null;
    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay API error:", errorText);
      try {
        paymentData = JSON.parse(errorText);
      } catch (_) {}
    } else {
      paymentData = await razorpayResponse.json();
    }

    console.log("Razorpay payment data:", {
      status: paymentData?.status,
      amount: paymentData?.amount,
    });

    // Payment must be captured
    if (!paymentData || paymentData.status !== "captured") {
      const failureCode = paymentData?.error_code || paymentData?.error?.code;
      const failureReason =
        paymentData?.error_description ||
        paymentData?.error?.description ||
        paymentData?.status ||
        "Payment not successful";

      // Save failure details to order
      await supabaseClient
        .from("orders")
        .update({
          status: "failed",
          payment_status: paymentData?.status ?? null,
          failure_code: failureCode ?? null,
          failure_reason: failureReason ?? null,
        })
        .eq("razorpay_order_id", orderId)
        .eq("user_id", userId);

      console.error("Payment not captured:", {
        status: paymentData?.status,
        failureCode,
        failureReason,
      });

      return new Response(
        JSON.stringify({ error: failureReason || "Payment not successful" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Payment verified with Razorpay successfully");

    // Update order status to completed
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: "completed",
        payment_status: paymentData.status,
        payment_id: paymentId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Order status updated to completed");

    // Add credits to user account via RPC
    console.log("Adding credits:", { userId, credits: order.credits });
    const { error: creditsError } = await supabaseClient.rpc("add_credits", {
      p_user_id: userId,
      p_amount: order.credits,
    });

    if (creditsError) {
      console.error("Error adding credits:", creditsError);
      return new Response(
        JSON.stringify({ error: "Failed to add credits" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Credits added successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        credits: order.credits,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
