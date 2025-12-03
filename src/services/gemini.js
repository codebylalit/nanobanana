// Mobile-Optimized Gemini API service using official Google Gemini HTTP API
// Using a stable public model endpoint (v1beta)
const GEMINI_API_URL =
  "https://gemini-proxy.namdevlalit914.workers.dev"; // Replace with your deployed Worker URL


const IMGBB_KEYS = ["976c43da17048b8595498ac1ba0fa639"];

// Enhanced mobile detection (fixed - no force mobile)
const isMobile = () => {
  const mobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  if (mobile) {
    console.log("📱 Mobile device detected - using optimized settings");
    console.log("📱 User Agent:", navigator.userAgent);
    console.log(
      "📱 Connection:",
      navigator.connection?.effectiveType || "unknown"
    );
  }
  return mobile;
};

// Performance monitoring
const perfLogger = {
  start: (label) => {
    if (window.performance) {
      console.time(label);
      console.log(`🚀 Starting: ${label}`);
    }
  },
  end: (label) => {
    if (window.performance) {
      console.timeEnd(label);
      console.log(`✅ Completed: ${label}`);
    }
  },
  memory: () => {
    if (window.performance?.memory) {
      const mb = (bytes) => Math.round(bytes / 1024 / 1024);
      console.log(
        `💾 Memory - Used: ${mb(
          performance.memory.usedJSHeapSize
        )}MB, Limit: ${mb(performance.memory.jsHeapSizeLimit)}MB`
      );
    }
  },
};


// Gemini call using only the per-user Gemini API key passed from the frontend.
// Shared bundled keys are no longer used.
async function callGeminiAPI({ prompt, imageUrls = [], userApiKey, retryCount = 0 }) {
  const trimmedPrompt = (prompt || "").slice(0, isMobile() ? 350 : 400);
  const images = Array.isArray(imageUrls) ? imageUrls.slice(0, 1) : [];

  if (!userApiKey || typeof userApiKey !== "string" || !userApiKey.trim()) {
    throw new Error(
      "Missing Gemini API key. Please add your key in the Profile page."
    );
  }

  perfLogger.start("Gemini API Call");

  const controller = new AbortController();
  const timeout = isMobile() ? 45000 : 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // If we have an image URL, fetch it and convert to base64
    let imageData = null;
    if (images.length > 0 && images[0]) {
      try {
        console.log("📥 Fetching image from URL:", images[0]);
        const response = await fetch(images[0]);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        console.log("✅ Image loaded successfully");
      } catch (error) {
        console.error("❌ Error loading image:", error);
        throw new Error("Failed to process the image. Please try again.");
      }
    }

    // Build the request payload
    const contents = {
      contents: [{
        role: "user",
        parts: [
          { text: trimmedPrompt },
          ...(imageData ? [{
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData
            }
          }] : [])
        ]
      }]
    };

    console.log("Sending request to Gemini API...");
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": userApiKey.trim(),
      },
      body: JSON.stringify(contents),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => `HTTP ${response.status}`);
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const responseJson = await response.json();
    console.log("Gemini FULL JSON response:", responseJson);

    // Handle the response - check for both text and inlineData
    if (responseJson.candidates?.[0]?.content?.parts) {
      const parts = responseJson.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          // If we have image data, return it as a data URL
          return { 
            imageDataUrl: `data:image/png;base64,${part.inlineData.data}`,
            generated: true 
          };
        } else if (part.text) {
          // If we have text, return it
          return part.text;
        }
      }
    }

    // If we get here, the response didn't contain the expected data
    throw new Error("Unexpected response format from Gemini API");
  } catch (error) {
    perfLogger.end("Gemini API Call");
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Image compression (keeping your working version)
async function compressForMobile(file) {
  perfLogger.start("Image Compression");

  return new Promise((resolve, reject) => {
    const maxFileSize = isMobile() ? 15 * 1024 * 1024 : 50 * 1024 * 1024; // 15MB mobile
    if (file.size > maxFileSize) {
      reject(
        new Error(
          `File too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`
        )
      );
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    let timeoutId;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        if (canvas.parentNode) canvas.remove();
        if (img.src) URL.revokeObjectURL(img.src);
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
    };

    img.onload = () => {
      try {
        const maxSize = isMobile() ? 1024 : 1200;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        if (width < 50 || height < 50) {
          cleanup();
          reject(new Error("Image too small after compression"));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = isMobile() ? "low" : "medium";
        ctx.drawImage(img, 0, 0, width, height);

        let quality = isMobile() ? 0.75 : 0.85;
        if (file.size > 5 * 1024 * 1024) quality = isMobile() ? 0.6 : 0.75;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              cleanup();
              reject(new Error("Compression failed"));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".jpg"),
              {
                type: "image/jpeg",
              }
            );

            const originalMB = (file.size / 1024 / 1024).toFixed(1);
            const compressedMB = (compressedFile.size / 1024 / 1024).toFixed(1);
            console.log(
              `📦 Compressed: ${originalMB}MB → ${compressedMB}MB (${Math.round(
                (1 - compressedFile.size / file.size) * 100
              )}% reduction)`
            );

            cleanup();
            perfLogger.end("Image Compression");
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      } catch (error) {
        cleanup();
        reject(new Error(`Compression error: ${error.message}`));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("Invalid image file"));
    };

    timeoutId = setTimeout(
      () => {
        cleanup();
        reject(new Error("Image loading timeout"));
      },
      isMobile() ? 30000 : 15000
    );

    img.src = URL.createObjectURL(file);
  });
}

// ImgBB upload (keeping your working version)
export async function uploadToImgBB(file, retryCount = 0) {
  perfLogger.start("ImgBB Upload");
  const maxRetries = isMobile() ? 2 : 3;

  try {
    const apiKey = IMGBB_KEYS[retryCount % IMGBB_KEYS.length];
    if (!apiKey || apiKey.startsWith("YOUR_")) {
      throw new Error("No valid ImgBB API key available");
    }

    const formData = new FormData();
    formData.append("image", file);

    const expiration = 3600;
    const uploadUrl = `https://api.imgbb.com/1/upload?expiration=${expiration}&key=${apiKey}`;

    const controller = new AbortController();
    const timeout = isMobile() ? 45000 : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    console.log(
      `📤 Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB to ImgBB... (${
        retryCount + 1
      }/${maxRetries + 1})`
    );

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => `HTTP ${response.status}`);

      if (
        (response.status >= 500 || response.status === 429) &&
        retryCount < maxRetries
      ) {
        const delay = isMobile() ? (retryCount + 1) * 2000 : 1500;
        console.log(
          `⚠️ Upload failed (${response.status}), retrying in ${
            delay / 1000
          }s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return uploadToImgBB(file, retryCount + 1);
      }

      throw new Error(`ImgBB error ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.success && result.data?.url) {
      console.log(`✅ Upload successful: ${result.data.url}`);
      perfLogger.end("ImgBB Upload");
      return result.data.url;
    }

    throw new Error(
      `ImgBB API error: ${result.error?.message || "No URL returned"}`
    );
  } catch (error) {
    if (error.name === "AbortError") {
      error.message = "Upload timeout - check your connection";
    }
    console.error(`❌ ImgBB upload failed:`, error.message);
    perfLogger.end("ImgBB Upload");
    throw error;
  }
}

// Helper function to create placeholders (like your Gemini code)
function createPlaceholder(label, subtitle, type = "info") {
  const colors = {
    info: ["#1a1a2e", "#16213e"],
    error: ["#dc2626", "#991b1b"],
    warning: ["#f59e0b", "#d97706"],
  };

  const [color1, color2] = colors[type] || colors.info;
  const size = isMobile() ? 300 : 400;

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${color1}'/>
        <stop offset='1' stop-color='${color2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='40%' text-anchor='middle' fill='#FACC15' font-size='14' font-family='system-ui' font-weight='bold'>${label}</text>
    <text x='50%' y='50%' text-anchor='middle' fill='#ddd' font-size='10' font-family='system-ui'>${subtitle}</text>
    <text x='50%' y='60%' text-anchor='middle' fill='#888' font-size='8' font-family='system-ui'>Gemini AI</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Main functions (based on your working Gemini patterns)
export async function textToImage(prompt, userApiKey) {
  if (!prompt?.trim()) {
    throw new Error("Prompt is required");
  }

  perfLogger.start("Text to Image");

  try {
    const result = await callGeminiAPI({
      prompt: `Create image: ${prompt.trim()}`,
      imageUrls: [],
      userApiKey,
    });
    console.log('Gemini raw result:', result);

    if (result && typeof result === 'object' && result.imageDataUrl) {
      perfLogger.end("Text to Image");
      return { url: result.imageDataUrl, generated: true };
    }

    if (typeof result === 'string' && result.trim()) {
      try {
        const parsed = JSON.parse(result);
        console.log('Gemini parsed object:', parsed);
        const imageUrl = parsed.url || parsed.image_url || parsed.image;
        if (imageUrl) {
          perfLogger.end("Text to Image");
          return { url: imageUrl, generated: true };
        }
      } catch {
        if (result.startsWith("http")) {
          perfLogger.end("Text to Image");
          return { url: result.trim(), generated: true };
        }
      }
    }

    perfLogger.end("Text to Image");
    return {
      url: createPlaceholder("Generated Image", prompt.slice(0, 30)),
      generated: false,
    };
  } catch (error) {
    console.error("❌ Text to Image failed:", error);
    perfLogger.end("Text to Image");
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

export async function imageToImage(file, prompt, userApiKey) {
  if (!file) {
    throw new Error("Image is required");
  }

  perfLogger.start("Image to Image");

  // Show progress indicator on mobile
  if (isMobile() && window.showMobileProgress) {
    window.showMobileProgress(true);
  }

  try {
    let imageUrl;

    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      if (isMobile() && file.size > 15 * 1024 * 1024) {
        throw new Error("File too large for mobile (max 15MB)");
      }

      try {
        console.log(`📱 Mobile processing: ${isMobile() ? "Yes" : "No"}`);
        console.log(
          `📦 Compressing image (${(file.size / 1024 / 1024).toFixed(1)}MB)...`
        );
        const compressedFile = await compressForMobile(file);
        console.log(`📤 Uploading to ImgBB...`);
        imageUrl = await uploadToImgBB(compressedFile);
      } catch (uploadError) {
        console.error("❌ Upload failed:", uploadError);
        perfLogger.end("Image to Image");

        if (isMobile() && window.showMobileProgress) {
          window.showMobileProgress(false);
        }

        let errorMsg = getFriendlyErrorMessage(uploadError.message);
        if (isMobile() && uploadError.message.includes("timeout")) {
          errorMsg = "Slow connection - try smaller image";
        }

        return {
          url: createPlaceholder("Upload Failed", errorMsg, "error"),
          generated: false,
        };
      }
    } else {
      throw new Error("Invalid image input");
    }

    console.log(`🔄 Processing with Gemini API...`);
    const result = await callGeminiAPI({
      prompt: `Transform: ${prompt || "artistic style"}`,
      imageUrls: [imageUrl],
      userApiKey,
    });

    if (result && typeof result === 'object' && result.imageDataUrl) {
      perfLogger.end("Image to Image");
      if (isMobile() && window.showMobileProgress) {
        window.showMobileProgress(false);
      }
      return { url: result.imageDataUrl, generated: true };
    }

    if (typeof result === 'string' && result.trim()) {
      try {
        const parsed = JSON.parse(result);
        const resultUrl = parsed.url || parsed.image_url || parsed.image;
        if (resultUrl) {
          console.log(`✅ Image transformation successful`);
          perfLogger.end("Image to Image");

          if (isMobile() && window.showMobileProgress) {
            window.showMobileProgress(false);
          }

          return { url: resultUrl, generated: true };
        }
      } catch {
        if (result.startsWith("http")) {
          console.log(`✅ Image transformation successful (direct URL)`);
          perfLogger.end("Image to Image");

          if (isMobile() && window.showMobileProgress) {
            window.showMobileProgress(false);
          }

          return { url: result.trim(), generated: true };
        }
      }
    }

    console.log(`⚠️ No valid result from API, showing placeholder`);
    perfLogger.end("Image to Image");

    if (isMobile() && window.showMobileProgress) {
      window.showMobileProgress(false);
    }

    return {
      url: createPlaceholder(
        "Transformed Image",
        prompt?.slice(0, 20) || "Style applied"
      ),
      generated: false,
    };

  } catch (error) {
    console.error("❌ Image to Image failed:", error);
    perfLogger.end("Image to Image");

    if (isMobile() && window.showMobileProgress) {
      window.showMobileProgress(false);
    }

    let errorMsg = getFriendlyErrorMessage(error?.message);
    if (isMobile()) {
      if (error.message.includes("timeout")) {
        errorMsg = "Request timeout - check connection";
      } else if (error.message.includes("memory")) {
        errorMsg = "Not enough memory - try smaller image";
      }
    }

    return {
      url: createPlaceholder("Transform Failed", errorMsg, "error"),
      generated: false,
    };
  }
}

// Helper functions (keeping your working patterns)
export async function generateHeadshot(file, prompt, userApiKey) {
  console.log("👤 Generating headshot...");
  return await imageToImage(
    file,
    `Professional headshot: ${prompt || "clean background"}`,
    userApiKey
  );
}

export async function removeBackground(file, userApiKey) {
  console.log("🎭 Removing background...");
  return await imageToImage(
    file,
    "Remove background, isolate subject",
    userApiKey
  );
}

export async function editImageAdjustments(file, options, userApiKey) {
  console.log("🎨 Applying adjustments...");
  const adjustments = Object.entries(options || {})
    .filter(([, v]) => v !== 0 && v != null)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return await imageToImage(
    file,
    `Enhance: ${adjustments || "improve quality"}`,
    userApiKey
  );
}

export async function improvePrompt(userPrompt, userApiKey) {
  try {
    console.log("🔧 Improving prompt:", userPrompt);

    if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
      console.warn("🔧 Invalid prompt provided:", userPrompt);
      return userPrompt || "";
    }

    // Make Gemini output a rewritten prompt instead of a question
    const result = await callGeminiAPI({
      prompt: `Rewrite this prompt into a more descriptive, detailed prompt for image generation. Do not ask questions. Return only the rewritten prompt: "${userPrompt.trim()}"`,
      imageUrls: [],
      userApiKey,
    });

    console.log("🔧 Raw API response:", result);

    if (!result || typeof result !== "string") {
      console.warn("🔧 Invalid response format:", result);
      return userPrompt;
    }

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(result);
      console.log("🔧 Parsed JSON:", parsed);

      // Check various possible response fields
      if (parsed.text) return parsed.text.trim();
      if (parsed.response) return parsed.response.trim();
      if (parsed.message) return parsed.message.trim();
      if (parsed.prompt) return parsed.prompt.trim();
      if (parsed.rewritten_prompt) return parsed.rewritten_prompt.trim();
      if (parsed.improved_prompt) return parsed.improved_prompt.trim();

      // If it's an object but no known fields, try to extract text content
      if (typeof parsed === "object") {
        const textContent = Object.values(parsed).find(
          (v) => typeof v === "string" && v.trim().length > 0
        );
        if (textContent) return textContent.trim();
      }

      return result.trim() || userPrompt;
    } catch (parseError) {
      console.log("🔧 Not JSON, treating as plain text");

      // If not JSON, treat as plain text
      const cleaned = result.trim();

      // Remove common prefixes that might be added by the API
      const prefixes = [
        "Here's an improved prompt:",
        "Improved prompt:",
        "Rewritten prompt:",
        "Here's the rewritten prompt:",
        "The improved prompt is:",
        "Here's a better prompt:",
        "Better prompt:",
        "Enhanced prompt:",
        "Here's the enhanced prompt:",
      ];

      let finalPrompt = cleaned;
      for (const prefix of prefixes) {
        if (finalPrompt.toLowerCase().startsWith(prefix.toLowerCase())) {
          finalPrompt = finalPrompt.substring(prefix.length).trim();
          break;
        }
      }

      // Remove quotes if the entire response is wrapped in them
      if (
        (finalPrompt.startsWith('"') && finalPrompt.endsWith('"')) ||
        (finalPrompt.startsWith("'") && finalPrompt.endsWith("'"))
      ) {
        finalPrompt = finalPrompt.slice(1, -1).trim();
      }

      console.log("🔧 Final improved prompt:", finalPrompt);
      return finalPrompt || userPrompt;
    }
  } catch (e) {
    console.error("🔧 improvePrompt error:", e);
    return userPrompt; // fallback
  }
}

export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();

  if (msg.includes("rate") || msg.includes("quota")) {
    return isMobile()
      ? "Rate limit reached. Wait 60 seconds."
      : "Rate limit - wait a few minutes";
  }
  if (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("abort")
  ) {
    return isMobile()
      ? "Slow connection. Try smaller image."
      : "Connection timeout - check network";
  }
  if (msg.includes("upload") || msg.includes("imgbb")) {
    return "Upload failed - try smaller image";
  }
  if (msg.includes("too large") || msg.includes("file size")) {
    return isMobile()
      ? "Image too large. Max 15MB on mobile."
      : "Image too large - try smaller file";
  }
  if (msg.includes("all api keys") || msg.includes("available api keys")) {
    return isMobile()
      ? "Service busy. Wait 60 seconds and retry."
      : "All APIs busy - try again shortly";
  }

  return isMobile()
    ? "Try again with smaller image"
    : "Try again with different settings";
}

export async function suggestPromptIdeas(topic, userApiKey) {
  try {
    // call your Gemini API
    const result = await callGeminiAPI({
      prompt: `List 8 creative prompts: ${topic || "art"}`,
      imageUrls: [],
      userApiKey,
    });

    let raw = result;

    // Only try to parse JSON if it actually looks like JSON
    if (typeof result === "string" && /^[[{]/.test(result.trim())) {
      try {
        const parsed = JSON.parse(result);
        raw = parsed.text || parsed.response || parsed.message || result;
      } catch (e) {
        // ignore parse errors and just use the original result
        raw = result;
      }
    }

    // Normalise to a string
    if (typeof raw !== "string") {
      raw = String(raw);
    }

    // Split by newlines, remove numbering/bullets, trim, filter out empty lines
    const lines = raw
      .split(/\n+/)
      .map((l) => l.replace(/^\s*[-*\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 8);

    if (lines.length) return lines;
  } catch (e) {
    console.warn("Suggest prompts failed:", e);
  }

  // Fallback prompts
  return [
    "Cyberpunk street with neon lights",
    "Mountain cabin at sunset",
    "Geometric patterns in pastels",
    "Dew drops on petals",
    "Futuristic city skyline",
    "Cozy library with warm light",
  ];
}

// Debug and utility functions


// Enhanced mobile debugging (keeping your working version)
export function enableMobileDebugging() {
  if (isMobile()) {
    const originalLog = console.log;
    const debugDiv = document.createElement("div");
    debugDiv.id = "mobile-debug";
    debugDiv.style.cssText = `
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      max-height: 250px; 
      overflow-y: auto; 
      background: rgba(0,0,0,0.9); 
      color: #00ff00; 
      font-family: monospace; 
      font-size: 11px; 
      padding: 10px; 
      z-index: 9999; 
      display: none;
      border-bottom: 2px solid #00ff00;
    `;
    document.body.appendChild(debugDiv);

    const progressDiv = document.createElement("div");
    progressDiv.id = "mobile-progress";
    progressDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #00ff00, #00aa00);
      z-index: 10000;
      display: none;
      animation: progress 2s ease-in-out infinite;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(progressDiv);

    let tapCount = 0;
    document.addEventListener("touchend", () => {
      tapCount++;
      if (tapCount === 3) {
        debugDiv.style.display =
          debugDiv.style.display === "none" ? "block" : "none";
        tapCount = 0;
      }
      setTimeout(() => (tapCount = 0), 500);
    });

    console.log = (...args) => {
      originalLog.apply(console, args);
      const message = args.join(" ");
      debugDiv.innerHTML =
        `${new Date().toLocaleTimeString()}: ${message}<br>` +
        debugDiv.innerHTML;
      if (debugDiv.children.length > 50) {
        debugDiv.removeChild(debugDiv.lastChild);
      }
    };

    window.showMobileProgress = (show = true) => {
      progressDiv.style.display = show ? "block" : "none";
    };

    console.log("🔍 Mobile debugging enabled - triple tap to toggle");
    console.log("📱 Mobile optimizations active");
  }
}
