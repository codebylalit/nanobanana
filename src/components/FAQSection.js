import React from "react";

export default function FAQSection() {
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
      className="py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
            Frequently asked questions
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Nano Banana
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-8 hover:border-gray-300 transition-all duration-300"
            >
              <h3 className="text-xl font-bold mb-3 text-gray-900">{f.q}</h3>
              <p className="text-gray-700 text-lg leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
