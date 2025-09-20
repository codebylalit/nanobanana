// ImgBB-optimized Gemini API service
const RAPIDAPI_URL =
  "https://gemini-2-5-flash-image-nano-banana1.p.rapidapi.com/api/gemini";

const RAPIDAPI_KEYS = [
  "35b7f88f82msh6d25d050022cf22p1a7c69jsn186f478ca907",
  "0c8ddd99f9msha85f88a8629814dp16cca4jsn6791b6b71e96",
  "1edab2b6f9msh6ff409c9a4b0b1fp17f2a5jsnf22db7c4bb79",
  "3c7e94fa19msh34f0e004e88042ep145455jsn8582a03edfeb",
  "f82066f4c3msh6ff409c9a4b0b1fp17f2a5jsnf22db7c4bb79",
];

// Multiple ImgBB API keys for redundancy
const IMGBB_KEYS = [
  "976c43da17048b8595498ac1ba0fa639", // Get from imgbb.com
  "YOUR_IMGBB_KEY_2", // Backup key 1
  "YOUR_IMGBB_KEY_3", // Backup key 2
];

// Device detection for optimization
const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Smart image compression before upload
async function compressImageForUpload(file) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Adaptive sizing based on device
      const maxSize = isMobile() ? 1200 : 1920;
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width *= scale;
        height *= scale;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Higher quality since we're uploading to ImgBB, not embedding in JSON
      const quality = isMobile() ? 0.85 : 0.92;
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });
          console.log(
            `Compressed: ${file.size} → ${compressedFile.size} bytes (${width}x${height})`
          );
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Image processing failed"));
    img.src = URL.createObjectURL(file);
  });
}

// Upload to ImgBB with multiple key fallback
async function uploadToImgBB(file) {
  let lastError;

  for (const apiKey of IMGBB_KEYS) {
    if (!apiKey || apiKey.startsWith("976c43da17048b8595498ac1ba0fa639")) {
      continue; // Skip placeholder keys
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ImgBB error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data?.url) {
        console.log("ImgBB upload successful:", result.data.url);
        return result.data.url;
      }

      throw new Error("ImgBB returned no URL");
    } catch (error) {
      console.warn(`ImgBB key ${apiKey.slice(0, 6)}... failed:`, error.message);
      lastError = error.message;

      // If rate limited, try next key immediately
      if (error.message.includes("429") || error.message.includes("rate")) {
        continue;
      }
    }
  }

  throw new Error(`All ImgBB keys failed: ${lastError}`);
}

// Fallback upload services if ImgBB fails
async function uploadToFallbackService(file) {
  const fallbackServices = [
    async () => {
      // File.io upload
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://file.io", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`File.io failed: ${response.status}`);

      const result = await response.json();
      if (result.success && result.link) return result.link;
      throw new Error("File.io no URL returned");
    },

    async () => {
      // TmpFiles upload
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`TmpFiles failed: ${response.status}`);

      const result = await response.json();
      if (result.status === "success" && result.data?.url) {
        return result.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
      }
      throw new Error("TmpFiles no URL returned");
    },
  ];

  let lastError;
  for (const service of fallbackServices) {
    try {
      const url = await service();
      console.log("Fallback upload successful:", url);
      return url;
    } catch (error) {
      console.warn("Fallback service failed:", error.message);
      lastError = error.message;
    }
  }

  throw new Error(`All upload services failed: ${lastError}`);
}

// Main upload function with intelligent fallback
async function uploadImage(file) {
  try {
    // Step 1: Compress image
    const compressedFile = await compressImageForUpload(file);

    // Step 2: Try ImgBB first (best reliability and permanence)
    try {
      return await uploadToImgBB(compressedFile);
    } catch (imgbbError) {
      console.warn(
        "ImgBB failed, trying fallback services:",
        imgbbError.message
      );

      // Step 3: Fallback to other services
      return await uploadToFallbackService(compressedFile);
    }
  } catch (error) {
    console.error("Image upload failed:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Optimized API call using URLs instead of base64
async function callGeminiAPI(prompt, imageUrls = []) {
  let lastError;

  for (const key of RAPIDAPI_KEYS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const payload = {
        prompt: prompt.slice(0, 500), // Reasonable prompt length
        image: imageUrls.slice(0, 1), // Single image
        stream: false,
        return: "url_image",
      };

      console.log(
        `API call with key ${key.slice(0, 6)}..., images: ${imageUrls.length}`
      );

      const response = await fetch(RAPIDAPI_URL, {
        method: "POST",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host":
            "gemini-2-5-flash-image-nano-banana1.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => `HTTP ${response.status}`);

        // Try next key on quota/rate limit
        if (
          response.status === 429 ||
          errorText.includes("rate") ||
          errorText.includes("quota")
        ) {
          console.warn("Key quota exceeded, trying next...");
          lastError = errorText;
          continue;
        }

        throw new Error(errorText);
      }

      const responseText = await response.text();

      // Handle empty responses
      if (
        !responseText ||
        responseText.trim() === "" ||
        responseText === "{}"
      ) {
        console.warn("Empty response, trying next key...");
        lastError = "Empty response";
        continue;
      }

      // Check for API errors
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.error) {
          if (
            parsed.error.includes("estava vazia") ||
            parsed.error.includes("no image")
          ) {
            console.warn("Empty AI response, trying next key...");
            lastError = parsed.error;
            continue;
          }
          throw new Error(parsed.error);
        }
      } catch (e) {
        if (e.message.includes("estava vazia")) throw e;
      }

      return responseText;
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Request timeout, trying next key...");
        lastError = "Timeout";
      } else {
        console.warn(`Key failed: ${err.message}`);
        lastError = err.message;
      }
    }
  }

  throw new Error(`All API keys failed: ${lastError}`);
}

// Create placeholder images
function createPlaceholder(label, subtitle, type = "info") {
  const colors = {
    info: ["#1a1a2e", "#16213e"],
    error: ["#dc2626", "#991b1b"],
    warning: ["#f59e0b", "#d97706"],
    success: ["#059669", "#047857"],
  };

  const [color1, color2] = colors[type] || colors.info;

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${color1}'/>
        <stop offset='1' stop-color='${color2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='45%' text-anchor='middle' fill='#FACC15' font-size='18' font-family='system-ui' font-weight='bold'>${label}</text>
    <text x='50%' y='55%' text-anchor='middle' fill='#ddd' font-size='11' font-family='system-ui'>${subtitle}</text>
    <text x='50%' y='65%' text-anchor='middle' fill='#888' font-size='9' font-family='system-ui'>Gemini AI</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Main API functions
export async function textToImage(prompt) {
  if (!prompt?.trim()) {
    throw new Error("Prompt is required");
  }

  try {
    const result = await callGeminiAPI(`Create image: ${prompt.trim()}`, []);

    if (result?.trim()) {
      try {
        const parsed = JSON.parse(result);
        const imageUrl = parsed.url || parsed.image_url || parsed.image;
        if (imageUrl) return { url: imageUrl, generated: true };
      } catch {
        if (result.startsWith("http")) {
          return { url: result.trim(), generated: true };
        }
      }
    }

    return {
      url: createPlaceholder("Generated Image", prompt.slice(0, 40) + "..."),
      generated: false,
    };
  } catch (error) {
    return {
      url: createPlaceholder(
        "Generation Failed",
        getFriendlyErrorMessage(error?.message),
        "error"
      ),
      generated: false,
    };
  }
}

export async function imageToImage(file, prompt) {
  if (!file) {
    throw new Error("Image is required");
  }

  try {
    let imageUrl;

    // Handle direct URLs
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    }
    // Handle File objects - upload to ImgBB
    else if (file instanceof File) {
      try {
        console.log("Uploading image to ImgBB...");
        imageUrl = await uploadImage(file);
        console.log("Image uploaded successfully:", imageUrl);
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        return {
          url: createPlaceholder(
            "Upload Failed",
            "Could not upload image. Try again or use a direct URL.",
            "error"
          ),
          generated: false,
        };
      }
    } else {
      throw new Error("Invalid image input");
    }

    // Transform the image using the uploaded URL
    const result = await callGeminiAPI(
      `Transform: ${prompt || "artistic style"}`,
      [imageUrl]
    );

    if (result?.trim()) {
      try {
        const parsed = JSON.parse(result);
        const resultUrl = parsed.url || parsed.image_url || parsed.image;
        if (resultUrl) return { url: resultUrl, generated: true };
      } catch {
        if (result.startsWith("http")) {
          return { url: result.trim(), generated: true };
        }
      }
    }

    return {
      url: createPlaceholder(
        "Transformed Image",
        prompt?.slice(0, 30) + "..." || "Style applied"
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Image transformation error:", error);
    return {
      url: createPlaceholder(
        "Transform Failed",
        getFriendlyErrorMessage(error?.message),
        "error"
      ),
      generated: false,
    };
  }
}

// Helper functions
export async function generateHeadshot(file, prompt) {
  return await imageToImage(
    file,
    `Professional headshot: ${prompt || "clean background"}`
  );
}

export async function removeBackground(file) {
  return await imageToImage(file, "Remove background, isolate subject");
}

export async function editImageAdjustments(file, options) {
  const adjustments = Object.entries(options || {})
    .filter(([, v]) => v !== 0 && v != null)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return await imageToImage(
    file,
    `Enhance: ${adjustments || "improve quality"}`
  );
}

export async function improvePrompt(userPrompt) {
  try {
    const result = await callGeminiAPI(`Improve: ${userPrompt}`, []);

    try {
      const parsed = JSON.parse(result);
      return parsed.text || parsed.response || result.trim() || userPrompt;
    } catch {
      return result.trim() || userPrompt;
    }
  } catch (e) {
    console.warn("Improve prompt failed:", e);
    return `${userPrompt} — detailed, high quality`;
  }
}

export async function suggestPromptIdeas(topic) {
  try {
    const result = await callGeminiAPI(
      `List 8 creative prompts: ${topic || "art"}`,
      []
    );

    let raw = result;
    try {
      const parsed = JSON.parse(result);
      raw = parsed.text || parsed.response || result;
    } catch {}

    const lines = raw
      .split(/\n+/)
      .map((l) => l.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 8);

    if (lines.length) return lines;
  } catch (e) {
    console.warn("Suggest prompts failed:", e);
  }

  return [
    "Cyberpunk street with neon lights",
    "Mountain cabin at sunset",
    "Geometric patterns in pastels",
    "Dew drops on petals",
    "Futuristic city skyline",
    "Cozy library with warm light",
    "Abstract digital patterns",
    "Zen garden with leaves",
  ];
}

export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();

  if (msg.includes("upload failed") || msg.includes("imgbb")) {
    return "Image upload failed - check connection and try again";
  }
  if (msg.includes("timeout")) {
    return "Request timed out - try again";
  }
  if (msg.includes("não continha uma imagem") || msg.includes("no image")) {
    return "Could not generate image - try different prompt";
  }
  if (msg.includes("rate") || msg.includes("quota") || msg.includes("429")) {
    return "Service busy - try again in a moment";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error - check connection";
  }
  if (msg.includes("processing failed")) {
    return "Could not process image - try different file";
  }

  return "Something went wrong - please try again";
}

// Setup instructions
export function getImgBBSetup() {
  return {
    title: "ImgBB Setup Required",
    steps: [
      "1. Go to https://imgbb.com and create a free account",
      "2. Go to https://api.imgbb.com/ and get your API key",
      "3. Replace the IMGBB_KEYS array with your actual keys",
      "4. Consider getting 2-3 keys for redundancy (free tier: 5000 uploads/month each)",
    ],
    benefits: [
      "✓ Much faster than base64 uploads",
      "✓ Works reliably on mobile browsers",
      "✓ Higher image quality support",
      "✓ Permanent image hosting",
      "✓ No payload size issues",
    ],
  };
}
