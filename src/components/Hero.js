import React, { useState, useEffect } from "react";

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 xl:py-36 text-center">
        <div className="max-w-5xl mx-auto">
          <p className="text-yellow-600 font-semibold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 lg:mb-6 tracking-wide flex items-center justify-center gap-2">
            <span className="text-base sm:text-lg lg:text-xl">🚀</span>
            <span className="xs:inline">Powered by Google · Nano Banana</span>
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 lg:mb-8 leading-tight text-gray-900">
            Create epic <span className="text-yellow-500">AI images</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto mb-6 sm:mb-8 lg:mb-12 leading-relaxed font-light px-2">
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
              <div className="relative mb-6 sm:mb-8 lg:mb-12 flex justify-center overflow-hidden px-2 sm:px-4">
                <div className="flex -space-x-1 sm:-space-x-2 md:-space-x-4 lg:-space-x-6 xl:-space-x-8">
                  {/* Show fewer images on mobile for better UX */}
                  {sampleImages.slice(0, isMobile ? 4 : 6).map((src, i) => (
                    <div
                      key={i}
                      className={`relative ${
                        rotations[i % rotations.length]
                      } w-14 xs:w-16 sm:w-20 md:w-28 lg:w-36 xl:w-44 aspect-[4/3] rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-lg sm:shadow-xl md:shadow-2xl ring-1 ring-black/10 bg-white transform transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2`}
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
                      <div className="pointer-events-none absolute inset-0 shadow-[0_6px_20px_rgba(0,0,0,0.1)] sm:shadow-[0_12px_30px_rgba(0,0,0,0.12)] md:shadow-[0_20px_60px_rgba(0,0,0,0.25)]" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6 px-4">
            <a
              href="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl sm:rounded-2xl bg-yellow-400 text-black font-bold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-yellow-400/25"
            >
              Try free
            </a>
            <a
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl sm:rounded-2xl border-2 border-gray-200 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              View pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
