const API_URL =
  process.env.REACT_APP_VIDEO_API_URL ||
  "https://REGION-PROJECT.cloudfunctions.net/veo3-proxy";

/**
 * Generate video from image via Cloud Function
 */
export async function generateVideoFromImage(prompt, imageFile, options = {}) {
  const { signal } = options;
  try {
    if (!prompt || !imageFile) throw new Error("Prompt and image are required");

    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const body = {
      prompt: prompt,
      imageBase64: base64, // Veo 3 expects base64 for image input
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) throw new Error(`Video generation failed: ${res.status}`);
    const data = await res.json();

    return {
      success: true,
      videoUrl: data.videoUrl || data.data?.predictions?.[0]?.videoUri || null,
      fullResponse: data,
    };
  } catch (err) {
    console.error("Video generation error:", err);
    throw err;
  }
}

/**
 * Optional: check Cloud Function health
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(API_URL, { method: "OPTIONS" });
    if (res.ok || res.status === 204) return { status: "healthy" };
    return { status: "error" };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}
