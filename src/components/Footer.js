import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col items-center space-y-6">
          {/* OfficeX Appstore Partner Badge */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-2">Partner with</div>
            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <svg 
                className="w-5 h-5 text-white" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-bold">OfficeX</span>
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Partner</span>
            </div>
          </div>
          
          <div className="w-full border-t border-gray-200 my-4"></div>
          
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            <div className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">
              © {new Date().getFullYear()} Nano Banana
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8 text-xs sm:text-sm lg:text-base">
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
              >
                Pricing
              </a>
              <a
                href="#credits"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
              >
                How credits work
              </a>
              <a
                href="/terms"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
