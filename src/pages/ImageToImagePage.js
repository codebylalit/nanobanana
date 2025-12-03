import React from "react";
import { useCredits } from "../creditsContext";
import { useAuth } from "../authContext";
import { addHistoryItem } from "../historyStore";
import {
  imageToImage,
  improvePrompt,
  suggestPromptIdeas,
  getFriendlyErrorMessage,
} from "../services/gemini";
import { useToast } from "../toastContext";
import { HiOutlineDownload, HiOutlineRefresh } from "react-icons/hi";
import Modal from "../components/Modal";

export default function ImageToImagePage() {
  const { credits, consumeCredits, initialized } = useCredits();
  const { user } = useAuth();
  const [file, setFile] = React.useState(null);
  const [prompt, setPrompt] = React.useState("");
  // const [autoActionFigure, setAutoActionFigure] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  // kept for compatibility; no longer used after moving presets to modal
  // const [savedManualPrompt, setSavedManualPrompt] = React.useState("");
  // img is always the Gemini output (data URL), previewUrl is only for user-uploaded preview
  const [img, setImg] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [ideas, setIdeas] = React.useState([]);
  const [improving, setImproving] = React.useState(false);
  const [showPresetModal, setShowPresetModal] = React.useState(false);
  const { show } = useToast();
  const [userApiKey, setUserApiKey] = React.useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [savingApiKey, setSavingApiKey] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) {
        setUserApiKey(null);
        setShowApiKeyModal(false);
        return;
      }
      try {
        const { getUserApiKey } = await import("../userApiKeyService");
        const key = await getUserApiKey(user.uid);
        if (!cancelled) {
          setUserApiKey(key || null);
          setShowApiKeyModal(!key);
        }
      } catch (e) {
        console.error("Failed to load user API key", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Deprecated action-figure toggle logic removed; preset is available via modal

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const [presets, setPresets] = React.useState([]);
  React.useEffect(() => {
    fetch("/presets/presets.json")
      .then((r) => r.json())
      .then((data) => setPresets(Array.isArray(data) ? data : []))
      .catch(() => setPresets([]));
  }, []);

  function onChoosePreset(preset) {
    // setAutoActionFigure(false); // deprecated
    // saved manual prompt no longer used
    setPrompt(preset.prompt);
    setShowPresetModal(false);
  }

  async function onGenerate() {
    if ((!userApiKey && credits < 1) || !file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await imageToImage(file, prompt, userApiKey);
      if (result && result.url) {
        setImg(result.url);
        if (result.generated) {
          // Only consume credits if the image was actually generated
          if (!userApiKey) {
            const ok = await consumeCredits(1);
            if (!ok) throw new Error("Credit deduction failed");
          }
          // Add to history
          await addHistoryItem({
            type: "img2img",
            prompt: prompt,
            url: result.url,
            timestamp: Date.now(),
          });
        }
      } else {
        const msg = getFriendlyErrorMessage("No image generated");
        setError(msg);
        show({ title: "Transformation failed", message: msg, type: "error" });
      }
    } catch (err) {
      console.error("Generation failed:", err);
      const msg = getFriendlyErrorMessage(err?.message);
      setError(msg);
      show({ title: "Transformation failed", message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function onImprove() {
    if (!prompt.trim()) {
      show({
        title: "No prompt",
        message: "Please enter a prompt first",
        type: "warning",
      });
      return;
    }
    if (credits < 1) {
      show({
        title: "No credits",
        message: "You need at least 1 credit to improve prompts",
        type: "error",
      });
      return;
    }

    setImproving(true);
    try {
      const better = await improvePrompt(prompt, userApiKey);
      if (better && better !== prompt) {
        setPrompt(better);
        show({
          title: "Prompt improved",
          message: "Your prompt has been enhanced",
          type: "success",
        });
      } else {
        show({
          title: "No changes",
          message: "The prompt couldn't be improved at this time",
          type: "info",
        });
      }
    } catch (e) {
      console.error("Improve prompt error:", e);
      show({
        title: "Improvement failed",
        message: "Could not improve prompt. Please try again.",
        type: "error",
      });
    } finally {
      setImproving(false);
    }
  }

  async function onSuggest() {
    setIdeas(["Loading ideas..."]);
    try {
      const list = await suggestPromptIdeas(
        prompt || "image editing styles",
        userApiKey
      );
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
    <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 pb-16 sm:pb-0">
      {/* Header */}
      <div className="mb-4 sm:mb-8 text-center">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
          Image to Image
        </h1>
        <p className="text-gray-600 text-xs sm:text-base">
          Transform and style your existing images with AI-powered editing
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Left Column */}
        <div className="space-y-3 sm:space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-6 flex flex-col min-h-[280px] sm:min-h-[480px]">
            <div className="mb-3 sm:mb-6">
              <h2 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-gray-900">
                Transform Your Image
              </h2>
              <p className="text-gray-700 text-xs sm:text-sm">
                Each transformation uses 1 credit
              </p>
            </div>

            {/* Upload */}
            <div className="flex-1 flex flex-col space-y-3 sm:space-y-5">
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-1">
                  Upload your image
                </label>
                <div className="relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-sm text-gray-900 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 cursor-pointer"
                  />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-md border border-gray-200 shadow-sm pointer-events-none"
                    />
                  )}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-1">
                  Describe the transformation
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., watercolor painting, vintage photo, anime style"
                  className="w-full h-20 sm:h-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPresetModal(true)}
                    className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    Presets
                  </button>
                  <button
                    onClick={onImprove}
                    disabled={improving || credits < 1}
                    className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    {improving ? "Improving…" : "Improve"}
                  </button>
                  <button
                    onClick={onSuggest}
                    disabled={credits < 1}
                    className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suggest
                  </button>
                </div>
              </div>

              {/* Ideas */}
              <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                    💡 Prompt Ideas
                  </h3>
                  <button
                    onClick={onSuggest}
                    disabled={credits < 1}
                    className="text-xs font-medium text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>

                {ideas.length === 0 ? (
                  <p className="text-gray-500 text-xs italic">
                    Tap refresh for prompt ideas
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                    {ideas.map((idea, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setPrompt((p) => (p ? `${p} — ${idea}` : idea))
                        }
                        className="rounded-full border border-gray-300 px-2.5 py-1 text-xs bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 transition"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate */}
              <div className="mt-auto hidden sm:block">
                <button
                  onClick={onGenerate}
                  disabled={loading || (!userApiKey && credits < 1) || !file}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 text-black font-bold px-4 py-3 text-sm hover:bg-yellow-300 transition-all duration-200 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Transforming...
                    </>
                  ) : (
                    <>
                      <HiOutlineRefresh className="w-4 h-4" />
                      {userApiKey ? "Transform (Free with API Key)" : "Transform (1 credit)"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2 sm:space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 sm:p-3 text-red-700 text-xs sm:text-sm">
                ❌ {error}
              </div>
            )}
            {credits < 1 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 sm:p-3 text-yellow-700 text-xs sm:text-sm">
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

        {/* Right Column */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-6 flex flex-col min-h-[280px] sm:min-h-[480px]">
          <h3 className="text-base sm:text-xl font-bold mb-3 text-gray-900">
            Transformed Image
          </h3>

          <div className="flex-1 flex items-center justify-center">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                <p className="text-gray-700 text-sm">Transforming image...</p>
                <p className="text-gray-500 text-xs mt-1">
                  This may take a few moments
                </p>
              </div>
            ) : img ? (
              <img
                src={img}
                alt="Result"
                className="w-full max-w-xs sm:max-w-md mx-auto rounded-lg border border-gray-200"
              />
            ) : (
              <div className="text-center text-gray-500">
                <HiOutlineRefresh className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs sm:text-sm">Upload an image to start</p>
              </div>
            )}
          </div>

          {img && (
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = img;
                link.download = "transformed-image.png";
                link.click();
              }}
              className="mt-4 w-full bg-yellow-400 text-black px-3 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition flex items-center justify-center gap-2 text-sm"
            >
              <HiOutlineDownload className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Sticky Bar for Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2">
        <button
          onClick={onGenerate}
          disabled={loading || (!userApiKey && credits < 1) || !file}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 text-black font-bold px-3 py-3 text-sm hover:bg-yellow-300 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              Transforming...
            </>
          ) : (
            <>
              <HiOutlineRefresh className="w-4 h-4" />
              {userApiKey ? "Transform (Free with API Key)" : "Transform (1 credit)"}
            </>
          )}
        </button>
      </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPresetModal(false)}
          ></div>
          <div className="relative z-50 w-full sm:max-w-3xl bg-white rounded-t-xl sm:rounded-xl shadow-xl p-3 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-sm sm:text-lg font-bold text-gray-900">
                Choose a preset
              </h3>
              <button
                onClick={() => setShowPresetModal(false)}
                className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChoosePreset(p)}
                  className="group text-left border border-gray-200 rounded-lg overflow-hidden hover:border-yellow-400"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gray-50">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-900 truncate">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-gray-500 line-clamp-2">
                      {p.prompt}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <Modal
        open={showApiKeyModal && !!user}
        onClose={() => setShowApiKeyModal(false)}
        title="Use Your Own API Key (Free)"
      >
        <div className="mb-3 text-gray-800 text-sm">
          Add your Google Gemini API key to use the app for free. Your credits will not be consumed if you use your own key.<br />
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-700 underline"
          >
            Get your Gemini API key
          </a>
        </div>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder="Paste your Gemini API key here"
          className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-yellow-400 text-black font-semibold px-4 py-2 text-sm hover:bg-yellow-300 disabled:opacity-50"
            disabled={!apiKeyInput.trim() || savingApiKey}
            onClick={async () => {
              if (!user?.uid || !apiKeyInput.trim()) return;
              setSavingApiKey(true);
              try {
                const { upsertUserApiKey } = await import("../userApiKeyService");
                await upsertUserApiKey(user.uid, apiKeyInput.trim());
                setUserApiKey(apiKeyInput.trim());
                setShowApiKeyModal(false);
                setApiKeyInput("");
                show({ title: "Saved", message: "API key added. Enjoy free usage!", type: "success" });
              } catch (err) {
                show({ title: "Error", message: err?.message || "Failed to save API key.", type: "error" });
              } finally {
                setSavingApiKey(false);
              }
            }}
          >
            {savingApiKey ? "Saving..." : "Save Key"}
          </button>
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => setShowApiKeyModal(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
