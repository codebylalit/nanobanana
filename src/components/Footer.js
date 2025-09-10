import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-gray-600 text-lg font-medium">
          © {new Date().getFullYear()} Nano Banana
        </div>
        <div className="flex items-center gap-8 text-base">
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
    </footer>
  );
}
