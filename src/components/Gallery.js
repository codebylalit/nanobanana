import React from "react";
import { loadHistory } from "../historyStore";

export default function Gallery() {
  const [images, setImages] = React.useState([]);
  const LOCAL_GALLERY_IMAGES = [
    "/img1.jpg",
    "/img3.jpg",
    "/img21.jpg",
    "/img14.jpg",
    "/img23.jpg",
    "/img30.jpg",
    "/img7.jpg",
    "/img8.jpg",
    "/img15.jpg",
    "/img25.jpg",
    "/img14.jpg",
    "/img25.jpg",
  ];
  React.useEffect(() => {
    const history = loadHistory();
    const urls = Array.from(
      new Set((history || []).map((h) => h?.url).filter(Boolean))
    ).slice(0, 12);
    if (urls.length > 0) {
      if (urls.length < 8) {
        const needed = Math.max(0, 12 - urls.length);
        const localFill = LOCAL_GALLERY_IMAGES.slice(0, needed);
        setImages([...urls, ...localFill]);
        return;
      }
      setImages(urls);
      return;
    }
    setImages(LOCAL_GALLERY_IMAGES);
  }, []);

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
            Discover amazing AI-generated images created by our community
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
                alt={`Community image ${i + 1}`}
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
    </section>
  );
}
