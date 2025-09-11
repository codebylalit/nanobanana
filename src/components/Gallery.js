import React from "react";
import { loadHistory } from "../historyStore";
import { getFeatureOptIn } from "../userPrefs";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Gallery() {
  const [images, setImages] = React.useState([]);
  const LOCAL_GALLERY_IMAGES = React.useMemo(
    () => [
      "/flash.png",
      "/img1.jpg",
      "/img3.jpg",
      "/img21.jpg",
      "/img11.jpg",
      "/img14.jpg",
      "/img23.jpg",
      "/sonic.png",
      "/img30.jpg",
      "/img7.jpg",
      "/img15.jpg",
      "/img25.jpg",
      "/img8.jpg",
      "/img6.jpg",
      "/img24.jpg",
      "/img20.jpg",
      "/img4.jpg",
    ],
    []
  );
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const isOptedIn = u?.uid ? getFeatureOptIn(u.uid) : false;
      if (!isOptedIn) {
        setImages(LOCAL_GALLERY_IMAGES);
        return;
      }
      const history = loadHistory();
      const urls = Array.from(
        new Set((history || []).map((h) => h?.url).filter(Boolean))
      ).slice(0, 12);
      if (urls.length > 0) {
        if (urls.length < 8) {
          const needed = Math.max(0, 18 - urls.length);
          const localFill = LOCAL_GALLERY_IMAGES.slice(0, needed);
          setImages([...urls, ...localFill]);
          return;
        }
        setImages(urls);
        return;
      }
      setImages(LOCAL_GALLERY_IMAGES);
    });
    return () => unsub();
  }, [LOCAL_GALLERY_IMAGES]);

  return (
    <section
      id="gallery"
      className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900">
            Community Gallery
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed px-2">
            See incredible AI-generated images made by our growing community
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8">
          {images.map((src, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:scale-105 transition-all duration-300 cursor-pointer group bg-white shadow-sm hover:shadow-md"
            >
              <img
                src={src}
                alt={`Community ${i + 1}`}
                className="w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-300"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://picsum.photos/seed/${i}-${Date.now()}/800/800`;
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-12 sm:mt-12 lg:mt-16 px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-gray-900">
          Get featured in our gallery!
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-xl mx-auto leading-relaxed mb-4 sm:mb-6">
          Create and showcase your AI images. Be part of our community of
          creators!
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <a
            href="/auth"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl lg:rounded-2xl bg-yellow-400 text-black font-semibold px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base lg:text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-md sm:shadow-lg hover:shadow-yellow-400/30"
          >
            Create Now
          </a>
          <a
            href="#pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl lg:rounded-2xl border-2 border-gray-200 px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base lg:text-lg font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            See Plans
          </a>
        </div>
      </div>
    </section>
  );
}
