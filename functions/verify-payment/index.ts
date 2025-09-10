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

  // Create HMAC-SHA256 signature
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
  console.log(
    "=== VERIFY PAYMENT FUNCTION CALLED ===",
    new Date().toISOString()
  );

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

    // Verify Firebase authentication
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

    const firebaseToken = authHeader.split("Bearer ")[1];

    // Verify Firebase token with Firebase Admin SDK
    const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID");
    if (!firebaseProjectId) {
      console.error("FIREBASE_PROJECT_ID environment variable not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const firebaseVerifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get(
      "FIREBASE_WEB_API_KEY"
    )}`;

    let firebaseUserId: string;

    try {
      const firebaseResponse = await fetch(firebaseVerifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: firebaseToken,
        }),
      });

      if (!firebaseResponse.ok) {
        console.error(
          "Firebase token verification failed:",
          await firebaseResponse.text()
        );
        return new Response(
          JSON.stringify({ error: "Invalid authentication token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const firebaseData = await firebaseResponse.json();
      firebaseUserId = firebaseData.users?.[0]?.localId;

      if (!firebaseUserId) {
        return new Response(JSON.stringify({ error: "Invalid user token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Firebase user verified:", firebaseUserId);
    } catch (error) {
      console.error("Error verifying Firebase token:", error);
      return new Response(
        JSON.stringify({ error: "Authentication verification failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
          error:
            "Missing required fields: orderId, paymentId, signature, userId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify that the userId matches the authenticated Firebase user
    if (userId !== firebaseUserId) {
      return new Response(
        JSON.stringify({
          error: "User ID mismatch - unauthorized access",
        }),
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

    // Check if order is already processed
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

    // Verify payment signature
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    console.log("Verifying signature for:", {
      orderId,
      paymentId,
      signature: signature.substring(0, 10) + "...",
    });

    const isValidSignature = await verifySignature(
      orderId,
      paymentId,
      signature,
      razorpaySecret
    );

    if (!isValidSignature) {
      console.error("Signature verification failed for:", {
        orderId,
        paymentId,
      });
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
      // Try to parse JSON if possible
      try {
        paymentData = JSON.parse(errorText);
      } catch (_) {}
    } else {
      paymentData = await razorpayResponse.json();
    }
    console.log("Razorpay payment data:", {
      status: paymentData.status,
      amount: paymentData.amount,
    });

    // Check if payment is successful
    if (!paymentData || paymentData.status !== "captured") {
      const failureCode = paymentData?.error_code || paymentData?.error?.code;
      const failureReason =
        paymentData?.error_description ||
        paymentData?.error?.description ||
        paymentData?.status ||
        "Payment not successful";

      // Update order with failure details
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

      console.error("Payment not captured", {
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

    console.log("Payment verified with Razorpay API successfully");

    // Update order status
    console.log("Updating order status:", { orderId: order.id, paymentId });
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

    console.log("Order status updated successfully");

    // Add credits to user account
    console.log("Adding credits:", { userId, credits: order.credits });

    // First, check if user exists
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from("users")
      .select("id, credits")
      .eq("id", userId)
      .single();

    console.log("User check result:", { existingUser, userCheckError });

    const { error: creditsError } = await supabaseClient.rpc("add_credits", {
      p_user_id: userId,
      p_amount: order.credits,
    });

    if (creditsError) {
      console.error("Error adding credits:", creditsError);
      return new Response(JSON.stringify({ error: "Failed to add credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Credits added successfully");

    // Verify credits were added
    const { data: updatedUser, error: verifyError } = await supabaseClient
      .from("users")
      .select("id, credits")
      .eq("id", userId)
      .single();

    console.log("Credits verification:", { updatedUser, verifyError });

    // Return success response
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
