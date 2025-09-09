import React from "react";
import { loadHistory, clearHistory, getStorageInfo } from "../historyStore";
import {
  HiOutlineExclamation,
  HiOutlinePhotograph,
  HiOutlinePencil,
} from "react-icons/hi";

export default function PreviousImagesPage() {
  const [items, setItems] = React.useState(() => loadHistory());
  const [storageInfo, setStorageInfo] = React.useState(() => getStorageInfo());
  const [showStorageWarning, setShowStorageWarning] = React.useState(false);

  React.useEffect(() => {
    setItems(loadHistory());
    setStorageInfo(getStorageInfo());

    // Show warning if storage is getting full
    const info = getStorageInfo();
    if (info.size > info.maxSize * 0.8) {
      setShowStorageWarning(true);
    }
  }, []);

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all history? This action cannot be undone."
      )
    ) {
      clearHistory();
      setItems([]);
      setStorageInfo(getStorageInfo());
      setShowStorageWarning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Storage Warning */}
      {showStorageWarning && (
        <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiOutlineExclamation className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-yellow-400 font-bold">
                  Storage Almost Full
                </h3>
                <p className="text-white/80 text-sm">
                  You're using {storageInfo.sizeFormatted} of storage. Clear old
                  history to free up space.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearHistory}
              className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold hover:bg-yellow-300 transition-all duration-200"
            >
              Clear History
            </button>
          </div>
        </div>
      )}

      {/* Storage Info */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Storage Usage</h3>
            <p className="text-white/70 text-sm">
              {storageInfo.itemCount} items • {storageInfo.sizeFormatted}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setItems(loadHistory());
                setStorageInfo(getStorageInfo());
              }}
              className="bg-white/10 text-white px-3 py-2 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200"
            >
              Refresh
            </button>
            <button
              onClick={handleClearHistory}
              className="bg-red-500/20 text-red-400 px-3 py-2 rounded-xl font-semibold hover:bg-red-500/30 transition-all duration-200"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xl text-white/80 leading-relaxed">
          Browse and download your AI-generated images
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-12 text-center">
          <HiOutlinePhotograph className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <h3 className="text-2xl font-bold mb-2 text-white">No images yet</h3>
          <p className="text-white/70 text-lg mb-6">
            Start creating amazing images with our AI tools!
          </p>
          <a
            href="/text-to-image"
            className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 text-black font-bold px-6 py-3 hover:bg-yellow-300 hover:scale-105 transition-all duration-200"
          >
            <HiOutlinePencil className="w-5 h-5" />
            Create Your First Image
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 overflow-hidden hover:border-white/20 hover:scale-105 transition-all duration-300 group"
            >
              <div className="relative">
                <img
                  src={it.url}
                  alt={it.prompt || it.type}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = it.url;
                      link.download = `image-${i + 1}.png`;
                      link.click();
                    }}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200"
                  >
                    Download
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm text-white/60 mb-1 capitalize">
                  {it.type}
                </div>
                <div className="text-white/90 text-sm line-clamp-2">
                  {it.prompt || "No description"}
                </div>
                <div className="text-white/50 text-xs mt-2">
                  {new Date(
                    it.ts || it.timestamp || Date.now()
                  ).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
