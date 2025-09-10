import React, { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 h-12 sm:h-14 lg:h-20 flex items-center justify-between">
        <a
          href="/"
          className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-900 transition-colors duration-200 flex items-center"
        >
          <img
            src="/nano0.png"
            alt="Banana"
            className="w-6 h-6 sm:w-10 sm:h-10 lg:w-10 lg:h-10 mr-1 sm:mr-1"
          />
          <span className="sm:inline">Nano Banana</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <a
            href="#gallery"
            className="text-sm lg:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            Gallery
          </a>
          <a
            href="#credits"
            className="text-sm lg:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            How credits work
          </a>
          <a
            href="#faq"
            className="text-sm lg:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            FAQ
          </a>
          <a
            href="#pricing"
            className="text-sm lg:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            Pricing
          </a>
          <a
            href="/contact"
            className="text-sm lg:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            Contact
          </a>
          <a
            href="/auth"
            className="inline-flex items-center rounded-xl bg-yellow-500 text-black font-semibold px-4 lg:px-6 py-2 lg:py-3 hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-yellow-400/25 text-sm lg:text-base"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
            <a
              href="#gallery"
              onClick={closeMobileMenu}
              className="block text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium py-2"
            >
              Gallery
            </a>
            <a
              href="#credits"
              onClick={closeMobileMenu}
              className="block text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium py-2"
            >
              How credits work
            </a>
            <a
              href="#faq"
              onClick={closeMobileMenu}
              className="block text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium py-2"
            >
              FAQ
            </a>
            <a
              href="#pricing"
              onClick={closeMobileMenu}
              className="block text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium py-2"
            >
              Pricing
            </a>
            <a
              href="/contact"
              onClick={closeMobileMenu}
              className="block text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium py-2"
            >
              Contact
            </a>
            <a
              href="/auth"
              onClick={closeMobileMenu}
              className="block w-full text-center rounded-xl bg-yellow-400 text-black font-semibold px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-yellow-300 transition-all duration-200 shadow-lg text-sm sm:text-base"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
