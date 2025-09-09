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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xl text-white/80 leading-relaxed">
          Remove backgrounds from your images instantly with AI-powered
          precision
        </p>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 lg:p-8 min-h-[500px] flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-white">
                Remove Background
              </h2>
              <p className="text-white/70 text-lg">
                Each removal uses 1 credit
              </p>
            </div>

            <div className="flex-1 flex flex-col space-y-6">
              <div className="flex-1">
                <label className="block text-white/90 text-lg font-medium mb-3">
                  Upload your image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-2xl bg-black/40 border border-white/10 px-6 py-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 file:cursor-pointer cursor-pointer"
                  />
                </div>
                {file && (
                  <div className="mt-3 p-3 rounded-xl bg-green-400/10 border border-green-400/20 text-green-200">
                    <HiOutlineCheck className="w-4 h-4 inline mr-1" />
                    {file.name} selected
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <button
                  onClick={onProcess}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-yellow-400 text-black font-bold px-8 py-4 text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-yellow-400/25 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  disabled={loading || credits < 1 || !file}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <HiOutlineScissors className="w-5 h-5" />
                      Remove Background (1 credit)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <div className="space-y-4">
            {credits < 1 && (
              <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 to-orange-400/5 p-4 text-yellow-200">
                <div className="flex items-center gap-3">
                  <HiOutlineExclamation className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h3 className="font-bold text-lg">Insufficient Credits</h3>
                    <p className="text-sm">
                      You need at least 1 credit to remove backgrounds.{" "}
                      <a
                        href="/dashboard-pricing"
                        className="underline hover:text-yellow-100"
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
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 lg:p-8 min-h-[500px] flex flex-col">
            <h3 className="text-2xl font-bold mb-6 text-white">
              Processed Image
            </h3>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center mb-4">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white/70 text-lg">
                      Removing background...
                    </p>
                    <p className="text-white/50 text-sm mt-2">
                      This may take a few moments
                    </p>
                  </div>
                ) : img ? (
                  <div className="w-full">
                    <img
                      src={img}
                      alt="Background removed result"
                      className="w-full max-w-md mx-auto rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                    />
                  </div>
                ) : (
                  <div className="text-center text-white/50">
                    <HiOutlineScissors className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <p className="text-lg">
                      Your processed image will appear here
                    </p>
                    <p className="text-sm mt-2">
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
                    className="w-full bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <HiOutlineDownload className="w-5 h-5" />
                    Download Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
