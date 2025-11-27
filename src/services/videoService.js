// Video Generation Service
// Using Pollinations AI (Free, No Key) for video generation.

import { uploadToImgBB, isMobile } from "./gemini";

/**
 * Generate video from image or text
 * @param {string} prompt - The text prompt for the video
 * @param {File|string} imageFile - Optional: Image file or URL for image-to-video
 * @param {object} options - Optional settings
 */
export async function generateVideoFromImage(prompt, imageFile, options = {}) {
  const { signal } = options;

  try {
    if (!prompt) throw new Error("Prompt is required");

    let imageUrl = null;

    // 1. Handle Image Upload if provided
    if (imageFile) {
      if (typeof imageFile === "string" && imageFile.startsWith("http")) {
        imageUrl = imageFile;
      } else if (imageFile instanceof File) {
        console.log("📤 Uploading image for video generation...");
        // Reuse the ImgBB upload logic from gemini.js
        imageUrl = await uploadToImgBB(imageFile);
      }
    }

    console.log(`🎥 Generating video with prompt: "${prompt}"`);

    // 2. Construct Pollinations Video URL
    // Base URL: https://video.pollinations.ai/prompt/{prompt}
    
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const seed = Math.floor(Math.random() * 1000);
    
    // Pollinations Video API
    let videoUrl = `https://video.pollinations.ai/prompt/${encodedPrompt}?model=luma&seed=${seed}&width=1024&height=576`;

    // If image exists, pass it (experimental support in Pollinations Luma wrapper)
    if (imageUrl) {
       // Note: We append it as a query param if supported, or modify prompt
       // Pollinations sometimes accepts 'image' param for video models
       videoUrl += `&image=${encodeURIComponent(imageUrl)}`;
    }

    return {
      success: true,
      videoUrl: videoUrl,
      fullResponse: { url: videoUrl },
    };

  } catch (err) {
    console.error("Video generation error:", err);
    throw err;
  }
}

/**
 * Check backend health (stub)
 */
export async function checkBackendHealth() {
  return { status: "healthy" };
}
