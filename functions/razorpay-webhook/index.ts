import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Verify Razorpay webhook signature
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body + secret)
  );

  const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedSignatureHex;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Verify webhook signature
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
    const isValidSignature = await verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the webhook payload
    const event = JSON.parse(body);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event, supabaseClient);
        break;

      case "payment.failed":
        await handlePaymentFailed(event, supabaseClient);
        break;

      case "order.paid":
        await handleOrderPaid(event, supabaseClient);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handlePaymentCaptured(event: any, supabaseClient: any) {
  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;

  console.log(`Payment captured for order: ${orderId}`);

  // Find the order in database
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .single();

  if (orderError || !order) {
    console.error("Order not found:", orderId);
    return;
  }

  // Update order status
  await supabaseClient
    .from("orders")
    .update({
      status: "completed",
      payment_id: payment.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  // Add credits to user account
  await supabaseClient.rpc("add_credits", {
    p_user_id: order.user_id,
    p_amount: order.credits,
  });

  console.log(`Credits added for user: ${order.user_id}`);
}

async function handlePaymentFailed(event: any, supabaseClient: any) {
  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;

  console.log(`Payment failed for order: ${orderId}`);

  // Update order status
  await supabaseClient
    .from("orders")
    .update({
      status: "failed",
      payment_id: payment.id,
      completed_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", orderId);
}

async function handleOrderPaid(event: any, supabaseClient: any) {
  const order = event.payload.order.entity;
  const orderId = order.id;

  console.log(`Order paid: ${orderId}`);

  // Find the order in database
  const { data: dbOrder, error: orderError } = await supabaseClient
    .from("orders")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .single();

  if (orderError || !dbOrder) {
    console.error("Order not found:", orderId);
    return;
  }

  // Update order status
  await supabaseClient
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", dbOrder.id);

  // Add credits to user account
  await supabaseClient.rpc("add_credits", {
    p_user_id: dbOrder.user_id,
    p_amount: dbOrder.credits,
  });

  console.log(`Credits added for user: ${dbOrder.user_id}`);
}
