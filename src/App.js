import React from "react";
import "./App.css";
import "./index.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./authContext";
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineBadgeCheck,
} from "react-icons/hi";
import { HiOutlineSparkles } from "react-icons/hi2";
import TextToImagePage from "./pages/TextToImagePage";
import ImageToImagePage from "./pages/ImageToImagePage";
import HeadshotPage from "./pages/HeadshotPage";
import BackgroundRemovalPage from "./pages/BackgroundRemovalPage";
import ImageEditorPage from "./pages/ImageEditorPage";
import PreviousImagesPage from "./pages/PreviousImagesPage";
import AuthPage from "./pages/AuthPage";
import CreditHistoryPage from "./pages/CreditHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ContactPage from "./pages/ContactPage";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Gallery from "./components/Gallery";
import HowCreditsWork from "./components/HowCreditsWork";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";
import PromptHelper from "./components/PromptHelper";
import PlanCard from "./components/PlanCard";
import DashboardLayout from "./layouts/DashboardLayout";
// Payments removedl nvcz
function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Routes>
        <Route path="/" element={<PublicLanding />} />
        <Route
          path="/text-to-image"
          element={
            <RequireAuth>
              <DashboardLayout>
                <TextToImagePage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/image-to-image"
          element={
            <RequireAuth>
              <DashboardLayout>
                <ImageToImagePage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/headshot-generator"
          element={
            <RequireAuth>
              <DashboardLayout>
                <HeadshotPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/background-removal"
          element={
            <RequireAuth>
              <DashboardLayout>
                <BackgroundRemovalPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/image-editor"
          element={
            <RequireAuth>
              <DashboardLayout>
                <ImageEditorPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/previous-images"
          element={
            <RequireAuth>
              <DashboardLayout>
                <PreviousImagesPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/credit-history"
          element={
            <RequireAuth>
              <DashboardLayout>
                <CreditHistoryPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard-pricing"
          element={
            <RequireAuth>
              <DashboardLayout>
                <DashboardPricingPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// Placeholder removed (unused)

function PublicLanding() {
  return (
    <div>
      <Navbar />
      <main>
        <Hero />
        <PromptHelper />
        <Gallery />
        <HowCreditsWork />
        <Pricing />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-white/70">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

// legacy landing generator removed in favor of TextToImagePage

// NeedCreditsCard removed (unused)

function PricingPage() {
  const [showSuccess, setShowSuccess] = React.useState(false);
  React.useEffect(() => {
    if (window.location.hash === "#success") {
      setShowSuccess(true);
      // Clean up the hash so refreshes don't re-show
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 xl:py-32">
        {showSuccess && (
          <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border border-green-400/30 bg-gradient-to-r from-green-400/10 to-emerald-400/5 p-3 sm:p-4 text-green-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <HiOutlineSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-base sm:text-lg">
                  Payment successful
                </h3>
                <p className="text-sm sm:text-base">
                  Your credits were added. If you don't see them yet, wait a few
                  seconds.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-gray-900">
            Choose your plan
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-2">
            Simple pricing. Credits never expire. Start creating amazing AI
            images today.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          <div className="w-full">
            <PlanCard
              badge="Starter Pack"
              title="Try It Out"
              price="$4"
              summary="15 credits = 15 images"
              priceSub="$0.27 per image"
              bullets={[
                "15 premium credits",
                "High-quality images",
                "All generation types",
                "Prompt Helper access",
                "Credits never expire",
              ]}
              productId="0d1fe4fa-e8c5-4d0c-8db1-e24c65165615"
              ctaLabel="Start Creating"
            />
          </div>
          <div className="w-full">
            <PlanCard
              badge="Basic Pack"
              title="Most Popular"
              price="$9"
              summary="45 credits = 45 images"
              priceSub="$0.20 per image"
              bullets={[
                "45 premium credits",
                "High-quality images",
                "All generation types",
                "Prompt Helper access",
                "Credits never expire",
              ]}
              productId="3022ce85-ceb2-4fae-9729-a82cf949bcb7"
              ctaLabel="Go Pro"
            />
          </div>
          <div className="w-full md:col-span-2 lg:col-span-1">
            <PlanCard
              badge="Premium Pack"
              highlight="Best Value"
              title="Best Value"
              price="$17"
              summary="120 credits = 120 images"
              priceSub="$0.14 per image - Best Deal!"
              bullets={[
                "120 premium credits",
                "High-quality images",
                "All generation types",
                "Prompt Helper access",
                "Credits never expire",
              ]}
              productId="4917da3b-46a3-41d2-b231-41e17ab1dd7d"
              ctaLabel="Unlock Best Value"
            />
          </div>
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">
              Need help choosing?
            </h3>
            <p className="text-gray-700 text-base sm:text-lg mb-4 sm:mb-6">
              All plans include access to all AI tools. Credits never expire, so
              you can use them whenever you want.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-black font-bold px-4 sm:px-6 py-3 text-sm sm:text-base hover:bg-yellow-300 hover:scale-105 transition-all duration-200"
              >
                <HiOutlineBadgeCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                Try It Out
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <HiOutlineQuestionMarkCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Landing section wrapper reusing the PricingPage content
function Pricing() {
  return (
    <section
      id="pricing"
      className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-white to-gray-50"
    >
      <PricingPage />
    </section>
  );
}

function DashboardPricingPage() {
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    // Check for payment success in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment") === "success") {
      setShowSuccess(true);
      // Clean up the URL parameter
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
      {showSuccess && (
        <div className="mb-3 sm:mb-4 lg:mb-6 rounded-xl sm:rounded-2xl border border-green-200 bg-green-50 p-3 sm:p-4 text-green-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <HiOutlineSparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base lg:text-lg">
                Payment successful!
              </h3>
              <p className="text-green-700/90 text-xs sm:text-sm lg:text-base">
                Your credits have been added to your account. You can now
                continue creating amazing AI images.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4 text-gray-900">
          Buy Credits
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed">
          Choose a plan to get more credits and continue creating amazing AI
          images
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
        <div className="w-full">
          <PlanCard
            badge="Starter Pack"
            title="Try It Out"
            price="$4"
            summary="15 credits = 15 images"
            priceSub="$0.01 per image"
            bullets={[
              "15 premium credits",
              "High-quality images",
              "All generation types",
              "Credits never expire",
              "Perfect for testing",
            ]}
            productId="0d1fe4fa-e8c5-4d0c-8db1-e24c65165615"
            ctaLabel="Start Creating"
          />
        </div>
        <div className="w-full">
          <PlanCard
            badge="Basic Pack"
            title="Most Popular"
            price="$9"
            summary="45 credits = 45 images"
            priceSub="$0.20 per image"
            bullets={[
              "45 premium credits",
              "High-quality images",
              "All generation types",
              "Credits never expire",
              "Most popular choice",
            ]}
            productId="3022ce85-ceb2-4fae-9729-a82cf949bcb7"
            ctaLabel="Go Pro"
          />
        </div>
        <div className="w-full">
          <PlanCard
            badge="Premium Pack"
            highlight="Best Value"
            title="Best Value"
            price="$17"
            summary="120 credits = 120 images"
            priceSub="$0.14 per image - Best Deal!"
            bullets={[
              "120 premium credits",
              "High-quality images",
              "All generation types",
              "Credits never expire",
              "Best value for creators",
            ]}
            productId="4917da3b-46a3-41d2-b231-41e17ab1dd7d"
            ctaLabel="Unlock Best Value"
          />
        </div>
      </div>

      <div className="mt-6 sm:mt-8 lg:mt-12 rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-3 sm:p-4 lg:p-6 xl:p-8">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-gray-900">
          Need help choosing?
        </h3>
        <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 lg:mb-6">
          All plans include access to all AI tools. Credits never expire, so you
          can use them whenever you want.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-gray-300 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs sm:text-sm lg:text-base"
          >
            <HiOutlineQuestionMarkCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
