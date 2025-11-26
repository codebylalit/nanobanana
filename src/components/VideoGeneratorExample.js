import React, { useState } from "react";
import {
  generateVideoFromImage,
  checkBackendHealth,
} from "../services/videoService";

/**
 * Simple example component demonstrating Google Veo 3 video generation
 * This shows how to use the videoService in a basic React component
 */
export default function VideoGeneratorExample() {
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);

  // Check backend health on component mount
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setImageUrl(""); // Clear URL when file is selected
  };

  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
    setImageFile(null); // Clear file when URL is entered
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!imageFile && !imageUrl.trim()) {
      setError("Please upload an image file or enter an image URL");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const imageInput = imageFile || imageUrl.trim();
      const result = await generateVideoFromImage(prompt.trim(), imageInput);

      if (result.videoUrl) {
        setVideoUrl(result.videoUrl);
      } else {
        setError("No video URL returned from the service");
      }
    } catch (err) {
      setError(err.message || "Video generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Google Veo 3 Video Generator
      </h2>

      {/* Backend Status */}
      {backendStatus && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            backendStatus.status === "healthy"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {backendStatus.status === "healthy"
            ? "✅ Backend Connected"
            : `❌ Backend Error: ${backendStatus.error}`}
        </div>
      )}

      {/* Prompt Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to generate..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      {/* Image Input - File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Image File
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
        {imageFile && (
          <p className="text-sm text-gray-600 mt-1">
            Selected: {imageFile.name} (
            {(imageFile.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        )}
      </div>

      {/* Image Input - URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Image URL
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim() || (!imageFile && !imageUrl.trim())}
        className={`w-full py-3 px-4 rounded-lg font-semibold ${
          loading || !prompt.trim() || (!imageFile && !imageUrl.trim())
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? "Generating Video..." : "Generate Video"}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Video Display */}
      {videoUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Generated Video</h3>
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: "400px" }}
          >
            Your browser does not support the video tag.
          </video>
          <div className="mt-2 text-sm text-gray-600">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open video in new tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}











