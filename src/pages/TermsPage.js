import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Terms and Conditions
      </h1>
      <p className="text-gray-700 mb-4">
        Welcome to Nano Banana. By accessing or using our services, you agree to
        the following terms. If you do not agree, please do not use the service.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        Use of Service
      </h2>
      <p className="text-gray-700 mb-4">
        You may use the app to generate and download images for personal or
        commercial use, provided you comply with applicable laws and these
        terms. Do not upload content that is illegal or infringes on others’
        rights.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        Credits & Payments
      </h2>
      <p className="text-gray-700 mb-4">
        Credits are consumable units. Purchases are final except where required
        by law. Failed generations are automatically refunded.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        Ownership
      </h2>
      <p className="text-gray-700 mb-4">
        You own images you generate, except for any third‑party content you
        upload. We may use anonymized, aggregated usage data to improve the
        service.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        Disclaimer
      </h2>
      <p className="text-gray-700 mb-4">
        The service is provided “as is” without warranties. We are not liable
        for indirect or consequential damages.
      </p>
      <p className="text-gray-500 text-sm mt-10">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
