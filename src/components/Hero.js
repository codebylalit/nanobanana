import React from "react";
import { loadHistory } from "../historyStore";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 lg:py-40 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-yellow-600 font-semibold text-lg mb-6 tracking-wide flex items-center justify-center gap-2">
            🚀 Powered by Google · Nano Banana
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-gray-900">
            Create epic <span className="text-yellow-500">AI images</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Create beautiful images from your thoughts. Edit, generate, and
            transform images in seconds with cutting-edge AI technology.
          </p>
          {(() => {
            const sampleImages = [
              "/img5.jpg",
              "/img12.jpg",
              "/img13.jpg",
              "/img22.jpg",
              "/img10.jpg",
              "/img9.jpg",
            ];
            const rotations = [
              "-rotate-6",
              "-rotate-3",
              "rotate-0",
              "rotate-3",
              "rotate-6",
              "rotate-3",
            ];
            return (
              <div className="relative mb-12 flex justify-center">
                <div className="flex -space-x-6">
                  {sampleImages.slice(0, 6).map((src, i) => (
                    <div
                      key={i}
                      className={`relative ${
                        rotations[i % rotations.length]
                      } w-36 sm:w-44 md:w-56 lg:w-64 aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white transform transition-all duration-300 hover:-translate-y-2`}
                      style={{ zIndex: 10 + i }}
                    >
                      <img
                        src={src}
                        alt={`Sample ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://picsum.photos/seed/hero-${i}/800/600`;
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 shadow-[0_20px_60px_rgba(0,0,0,0.25)]" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <a
              href="/auth"
              className="inline-flex items-center rounded-2xl bg-yellow-400 text-black font-bold px-8 py-4 text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-yellow-400/25"
            >
              Try free
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center rounded-2xl border-2 border-gray-200 px-8 py-4 text-lg font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              View pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
