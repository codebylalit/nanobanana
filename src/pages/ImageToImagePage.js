import React from "react";
import { useCredits } from "../creditsContext";
import { addHistoryItem } from "../historyStore";
import {
  imageToImage,
  improvePrompt,
  suggestPromptIdeas,
  getFriendlyErrorMessage,
} from "../services/gemini";
import { useToast } from "../toastContext";
import {
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlineRefresh,
} from "react-icons/hi";

export default function ImageToImagePage() {
  const { credits, consumeCredits, initialized } = useCredits();
  const [file, setFile] = React.useState(null);
  const [prompt, setPrompt] = React.useState("");
  const [autoActionFigure, setAutoActionFigure] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  // kept for compatibility; no longer used after moving presets to modal
  // const [savedManualPrompt, setSavedManualPrompt] = React.useState("");
  const [img, setImg] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [ideas, setIdeas] = React.useState([]);
  const [improving, setImproving] = React.useState(false);
  const [showPresetModal, setShowPresetModal] = React.useState(false);
  const { show } = useToast();

  // Deprecated action-figure toggle logic removed; preset is available via modal

  React.useEffect(() => {
    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, previewUrl]);

  const [presets, setPresets] = React.useState([]);
  React.useEffect(() => {
    fetch("/presets/presets.json")
      .then((r) => r.json())
      .then((data) => setPresets(Array.isArray(data) ? data : []))
      .catch(() => setPresets([]));
  }, []);

  function onChoosePreset(preset) {
    setAutoActionFigure(false);
    // saved manual prompt no longer used
    setPrompt(preset.prompt);
    setShowPresetModal(false);
  }

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
        const msg = getFriendlyErrorMessage("No image generated");
        setError(msg);
        show({ title: "Transformation failed", message: msg, type: "error" });
      }
    } catch (err) {
      const msg = getFriendlyErrorMessage(err?.message);
      setError(msg);
      show({ title: "Transformation failed", message: msg, type: "error" });
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
    } finally {
      setImproving(false);
    }
  }

  async function onSuggest() {
    setIdeas(["Loading ideas..."]);
    try {
      const list = await suggestPromptIdeas(prompt || "image editing styles");
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
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          Image to Image
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg">
          Transform and style your existing images with AI‑powered editing
        </p>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
        {/* Left Column - Input Form */}
        <div className="space-y-3 sm:space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-3 sm:p-6 lg:p-8 min-h-[320px] sm:min-h-[500px] flex flex-col">
            <div className="mb-3 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 text-gray-900">
                Transform Your Image
              </h2>
              <p className="text-gray-700 text-sm sm:text-lg">
                Each transformation uses 1 credit
              </p>
            </div>

            <div className="flex-1 flex flex-col space-y-3 sm:space-y-6">
              <div className="flex-1">
                <label className="block text-gray-900 text-sm sm:text-lg font-medium mb-2 sm:mb-3">
                  Upload your image
                </label>
                <div className="relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-2xl bg-white border border-gray-300 px-3 sm:px-6 py-2 sm:py-4 pr-16 sm:pr-24 text-gray-900 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 file:cursor-pointer cursor-pointer text-sm sm:text-base"
                  />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-12 sm:w-12 object-cover rounded-xl border border-gray-200 shadow-sm pointer-events-none"
                    />
                  )}
                </div>
                {/* Inline preview shown inside input; removed below-the-input preview */}
              </div>

              <div>
                <label className="block text-gray-900 text-sm sm:text-lg font-medium mb-2 sm:mb-3">
                  Describe the transformation
                </label>
                <div className="mb-2 sm:mb-3 flex items-center gap-2 flex-wrap"></div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    "e.g., Transform into a watercolor painting, make it look like a vintage photograph, convert to anime style"
                  }
                  disabled={false}
                  className={`w-full h-20 sm:h-28 rounded-2xl px-3 sm:px-6 py-2 sm:py-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none ${
                    autoActionFigure
                      ? "bg-gray-50 border border-gray-200 text-gray-600"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPresetModal(true)}
                    className="inline-flex items-center rounded-xl border border-gray-300 px-2.5 py-2 text-sm font-semibold hover:bg-gray-50"
                  >
                    Select preset
                  </button>
                  <button
                    onClick={onImprove}
                    className="inline-flex items-center rounded-xl border border-gray-300 px-2.5 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 disabled:hover:bg-white disabled:cursor-not-allowed"
                    disabled={improving || credits < 1}
                  >
                    {improving ? "Improving…" : "Improve prompt"}
                  </button>
                  <button
                    onClick={onSuggest}
                    className="inline-flex items-center rounded-xl border border-gray-300 px-2.5 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 disabled:hover:bg-white disabled:cursor-not-allowed"
                    disabled={credits < 1}
                  >
                    Suggest ideas
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
                      Click <span className="font-medium">Refresh</span> to get
                      ideas based on your current prompt.
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
              </div>

              <div className="mt-auto">
                <button
                  onClick={onGenerate}
                  className="w-full inline-flex items-center justify-center gap-2 sm:gap-3 rounded-2xl bg-yellow-400 text-black font-bold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-yellow-400/25 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
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
          <div className="space-y-2 sm:space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 sm:p-4 text-red-700">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl">❌</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">
                      Transformation Failed
                    </h3>
                    <p className="text-xs sm:text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {credits < 1 && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4 text-yellow-700">
                <div className="flex items-center gap-2 sm:gap-3">
                  <HiOutlineExclamation className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">
                      Insufficient Credits
                    </h3>
                    <p className="text-xs sm:text-sm">
                      You need at least 1 credit to transform an image.{" "}
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

        {/* Right Column - Generated Image + Ideas */}
        <div className="space-y-3 sm:space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-3 sm:p-6 lg:p-8 min-h-[320px] sm:min-h-[500px] flex flex-col">
            <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-900">
              Transformed Image
            </h3>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center mb-4">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-yellow-400 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-700 text-base sm:text-lg">
                      Transforming your image...
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-2">
                      This may take a few moments
                    </p>
                  </div>
                ) : img ? (
                  <div className="w-full">
                    <img
                      src={img}
                      alt="Transformed result"
                      className="w-full max-w-sm sm:max-w-md mx-auto rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <HiOutlineRefresh className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-gray-400" />
                    <p className="text-sm sm:text-lg">
                      Your transformed image will appear here
                    </p>
                    <p className="text-xs sm:text-sm mt-1 sm:mt-2">
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
                    className="w-full bg-yellow-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-yellow-300 transition-all duration-200 flex items-center justify-center gap-2"
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
      {/* Sticky Transform Bar (mobile) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onGenerate}
            disabled={loading || credits < 1 || !file}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 text-base hover:bg-yellow-300 transition disabled:opacity-50"
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

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPresetModal(false)}
          ></div>
          <div className="relative z-50 w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-3 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-base sm:text-xl font-bold text-gray-900">
                Choose a preset
              </h3>
              <button
                onClick={() => setShowPresetModal(false)}
                className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChoosePreset(p)}
                  className="group text-left border border-gray-200 rounded-xl overflow-hidden hover:border-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gray-50">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-2">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {p.title}
                    </div>
                    <div className="text-[11px] sm:text-xs text-gray-500 line-clamp-2">
                      {p.prompt}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
