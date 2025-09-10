import React from "react";
import { useCredits } from "../creditsContext";
import { addHistoryItem } from "../historyStore";
import {
  textToImage,
  improvePrompt,
  suggestPromptIdeas,
  getFriendlyErrorMessage,
} from "../services/gemini";
import { useToast } from "../toastContext";
import {
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlinePencil,
  HiOutlineRefresh,
} from "react-icons/hi";

export default function TextToImagePage() {
  const { credits, consumeCredits, initialized } = useCredits();
  const [prompt, setPrompt] = React.useState("");
  const [img, setImg] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [ideas, setIdeas] = React.useState([]);
  const [improving, setImproving] = React.useState(false);
  const { show } = useToast();

  async function onGenerate() {
    if (credits < 1) return;

    setLoading(true);
    setError(null);

    try {
      const result = await textToImage(prompt);
      setImg(result.url);
      if (result.generated) {
        const ok = await consumeCredits(1);
        if (!ok) throw new Error("Credit deduction failed");
        addHistoryItem({
          type: "text2img",
          prompt,
          url: result.url,
          ts: Date.now(),
        });
      } else {
        const msg = getFriendlyErrorMessage("No image generated");
        setError(msg);
        show({ title: "Generation failed", message: msg, type: "error" });
      }
    } catch (err) {
      const msg = getFriendlyErrorMessage(err?.message);
      setError(msg);
      show({ title: "Generation failed", message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function onImprove() {
    if (!prompt.trim()) return;
    setImproving(true);
    try {
      const better = await improvePrompt(prompt);
      setPrompt(better);
    } catch (e) {
      // silent fallback
    } finally {
      setImproving(false);
    }
  }

  async function onSuggest() {
    setIdeas(["Loading ideas..."]);
    try {
      const list = await suggestPromptIdeas(prompt);
      setIdeas(list);
    } catch (e) {
      setIdeas(["Try again later"]);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-0">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Text to Image Generator
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Transform your ideas into stunning visuals with AI-powered image
          generation
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Form */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm flex flex-col">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">
            Create Your Image
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            Each generation uses <span className="font-semibold">1 credit</span>
          </p>

          {/* Prompt Input */}
          <label className="block text-gray-900 text-base font-medium mb-2">
            Describe your image
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic city at sunset with flying cars, cyberpunk style"
            className="w-full h-28 sm:h-32 rounded-2xl bg-white border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-base"
          />

          {/* Prompt Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onImprove}
              disabled={improving || credits < 1}
              className="inline-flex items-center rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {improving ? "Improving…" : "Improve Prompt"}
            </button>
            <button
              onClick={onSuggest}
              disabled={credits < 1}
              className="inline-flex items-center rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suggest Ideas
            </button>
          </div>

          {/* Prompt Ideas */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                💡 Prompt Ideas
              </h3>
              <button
                onClick={onSuggest}
                disabled={credits < 1}
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-yellow-600 hover:text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {ideas.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                Click <span className="font-medium">Refresh</span> to get ideas
                based on your current prompt.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {ideas.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPrompt((p) => (p ? `${p} — ${idea}` : idea))
                    }
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-sm bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 transition shadow-sm"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <button
              onClick={onGenerate}
              disabled={loading || credits < 1 || !prompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-black font-bold px-6 py-3 text-base hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Generating...
                </>
              ) : (
                <>
                  <HiOutlinePencil className="w-5 h-5" />
                  Generate (1 credit)
                </>
              )}
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-4 space-y-3">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                ❌ {error}
              </div>
            )}
            {credits < 1 && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-yellow-700 text-sm">
                ⚠️ You need at least 1 credit.{" "}
                <a
                  href="/dashboard-pricing"
                  className="underline hover:text-yellow-600"
                >
                  Buy credits
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm flex flex-col">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">
            Generated Image
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                <p className="text-gray-700">Generating your image...</p>
                <p className="text-gray-500 text-sm mt-1">
                  This may take a few moments
                </p>
              </div>
            ) : img ? (
              <img
                src={img}
                alt="Generated result"
                className="w-full max-w-sm sm:max-w-md rounded-2xl border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="text-center text-gray-500">
                <HiOutlinePencil className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Your generated image will appear here</p>
                <p className="text-xs text-gray-400 mt-1">
                  Enter a prompt and click Generate
                </p>
              </div>
            )}
          </div>

          {img && (
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = img;
                link.download = "generated-image.png";
                link.click();
              }}
              className="mt-6 w-full bg-yellow-400 text-black px-4 py-3 rounded-xl font-semibold hover:bg-yellow-300 transition flex items-center justify-center gap-2 text-sm"
            >
              <HiOutlineDownload className="w-4 h-4" />
              Download Image
            </button>
          )}
        </div>
      </div>

      {/* Sticky Generate Bar (mobile) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onGenerate}
            disabled={loading || credits < 1 || !prompt.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 text-base hover:bg-yellow-300 transition disabled:opacity-50 disabled:hover:bg-yellow-400"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                Generating...
              </>
            ) : (
              <>
                <HiOutlinePencil className="w-5 h-5" />
                Generate (1 credit)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
