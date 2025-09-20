import React from "react";
import { useCredits } from "../creditsContext";
import { addHistoryItem } from "../historyStore";
import { removeBackground } from "../services/gemini";
import {
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlineCheck,
  HiOutlineScissors,
} from "react-icons/hi";

export default function BackgroundRemovalPage() {
  const { credits, consumeCredits } = useCredits();
  const [file, setFile] = React.useState(null);
  const [img, setImg] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  async function onProcess() {
    if (credits < 1 || !file) return;
    setLoading(true);
    try {
      const result = await removeBackground(file);
      setImg(result.url);
      if (result.generated) {
        const ok = await consumeCredits(1);
        if (!ok) throw new Error("Credit deduction failed");
        addHistoryItem({ type: "bgremove", url: result.url, ts: Date.now() });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-20 sm:pb-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-lg sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          Background Removal
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg">
          Remove or replace backgrounds from your images with AI-powered
          precision
        </p>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
        {/* Left Column - Input Form */}
        <div className="space-y-3 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-3 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[500px] flex flex-col">
            <div className="mb-3 sm:mb-6">
              <h2 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2 text-gray-900">
                Remove Background
              </h2>
              <p className="text-gray-700 text-xs sm:text-lg">
                Each removal uses 1 credit
              </p>
            </div>

            <div className="flex-1 flex flex-col space-y-3 sm:space-y-6">
              <div className="flex-1">
                <label className="block text-gray-900 text-sm sm:text-lg font-medium mb-1 sm:mb-3">
                  Upload your image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl sm:rounded-2xl bg-white border border-gray-300 px-3 sm:px-6 py-2 sm:py-4 text-gray-900 
                    file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg sm:file:rounded-xl 
                    file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-yellow-400 file:text-black 
                    hover:file:bg-yellow-300 file:cursor-pointer cursor-pointer text-xs sm:text-base"
                  />
                </div>
                {file && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm">
                    <HiOutlineCheck className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                    {file.name} selected
                  </div>
                )}
              </div>

              <div className="mt-auto hidden sm:block">
                <button
                  onClick={onProcess}
                  className="w-full inline-flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-yellow-400 text-black font-bold px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-md sm:shadow-xl hover:shadow-yellow-400/25 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  disabled={loading || credits < 1 || !file}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-black"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <HiOutlineScissors className="w-4 h-4 sm:w-5 sm:h-5" />
                      Remove Background
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <div className="space-y-2 sm:space-y-4">
            {credits < 1 && (
              <div className="rounded-xl sm:rounded-2xl border border-yellow-200 bg-yellow-50 p-2.5 sm:p-4 text-yellow-700">
                <div className="flex items-start gap-2 sm:gap-3">
                  <HiOutlineExclamation className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg">
                      Insufficient Credits
                    </h3>
                    <p className="text-xs sm:text-sm">
                      You need at least 1 credit to remove backgrounds.{" "}
                      <a
                        href="/dashboard-pricing"
                        className="underline hover:text-yellow-600"
                      >
                        Buy credits
                      </a>{" "}
                      to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Generated Image */}
        <div className="space-y-3 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-3 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[500px] flex flex-col">
            <h3 className="text-base sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-900">
              Processed Image
            </h3>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center mb-3 sm:mb-4">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-16 sm:w-16 border-b-2 border-yellow-400 mx-auto mb-2 sm:mb-4"></div>
                    <p className="text-gray-700 text-sm sm:text-lg">
                      Removing background...
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
                      This may take a few moments
                    </p>
                  </div>
                ) : img ? (
                  <div className="w-full">
                    <img
                      src={img}
                      alt="Background removed result"
                      className="w-full max-w-[250px] sm:max-w-md mx-auto rounded-xl sm:rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <HiOutlineScissors className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-gray-400" />
                    <p className="text-sm sm:text-lg">
                      Your processed image will appear here
                    </p>
                    <p className="text-xs sm:text-sm mt-1 sm:mt-2">
                      Upload an image and click Remove Background
                    </p>
                  </div>
                )}
              </div>

              {img && (
                <div className="mt-auto">
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = img;
                      link.download = "background-removed.png";
                      link.click();
                    }}
                    className="w-full bg-yellow-400 text-black px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-yellow-300 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <HiOutlineDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                    Download Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Remove Bar (mobile only) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2.5">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onProcess}
            disabled={loading || credits < 1 || !file}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 text-black font-bold px-3 py-2.5 text-sm hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                Processing...
              </>
            ) : (
              <>
                <HiOutlineScissors className="w-4 h-4" />
                Remove Background
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
