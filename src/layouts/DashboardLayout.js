import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { useCredits } from "../creditsContext";
import { useToast } from "../toastContext";
// preferences handled within Profile page
import {
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineScissors,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
} from "react-icons/hi";
import { HiOutlineChevronRight } from "react-icons/hi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { FiLayout } from "react-icons/fi";
import { BiHistory } from "react-icons/bi";

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const { credits, initialized } = useCredits();
  const [sidebarOpen, setSidebarOpen] = React.useState(false); // Start closed on mobile
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
  }, [show]);

  // Close sidebar when clicking outside on mobile
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar && !sidebar.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen ? "w-72" : "w-0"
        } shrink-0 border-r border-gray-200 bg-white backdrop-blur flex flex-col transition-all duration-300 overflow-hidden fixed left-0 top-0 h-full z-30 lg:relative lg:z-10 lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-200 text-lg font-bold">
          <img src="/nano0.png" alt="Banana" className="w-8 h-8 mr-1" />
          <span className="whitespace-nowrap">NANO BANANA</span>
        </div>
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          <SidebarLink
            to="/text-to-image"
            label="Text to Image"
            icon={HiOutlineDocumentText}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          />
          <SidebarLink
            to="/image-to-image"
            label="Image to Image"
            icon={HiOutlineRefresh}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          />
          <SidebarLink
            to="/image-editor"
            label="AI Image Editor"
            icon={HiOutlinePhotograph}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          />
          {/* <SidebarLink
            to="/image-to-video"
            label="Image to Video"
            icon={HiOutlineVideoCamera}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          /> */}
          <SidebarLink
            to="/headshot-generator"
            label="Headshot Generator"
            icon={HiOutlineUser}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          />
          <SidebarLink
            to="/background-removal"
            label="Background Removal"
            icon={HiOutlineScissors}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          />
          <SidebarLink
            to="/previous-images"
            label="Previous Images"
            icon={BiHistory}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          />
          {/* <SidebarLink
            to="/profile"
            label="Profile"
            icon={HiOutlineUser}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          /> */}
        </nav>
        <div className="mt-auto p-4 text-sm text-gray-900 space-y-3">
          <SidebarAvailableCredits />
          <SidebarAccount />
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-white/80 backdrop-blur-md z-20 text-gray-900">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <FiLayout className="w-5 h-5" />
            </button>
            <span className="h-6 w-[1.5px] bg-gray-300" aria-hidden="true" />
            <PageTitle />
          </div>
          <CreditsBadge />
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {initialized && credits === 2 && user && (
            <div className="mb-4">
              <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="rounded-xl sm:rounded-2xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4 text-yellow-800">
                  <div className="flex items-center gap-3">
                    <HiOutlineSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900">
                        Welcome to Nano Banana!
                      </h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-800">
                        You have 2 trial credits to get started. Generate your
                        first AI image!
                      </p>
                    </div>
                  </div>
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

function CreditsBadge() {
  const { credits, initialized } = useCredits();
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 sm:gap-3 text-gray-800">
      <div
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-2 sm:px-3 py-1 text-xs cursor-pointer sm:text-sm bg-white"
        onClick={() => navigate("/dashboard-pricing")}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
        <span className="hidden sm:inline">Credits: </span>
        <span>{initialized ? credits : "..."}</span>
      </div>
      {loading ? null : user ? (
        <button
          onClick={() => navigate("/credit-history")}
          className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 underline-offset-4 hover:underline hidden sm:block"
        >
          Purchase History
        </button>
      ) : (
        <button
          onClick={signIn}
          className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 hidden sm:block"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}

function BuyCreditsButton({ label }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/dashboard-pricing")}
      className="w-full inline-flex items-center justify-center rounded-md bg-yellow-400 text-black font-semibold px-4 py-2 hover:bg-yellow-300 transition"
    >
      {label || "Buy credits"}
    </button>
  );
}

function SidebarAvailableCredits() {
  const { credits, initialized } = useCredits();
  const current = initialized ? Number(credits) || 0 : 0;
  const max = 120; // reference max (Premium pack)
  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const widthPct = Math.max(pct, current > 0 ? 8 : 0);
  const barColor =
    current <= 20
      ? "bg-yellow-400"
      : current <= 60
      ? "bg-yellow-400"
      : "bg-yellow-500";

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Available credits</span>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          {initialized ? current : "..."}
          <button
            onClick={() => (window.location.href = "/dashboard-pricing")}
            className="ml-2 inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            aria-label="Top up credits"
          >
            Top up
          </button>
        </div>
      </div>
      <div
        className="mt-2 h-1.5 w-full rounded-full bg-gray-200/70"
        aria-hidden="true"
      >
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${widthPct}%` }}
          aria-label={`Approximately ${pct}% of reference capacity`}
        />
      </div>
      {/* <div className="mt-2 text-[11px] text-gray-700 flex justify-end">
        <button
          onClick={() => (window.location.href = "/credit-history")}
          className="underline underline-offset-2 hover:text-gray-900"
        >
          View history
        </button>
      </div> */}
    </div>
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
      case "/profile":
        return "Profile";
      case "/dashboard-pricing":
        return "Buy Credits";
      case "/pricing":
        return "Pricing";
      default:
        return "Dashboard";
    }
  };

  const currentPage = getPageTitle(pathname);

  return (
    <div className="flex items-center text-gray-900">
      {/* Desktop breadcrumb */}
      <nav className="hidden sm:flex items-center text-base font-medium">
        <span className="text-gray-700">Dashboard</span>
        {currentPage !== "Dashboard" && (
          <>
            <HiOutlineChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-gray-900">{currentPage}</span>
          </>
        )}
      </nav>
      {/* Mobile title */}
      <div className="sm:hidden text-sm font-semibold truncate">
        {currentPage}
      </div>
    </div>
  );
}

function SidebarAccount() {
  const { user, loading, signIn, signOut } = useAuth();
  // credits badge removed; quick settings link instead
  const navigate = useNavigate();
  // preferences handled on Profile page

  if (loading) return null;
  return user ? (
    <div className="rounded-lg border border-gray-200 p-3 bg-white text-gray-900">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-700 text-xs sm:text-sm truncate">
          {user.displayName || user.email}
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="inline-flex items-center justify-center rounded-md px-4 py-1 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
          aria-label="Sign out"
          title="Sign out"
        >
          Sign out
        </button>
      </div>

      {/* Minimal sidebar; preferences moved to Profile page */}

      <button
        onClick={() => navigate("/profile")}
        className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 mt-1 hover:bg-gray-50 transition text-xs sm:text-sm"
      >
        Manage Account
      </button>
      <div className="mt-2.5">
        <BuyCreditsButton label="Buy Credits" />
      </div>
    </div>
  ) : (
    <button
      onClick={signIn}
      className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 transition text-xs sm:text-sm text-gray-900"
    >
      Sign in with Google
    </button>
  );
}

function SidebarLink({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-yellow-400 text-black"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        }`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
