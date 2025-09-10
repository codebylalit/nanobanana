import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { useCredits } from "../creditsContext";
import { useToast } from "../toastContext";
import {
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineScissors,
  HiOutlinePhotograph,
} from "react-icons/hi";
import { HiOutlineSparkles } from "react-icons/hi2";

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
        } shrink-0 border-r border-gray-200 bg-white backdrop-blur flex flex-col transition-all duration-300 overflow-hidden fixed left-0 top-0 h-full z-30 lg:relative lg:z-10`}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-200 text-lg font-bold">
          <img src="/banana.png" alt="Banana" className="w-6 h-6 mr-2" />
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
            icon={HiOutlinePhotograph}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          />
        </nav>
        <div className="mt-auto p-4 text-sm text-white/70 space-y-3">
          <BuyCreditsButton />
          <SidebarAccount />
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-white/80 backdrop-blur-md z-20 text-gray-900">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition"
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
        <main className="flex-1 p-4 sm:p-6">
          {initialized && credits === 2 && user && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
              <div className="flex items-center gap-3">
                <HiOutlineSparkles className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Welcome to Nano Banana!</h3>
                  <p className="text-sm sm:text-base">
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

function CreditsBadge() {
  const { credits, initialized } = useCredits();
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 sm:gap-3 text-gray-800">
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white">
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
    <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
      <span className="hidden sm:inline">
        {currentPage === "Dashboard"
          ? "Dashboard"
          : `Dashboard > ${currentPage}`}
      </span>
      <span className="sm:hidden">{currentPage}</span>
    </h1>
  );
}

function SidebarAccount() {
  const { user, loading, signIn, signOut } = useAuth();
  const { credits, initialized } = useCredits();
  const navigate = useNavigate();
  if (loading) return null;
  return user ? (
    <div className="rounded-lg border border-gray-200 p-3 bg-white text-gray-900">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-700 text-xs sm:text-sm truncate">
          {user.displayName || user.email}
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-2 sm:px-3 py-1 text-xs bg-gray-50">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          <span>{initialized ? credits : "..."}</span>
        </div>
      </div>
      <button
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
        className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 transition text-xs sm:text-sm"
      >
        Sign out
      </button>
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
