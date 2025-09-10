import React from "react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        <a
          href="/"
          className="text-2xl font-bold tracking-tight text-gray-900 hover:text-yellow-500 transition-colors duration-200 flex items-center"
        >
          <img src="/banana.png" alt="Banana" className="w-6 h-6 mr-2" />
          NANO BANANA
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#gallery"
            className="text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            Gallery
          </a>
          <a
            href="#credits"
            className="text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            How credits work
          </a>
          <a
            href="#faq"
            className="text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            FAQ
          </a>
          <a
            href="#pricing"
            className="text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            Pricing
          </a>
          <a
            href="/contact"
            className="text-base text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            Contact
          </a>
          <a
            href="/auth"
            className="inline-flex items-center rounded-xl bg-yellow-400 text-black font-semibold px-6 py-3 hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-yellow-400/25"
          >
            Get Started
          </a>
        </div>
        <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors">
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
