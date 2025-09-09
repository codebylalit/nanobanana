// No need to import supabase for authentication since we're using Firebase

// Razorpay configuration
const RAZORPAY_KEY_ID =
  process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_live_m1qfDdgI9r1AGQ"; // Replace with your actual key

// Supabase configuration
const SUPABASE_URL = "https://ldiwitjpdmekzwxwxklk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXdpdGpwZG1la3p3eHd4a2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjI2MjYsImV4cCI6MjA3Mjg5ODYyNn0.ObaL7HjNvMxEEAdj405BdK1YIE5TT8gVOnVLCdv-NFs";

// Edge Function URLs
const CREATE_ORDER_URL = `${SUPABASE_URL}/functions/v1/create-order`;
const VERIFY_PAYMENT_URL = `${SUPABASE_URL}/functions/v1/verify`;

// Credit packages configuration
export const CREDIT_PACKAGES = {
  "0d1fe4fa-e8c5-4d0c-8db1-e24c65165615": {
    name: "Starter Pack",
    credits: 15,
    price: 400, // $4.00
    currency: "USD",
    description: "15 credits = 15 images",
  },
  "3022ce85-ceb2-4fae-9729-a82cf949bcb7": {
    name: "Basic Pack",
    credits: 45,
    price: 900, // $9.00
    currency: "USD",
    description: "45 credits = 45 images",
  },
  "4917da3b-46a3-41d2-b231-41e17ab1dd7d": {
    name: "Premium Pack",
    credits: 120,
    price: 1700, // $17.00
    currency: "USD",
    description: "120 credits = 120 images",
  },
};

// Create Razorpay order using backend API
export const createRazorpayOrder = async (productId, user) => {
  const packageInfo = CREDIT_PACKAGES[productId];
  if (!packageInfo) {
    throw new Error("Invalid product ID");
  }

  if (!user || !user.uid) {
    throw new Error("User not authenticated");
  }

  try {
    // Get Firebase ID token for authentication
    const idToken = await user.getIdToken();

    // Call backend API to create order
    const response = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        productId,
        userId: user.uid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create order");
    }

    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Failed to create payment order. Please try again.");
  }
};

// Initialize Razorpay payment
export const initializeRazorpayPayment = (
  order,
  user,
  onSuccess,
  onError,
  { onOpen, onDismiss } = {}
) => {
  if (!window.Razorpay) {
    onError(new Error("Razorpay not loaded"));
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: "Nano Banana",
    description: order.packageInfo.description,
    order_id: order.id,
    prefill: {
      name: user.displayName || user.email,
      email: user.email,
    },
    theme: {
      color: "#EAB308", // Yellow color matching the app theme
    },
    handler: async (response) => {
      try {
        // Call backend API to verify payment
        const verification = await verifyPayment(response, user);

        if (verification.success) {
          onSuccess({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            packageInfo: order.packageInfo,
            credits: verification.credits,
          });
        } else {
          throw new Error(verification.error || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        onError(error);
      }
    },
    modal: {
      ondismiss: () => {
        console.log("Payment modal dismissed");
      },
    },
  };

  const razorpayInstance = new window.Razorpay(options);
  try {
    if (typeof onOpen === "function") {
      onOpen();
    }
  } catch (_) {}
  razorpayInstance.open();
  // Hook modal dismiss to external callback
  if (options.modal && typeof onDismiss === "function") {
    const originalDismiss = options.modal.ondismiss;
    options.modal.ondismiss = () => {
      try {
        onDismiss();
      } catch (_) {}
      if (typeof originalDismiss === "function") originalDismiss();
    };
  }
};

// Verify payment using backend API
export const verifyPayment = async (paymentData, user) => {
  try {
    // Get Firebase ID token for authentication
    const idToken = await user.getIdToken();

    // Extract payment data from Razorpay response
    const orderId = paymentData.razorpay_order_id;
    const paymentId = paymentData.razorpay_payment_id;
    const signature = paymentData.razorpay_signature;

    console.log("Verifying payment with data:", {
      orderId,
      paymentId,
      signature: signature?.substring(0, 10) + "...",
    });

    // Call backend API to verify payment
    const response = await fetch(VERIFY_PAYMENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        orderId: orderId,
        paymentId: paymentId,
        signature: signature,
        userId: user.uid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Payment verification failed");
    }

    const data = await response.json();
    return {
      success: data.success,
      credits: data.credits,
      error: data.error,
    };
  } catch (error) {
    console.error("Payment verification failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Load Razorpay script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
