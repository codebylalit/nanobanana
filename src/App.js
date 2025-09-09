import React from "react";
import "./App.css";
import "./index.css";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./authContext";
import { useCredits } from "./creditsContext";
import {
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineScissors,
  HiOutlinePhotograph,
  HiOutlineCheck,
  HiOutlineLightningBolt,
  HiOutlineQuestionMarkCircle,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlinePaperAirplane,
} from "react-icons/hi";
import { HiOutlineSparkles } from "react-icons/hi2";
import {
  createRazorpayOrder,
  initializeRazorpayPayment,
  loadRazorpayScript,
} from "./services/paymentService";
import TextToImagePage from "./pages/TextToImagePage";
import ImageToImagePage from "./pages/ImageToImagePage";
import HeadshotPage from "./pages/HeadshotPage";
import BackgroundRemovalPage from "./pages/BackgroundRemovalPage";
// import ImageEditorPage from "./pages/ImageEditorPage";
import PreviousImagesPage from "./pages/PreviousImagesPage";
import AuthPage from "./pages/AuthPage";
import CreditHistoryPage from "./pages/CreditHistoryPage";
import { useToast } from "./toastContext";
// Payments removedl nvcz
function App() {
  return (
    <div className="min-h-screen bg-black text-white">
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
        {false && (
          <Route
            path="/image-editor"
            element={
              <RequireAuth>
                <DashboardLayout>
                  <div />
                </DashboardLayout>
              </RequireAuth>
            }
          />
        )}
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function DashboardLayout({ children }) {
  const { user } = useAuth();
  const { credits, initialized } = useCredits();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { show } = useToast();

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment") === "success") {
      show({
        title: "Payment successful",
        message: "Your credits were added to your account.",
        type: "success",
      });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // No local toast state; global toast container handles timing

  return (
    <div className="flex min-h-screen">
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } shrink-0 border-r border-white/10 bg-white/5 backdrop-blur flex flex-col transition-all duration-300 overflow-hidden fixed left-0 top-0 h-full z-10`}
      >
        <div className="h-16 flex items-center px-4 border-b border-white/10 text-lg font-bold">
          <img src="/banana.png" alt="Banana" className="w-6 h-6 mr-2" />
          NANO BANANA
        </div>
        <nav className="p-2 space-y-1">
          <SidebarLink
            to="/text-to-image"
            label="Text to Image"
            icon={HiOutlineDocumentText}
          />
          <SidebarLink
            to="/image-to-image"
            label="Image to Image"
            icon={HiOutlineRefresh}
          />
          <SidebarLink
            to="/headshot-generator"
            label="Headshot Generator"
            icon={HiOutlineUser}
          />
          <SidebarLink
            to="/background-removal"
            label="Background Removal"
            icon={HiOutlineScissors}
          />
          {/* <SidebarLink
            to="/image-editor"
            label="Image Editor"
            icon={HiOutlineAdjustments}
          /> */}
          <SidebarLink
            to="/previous-images"
            label="Previous Images"
            icon={HiOutlinePhotograph}
          />
        </nav>
        <div className="mt-auto p-4 text-sm text-white/70 space-y-3">
          <BuyCreditsButton />
          <SidebarAccount />
        </div>
      </aside>
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 sticky top-0 bg-black/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-white/10 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <PageTitle />
          </div>
          <CreditsBadge />
        </header>
        {/* Global toast container handles rendering */}
        <main className="flex-1 p-6">
          {initialized && credits === 2 && user && (
            <div className="mb-6 rounded-2xl border border-green-400/30 bg-gradient-to-r from-green-400/10 to-emerald-400/5 p-4 text-green-200">
              <div className="flex items-center gap-3">
                <HiOutlineSparkles className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="font-bold text-lg">Welcome to Nano Banana!</h3>
                  <p>
                    You've received 2 trial credits to get started. Try creating
                    your first AI image!
                  </p>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

// Placeholder removed (unused)

// Public landing sections
function Navbar() {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-black/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        <a
          href="/"
          className="text-2xl font-bold tracking-tight text-white hover:text-yellow-400 transition-colors duration-200 flex items-center"
        >
          <img src="/banana.png" alt="Banana" className="w-6 h-6 mr-2" />
          NANO BANANA
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#gallery"
            className="text-base text-white/80 hover:text-white transition-colors duration-200 font-medium"
          >
            Gallery
          </a>
          <a
            href="#credits"
            className="text-base text-white/80 hover:text-white transition-colors duration-200 font-medium"
          >
            How credits work
          </a>
          <a
            href="#faq"
            className="text-base text-white/80 hover:text-white transition-colors duration-200 font-medium"
          >
            FAQ
          </a>
          <a
            href="#pricing"
            className="text-base text-white/80 hover:text-white transition-colors duration-200 font-medium"
          >
            Pricing
          </a>
          <a
            href="/auth"
            className="inline-flex items-center rounded-xl bg-yellow-400 text-black font-semibold px-6 py-3 hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-yellow-400/25"
          >
            Get Started
          </a>
        </div>
        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-white/80 hover:text-white transition-colors">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 lg:py-40 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-yellow-400 font-semibold text-lg mb-6 tracking-wide flex items-center justify-center gap-2">
            <HiOutlinePaperAirplane className="w-5 h-5" />
            Powered by Google · Nano Banana
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Create epic{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              AI images
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Create beautiful images from your thoughts. Edit, generate, and
            transform images in seconds with cutting-edge AI technology.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <a
              href="/auth"
              className="inline-flex items-center rounded-2xl bg-yellow-400 text-black font-bold px-8 py-4 text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-yellow-400/25"
            >
              Try free
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center rounded-2xl border-2 border-white/20 px-8 py-4 text-lg font-semibold hover:bg-white/5 hover:border-white/40 transition-all duration-200"
            >
              View pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const placeholders = Array.from({ length: 12 });
  return (
    <section
      id="gallery"
      className="py-24 lg:py-32 bg-gradient-to-b from-black to-gray-900"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Community Gallery
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Discover amazing AI-generated images created by our community
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {placeholders.map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PublicLanding() {
  return (
    <div>
      <Navbar />
      <main>
        <Hero />
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

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-white/70 text-lg font-medium">
          © {new Date().getFullYear()} Nano Banana
        </div>
        <div className="flex items-center gap-8 text-base">
          <a
            href="#pricing"
            className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
          >
            Pricing
          </a>
          {/* <a
            href="#faq"
            className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
          >
            FAQ
          </a> */}
          <a
            href="#credits"
            className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
          >
            How credits work
          </a>
        </div>
      </div>
    </footer>
  );
}

function CreditsBadge() {
  const { credits, initialized } = useCredits();
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
        <span>Credits: {initialized ? credits : "..."}</span>
      </div>
      {loading ? null : user ? (
        <button
          onClick={() => navigate("/credit-history")}
          className="text-sm text-white/90 hover:text-white underline-offset-4 hover:underline"
        >
          Purchase History
        </button>
      ) : (
        <button
          onClick={signIn}
          className="text-sm text-white/80 hover:text-white"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}

function BuyCreditsButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/dashboard-pricing")}
      className="w-full inline-flex items-center justify-center rounded-md bg-yellow-400 text-black font-semibold px-4 py-2 hover:bg-yellow-300 transition"
    >
      Buy credits
    </button>
  );
}

function PageTitle() {
  const pathname = window.location.pathname;

  const getPageTitle = (path) => {
    switch (path) {
      case "/text-to-image":
        return "Text to Image";
      case "/image-to-image":
        return "Image to Image";
      case "/headshot-generator":
        return "Headshot Generator";
      case "/background-removal":
        return "Background Removal";
      case "/image-editor":
        return "Image Editor";
      case "/previous-images":
        return "Previous Images";
      case "/credit-history":
        return "Credit History";
      case "/pricing":
        return "Pricing";
      default:
        return "Dashboard";
    }
  };

  const currentPage = getPageTitle(pathname);

  return (
    <h1 className="text-lg font-semibold text-white">
      {currentPage === "Dashboard" ? "Dashboard" : `Dashboard > ${currentPage}`}
    </h1>
  );
}

function SidebarAccount() {
  const { user, loading, signIn, signOut } = useAuth();
  const { credits, initialized } = useCredits();
  const navigate = useNavigate();
  if (loading) return null;
  return user ? (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/80 text-sm truncate">
          {user.displayName || user.email}
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1 text-xs bg-white/5">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          <span>{initialized ? credits : "..."}</span>
        </div>
      </div>
      <button
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
        className="w-full inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 hover:bg-white/5 transition text-sm"
      >
        Sign out
      </button>
    </div>
  ) : (
    <button
      onClick={signIn}
      className="w-full inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 hover:bg-white/5 transition text-sm"
    >
      Sign in with Google
    </button>
  );
}

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-yellow-400 text-black"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`
      }
    >
      <Icon className="w-5 h-5" />
      {label}
    </NavLink>
  );
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        {showSuccess && (
          <div className="mb-6 rounded-2xl border border-green-400/30 bg-gradient-to-r from-green-400/10 to-emerald-400/5 p-4 text-green-200">
            <div className="flex items-center gap-3">
              <HiOutlineSparkles className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="font-bold text-lg">Payment successful</h3>
                <p>
                  Your credits were added. If you don’t see them yet, wait a few
                  seconds.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Choose your plan
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Simple pricing. Credits never expire. Start creating amazing AI
            images today.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
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
                "Credits never expire",
                "Perfect for testing",
              ]}
              productId="0d1fe4fa-e8c5-4d0c-8db1-e24c65165615"
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
                "Priority processing",
                "Credits never expire",
                "Best value for creators",
              ]}
              productId="4917da3b-46a3-41d2-b231-41e17ab1dd7d"
            />
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Need help choosing?
            </h3>
            <p className="text-white/80 text-lg mb-6">
              All plans include access to all AI tools. Credits never expire, so
              you can use them whenever you want.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth"
                className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 text-black font-bold px-6 py-3 hover:bg-yellow-300 hover:scale-105 transition-all duration-200"
              >
                <HiOutlinePaperAirplane className="w-5 h-5" />
                Get Started Free
              </a>
              <a
                href="#faq"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/5 hover:border-white/40 transition-all duration-200"
              >
                <HiOutlineQuestionMarkCircle className="w-5 h-5" />
                View FAQ
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
      className="py-24 lg:py-32 bg-gradient-to-b from-gray-900 to-black"
    >
      <PricingPage />
    </section>
  );
}

function HowCreditsWork() {
  const items = [
    {
      title: "What is a credit?",
      text: "1 credit = 1 image generation. Each tool uses exactly 1 credit per operation.",
      icon: <HiOutlineCreditCard className="w-8 h-8" />,
    },
    {
      title: "Do credits expire?",
      text: "No. Your credits stay in your account until you use them.",
      icon: <HiOutlineClock className="w-8 h-8" />,
    },
    {
      title: "What if a job fails?",
      text: "Failed generations automatically refund credits.",
      icon: <HiOutlineRefresh className="w-8 h-8" />,
    },
  ];
  return (
    <section
      id="credits"
      className="py-24 lg:py-32 bg-gradient-to-b from-gray-900 to-black"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            How credits work
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Simple, transparent pricing with no hidden fees
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 hover:border-white/20 hover:scale-105 transition-all duration-300 group"
            >
              <div className="text-4xl mb-4">{it.icon}</div>
              <h3 className="text-2xl font-bold mb-4 text-white">{it.title}</h3>
              <p className="text-white/80 text-lg leading-relaxed">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "Which tools are included?",
      a: "Text-to-Image, Image-to-Image, Headshots, Background Removal, and Image Editor.",
    },
    {
      q: "Can I use results commercially?",
      a: "Yes. You own the images you generate; see terms in checkout.",
    },
    {
      q: "Do I need a subscription?",
      a: "No subscription required. Buy credits once and use anytime. New users get 2 trial credits to start!",
    },
    {
      q: "How do I sign in?",
      a: "Use your Google account for quick and secure access.",
    },
  ];
  return (
    <section
      id="faq"
      className="py-24 lg:py-32 bg-gradient-to-b from-black to-gray-900"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Frequently asked questions
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Nano Banana
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 hover:border-white/20 transition-all duration-300"
            >
              <h3 className="text-xl font-bold mb-3 text-white">{f.q}</h3>
              <p className="text-white/80 text-lg leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  badge,
  highlight,
  title,
  price,
  summary,
  priceSub,
  bullets,
  productId,
}) {
  const { user } = useAuth();
  const { fetchCredits } = useCredits();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState(null);
  const { show } = useToast();

  const handlePayment = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    show({
      title: "Starting checkout",
      message: "Preparing payment...",
      type: "info",
    });

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }
      show({
        title: "Loaded",
        message: "Payment widget ready",
        type: "success",
      });

      // Create order
      const order = await createRazorpayOrder(productId, user);
      show({
        title: "Order created",
        message: `Amount: ${(order.amount / 100).toFixed(2)} ${order.currency}`,
        type: "success",
      });

      // Initialize payment
      initializeRazorpayPayment(
        order,
        user,
        async (paymentData) => {
          try {
            // Payment verification is already handled in initializeRazorpayPayment
            // paymentData contains the verification result

            // Refresh credits from database
            await fetchCredits();

            // Redirect to dashboard with success message
            navigate("/dashboard-pricing?payment=success");
            show({
              title: "Credits added",
              message: `${paymentData.credits} credits added to your account`,
              type: "success",
            });
          } catch (error) {
            console.error("Payment processing error:", error);
            setPaymentError(error.message);
            show({
              title: "Payment error",
              message: error.message,
              type: "error",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        (error) => {
          console.error("Payment failed:", error);
          setPaymentError("Payment failed. Please try again.");
          show({
            title: "Payment failed",
            message: "Please try again.",
            type: "error",
          });
          setIsProcessing(false);
        },
        {
          onOpen: () =>
            show({
              title: "Payment",
              message: "Opening secure checkout...",
              type: "info",
            }),
          onDismiss: () =>
            show({
              title: "Checkout closed",
              message: "You can try again anytime.",
              type: "warning",
            }),
        }
      );
    } catch (error) {
      console.error("Payment initialization error:", error);
      setPaymentError(error.message);
      show({ title: "Payment error", message: error.message, type: "error" });
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-8 border transition-all duration-300 hover:scale-105 ${
        highlight
          ? "border-yellow-400 shadow-[0_0_0_4px_rgba(234,179,8,0.15)] bg-gradient-to-br from-yellow-400/10 to-orange-400/5"
          : "border-white/10 bg-gradient-to-br from-white/10 to-white/5 hover:border-white/20"
      }`}
    >
      {highlight ? (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg">
          Best Value
        </div>
      ) : null}
      <div className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-white/10 mb-6">
        <HiOutlineLightningBolt className="w-4 h-4" />
        <span className="font-semibold">{badge}</span>
      </div>
      <h3 className="text-3xl font-bold mb-4 text-white">{title}</h3>
      <div className="text-6xl font-extrabold text-yellow-400 mb-4">
        {price}
      </div>
      <div className="text-white/90 text-lg mb-2 font-medium">{summary}</div>
      <div className="text-yellow-300 text-base mb-8 font-semibold">
        {priceSub}
      </div>
      <ul className="space-y-3 mb-8 text-white/80 text-base">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3">
            <HiOutlineCheck className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {paymentError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {paymentError}
        </div>
      )}

      {user ? (
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full inline-flex items-center justify-center rounded-2xl font-bold px-6 py-4 text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            highlight
              ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-xl hover:shadow-yellow-400/25"
              : "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-xl hover:shadow-yellow-400/25"
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
            "Buy Now"
          )}
        </button>
      ) : (
        <a
          href="/auth"
          onClick={(e) => {
            e.preventDefault();
            navigate("/auth");
          }}
          className={`w-full inline-flex items-center justify-center rounded-2xl font-bold px-6 py-4 text-lg transition-all duration-200 ${
            highlight
              ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-xl hover:shadow-yellow-400/25"
              : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40"
          }`}
        >
          Sign in to buy
        </a>
      )}
    </div>
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
    <div className="max-w-6xl mx-auto">
      {showSuccess && (
        <div className="mb-6 rounded-2xl border border-green-400/30 bg-gradient-to-r from-green-400/10 to-emerald-400/5 p-4 text-green-200">
          <div className="flex items-center gap-3">
            <HiOutlineSparkles className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="font-bold text-lg">Payment successful!</h3>
              <p>
                Your credits have been added to your account. You can now
                continue creating amazing AI images.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
          Buy Credits
        </h1>
        <p className="text-xl text-white/80 leading-relaxed">
          Choose a plan to get more credits and continue creating amazing AI
          images
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="w-full">
          <PlanCard
            badge="Starter Pack"
            title="Try It Out"
            price="$0.20"
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
              "Priority processing",
              "Credits never expire",
              "Best value for creators",
            ]}
            productId="4917da3b-46a3-41d2-b231-41e17ab1dd7d"
          />
        </div>
      </div>

      <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8">
        <h3 className="text-2xl font-bold mb-4 text-white">
          Need help choosing?
        </h3>
        <p className="text-white/80 text-lg mb-6">
          All plans include access to all AI tools. Credits never expire, so you
          can use them whenever you want.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#faq"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/5 hover:border-white/40 transition-all duration-200"
          >
            <HiOutlineQuestionMarkCircle className="w-5 h-5" />
            View FAQ
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
