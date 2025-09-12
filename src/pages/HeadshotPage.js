import React from "react";
import { useCredits } from "../creditsContext";
import { addHistoryItem } from "../historyStore";
import {
  generateHeadshot,
  improvePrompt,
  suggestPromptIdeas,
} from "../services/gemini";
import {
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineRefresh,
} from "react-icons/hi";

export default function HeadshotPage() {
  const { credits, consumeCredits } = useCredits();
  const [file, setFile] = React.useState(null);
  const [prompt, setPrompt] = React.useState("");
  const [img, setImg] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [ideas, setIdeas] = React.useState([]);
  const [improving, setImproving] = React.useState(false);

  async function onGenerate() {
    if (credits < 1 || !file) return;
    setLoading(true);
    try {
      const result = await generateHeadshot(file, prompt);
      const url = result?.url || result;
      setImg(url);
      addHistoryItem({ type: "headshot", prompt, url, ts: Date.now() });
      const ok = await consumeCredits(1);
      if (!ok) console.warn("Credit deduction failed after headshot");
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
      const list = await suggestPromptIdeas("professional headshot styles");
      setIdeas(list);
    } catch (e) {
      setIdeas(["Try again later"]);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-24 sm:pb-12">
      {/* Header */}
      <div className="mb-6 sm:mb-10 text-center">
        <h1 className="text-lg sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          Headshot Generator
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg leading-snug sm:leading-normal">
          Create professional headshots from your photos with AI-powered
          enhancement
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
        {/* Left Column: Upload & Prompt */}
        <div className="space-y-3 sm:space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[500px] flex flex-col">
            {/* Section Header */}
            <div className="mb-3 sm:mb-6">
              <h2 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2 text-gray-900">
                Generate Professional Headshot
              </h2>
              <p className="text-gray-700 text-xs sm:text-lg">
                Each generation uses 1 credit
              </p>
            </div>

            <div className="flex-1 flex flex-col space-y-3 sm:space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-gray-900 text-sm sm:text-lg font-medium mb-1 sm:mb-3">
                  Upload your photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl sm:rounded-2xl bg-white border border-gray-300 px-3 sm:px-6 py-2 sm:py-4 text-gray-900 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg sm:file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 cursor-pointer text-xs sm:text-base"
                />
                {file && (
                  <div className="mt-2 sm:mt-3 p-2 rounded-lg sm:rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-center gap-1">
                    <HiOutlineCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    {file.name} selected
                  </div>
                )}
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-gray-900 text-sm sm:text-lg font-medium mb-1 sm:mb-3">
                  Style preferences (optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Corporate portrait, soft lighting, professional attire"
                  className="w-full h-20 sm:h-24 rounded-xl sm:rounded-2xl bg-white border border-gray-300 px-3 sm:px-6 py-2 sm:py-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-xs sm:text-base resize-none"
                />

                <div className="mt-2 sm:mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={onImprove}
                    className="rounded-lg sm:rounded-xl border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                    disabled={improving || credits < 1}
                  >
                    {improving ? "Improving…" : "Improve prompt"}
                  </button>
                  <button
                    onClick={onSuggest}
                    className="rounded-lg sm:rounded-xl border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                    disabled={credits < 1}
                  >
                    Suggest ideas
                  </button>
                </div>

                {/* Prompt Ideas */}
                <div className="mt-3 sm:mt-6 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-xs sm:text-base font-semibold text-gray-900 flex items-center gap-1">
                      💡 Prompt Ideas
                    </h3>
                    <button
                      onClick={onSuggest}
                      disabled={credits < 1}
                      className="flex items-center gap-1 text-xs sm:text-sm font-medium text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
                    >
                      <HiOutlineRefresh className="w-4 h-4" /> Refresh
                    </button>
                  </div>

                  {ideas.length === 0 ? (
                    <p className="text-gray-500 text-xs sm:text-sm italic">
                      Click Refresh to get ideas.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-24 sm:max-h-32 overflow-y-auto pr-1">
                      {ideas.map((idea, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setPrompt((p) => (p ? `${p} — ${idea}` : idea))
                          }
                          className="rounded-full border border-gray-300 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 transition"
                        >
                          {idea}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-auto">
                <button
                  onClick={onGenerate}
                  className="w-full flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-yellow-400 text-black font-bold px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base hover:bg-yellow-300 transition shadow-md disabled:opacity-50"
                  disabled={loading || credits < 1 || !file}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-black"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <HiOutlineUser className="w-4 h-4 sm:w-5 sm:h-5" />
                      Generate Headshot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          {credits < 1 && (
            <div className="rounded-xl sm:rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-yellow-700 text-xs sm:text-sm mt-2 sm:mt-4">
              <div className="flex items-start gap-2">
                <HiOutlineExclamation className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm sm:text-lg">
                    Insufficient Credits
                  </h3>
                  <p>
                    You need at least 1 credit to generate a headshot.{" "}
                    <a
                      href="/dashboard-pricing"
                      className="underline hover:text-yellow-600"
                    >
                      Buy credits
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Generated Headshot */}
        <div className="space-y-3 sm:space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[500px] flex flex-col">
            <h3 className="text-base sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-900">
              Generated Headshot
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-16 sm:w-16 border-b-2 border-yellow-400 mb-2 sm:mb-4"></div>
                  <p className="text-gray-700 text-sm sm:text-lg">
                    Generating your headshot...
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
                    This may take a few moments
                  </p>
                </>
              ) : img ? (
                <>
                  <img
                    src={img}
                    alt="Generated headshot"
                    className="w-full max-w-xs sm:max-w-md mx-auto rounded-xl sm:rounded-2xl border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = img;
                      link.download = "headshot.png";
                      link.click();
                    }}
                    className="mt-3 sm:mt-6 w-full bg-yellow-400 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-yellow-300 transition flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <HiOutlineDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                    Download Image
                  </button>
                </>
              ) : (
                <>
                  <HiOutlineUser className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-gray-400" />
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Upload a photo and click Generate to see results
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Generate Button (mobile only) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2">
        <button
          onClick={onGenerate}
          disabled={loading || credits < 1 || !file}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-yellow-400 text-black font-bold px-3 py-2 text-sm hover:bg-yellow-300 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              Generating...
            </>
          ) : (
            <>
              <HiOutlineUser className="w-4 h-4" />
              Generate Headshot
            </>
          )}
        </button>
      </div>
    </div>
  );
}
