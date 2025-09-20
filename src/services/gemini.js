// Mobile-Optimized Gemini API service with performance improvements
const RAPIDAPI_URL =
  "https://gemini-2-5-flash-image-nano-banana1.p.rapidapi.com/api/gemini";

// Reduced API keys for faster iteration

const RAPIDAPI_KEYS = [
  "5def448890msh1dee7ee52790518p1cf21ejsnaf19597d61ec",
  "7fdc303ae4msh9781fc64209f968p1f6cc1jsnfebc43ac3654",
  "a4fde24ae0msh026d67a6ff832ddp13eb3bjsn628bcb556410",
  "bfebd81595msh3d2b9f6a1d00cefp1b1783jsn1782d7b41d90",
  "6338b2c519mshb9b9c7fc1ede6d5p14c35bjsn4c6b7c825900",
  "509e1fefdfmshc23df0836c71f1ep1cbdedjsn983160b969f7",
  "13144781e5msha558a40cb816aa7p18fb70jsn3c0ff999ea47",
  "dc328116d9mshf39067e4d6098e2p17bca4jsndb179a489d49",
  "ef011a07a3msh0fceac212781e08p1d4e8bjsn824e743344f0",
  "fee2943b1dmsh976699deb810f6fp1de527jsnc682c33c0fba",
  "652bf87408msh92776cc22ca52ecp1f8a64jsnf6965a425473",
  "e8870d278bmshe41389b1d6c6e24p161897jsn1c349d5d158d",
  "2d2574972emsh66a64b66fbbfed9p1c9a86jsn2eee815aa52d",
  "35b7f88f82msh6d25d050022cf22p1a7c69jsn186f478ca907",
  "0c8ddd99f9msha85f88a8629814dp16cca4jsn6791b6b71e96",
  "1edab2b6f9msh6ff409c9a4b0b1fp17f2a5jsnf22db7c4bb79",
  "3c7e94fa19msh34f0e004e88042ep145455jsn8582a03edfeb",
  "f82066f4c3msh6ff409c9a4b0b1fp17f2a5jsnf22db7c4bb79",
];
const IMGBB_KEYS = ["976c43da17048b8595498ac1ba0fa639"];

// Enhanced mobile detection with performance info
const isMobile = () => {
  const mobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  if (mobile) {
    console.log("📱 Mobile device detected - using optimized settings");
  }
  return mobile;
};

// Performance monitoring for mobile debugging
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

// Optimized mobile compression with better memory management
async function compressForMobile(file) {
  perfLogger.start("Image Compression");

  return new Promise((resolve, reject) => {
    // More conservative file size limits for mobile
    const maxFileSize = isMobile() ? 20 * 1024 * 1024 : 50 * 1024 * 1024; // 20MB mobile, 50MB desktop
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
        // More conservative sizing for mobile stability
        const maxSize = isMobile() ? 1024 : 1200; // Increased from 800 to 1024
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        // More lenient minimum size check
        if (width < 50 || height < 50) {
          cleanup();
          reject(new Error("Image too small after compression"));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Better rendering settings for mobile
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = isMobile() ? "low" : "medium";
        ctx.drawImage(img, 0, 0, width, height);

        // More conservative quality settings
        let quality = isMobile() ? 0.8 : 0.85; // Increased from 0.7 to 0.8
        if (file.size > 5 * 1024 * 1024) quality = isMobile() ? 0.7 : 0.8;
        if (file.size > 10 * 1024 * 1024) quality = isMobile() ? 0.6 : 0.7;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              cleanup();
              reject(new Error("Compression failed - no blob created"));
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

    // Longer timeout for mobile networks
    timeoutId = setTimeout(
      () => {
        cleanup();
        reject(new Error("Image loading timeout"));
      },
      isMobile() ? 30000 : 15000
    ); // 30s for mobile, 15s for desktop

    img.src = URL.createObjectURL(file);
  });
}

// Optimized ImgBB upload with better mobile handling
async function uploadToImgBB(file, retryCount = 0) {
  perfLogger.start("ImgBB Upload");
  const maxRetries = isMobile() ? 3 : 2; // More retries for mobile

  try {
    const apiKey = IMGBB_KEYS[retryCount % IMGBB_KEYS.length];
    if (!apiKey || apiKey.startsWith("YOUR_")) {
      throw new Error("No valid ImgBB API key available");
    }

    const formData = new FormData();
    formData.append("image", file);

    // Longer expiration for mobile to avoid re-uploads
    const expiration = isMobile() ? 3600 : 3600; // 1hr for both
    const uploadUrl = `https://api.imgbb.com/1/upload?expiration=${expiration}&key=${apiKey}`;

    const controller = new AbortController();
    // Much longer timeouts for mobile networks
    const timeout = isMobile() ? 60000 : 30000; // 60s mobile, 30s desktop
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

      // More aggressive retry for mobile
      if (
        (response.status >= 500 ||
          response.status === 429 ||
          response.status === 0) &&
        retryCount < maxRetries
      ) {
        const delay = isMobile() ? (retryCount + 1) * 3000 : 2000; // Progressive delay for mobile
        console.log(
          `⚠️ Upload failed (${response.status}), retrying in ${
            delay / 1000
          }s... (${retryCount + 1}/${maxRetries})`
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

// Optimized API call with better mobile handling
async function callGeminiAPI(prompt, imageUrls = [], retryCount = 0) {
  perfLogger.start("Gemini API Call");
  const maxRetries = isMobile() ? 3 : 3; // Same retries for both

  // Use fewer API keys on mobile to avoid confusion
  const keysToUse = isMobile() ? RAPIDAPI_KEYS.slice(0, 5) : RAPIDAPI_KEYS;

  for (
    let i = retryCount;
    i < keysToUse.length && i < retryCount + maxRetries;
    i++
  ) {
    const key = keysToUse[i];

    try {
      const controller = new AbortController();
      // Much longer timeouts for mobile networks
      const timeout = isMobile() ? 90000 : 45000; // 90s mobile, 45s desktop
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Better payload for mobile
      const payload = {
        prompt: prompt.slice(0, isMobile() ? 400 : 500), // Increased from 300
        image: imageUrls.slice(0, 1),
        stream: false,
        return: "url_image",
      };

      console.log(
        `🤖 Calling Gemini API (key ${i + 1}/${keysToUse.length})...`
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
        if (response.status === 429) {
          console.log(`⚠️ Rate limit hit, trying next key...`);
          continue;
        }
        throw new Error(`API error ${response.status}`);
      }

      const responseText = await response.text();

      if (
        !responseText ||
        responseText.trim() === "" ||
        responseText === "{}"
      ) {
        console.log(`⚠️ Empty response, trying next key...`);
        continue;
      }

      console.log(`✅ Gemini API success`);
      perfLogger.end("Gemini API Call");
      perfLogger.memory();
      return responseText;
    } catch (error) {
      const errorMsg =
        error.name === "AbortError" ? "Request timeout" : error.message;
      console.warn(`❌ API key ${i + 1} failed: ${errorMsg}`);

      if (i === keysToUse.length - 1) {
        perfLogger.end("Gemini API Call");
        throw new Error(`All API keys failed: ${errorMsg}`);
      }
    }
  }

  perfLogger.end("Gemini API Call");
  throw new Error("No valid API response received");
}

// Lightweight placeholder with mobile optimization
function createPlaceholder(label, subtitle, type = "info") {
  const colors = {
    info: ["#1a1a2e", "#16213e"],
    error: ["#dc2626", "#991b1b"],
    warning: ["#f59e0b", "#d97706"],
  };

  const [color1, color2] = colors[type] || colors.info;
  const size = isMobile() ? 300 : 400; // Smaller placeholders for mobile

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

// Main functions with mobile-first approach
export async function textToImage(prompt) {
  if (!prompt?.trim()) {
    throw new Error("Prompt is required");
  }

  perfLogger.start("Text to Image");

  try {
    const result = await callGeminiAPI(`Create image: ${prompt.trim()}`, []);

    if (result?.trim()) {
      try {
        const parsed = JSON.parse(result);
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

export async function imageToImage(file, prompt) {
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
      // Add mobile-specific file validation
      if (isMobile() && file.size > 20 * 1024 * 1024) {
        throw new Error("File too large for mobile (max 20MB)");
      }

      try {
        console.log(`📱 Mobile processing: ${isMobile() ? 'Yes' : 'No'}`);
        console.log(`📦 Compressing image (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
        const compressedFile = await compressForMobile(file);
        console.log(`📤 Uploading to ImgBB...`);
        imageUrl = await uploadToImgBB(compressedFile);
      } catch (uploadError) {
        console.error("❌ Upload failed:", uploadError);
        perfLogger.end("Image to Image");
        
        // Hide progress on error
        if (isMobile() && window.showMobileProgress) {
          window.showMobileProgress(false);
        }
        
        // Better error messages for mobile
        let errorMsg = getFriendlyErrorMessage(uploadError.message);
        if (isMobile() && uploadError.message.includes("timeout")) {
          errorMsg = "Slow connection - try smaller image";
        }
        
        return {
          url: createPlaceholder(
            "Upload Failed",
            errorMsg,
            "error"
          ),
          generated: false,
        };
      }
    } else {
      throw new Error("Invalid image input");
    }

    console.log(`🔄 Processing with Gemini API...`);
    const result = await callGeminiAPI(
      `Transform: ${prompt || "artistic style"}`,
      [imageUrl]
    );

    if (result?.trim()) {
      try {
        const parsed = JSON.parse(result);
        const resultUrl = parsed.url || parsed.image_url || parsed.image;
        if (resultUrl) {
          console.log(`✅ Image transformation successful`);
          perfLogger.end("Image to Image");
          
          // Hide progress on success
          if (isMobile() && window.showMobileProgress) {
            window.showMobileProgress(false);
          }
          
          return { url: resultUrl, generated: true };
        }
      } catch {
        if (result.startsWith("http")) {
          console.log(`✅ Image transformation successful (direct URL)`);
          perfLogger.end("Image to Image");
          
          // Hide progress on success
          if (isMobile() && window.showMobileProgress) {
            window.showMobileProgress(false);
          }
          
          return { url: result.trim(), generated: true };
        }
      }
    }

    console.log(`⚠️ No valid result from API, showing placeholder`);
    perfLogger.end("Image to Image");
    
    // Hide progress on completion
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
    
    // Hide progress on error
    if (isMobile() && window.showMobileProgress) {
      window.showMobileProgress(false);
    }
    
    // Enhanced error handling for mobile
    let errorMsg = getFriendlyErrorMessage(error?.message);
    if (isMobile()) {
      if (error.message.includes("timeout")) {
        errorMsg = "Request timeout - check connection";
      } else if (error.message.includes("memory")) {
        errorMsg = "Not enough memory - try smaller image";
      }
    }
    
    return {
      url: createPlaceholder(
        "Transform Failed",
        errorMsg,
        "error"
      ),
      generated: false,
    };
  }
}

// Helper functions (unchanged but with logging)
export async function generateHeadshot(file, prompt) {
  console.log("👤 Generating headshot...");
  return await imageToImage(
    file,
    `Professional headshot: ${prompt || "clean background"}`
  );
}

export async function removeBackground(file) {
  console.log("🎭 Removing background...");
  return await imageToImage(file, "Remove background, isolate subject");
}

export async function editImageAdjustments(file, options) {
  console.log("🎨 Applying adjustments...");
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
    console.warn("⚠️ Improve prompt failed:", e);
    return `${userPrompt} — detailed, high quality`;
  }
}

export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();

  if (msg.includes("rate") || msg.includes("quota")) {
    return "Rate limit - wait a few minutes";
  }
  if (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("abort")
  ) {
    return "Connection slow - check network";
  }
  if (msg.includes("upload") || msg.includes("imgbb")) {
    return "Upload failed - try smaller image";
  }
  if (msg.includes("too large") || msg.includes("file size")) {
    return "Image too large - try smaller file";
  }
  if (msg.includes("compression") || msg.includes("processing")) {
    return "Could not process image";
  }

  return "Try again with different settings";
}

// Enhanced mobile debugging with progress indicators
export function enableMobileDebugging() {
  if (isMobile()) {
    // Override console.log to show on screen for mobile debugging
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

    // Add progress indicator
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

    // Toggle debug with triple tap
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

    // Show progress during operations
    window.showMobileProgress = (show = true) => {
      progressDiv.style.display = show ? "block" : "none";
    };

    console.log("🔍 Mobile debugging enabled - triple tap to toggle");
    console.log("📱 Mobile optimizations active");
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
// Performance monitoring
export function getPerformanceInfo() {
  const info = {
    isMobile: isMobile(),
    userAgent: navigator.userAgent,
    connection: navigator.connection?.effectiveType || "unknown",
    memory: window.performance?.memory
      ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        }
      : null,
    timing: window.performance?.timing
      ? {
          loadTime:
            performance.timing.loadEventEnd -
            performance.timing.navigationStart,
          domReady:
            performance.timing.domContentLoadedEventEnd -
            performance.timing.navigationStart,
        }
      : null,
  };

  console.log("📊 Performance Info:", info);
  return info;
}

// Auto-enable debugging on mobile
if (typeof window !== "undefined" && isMobile()) {
  enableMobileDebugging();
  getPerformanceInfo();
}
