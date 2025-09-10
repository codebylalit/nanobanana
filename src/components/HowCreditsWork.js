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
      className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900">
            How credits work
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed px-2">
            Simple, transparent pricing with no hidden fees
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-xl sm:rounded-2xl lg:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 lg:p-8 hover:border-gray-300 hover:scale-105 transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 text-yellow-500">
                {it.icon}
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-gray-900">
                {it.title}
              </h3>
              <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                {it.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
