import React from "react";
import { useAuth } from "../authContext";
import { useCredits } from "../creditsContext";
import { useToast } from "../toastContext";
import { useNavigate } from "react-router-dom";
import { HiOutlineLightningBolt, HiOutlineCheck } from "react-icons/hi";
import {
  createRazorpayOrder,
  initializeRazorpayPayment,
  loadRazorpayScript,
  getPackagePriceInfo,
} from "../services/paymentService";

export default function PlanCard({
  badge,
  highlight,
  title,
  price,
  summary,
  priceSub,
  bullets,
  productId,
  ctaLabel
}) {
  const { user } = useAuth();
  const { fetchCredits } = useCredits();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(false);
  // kept for potential logging; UI feedback via toasts
  const [, setPaymentError] = React.useState(null);
  const { show } = useToast();
  const [currency, setCurrency] = React.useState("USD"); // USD | INR
  const [priceInfo, setPriceInfo] = React.useState({
    display: price,
    perImage: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await getPackagePriceInfo(productId, currency);
        if (!cancelled) setPriceInfo(info);
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, currency]);

  const handlePayment = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }

      const order = await createRazorpayOrder(productId, user, {
        currency,
        currencyPreference: currency,
      });

      initializeRazorpayPayment(
        order,
        user,
        async (paymentData) => {
          try {
            await fetchCredits();
            navigate("/dashboard-pricing?payment=success");
            show({
              title: "Payment successful",
              message: "Your credits were added to your account.",
              type: "success",
            });
          } catch (error) {
            setPaymentError(error.message);
            show({
              title: "Credits update error",
              message: "Payment captured but updating credits failed.",
              type: "error",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        (error) => {
          setPaymentError("Payment failed. Please try again.");
          show({
            title: "Payment failed",
            message: "The transaction did not complete. Please try again.",
            type: "error",
          });
          setIsProcessing(false);
        },
        {
          onOpen: () => {
            show({
              title: "Opening checkout",
              message: "Launching secure Razorpay widget...",
              type: "info",
            });
          },
          onDismiss: () => {
            show({
              title: "Checkout closed",
              message: "You can try again when ready.",
              type: "warning",
            });
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      setPaymentError(error.message);
      show({
        title: "Payment error",
        message: error.message || "Unexpected error during payment.",
        type: "error",
      });
      setIsProcessing(false);
    }
  };

  // Inline status removed

  return (
    <div
      className={`relative rounded-3xl p-4 sm:p-6 lg:p-8 border transition-all duration-300 hover:scale-105 ${
        highlight
          ? "border-yellow-300 bg-yellow-50 shadow-[0_0_0_4px_rgba(234,179,8,0.15)]"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {highlight ? (
        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg">
          Best Value
        </div>
      ) : null}

      {/* Badge */}
      <div className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gray-100 text-gray-800 mb-4 sm:mb-6">
        <HiOutlineLightningBolt className="w-4 h-4" />
        <span className="font-semibold">{badge}</span>
      </div>

      {/* Title & Price */}
      <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900">
        {title}
      </h3>
      <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-yellow-500 mb-1 sm:mb-2">
        {priceInfo.display}
      </div>
      <div className="text-yellow-700 text-xs sm:text-sm mb-2 sm:mb-3 font-semibold">
        {priceInfo.perImage}
      </div>
      <div className="text-gray-800 text-base sm:text-lg mb-6 sm:mb-8 font-medium">
        {summary}
      </div>
      {/* priceSub removed in favor of dynamic per-image */}

      {/* Bullets */}
      <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-gray-700 text-sm sm:text-base">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 sm:gap-3">
            <HiOutlineCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* Status messages replaced by toasts */}

      {/* Payment method selector */}
      <div className="mb-4 sm:mb-6">
        <div className="text-sm font-semibold text-gray-800 mb-2">
          Payment method
        </div>
        <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={`${
              currency === "USD"
                ? "bg-yellow-400 text-black"
                : "bg-white text-gray-800"
            } px-4 py-2 text-sm font-bold transition-colors`}
          >
            International
          </button>
          <button
            type="button"
            onClick={() => setCurrency("INR")}
            className={`${
              currency === "INR"
                ? "bg-yellow-400 text-black"
                : "bg-white text-gray-800"
            } px-4 py-2 text-sm font-bold border-l border-gray-300 transition-colors`}
          >
            UPI
          </button>
        </div>
      </div>

      {/* Payment button */}
      {user ? (
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full inline-flex items-center justify-center rounded-2xl font-bold px-4 sm:px-6 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
      ${
        highlight
          ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-xl hover:shadow-yellow-400/25"
          : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      }`}
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            ctaLabel // 👈 dynamic text here
          )}
        </button>
      ) : (
        <a
          href="/auth"
          onClick={(e) => {
            e.preventDefault();
            navigate("/auth");
          }}
          className={`w-full inline-flex items-center justify-center rounded-2xl font-bold px-4 sm:px-6 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg transition-all duration-200
      ${
        highlight
          ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-xl hover:shadow-yellow-400/25"
          : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      }`}
        >
          {ctaLabel} {/* 👈 same dynamic text */}
        </a>
      )}
    </div>
  );
}
