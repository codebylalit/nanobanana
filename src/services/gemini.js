// Gemini 2.5 Flash Image Preview API service
const API_KEY = "AIzaSyBZyxJ3JolphkdvJpij0ic7XM8RvXeTpVI";
const BASE_URL_TEXT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const BASE_URL_IMAGE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent";

async function callGeminiAPI(
  prompt,
  imageData = null,
  useImageModel = false,
  retries = 2
) {
  if (!API_KEY) throw new Error("Missing Gemini API Key");

  const contents = [{ parts: [{ text: prompt }] }];
  if (imageData) {
    contents[0].parts.push({
      inline_data: { mime_type: imageData.mimeType, data: imageData.base64 },
    });
  }

  const baseUrl = useImageModel ? BASE_URL_IMAGE : BASE_URL_TEXT;
  const requestBody = { contents };
  if (useImageModel) {
    requestBody.generationConfig = { responseModalities: ["TEXT", "IMAGE"] };
  }

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (res.status === 429 && retries > 0) {
      const err = await res.json().catch(() => null);
      const retryDelay =
        err?.error?.details?.find((d) => d["@type"]?.includes("RetryInfo"))
          ?.retryDelay || "60s";
      const delayMs = parseInt(retryDelay) * 1000;
      console.warn(`Rate limit hit. Retrying after ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
      return callGeminiAPI(prompt, imageData, useImageModel, retries - 1);
    }

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${error}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Gemini API failed:", err);
    throw err;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({
        base64,
        mimeType: file.type,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to create enhanced placeholder images
function createPlaceholderImage(
  label,
  subtitle,
  gradientColors = ["#1a1a2e", "#16213e"]
) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${gradientColors[0]}'/>
        <stop offset='1' stop-color='${gradientColors[1]}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' text-anchor='middle' fill='#FACC15' font-size='24' font-family='monospace' font-weight='bold'>${label}</text>
    <text x='50%' y='60%' text-anchor='middle' fill='#ddd' font-size='14' font-family='monospace'>${
      subtitle || ""
    }</text>
    <text x='50%' y='70%' text-anchor='middle' fill='#888' font-size='12' font-family='monospace'>Powered by Gemini AI</text>
  </svg>`;
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

export async function textToImage(prompt) {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt is required for image generation");
  }

  try {
    console.log("Attempting to generate image with prompt:", prompt);

    // Use the image generation model for actual image creation
    const imagePrompt = `Generate a high-quality image based on this description: ${prompt}. Create a detailed, visually appealing image that matches the description.`;
    const response = await callGeminiAPI(imagePrompt, null, true);

    console.log("API Response:", response);

    // Check if the response contains generated image data
    if (
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content
    ) {
      const content = response.candidates[0].content;
      console.log("Content parts:", content.parts);

      // Look for image data in the response
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
          console.log("Found image data!");
          // Return the generated image as a data URL
          return {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            generated: true,
          };
        }
      }
    }

    // If no image was generated, fall back to enhanced placeholder
    console.warn(
      "No image generated, using placeholder. Response structure:",
      response
    );
    return {
      url: createPlaceholderImage(
        "AI Generated Image",
        `${prompt.slice(0, 40)}...`,
        ["#1a1a2e", "#16213e"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Text to Image Error:", error);

    // If the API call fails, return a placeholder with error info
    return {
      url: createPlaceholderImage(
        "We couldn't create this image",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

export async function imageToImage(file, prompt) {
  if (!file) {
    throw new Error("Image file is required for transformation");
  }

  try {
    const imageData = await fileToBase64(file);
    const transformationPrompt = `Transform this image according to: ${prompt}. Apply the requested changes while maintaining the overall composition and quality.`;
    const response = await callGeminiAPI(transformationPrompt, imageData, true);

    // Check if the response contains generated image data
    if (
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content
    ) {
      const content = response.candidates[0].content;

      // Look for image data in the response
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
          // Return the generated image as a data URL
          return {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            generated: true,
          };
        }
      }
    }

    // If no image was generated, fall back to enhanced placeholder
    console.warn("No image generated, using placeholder");
    return {
      url: createPlaceholderImage(
        "Image Transformed",
        `Style: ${prompt || "Default transformation"}`,
        ["#2d1b69", "#11998e"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Image to Image Error:", error);
    return {
      url: createPlaceholderImage(
        "We couldn't transform this image",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

export async function generateHeadshot(file, prompt) {
  if (!file) {
    throw new Error("Photo is required for headshot generation");
  }

  try {
    const imageData = await fileToBase64(file);
    const headshotPrompt = `Create a professional headshot from this photo: ${
      prompt || "professional corporate portrait"
    }. Enhance the lighting, background, and overall professional appearance.`;
    const response = await callGeminiAPI(headshotPrompt, imageData, true);

    // Check if the response contains generated image data
    if (
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content
    ) {
      const content = response.candidates[0].content;

      // Look for image data in the response
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
          // Return the generated image as a data URL
          return {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            generated: true,
          };
        }
      }
    }

    // If no image was generated, fall back to enhanced placeholder
    console.warn("No headshot generated, using placeholder");
    return {
      url: createPlaceholderImage(
        "Professional Headshot",
        `Style: ${prompt || "Corporate portrait"}`,
        ["#667eea", "#764ba2"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Headshot Generation Error:", error);
    return {
      url: createPlaceholderImage(
        "We couldn't generate a headshot",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

export async function removeBackground(file) {
  if (!file) {
    throw new Error("Image file is required for background removal");
  }

  try {
    const imageData = await fileToBase64(file);
    const backgroundRemovalPrompt = `Remove the background from this image while keeping the main subject intact. Create a clean, professional result with transparent or solid background.`;
    const response = await callGeminiAPI(
      backgroundRemovalPrompt,
      imageData,
      true
    );

    // Check if the response contains generated image data
    if (
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content
    ) {
      const content = response.candidates[0].content;

      // Look for image data in the response
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
          // Return the generated image as a data URL
          return {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            generated: true,
          };
        }
      }
    }

    // If no image was generated, fall back to enhanced placeholder
    console.warn("No background removal generated, using placeholder");
    return {
      url: createPlaceholderImage(
        "Background Removed",
        `Subject: ${file.name}`,
        ["#ff9a9e", "#fecfef"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Background Removal Error:", error);
    return {
      url: createPlaceholderImage(
        "We couldn't remove the background",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

export async function editImageAdjustments(file, options) {
  if (!file) {
    throw new Error("Image file is required for editing");
  }

  try {
    const imageData = await fileToBase64(file);
    const adjustments = Object.entries(options || {})
      .filter(([, v]) => v !== 0 && v != null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const editPrompt = `Apply these image adjustments to enhance this image: ${adjustments}. Focus on brightness, contrast, saturation, and overall enhancement while maintaining natural appearance.`;
    const response = await callGeminiAPI(editPrompt, imageData, true);

    // Check if the response contains generated image data
    if (
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content
    ) {
      const content = response.candidates[0].content;

      // Look for image data in the response
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
          // Return the generated image as a data URL
          return {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            generated: true,
          };
        }
      }
    }

    // If no image was generated, fall back to enhanced placeholder
    console.warn("No image editing generated, using placeholder");
    return {
      url: createPlaceholderImage(
        "Image Enhanced",
        adjustments || "No adjustments applied",
        ["#a8edea", "#fed6e3"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Image Editing Error:", error);
    return {
      url: createPlaceholderImage(
        "We couldn't enhance this image",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

// --- Prompt helper utilities ---
export async function improvePrompt(userPrompt) {
  try {
    const system =
      "Rewrite this short image prompt into a detailed, vivid, single sentence that would guide an image model. Include subject, scene, mood, lighting, lens, style, color palette. 45-80 words. Return only the prompt, no quotes or extra text.";
    const res = await callGeminiAPI(`${system}\nPrompt: ${userPrompt}`);
    const text = res?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.trim() || userPrompt;
  } catch (e) {
    console.warn("improvePrompt fallback:", e);
    return `${userPrompt} — ultra-detailed, cinematic lighting, 35mm lens, volumetric light, high contrast, rich color palette, hyperreal details, artstation quality`;
  }
}

export async function suggestPromptIdeas(topic) {
  const seed = topic?.trim() || "creative image ideas";
  try {
    const instruction =
      "Give 8 diverse, short image ideas as a bulleted list. Each idea must be <= 12 words, no numbering, no extra commentary.";
    const res = await callGeminiAPI(`${instruction}\nTopic: ${seed}`);
    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const lines = raw
      .split(/\n+/)
      .map((l) => l.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 8);
    if (lines.length) return lines;
  } catch (e) {
    console.warn("suggestPromptIdeas fallback:", e);
  }
  return [
    "Cyberpunk alley at night, neon rain, reflective puddles",
    "Cozy cabin by a lake, golden hour, misty mountains",
    "Low-poly isometric city block, pastel palette, tiny cars",
    "Macro shot of dew on leaf, soft bokeh, morning light",
    "Ancient library with floating candles, warm amber glow",
    "Futuristic desert rover under twin suns, sandstorm",
    "Studio portrait of astronaut, dramatic rim lighting",
    "Surreal staircase to clouds, minimal, clean white",
  ];
}

// --- Friendly error helpers ---
export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();
  if (msg.includes("429") || msg.includes("rate") || msg.includes("quota"))
    return "We're a bit busy right now. Please try again in a minute.";
  if (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("fetch")
  )
    return "Network issue. Check your connection and try again.";
  if (msg.includes("400") || msg.includes("invalid") || msg.includes("prompt"))
    return "The prompt may be too complex. Try simplifying or shortening it.";
  if (
    msg.includes("403") ||
    msg.includes("api key") ||
    msg.includes("unauthorized")
  )
    return "Service is temporarily unavailable. Please try again later.";
  if (msg.includes("500") || msg.includes("server"))
    return "The server had a hiccup. Please try again.";
  return "Something went wrong. Please try again.";
}

function friendlyErrorSubtitle(raw) {
  return getFriendlyErrorMessage(raw).replace(/\.$/, "");
}
