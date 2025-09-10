import React, { useState, useEffect, useRef } from "react";
import { HiOutlineRocketLaunch } from "react-icons/hi2";

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);
  const mobileTrackRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="relative overflow-visible bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32 xl:py-40 text-center">
        <div className="max-w-5xl mx-auto">
          <p className="font-semibold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 lg:mb-6 tracking-wide flex items-center justify-center gap-2">
            <span className="text-base sm:text-lg lg:text-xl">🚀</span>
            <span className="xs:inline flex items-center gap-1">
              <span className="text-gray-500">Image generation by</span>{" "}
              <span className="inline-flex font-bold">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
              </span>{" "}
              <span className="text-yellow-500 font-bold">· Nano Banana</span>
            </span>
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

            const layout = [
              {
                rotate: "-rotate-6",
                translate: "translate-y-8 sm:translate-y-10",
                size: "w-20 sm:w-28 lg:w-40",
                z: 10,
              },
              {
                rotate: "-rotate-3",
                translate: "translate-y-5 sm:translate-y-6",
                size: "w-24 sm:w-32 lg:w-44",
                z: 12,
              },
              {
                rotate: "-rotate-1",
                translate: "translate-y-2",
                size: "w-28 sm:w-36 lg:w-52",
                z: 14,
              },
              {
                rotate: "rotate-1",
                translate: "translate-y-2",
                size: "w-28 sm:w-36 lg:w-52",
                z: 14,
              },
              {
                rotate: "rotate-3",
                translate: "translate-y-5 sm:translate-y-6",
                size: "w-24 sm:w-32 lg:w-44",
                z: 12,
              },
              {
                rotate: "rotate-6",
                translate: "translate-y-8 sm:translate-y-10",
                size: "w-20 sm:w-28 lg:w-40",
                z: 10,
              },
            ];

            if (isMobile) {
              const yAngles = [-14, -10, -6, -2, 2, 6, 10, 14];
              const mobileImages = sampleImages.concat(sampleImages);
              return (
                <div
                  className="relative mb-6 flex justify-center overflow-hidden -mx-4 px-4"
                  style={{ perspective: "1000px" }}
                >
                  {/* edge fades */}
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
                  <div className="w-[200%] flex gap-3 auto-marquee">
                    {mobileImages.concat(mobileImages).map((src, i) => (
                      <div
                        key={i}
                        className="shrink-0 w-48 aspect-[4/3] rounded-xl overflow-hidden bg-white ring-1 ring-black/10 shadow-lg transform-gpu"
                        style={{
                          transform: `rotateY(${
                            yAngles[i % yAngles.length]
                          }deg)`,
                        }}
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div className="relative mb-6 sm:mb-8 lg:mb-12 flex justify-center overflow-visible px-2 sm:px-4">
                <div className="flex items-end -space-x-2 sm:-space-x-4 lg:-space-x-6">
                  {layout.map((cfg, i) => (
                    <div
                      key={i}
                      className={`relative ${cfg.rotate} ${cfg.translate} ${cfg.size} aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-white ring-1 ring-black/10 shadow-xl transition-transform duration-300 transform-gpu will-change-transform scale-95 hover:scale-110 hover:z-50`}
                      style={{ zIndex: cfg.z }}
                    >
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/70" />
                      <img
                        src={sampleImages[i % sampleImages.length]}
                        alt={`Sample ${i + 1}`}
                        className="relative w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://picsum.photos/seed/hero-${i}/800/600`;
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 shadow-[0_12px_40px_rgba(0,0,0,0.18)]" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 lg:gap-6 px-3 sm:px-4">
            <a
              href="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center 
      rounded-xl lg:rounded-2xl 
      bg-yellow-400 text-black font-semibold 
      px-5 py-3 text-sm sm:text-base lg:text-lg
      hover:bg-yellow-300 hover:scale-105 transition-all duration-200 
      shadow-md sm:shadow-lg hover:shadow-yellow-400/30"
            >
              <HiOutlineRocketLaunch className="w-5 h-5 mr-2" />
              Start Free Trial
            </a>
            <a
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center 
      rounded-xl lg:rounded-2xl 
      border-2 border-gray-200 
      px-5 py-3 text-sm sm:text-base lg:text-lg
      font-semibold 
      hover:bg-gray-50 hover:border-gray-300 
      transition-all duration-200"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
