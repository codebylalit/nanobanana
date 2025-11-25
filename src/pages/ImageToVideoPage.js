import React from "react";
import {
  HiOutlineVideoCamera,
  HiOutlineDownload,
  HiOutlinePhotograph,
} from "react-icons/hi";
import { useCredits } from "../creditsContext";
import {
  generateVideoFromImage,
  checkBackendHealth,
} from "../services/videoService";

export default function ImageToVideoPage() {
  const { credits, consumeCredits } = useCredits();
  const [file, setFile] = React.useState(null);
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [backendStatus, setBackendStatus] = React.useState(null);
  const abortRef = React.useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkBackendHealth();
        setBackendStatus({ status: "healthy", data: health });
      } catch (error) {
        setBackendStatus({ status: "error", error: error.message });
      }
    };
    checkHealth();
  }, []);

  const onGenerate = async () => {
    if (!file || !prompt.trim()) return;
    if (credits < 5) return; // example cost

    setLoading(true);
    setError(null);

    try {
      abortRef.current?.abort?.();
      abortRef.current = new AbortController();

      console.log("Starting video generation...", {
        file: file.name,
        prompt: prompt.trim(),
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });

      const result = await generateVideoFromImage(prompt.trim(), file, {
        signal: abortRef.current.signal,
      });

      console.log("Video generation result:", result);

      if (result?.videoUrl) {
        setVideoUrl(result.videoUrl);
        const ok = await consumeCredits(5);
        if (!ok) throw new Error("Credit deduction failed");
      } else {
        throw new Error("No video URL returned from Google Veo");
      }
    } catch (err) {
      console.error("Video generation error:", err);
      setError(err.message || "Video generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-16">
      <div className="mb-4 sm:mb-8 text-center">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          Image to Video
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm">
          Generate a short video from an image with a guiding prompt.
        </p>
        {backendStatus && (
          <div
            className={`mt-2 text-xs px-3 py-1 rounded-full inline-block ${
              backendStatus.status === "healthy"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {backendStatus.status === "healthy"
              ? "✅ Cloud Function Connected"
              : `❌ API Error: ${backendStatus.error}`}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Upload Image
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-3 sm:p-4 text-center hover:border-yellow-400 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <p className="text-gray-500 text-xs sm:text-sm">
                  <HiOutlinePhotograph className="inline w-4 h-4 mr-1 align-text-bottom" />
                  Drop image here or{" "}
                  <span className="font-medium text-yellow-600">
                    click to upload
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the motion, scene, and style..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>

            <button
              onClick={onGenerate}
              disabled={loading || !file || !prompt.trim() || credits < 5}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-4 py-2 text-sm sm:text-base transition ${
                loading || !file || !prompt.trim() || credits < 5
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-400 text-black hover:bg-yellow-300"
              }`}
            >
              <HiOutlineVideoCamera className="w-5 h-5" />
              {loading ? "Generating..." : "Generate Video (5 credits)"}
            </button>

            {credits < 5 && (
              <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2">
                Not enough credits.
              </div>
            )}
            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                {error}
              </div>
            )}
            {loading && (
              <button
                type="button"
                onClick={() => abortRef.current?.abort?.()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm flex flex-col">
          <div className="mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
              Preview
            </h2>
          </div>
          <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full max-h-[360px] object-contain"
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected"
                className="w-full h-full max-h-[360px] object-contain"
              />
            ) : (
              <p className="text-gray-400 text-xs sm:text-sm">
                Upload an image to preview it here
              </p>
            )}
          </div>

          {videoUrl && (
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = videoUrl;
                a.download = `video-${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 text-black font-semibold px-3 py-2 text-sm sm:text-base hover:bg-yellow-600 transition"
            >
              <HiOutlineDownload className="w-4 h-4" /> Download Video
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
