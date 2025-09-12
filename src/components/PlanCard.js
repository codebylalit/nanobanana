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
  bullets,
  productId,
  ctaLabel,
}) {
  const { user } = useAuth();
  const { fetchCredits } = useCredits();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [, setPaymentError] = React.useState(null);
  const { show } = useToast();
  const [currency, setCurrency] = React.useState("USD");
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
      if (!scriptLoaded) throw new Error("Failed to load Razorpay script");

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

  return (
    <div
      className={`relative rounded-2xl p-3 sm:p-5 lg:p-6 border transition-all duration-300 hover:scale-105 ${
        highlight
          ? "border-yellow-300 bg-yellow-50 shadow-[0_0_0_4px_rgba(234,179,8,0.15)]"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-md">
          Best Value
        </div>
      )}

      {/* Badge */}
      <div className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gray-100 text-gray-800 mb-3 sm:mb-5">
        <HiOutlineLightningBolt className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="font-semibold">{badge}</span>
      </div>

      {/* Title & Price */}
      <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900">
        {title}
      </h3>
      <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-yellow-500 mb-1 sm:mb-2">
        {priceInfo.display}
      </div>
      {priceInfo.perImage && (
        <div className="text-yellow-700 text-xs sm:text-sm mb-2 sm:mb-3 font-semibold">
          {priceInfo.perImage}
        </div>
      )}
      <div className="text-gray-800 text-sm sm:text-base mb-4 sm:mb-6 font-medium">
        {summary}
      </div>

      {/* Bullets */}
      <ul className="space-y-1 sm:space-y-2 mb-4 sm:mb-6 text-gray-700 text-xs sm:text-sm">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-1 sm:gap-2">
            <HiOutlineCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* Payment method selector */}
      <div className="mb-3 sm:mb-4">
        <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
          Payment method
        </div>
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={`${
              currency === "USD"
                ? "bg-yellow-400 text-black"
                : "bg-white text-gray-800"
            } px-2 sm:px-3 py-1 sm:py-2 font-semibold transition-colors`}
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
            } px-2 sm:px-3 py-1 sm:py-2 font-semibold border-l border-gray-300 transition-colors`}
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
          className={`w-full inline-flex items-center justify-center rounded-xl sm:rounded-2xl font-bold px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm lg:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            highlight
              ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-md hover:shadow-yellow-400/25"
              : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          {isProcessing ? "Processing..." : ctaLabel}
        </button>
      ) : (
        <a
          href="/auth"
          onClick={(e) => {
            e.preventDefault();
            navigate("/auth");
          }}
          className={`w-full inline-flex items-center justify-center rounded-xl sm:rounded-2xl font-bold px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm lg:text-base transition-all duration-200 ${
            highlight
              ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-md hover:shadow-yellow-400/25"
              : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
}
