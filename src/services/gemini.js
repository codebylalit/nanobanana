// Mobile-compatible Gemini API service - avoids FileReader/FormData issues
const RAPIDAPI_URL =
  "https://gemini-2-5-flash-image-nano-banana1.p.rapidapi.com/api/gemini";

const RAPIDAPI_KEYS = [
  "35b7f88f82msh6d25d050022cf22p1a7c69jsn186f478ca907",
  "0c8ddd99f9msha85f88a8629814dp16cca4jsn6791b6b71e96",
  "1edab2b6f9msh6ff409c9a4b0b1fp17f2a5jsnf22db7c4bb79",
  "3c7e94fa19msh34f0e004e88042ep145455jsn8582a03edfeb",
  "f82066f4c3msh56c57d6e1267699p1b718ejsn97d173495495",
];

// Detect mobile browsers
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Mobile-safe API call with better error handling for empty responses
async function callGeminiAPI(prompt, imageUrls = [], retryCount = 0) {
  const maxRetries = 2;
  let lastError;

  for (const key of RAPIDAPI_KEYS) {
    try {
      const timeoutMs = isMobile() ? 45000 : 60000; // Longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // For large base64 images, use simpler prompts
      const hasLargeImage = imageUrls.some(
        (url) => typeof url === "string" && url.length > 100000 // ~75KB base64
      );

      const simplifiedPrompt = hasLargeImage
        ? prompt.split(".")[0].slice(0, 100) // Just first sentence, truncated
        : prompt.slice(0, 300);

      const payload = {
        prompt: simplifiedPrompt,
        image: imageUrls.slice(0, 1), // Only first image
        stream: false,
        return: "url_image",
      };

      console.log(
        `API call attempt (key: ${key.slice(0, 6)}..., prompt length: ${
          simplifiedPrompt.length
        }, image size: ${imageUrls[0]?.length || 0} chars)`
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
        let errorDetails = `HTTP ${response.status}`;
        try {
          const text = await response.text();
          const errorObj = JSON.parse(text);
          errorDetails = errorObj.error || errorObj.message || errorDetails;
        } catch {
          // Keep HTTP status
        }

        // Try next key on quota/rate limit
        if (response.status === 429 || /rate|quota|limit/i.test(errorDetails)) {
          console.warn("Key quota exceeded, trying next...");
          lastError = errorDetails;
          continue;
        }

        throw new Error(`API error: ${errorDetails}`);
      }

      const responseText = await response.text();
      console.log("Raw response:", responseText?.slice(0, 200) + "...");

      // Handle empty responses
      if (
        !responseText ||
        responseText.trim() === "" ||
        responseText === "{}"
      ) {
        console.warn("Empty response, trying next key...");
        lastError = "Empty response from API";
        continue;
      }

      // Check for API-level errors
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.error) {
          const errorMsg = parsed.error;

          // Retry with next key for specific errors
          if (
            errorMsg.includes("estava vazia") ||
            errorMsg.includes("no image") ||
            errorMsg.includes("não continha uma imagem") ||
            errorMsg.includes("empty")
          ) {
            console.warn("Empty AI response, trying next key...");
            lastError = errorMsg;
            continue;
          }

          throw new Error(errorMsg);
        }
      } catch (e) {
        if (e.message.includes("estava vazia") || e.message.includes("empty")) {
          throw e;
        }
        // Not JSON or not an error - proceed
      }

      return responseText;
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Request timeout, trying next key...");
        lastError = "Request timeout";
      } else if (
        err.message.includes("estava vazia") ||
        err.message.includes("empty")
      ) {
        console.warn(`Empty response error: ${err.message}`);
        lastError = err.message;
        // Don't continue, this might be a systematic issue
        break;
      } else {
        console.warn(`Key failed: ${err.message}`);
        lastError = err.message;
      }
      continue;
    }
  }

  // If we get empty responses from all keys, try once more with text-only
  if (
    lastError &&
    lastError.includes("estava vazia") &&
    imageUrls.length > 0 &&
    retryCount < maxRetries
  ) {
    console.log("Retrying with text-only prompt due to empty responses...");
    return await callGeminiAPI(prompt, [], retryCount + 1);
  }

  throw new Error(`All keys failed: ${lastError}`);
}

// Mobile-safe base64 conversion with compression
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Create canvas for compression
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Compress image for API compatibility
      const maxSize = isMobile() ? 800 : 1200; // Smaller for mobile
      let { width, height } = img;

      // Resize if too large
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width *= scale;
        height *= scale;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with compression
      const quality = isMobile() ? 0.6 : 0.8; // More compression on mobile
      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      console.log(`Compressed: ${file.size} bytes → ${dataUrl.length} chars`);
      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error("Image processing failed"));

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

// Mobile-compatible upload strategy - avoid FormData issues
async function uploadImageToHost(file) {
  if (isMobile()) {
    // On mobile, prefer direct URL method or skip upload entirely
    throw new Error(
      "Mobile upload not supported - use direct image URLs instead"
    );
  }

  // Desktop upload strategies (keeping original logic)
  const uploadStrategies = [
    () => uploadToFileIO(file),
    () => uploadToTmpFiles(file),
    () => uploadToImgBB(file),
    () => uploadToCloudinary(file),
  ];

  const errors = [];

  for (const strategy of uploadStrategies) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 15000);

      const url = await strategy();
      if (url && url.startsWith("http")) {
        console.log("Upload successful:", url);
        return url;
      }
    } catch (error) {
      console.warn("Upload failed:", error.message);
      errors.push(error.message);
    }
  }

  throw new Error(`All uploads failed: ${errors.join("; ")}`);
}

// Simplified upload functions (desktop only)
async function uploadToFileIO(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://file.io", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`File.io failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.success && result.link) {
    return result.link;
  }

  throw new Error("File.io no URL returned");
}

async function uploadToTmpFiles(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`TmpFiles failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.status === "success" && result.data && result.data.url) {
    return result.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
  }

  throw new Error("TmpFiles no URL returned");
}

async function uploadToImgBB(file) {
  // Skip if no API key configured
  throw new Error("ImgBB API key not configured");
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/demo/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.secure_url) {
    return result.secure_url;
  }

  throw new Error("Cloudinary no URL returned");
}

// Create placeholder images
function createPlaceholderImage(
  label,
  subtitle,
  gradientColors = ["#1a1a2e", "#16213e"]
) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${gradientColors[0]}'/>
        <stop offset='1' stop-color='${gradientColors[1]}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='45%' text-anchor='middle' fill='#FACC15' font-size='20' font-family='system-ui' font-weight='bold'>${label}</text>
    <text x='50%' y='55%' text-anchor='middle' fill='#ddd' font-size='12' font-family='system-ui'>${
      subtitle || ""
    }</text>
    <text x='50%' y='65%' text-anchor='middle' fill='#888' font-size='10' font-family='system-ui'>Gemini AI</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Main API functions
export async function textToImage(prompt) {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  try {
    console.log("Text to image:", prompt.slice(0, 50) + "...");

    const cleanPrompt = `Create image: ${prompt.trim()}`;
    const result = await callGeminiAPI(cleanPrompt, []);

    if (result && result.trim()) {
      try {
        const parsed = JSON.parse(result);
        if (parsed.url || parsed.image_url || parsed.image) {
          return {
            url: parsed.url || parsed.image_url || parsed.image,
            generated: true,
          };
        }
      } catch {
        if (result.startsWith("http") || result.startsWith("data:")) {
          return { url: result.trim(), generated: true };
        }
      }
    }

    return {
      url: createPlaceholderImage(
        "Generated Image",
        prompt.slice(0, 30) + "...",
        ["#1a1a2e", "#16213e"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Text to image error:", error);
    return {
      url: createPlaceholderImage(
        "Generation Failed",
        getFriendlyErrorMessage(error?.message),
        ["#dc2626", "#991b1b"]
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

    // Handle direct URLs (works on mobile)
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    }
    // Handle files - need to convert to base64 data URL for API
    else if (file instanceof File) {
      if (isMobile() && file.size > 1000000) {
        // 1MB limit for mobile
        return {
          url: createPlaceholderImage(
            "File Too Large",
            "Use smaller image or direct URL on mobile",
            ["#f59e0b", "#d97706"]
          ),
          generated: false,
        };
      }

      try {
        // Convert file to base64 data URL that can be sent to API
        imageUrl = await fileToBase64(file);
        console.log("Converted file to base64, size:", imageUrl.length);
      } catch (error) {
        console.error("File conversion failed:", error);
        return {
          url: createPlaceholderImage(
            "File Processing Failed",
            "Try using a direct image URL instead",
            ["#f59e0b", "#d97706"]
          ),
          generated: false,
        };
      }
    } else {
      throw new Error("Invalid image input");
    }

    console.log(
      "Transform image:",
      typeof imageUrl === "string" && imageUrl.startsWith("data:")
        ? "base64 data"
        : imageUrl
    );

    // Use simple prompt for better mobile compatibility
    const cleanPrompt = `Transform: ${prompt || "artistic style"}`;
    const result = await callGeminiAPI(cleanPrompt, [imageUrl]);

    if (result && result.trim()) {
      try {
        const parsed = JSON.parse(result);
        if (parsed.url || parsed.image_url || parsed.image) {
          return {
            url: parsed.url || parsed.image_url || parsed.image,
            generated: true,
          };
        }
      } catch {
        if (result.startsWith("http") || result.startsWith("data:")) {
          return { url: result.trim(), generated: true };
        }
      }
    }

    return {
      url: createPlaceholderImage(
        "Transformed Image",
        prompt ? prompt.slice(0, 30) + "..." : "Style applied",
        ["#2d1b69", "#11998e"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Image transformation error:", error);

    return {
      url: createPlaceholderImage(
        "Transform Failed",
        getFriendlyErrorMessage(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

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
    const result = await callGeminiAPI(
      `Improve this prompt: ${userPrompt}`,
      []
    );

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
      `List 8 creative prompts about: ${topic || "art"}`,
      []
    );

    let raw = result;
    try {
      const parsed = JSON.parse(result);
      raw = parsed.text || parsed.response || result;
    } catch {
      // Use as is
    }

    const lines = raw
      .split(/\n+/)
      .map((l) => l.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 8);

    if (lines.length) return lines;
  } catch (e) {
    console.warn("Suggest prompts failed:", e);
  }

  // Fallback suggestions
  return [
    "Cyberpunk street with neon lights",
    "Mountain cabin at golden hour",
    "Geometric patterns in pastels",
    "Dew drops on flower petals",
    "Futuristic city skyline",
    "Cozy library with warm lighting",
    "Abstract digital art patterns",
    "Zen garden with falling leaves",
  ];
}

export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();

  if (msg.includes("file too large")) {
    return "File too large for mobile - use smaller image";
  }
  if (
    msg.includes("file processing failed") ||
    msg.includes("file read failed")
  ) {
    return "Could not process file - try image URL instead";
  }
  if (msg.includes("timeout")) {
    return "Request timed out - try again";
  }
  if (msg.includes("upload") || msg.includes("hosting")) {
    return "Upload failed - try image URL instead";
  }
  if (msg.includes("não continha uma imagem") || msg.includes("no image")) {
    return "Could not generate image - try different prompt";
  }
  if (msg.includes("rate") || msg.includes("quota") || msg.includes("429")) {
    return "API limit reached - try again in a moment";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error - check connection";
  }
  if (msg.includes("invalid") || msg.includes("400")) {
    return "Invalid request - try simpler prompt";
  }
  if (msg.includes("500") || msg.includes("server")) {
    return "Server error - try again";
  }

  return "Something went wrong - please try again";
}

// Helper functions
export function createImageUrlInput() {
  return `
    <div class="image-input">
      <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg" />
      <small>Paste a direct link to an image</small>
      ${
        isMobile()
          ? "<p><em>Note: File uploads not supported on mobile - use image URLs</em></p>"
          : ""
      }
    </div>
  `;
}

export async function getImageSource() {
  const urlInput = document.getElementById("imageUrl");
  if (urlInput && urlInput.value.trim()) {
    return urlInput.value.trim();
  }

  if (!isMobile()) {
    const fileInput = document.getElementById("imageFile");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      return await uploadImageToHost(fileInput.files[0]);
    }
  }

  throw new Error(
    "Please provide an image URL" + (isMobile() ? "" : " or file")
  );
}
