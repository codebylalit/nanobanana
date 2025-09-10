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
    {
      q: "What is the Prompt Helper?",
      a: "The Prompt Helper assists you in crafting detailed, high-quality prompts. It can rewrite your idea, suggest new ideas, and provide one-click chips to quickly enhance your prompts for better AI image generation.",
    },
  ];
  return (
    <section
      id="faq"
      className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900">
            Frequently asked questions
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed px-2">
            Everything you need to know about Nano Banana
          </p>
        </div>
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 lg:p-8 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                {f.q}
              </h3>
              <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
