import React from "react";
import { useCredits } from "../creditsContext";
import { addHistoryItem } from "../historyStore";
import { imageToImage } from "../services/gemini";
import {
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlineCheck,
  HiOutlineRefresh,
} from "react-icons/hi";

export default function ImageToImagePage() {
  const { credits, consumeCredits, initialized } = useCredits();
  const [file, setFile] = React.useState(null);
  const [prompt, setPrompt] = React.useState("");
  const [img, setImg] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function onGenerate() {
    if (credits < 1 || !file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await imageToImage(file, prompt);
      setImg(result.url);
      if (result.generated) {
        const ok = await consumeCredits(1);
        if (!ok) throw new Error("Credit deduction failed");
        addHistoryItem({
          type: "img2img",
          prompt,
          url: result.url,
          ts: Date.now(),
        });
      } else {
        setError("No image was generated. No credits deducted.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while credits are being initialized
  if (!initialized) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xl text-white/80 leading-relaxed">
          Transform and style your existing images with AI-powered editing
        </p>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 lg:p-8 min-h-[500px] flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-white">
                Transform Your Image
              </h2>
              <p className="text-white/70 text-lg">
                Each transformation uses 1 credit
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

              <div>
                <label className="block text-white/90 text-lg font-medium mb-3">
                  Describe the transformation
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Transform into a watercolor painting, make it look like a vintage photograph, convert to anime style"
                  className="w-full h-24 rounded-2xl bg-black/40 border border-white/10 px-6 py-4 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none text-lg"
                />
              </div>

              <div className="mt-auto">
                <button
                  onClick={onGenerate}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-yellow-400 text-black font-bold px-8 py-4 text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-yellow-400/25 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  disabled={loading || credits < 1 || !file}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Transforming...
                    </>
                  ) : (
                    <>
                      <HiOutlineRefresh className="w-5 h-5" />
                      Transform (1 credit)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <div className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-gradient-to-r from-red-400/10 to-orange-400/5 p-4 text-red-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl">❌</span>
                  <div>
                    <h3 className="font-bold text-lg">Transformation Failed</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {credits < 1 && (
              <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 to-orange-400/5 p-4 text-yellow-200">
                <div className="flex items-center gap-3">
                  <HiOutlineExclamation className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h3 className="font-bold text-lg">Insufficient Credits</h3>
                    <p className="text-sm">
                      You need at least 1 credit to transform an image.{" "}
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
              Transformed Image
            </h3>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center mb-4">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white/70 text-lg">
                      Transforming your image...
                    </p>
                    <p className="text-white/50 text-sm mt-2">
                      This may take a few moments
                    </p>
                  </div>
                ) : img ? (
                  <div className="w-full">
                    <img
                      src={img}
                      alt="Transformed result"
                      className="w-full max-w-md mx-auto rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                    />
                  </div>
                ) : (
                  <div className="text-center text-white/50">
                    <HiOutlineRefresh className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <p className="text-lg">
                      Your transformed image will appear here
                    </p>
                    <p className="text-sm mt-2">
                      Upload an image and describe the transformation
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
                      link.download = "transformed-image.png";
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
