// Mobile-optimized Gemini 2.5 Flash Image API service
const RAPIDAPI_URL =
  "https://gemini-2-5-flash-image-nano-banana1.p.rapidapi.com/api/gemini";

const RAPIDAPI_KEYS = [
  "f82066f4c3msh56c57d6e1267699p1b718ejsn97d173495495",
  "1edab2b6f9msh6ff409c9a4b0b1fp17f2a5jsnf22db7c4bb79",
  "3c7e94fa19msh34f0e004e88042ep145455jsn8582a03edfeb",
  "0c8ddd99f9msha85f88a8629814dp16cca4jsn6791b6b71e96",
];

// Configure your preferred image hosting service
const IMAGE_HOSTING_CONFIG = {
  imgbb: {
    apiKey: "976c43da17048b8595498ac1ba0fa639",
    url: "https://api.imgbb.com/1/upload",
  },
  cloudinary: {
    cloudName: "demo",
    uploadPreset: "ml_default",
    url: "https://api.cloudinary.com/v1_1/demo/image/upload",
  },
};

// Mobile-optimized API call with timeout and better error handling
async function callGeminiAPI(prompt, imageUrls = []) {
  let lastError;

  for (const key of RAPIDAPI_KEYS) {
    try {
      // Mobile-specific timeout (shorter than desktop)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 45000); // 45 seconds for mobile

      const options = {
        method: "POST",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host":
            "gemini-2-5-flash-image-nano-banana1.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          image: imageUrls,
          stream: false,
          return: "url_image",
        }),
        signal: controller.signal,
      };

      console.log("Calling Gemini API with key:", key.slice(0, 6) + "…");

      const response = await fetch(RAPIDAPI_URL, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails = "Unknown error";
        try {
          const responseText = await response.text();
          const errorObj = JSON.parse(responseText);
          if (errorObj.error || errorObj.details) {
            errorDetails = `${errorObj.error || ""} ${
              errorObj.details || ""
            }`.trim();
          }
        } catch {
          errorDetails = `HTTP ${response.status}`;
        }

        // If quota/rate limit → try next key
        if (response.status === 429 || /rate|quota|limit/i.test(errorDetails)) {
          console.warn("Key hit quota, trying next key…");
          lastError = errorDetails;
          continue;
        }

        throw new Error(`API error: ${response.status} - ${errorDetails}`);
      }

      // Get response text with timeout protection
      const responseText = await Promise.race([
        response.text(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Response read timeout")), 10000)
        ),
      ]);

      // Check for API-level error in body
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.error) {
          // If it's a "no image" error, try next key
          if (
            parsed.error.includes("não continha uma imagem") ||
            parsed.error.includes("no image")
          ) {
            console.warn("API returned no image, trying next key…");
            lastError = parsed.error;
            continue;
          }
          throw new Error(`API Error: ${parsed.error}`);
        }
      } catch (e) {
        if (e.message.startsWith("API Error:")) throw e;
        // Not JSON, proceed normally
      }

      return responseText;
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Request timeout, trying next key…");
        lastError = "Request timeout";
      } else {
        console.warn("Key failed:", key.slice(0, 6) + "…", err.message);
        lastError = err.message;
      }
      continue;
    }
  }

  throw new Error(`All API keys failed: ${lastError || "Unknown error"}`);
}

// Mobile-optimized file compression before upload
function compressImageForMobile(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// Mobile-optimized upload strategies (prioritize faster services)
async function uploadImageToHost(file) {
  // Compress image on mobile for faster upload
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  let processedFile = file;

  if (isMobile && file.size > 500000) {
    // 500KB threshold
    console.log("Compressing image for mobile upload...");
    try {
      processedFile = await compressImageForMobile(file);
      console.log(`Compressed: ${file.size} → ${processedFile.size} bytes`);
    } catch (e) {
      console.warn("Compression failed, using original file");
    }
  }

  // Prioritize faster upload services for mobile
  const uploadStrategies = isMobile
    ? [
        () => uploadToFileIO(processedFile),
        () => uploadToTmpFiles(processedFile),
        () => uploadToCloudinary(processedFile),
        () => uploadToImgBB(processedFile),
      ]
    : [
        () => uploadToImgBB(processedFile),
        () => uploadToCloudinary(processedFile),
        () => uploadToFileIO(processedFile),
        () => uploadToTmpFiles(processedFile),
      ];

  const errors = [];

  for (const strategy of uploadStrategies) {
    try {
      const url = await Promise.race([
        strategy(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Upload timeout")), 20000)
        ),
      ]);

      if (url && url.startsWith("http")) {
        console.log("Successfully uploaded image:", url);
        return url;
      }
    } catch (error) {
      console.warn("Upload strategy failed:", error.message);
      errors.push(error.message);
      continue;
    }
  }

  throw new Error(`All uploads failed: ${errors.join("; ")}`);
}

// ImgBB upload with mobile optimizations
async function uploadToImgBB(file) {
  const apiKey = IMAGE_HOSTING_CONFIG.imgbb.apiKey;
  if (!apiKey || apiKey === "YOUR_IMGBB_API_KEY_HERE") {
    throw new Error("ImgBB API key not configured");
  }

  const formData = new FormData();
  formData.append("image", file);

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 15000); // 15s timeout

  const response = await fetch(
    `${IMAGE_HOSTING_CONFIG.imgbb.url}?key=${apiKey}`,
    {
      method: "POST",
      body: formData,
      signal: controller.signal,
    }
  );

  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.success && result.data && result.data.url) {
    return result.data.url;
  }

  throw new Error("ImgBB did not return a valid URL");
}

// Cloudinary upload with mobile optimizations
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    IMAGE_HOSTING_CONFIG.cloudinary.uploadPreset
  );

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 15000); // 15s timeout

  const response = await fetch(IMAGE_HOSTING_CONFIG.cloudinary.url, {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.secure_url) {
    return result.secure_url;
  }

  throw new Error("Cloudinary did not return a valid URL");
}

// File.io upload (fast for mobile)
async function uploadToFileIO(file) {
  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000); // 10s timeout

  const response = await fetch("https://file.io", {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`File.io upload failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.success && result.link) {
    return result.link;
  }

  throw new Error("File.io did not return a valid URL");
}

// TmpFiles upload with mobile optimization
async function uploadToTmpFiles(file) {
  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000); // 10s timeout

  const response = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`TmpFiles upload failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.status === "success" && result.data && result.data.url) {
    const directUrl = result.data.url.replace(
      "tmpfiles.org/",
      "tmpfiles.org/dl/"
    );
    return directUrl;
  }

  throw new Error("TmpFiles did not return a valid URL");
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

    const imagePrompt = `Generate a high-quality image: ${prompt}. Create detailed, visually appealing artwork.`;
    const result = await callGeminiAPI(imagePrompt, []);

    console.log("API Response:", result);

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
          return {
            url: result.trim(),
            generated: true,
          };
        }
      }
    }

    console.warn("No valid image URL returned, using placeholder");
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
    return {
      url: createPlaceholderImage(
        "Image Generation Failed",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

export async function imageToImage(file, prompt) {
  if (!file) {
    throw new Error("Image file or URL is required for transformation");
  }

  try {
    let imageUrl;

    // Handle both file objects and direct URLs
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      console.log("Uploading file for mobile...");
      imageUrl = await uploadImageToHost(file);
    } else {
      throw new Error("Invalid image input");
    }

    console.log("Using image URL:", imageUrl);

    // Use simpler prompts for mobile to reduce processing time
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const safePrompt = isMobile
      ? `Transform image: ${prompt}`
      : `Apply creative transformation: ${prompt}. Focus on artistic style, lighting, colors, and visual effects.`;

    const result = await callGeminiAPI(safePrompt, [imageUrl]);

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
          return {
            url: result.trim(),
            generated: true,
          };
        }
      }
    }

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

    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes("timeout")) {
      return {
        url: createPlaceholderImage(
          "Request Timeout",
          "Try again with a smaller image or simpler prompt",
          ["#f59e0b", "#d97706"]
        ),
        generated: false,
      };
    }

    if (
      errorMsg.includes("person") ||
      errorMsg.includes("cannot fulfill") ||
      errorMsg.includes("não continha uma imagem")
    ) {
      return {
        url: createPlaceholderImage(
          "Transformation Restricted",
          "This transformation isn't supported",
          ["#f59e0b", "#d97706"]
        ),
        generated: false,
      };
    }

    if (errorMsg.includes("hosting") || errorMsg.includes("upload")) {
      return {
        url: createPlaceholderImage(
          "Upload Failed",
          "Try using a direct image URL instead",
          ["#f59e0b", "#d97706"]
        ),
        generated: false,
      };
    }

    return {
      url: createPlaceholderImage(
        "Transformation Failed",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

// Additional mobile-optimized functions...
export async function generateHeadshot(file, prompt) {
  if (!file) {
    throw new Error("Photo is required for headshot generation");
  }

  try {
    let imageUrl;
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      imageUrl = await uploadImageToHost(file);
    } else {
      throw new Error("Invalid image input");
    }

    const headshotPrompt = `Professional portrait: ${
      prompt || "clean background"
    }`;
    const result = await callGeminiAPI(headshotPrompt, [imageUrl]);

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
          return {
            url: result.trim(),
            generated: true,
          };
        }
      }
    }

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
        "Headshot Generation Failed",
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
    let imageUrl;
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      imageUrl = await uploadImageToHost(file);
    } else {
      throw new Error("Invalid image input");
    }

    const result = await callGeminiAPI("Remove background, isolate subject", [
      imageUrl,
    ]);

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
          return {
            url: result.trim(),
            generated: true,
          };
        }
      }
    }

    return {
      url: createPlaceholderImage(
        "Background Removed",
        "Clean cutout created",
        ["#ff9a9e", "#fecfef"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Background Removal Error:", error);
    return {
      url: createPlaceholderImage(
        "Background Removal Failed",
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
    let imageUrl;
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      imageUrl = await uploadImageToHost(file);
    } else {
      throw new Error("Invalid image input");
    }

    const adjustments = Object.entries(options || {})
      .filter(([, v]) => v !== 0 && v != null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const result = await callGeminiAPI(
      `Enhance image: ${adjustments || "improve quality"}`,
      [imageUrl]
    );

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
          return {
            url: result.trim(),
            generated: true,
          };
        }
      }
    }

    return {
      url: createPlaceholderImage(
        "Image Enhanced",
        adjustments || "Adjustments applied",
        ["#a8edea", "#fed6e3"]
      ),
      generated: false,
    };
  } catch (error) {
    console.error("Image Editing Error:", error);
    return {
      url: createPlaceholderImage(
        "Image Enhancement Failed",
        friendlyErrorSubtitle(error?.message),
        ["#dc2626", "#991b1b"]
      ),
      generated: false,
    };
  }
}

// Prompt helper utilities
export async function improvePrompt(userPrompt) {
  try {
    const result = await callGeminiAPI(`Enhance prompt: ${userPrompt}`, []);

    try {
      const parsed = JSON.parse(result);
      return parsed.text || parsed.response || result.trim() || userPrompt;
    } catch {
      return result.trim() || userPrompt;
    }
  } catch (e) {
    console.warn("improvePrompt fallback:", e);
    return `${userPrompt} — detailed, high quality, artistic`;
  }
}

export async function suggestPromptIdeas(topic) {
  const seed = topic?.trim() || "creative image concepts";
  try {
    const result = await callGeminiAPI(
      `Generate 8 image prompt ideas about: ${seed}`,
      []
    );

    let raw = result;
    try {
      const parsed = JSON.parse(result);
      raw = parsed.text || parsed.response || result;
    } catch {
      // Use result as is
    }

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
    "Cyberpunk street scene with neon reflections",
    "Cozy mountain cabin during golden hour",
    "Minimalist geometric patterns in pastels",
    "Morning dew on flower petals macro",
    "Futuristic city skyline with flying cars",
    "Vintage library with floating books",
    "Abstract digital art with energy patterns",
    "Zen garden with cherry blossoms",
  ];
}

export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();

  if (msg.includes("timeout")) {
    return "Request took too long. Try a smaller image or simpler prompt.";
  }
  if (msg.includes("hosting") || msg.includes("upload")) {
    return "Image upload failed. Try using a direct image URL instead.";
  }
  if (
    msg.includes("person") ||
    msg.includes("cannot fulfill") ||
    msg.includes("não continha uma imagem")
  ) {
    return "This transformation isn't supported for this image.";
  }
  if (msg.includes("429") || msg.includes("rate") || msg.includes("quota")) {
    return "API limit reached. Please try again in a minute.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network issue. Check your connection and try again.";
  }
  if (
    msg.includes("400") ||
    msg.includes("invalid") ||
    msg.includes("prompt")
  ) {
    return "The prompt may be too complex. Try simplifying it.";
  }
  if (
    msg.includes("403") ||
    msg.includes("api key") ||
    msg.includes("unauthorized")
  ) {
    return "Service is temporarily unavailable. Please try again later.";
  }
  if (msg.includes("500") || msg.includes("server")) {
    return "Server error. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

function friendlyErrorSubtitle(raw) {
  return getFriendlyErrorMessage(raw).replace(/\.$/, "");
}
