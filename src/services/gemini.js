// Gemini 2.5 Flash Image API service using RapidAPI
const RAPIDAPI_URL =
  "https://gemini-2-5-flash-image-nano-banana1.p.rapidapi.com/api/gemini";
// Add all your keys here
const RAPIDAPI_KEYS = [
  "f82066f4c3msh56c57d6e1267699p1b718ejsn97d173495495",
  "1edab2b6f9msh6ff409c9a4b0b1fp17f2a5jsnf22db7c4bb79",
  "3c7e94fa19msh34f0e004e88042ep145455jsn8582a03edfeb",
  "0c8ddd99f9msha85f88a8629814dp16cca4jsn6791b6b71e96"
];


// Configure your preferred image hosting service
const IMAGE_HOSTING_CONFIG = {
  // Option 1: ImgBB (recommended - get free API key from imgbb.com)
  imgbb: {
    apiKey: "YOUR_IMGBB_API_KEY_HERE", // Replace with your actual API key
    url: "https://api.imgbb.com/1/upload",
  },

  // Option 2: Cloudinary (free tier available)
  cloudinary: {
    cloudName: "demo", // Replace with your cloud name
    uploadPreset: "ml_default", // Replace with your preset
    url: "https://api.cloudinary.com/v1_1/demo/image/upload",
  },
};

async function callGeminiAPI(prompt, imageUrls = []) {
  let lastError;

  for (const key of RAPIDAPI_KEYS) {
    try {
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
      };

      console.log("Calling Gemini API with key:", key.slice(0, 6) + "…");

      const response = await fetch(RAPIDAPI_URL, options);
      const responseText = await response.text().catch(() => "");

      if (!response.ok) {
        // Extract error details
        let errorDetails = responseText;
        try {
          const errorObj = JSON.parse(responseText);
          if (errorObj.error || errorObj.details) {
            errorDetails = `${errorObj.error || ""} ${errorObj.details || ""}`.trim();
          }
        } catch {
          // Keep original error text
        }

        // If quota/rate limit → try next key
        if (
          response.status === 429 ||
          /rate|quota|limit/i.test(errorDetails)
        ) {
          console.warn("Key hit quota, trying next key…");
          lastError = errorDetails;
          continue;
        }

        throw new Error(`RapidAPI error: ${response.status} - ${errorDetails}`);
      }

      // Check for API-level error in body
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.error) {
          throw new Error(`API Error: ${parsed.error} - ${parsed.details || ""}`);
        }
      } catch (e) {
        if (e.message.startsWith("API Error:")) throw e;
        // Not JSON, proceed normally
      }

      // Success
      return responseText;
    } catch (err) {
      console.warn("Key failed:", key.slice(0, 6) + "…", err.message);
      lastError = err.message;
      // Try next key automatically
    }
  }

  // If all keys fail
  throw new Error(`All API keys failed: ${lastError || "Unknown error"}`);
}


function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({
        base64,
        mimeType: file.type,
        dataUrl: reader.result,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Multiple image hosting strategies
async function uploadImageToHost(file) {
  const uploadStrategies = [
    () => uploadToImgBB(file),
    () => uploadToCloudinary(file),
    () => uploadToFileIO(file),
    () => uploadToTmpFiles(file),
  ];

  for (const strategy of uploadStrategies) {
    try {
      const url = await strategy();
      if (url && url.startsWith("http")) {
        console.log("Successfully uploaded image:", url);
        return url;
      }
    } catch (error) {
      console.warn("Upload strategy failed:", error.message);
      continue;
    }
  }

  throw new Error(
    "All image hosting services failed. Please try uploading your image to a free service like imgbb.com or imgur.com and use the direct URL instead."
  );
}

// ImgBB upload (best option if you have an API key)
async function uploadToImgBB(file) {
  const apiKey = IMAGE_HOSTING_CONFIG.imgbb.apiKey;
  if (!apiKey || apiKey === "YOUR_IMGBB_API_KEY_HERE") {
    throw new Error("ImgBB API key not configured");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${IMAGE_HOSTING_CONFIG.imgbb.url}?key=${apiKey}`,
    {
      method: "POST",
      body: formData,
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

// Cloudinary upload (free tier available)
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    IMAGE_HOSTING_CONFIG.cloudinary.uploadPreset
  );

  const response = await fetch(IMAGE_HOSTING_CONFIG.cloudinary.url, {
    method: "POST",
    body: formData,
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

// File.io upload (simple temporary hosting)
async function uploadToFileIO(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://file.io", {
    method: "POST",
    body: formData,
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

// tmpfiles.org upload (another free option)
async function uploadToTmpFiles(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`TmpFiles upload failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.status === "success" && result.data && result.data.url) {
    // TmpFiles returns a viewing URL, we need the direct URL
    const directUrl = result.data.url.replace(
      "tmpfiles.org/",
      "tmpfiles.org/dl/"
    );
    return directUrl;
  }

  throw new Error("TmpFiles did not return a valid URL");
}

// Alternative: Accept direct URLs from users
export function createImageUrlInput() {
  return `
    <div class="image-input-options">
      <div class="upload-option">
        <label>Upload Image File:</label>
        <input type="file" id="imageFile" accept="image/*" />
      </div>
      <div class="url-option">
        <label>Or enter image URL:</label>
        <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg" />
        <small>Use a direct link to an image hosted online</small>
      </div>
    </div>
  `;
}

// Helper to get image source (file or URL)
export async function getImageSource() {
  const fileInput = document.getElementById("imageFile");
  const urlInput = document.getElementById("imageUrl");

  if (urlInput && urlInput.value.trim()) {
    // User provided a direct URL
    return urlInput.value.trim();
  }

  if (fileInput && fileInput.files && fileInput.files[0]) {
    // User uploaded a file - need to host it
    return await uploadImageToHost(fileInput.files[0]);
  }

  throw new Error("Please provide an image file or URL");
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

    // Parse the response
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
        // If not JSON, treat as direct URL
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
  if (!file && !prompt) {
    throw new Error("Image file or URL is required for transformation");
  }

  try {
    let imageUrl;

    // Handle both file objects and direct URLs
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      imageUrl = await uploadImageToHost(file);
    } else {
      throw new Error("Invalid image input");
    }

    console.log("Using image URL:", imageUrl);

    const safePrompt = `Apply creative transformation: ${prompt}. Focus on artistic style, lighting, colors, and visual effects.`;
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

    const headshotPrompt = `Apply professional portrait enhancements: ${
      prompt || "professional lighting and clean background"
    }. Focus on lighting quality and professional appearance.`;

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

    const errorMsg = error.message.toLowerCase();
    if (
      errorMsg.includes("person") ||
      errorMsg.includes("cannot fulfill") ||
      errorMsg.includes("não continha uma imagem")
    ) {
      return {
        url: createPlaceholderImage(
          "Headshot Generation Restricted",
          "This service isn't available for this image type",
          ["#f59e0b", "#d97706"]
        ),
        generated: false,
      };
    }

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

    const backgroundRemovalPrompt = `Remove background and isolate the main subject. Create clean cutout with transparent or solid background.`;
    const result = await callGeminiAPI(backgroundRemovalPrompt, [imageUrl]);

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

    const editPrompt = `Enhance image with adjustments: ${adjustments}. Improve brightness, contrast, saturation while maintaining natural appearance.`;
    const result = await callGeminiAPI(editPrompt, [imageUrl]);

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

// --- Prompt helper utilities ---
export async function improvePrompt(userPrompt) {
  try {
    const system =
      "Enhance this image prompt with vivid details, lighting, style, and composition. Keep it concise but descriptive (45-80 words). Return only the enhanced prompt.";
    const result = await callGeminiAPI(
      `${system}\nOriginal: ${userPrompt}`,
      []
    );

    try {
      const parsed = JSON.parse(result);
      return parsed.text || parsed.response || result.trim() || userPrompt;
    } catch {
      return result.trim() || userPrompt;
    }
  } catch (e) {
    console.warn("improvePrompt fallback:", e);
    return `${userPrompt} — ultra-detailed, cinematic lighting, professional quality, vibrant colors, sharp focus, artistic composition`;
  }
}

export async function suggestPromptIdeas(topic) {
  const seed = topic?.trim() || "creative image concepts";
  try {
    const instruction =
      "Generate 8 creative image prompts as a simple list. Each should be 8-12 words, diverse and inspiring.";
    const result = await callGeminiAPI(`${instruction}\nTopic: ${seed}`, []);

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
    "Cyberpunk street scene with neon reflections in rain",
    "Cozy mountain cabin during golden hour sunset",
    "Minimalist geometric patterns in pastel colors",
    "Macro photography of morning dew on flower petals",
    "Futuristic city skyline with flying vehicles",
    "Vintage library with floating books and warm lighting",
    "Abstract digital art with flowing energy patterns",
    "Serene zen garden with cherry blossoms falling",
  ];
}

// --- Setup Instructions ---
export function getSetupInstructions() {
  return {
    title: "Image Hosting Setup Required",
    steps: [
      "1. Get a free ImgBB API key from https://imgbb.com",
      "2. Replace 'YOUR_IMGBB_API_KEY_HERE' in the code with your actual key",
      "3. Or use direct image URLs instead of uploading files",
      "4. Alternative: Set up Cloudinary account for more reliable hosting",
    ],
    quickStart:
      "For immediate testing, use direct image URLs like: https://i.ibb.co/CLWKLpL/MIv8s-1.png",
  };
}

// --- Friendly error helpers ---
export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();

  if (msg.includes("hosting") || msg.includes("upload")) {
    return "Image upload failed. Try using a direct image URL instead.";
  }
  if (
    msg.includes("person") ||
    msg.includes("cannot fulfill") ||
    msg.includes("não continha uma imagem")
  ) {
    return "This transformation isn't supported for images containing people.";
  }
  if (msg.includes("429") || msg.includes("rate") || msg.includes("quota"))
    return "API limit reached. Please try again in a minute.";
  if (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("fetch")
  )
    return "Network issue. Check your connection and try again.";
  if (msg.includes("400") || msg.includes("invalid") || msg.includes("prompt"))
    return "The prompt may be too complex. Try simplifying it.";
  if (
    msg.includes("403") ||
    msg.includes("api key") ||
    msg.includes("unauthorized")
  )
    return "Service is temporarily unavailable. Please try again later.";
  if (msg.includes("500") || msg.includes("server"))
    return "Server error. Please try again.";
  return "Something went wrong. Please try again.";
}

function friendlyErrorSubtitle(raw) {
  return getFriendlyErrorMessage(raw).replace(/\.$/, "");
}
