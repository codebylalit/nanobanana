import React from "react";
import {
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineRefresh,
} from "react-icons/hi";

export default function HowCreditsWork() {
  const items = [
    {
      title: "What is a credit?",
      text: "1 credit = 1 image generation. Each tool uses exactly 1 credit per operation.",
      icon: <HiOutlineCreditCard className="w-8 h-8" />,
    },
    {
      title: "Do credits expire?",
      text: "No. Your credits stay in your account until you use them.",
      icon: <HiOutlineClock className="w-8 h-8" />,
    },
    {
      title: "What if a job fails?",
      text: "Failed generations automatically refund credits.",
      icon: <HiOutlineRefresh className="w-8 h-8" />,
    },
  ];
  return (
    <section
      id="credits"
      className="py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
            How credits work
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Simple, transparent pricing with no hidden fees
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-3xl border border-gray-200 bg-white p-8 hover:border-gray-300 hover:scale-105 transition-all duration-300 group"
            >
              <div className="text-4xl mb-4">{it.icon}</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {it.title}
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
