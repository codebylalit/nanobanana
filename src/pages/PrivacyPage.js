import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <p className="text-gray-700 mb-4">
        We respect your privacy. This policy explains what information we
        collect, how we use it, and your choices.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        Data We Collect
      </h2>
      <p className="text-gray-700 mb-4">
        Account information (from Google sign‑in), purchase records, and image
        generation metadata (non‑content) may be stored to provide the service.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        How We Use Data
      </h2>
      <p className="text-gray-700 mb-4">
        To authenticate, deliver credits, prevent abuse, and improve features.
        We do not sell your personal data.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        Third Parties
      </h2>
      <p className="text-gray-700 mb-4">
        We use providers like Google, Razorpay, and Supabase to run the app.
        Their processing is governed by their own policies.
      </p>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
        Your Choices
      </h2>
      <p className="text-gray-700 mb-4">
        You can sign out or delete your account data by contacting support. You
        can also clear local history in the app.
      </p>
      <p className="text-gray-500 text-sm mt-10">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
