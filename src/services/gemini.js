// Truly Mobile-Optimized Gemini API service
const RAPIDAPI_URL =
  "https://gemini-2-5-flash-image-nano-banana1.p.rapidapi.com/api/gemini";

// Mobile-first API key strategy: fewer keys = faster failures = better UX
const RAPIDAPI_KEYS = [
  "5def448890msh1dee7ee52790518p1cf21ejsnaf19597d61ec",
  "7fdc303ae4msh9781fc64209f968p1f6cc1jsnfebc43ac3654",
  "a4fde24ae0msh026d67a6ff832ddp13eb3bjsn628bcb556410",
];

const IMGBB_KEYS = ["976c43da17048b8595498ac1ba0fa639"];

// Enhanced mobile detection with capability assessment
const deviceInfo = (() => {
  const ua = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSlowDevice =
    isMobile &&
    (/Android [1-6]\./i.test(ua) ||
      /iPhone OS [1-9]_/i.test(ua) ||
      navigator.hardwareConcurrency < 4);

  return {
    isMobile,
    isSlowDevice,
    connection: navigator.connection?.effectiveType || "unknown",
    memory: navigator.deviceMemory || 4,
    cores: navigator.hardwareConcurrency || 4,
  };
})();

console.log("📱 Device Info:", deviceInfo);

// Lightweight performance logger
const perf = {
  start: (label) => console.time(label),
  end: (label) => console.timeEnd(label),
};

// CRITICAL FIX 1: Non-blocking compression with proper error handling
async function compressImage(file) {
  perf.start("compress");

  // Immediate validation
  const maxSize = deviceInfo.isMobile ? 15 : 30; // MB
  if (file.size > maxSize * 1024 * 1024) {
    throw new Error(
      `File too large (max ${maxSize}MB for ${
        deviceInfo.isMobile ? "mobile" : "desktop"
      })`
    );
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    let cleanup = () => {
      try {
        canvas.width = 1;
        canvas.height = 1; // Force cleanup
        URL.revokeObjectURL(img.src);
        cleanup = () => {}; // Prevent double cleanup
      } catch (e) {}
    };

    // CRITICAL: Set timeout BEFORE starting processing
    const timeout = setTimeout(
      () => {
        cleanup();
        reject(new Error("Image processing timeout"));
      },
      deviceInfo.isMobile ? 25000 : 15000
    );

    img.onload = () => {
      try {
        clearTimeout(timeout);

        // Aggressive mobile sizing
        const maxDim = deviceInfo.isSlowDevice
          ? 512
          : deviceInfo.isMobile
          ? 768
          : 1024;
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          const ratio = maxDim / Math.max(width, height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Mobile-optimized rendering
        ctx.imageSmoothingEnabled = !deviceInfo.isSlowDevice;
        ctx.imageSmoothingQuality = deviceInfo.isSlowDevice ? "low" : "medium";

        // CRITICAL: Use requestAnimationFrame to prevent blocking
        requestAnimationFrame(() => {
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive quality based on device capability
          let quality = 0.85;
          if (deviceInfo.isSlowDevice) quality = 0.7;
          if (deviceInfo.isMobile) quality = 0.8;
          if (file.size > 5 * 1024 * 1024) quality *= 0.9;

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (!blob) {
                reject(new Error("Compression failed"));
                return;
              }

              const result = new File([blob], "image.jpg", {
                type: "image/jpeg",
              });
              console.log(
                `📦 ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(
                  result.size /
                  1024 /
                  1024
                ).toFixed(1)}MB`
              );
              perf.end("compress");
              resolve(result);
            },
            "image/jpeg",
            quality
          );
        });
      } catch (error) {
        clearTimeout(timeout);
        cleanup();
        reject(error);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Invalid image"));
    };

    img.src = URL.createObjectURL(file);
  });
}

// CRITICAL FIX 2: Mobile-first upload strategy
async function uploadImage(file) {
  perf.start("upload");

  const apiKey = IMGBB_KEYS[0];
  if (!apiKey) throw new Error("No ImgBB key");

  const formData = new FormData();
  formData.append("image", file);

  const controller = new AbortController();

  // Mobile-specific timeout strategy
  const baseTimeout =
    deviceInfo.connection === "slow-2g"
      ? 90000
      : deviceInfo.connection === "2g"
      ? 60000
      : deviceInfo.isMobile
      ? 45000
      : 30000;

  const timeout = setTimeout(() => controller.abort(), baseTimeout);

  try {
    console.log(`📤 Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB...`);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}&expiration=3600`,
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data?.url) {
      throw new Error("No upload URL received");
    }

    console.log("✅ Upload successful");
    perf.end("upload");
    return result.data.url;
  } catch (error) {
    clearTimeout(timeout);
    perf.end("upload");

    if (error.name === "AbortError") {
      throw new Error("Upload timeout - connection too slow");
    }
    throw error;
  }
}

// CRITICAL FIX 3: Simplified API calling with mobile prioritization
async function callAPI(prompt, imageUrls = []) {
  perf.start("api");

  // Mobile-first prompt optimization
  const cleanPrompt = prompt.slice(0, deviceInfo.isMobile ? 300 : 500).trim();

  for (let i = 0; i < RAPIDAPI_KEYS.length; i++) {
    try {
      const controller = new AbortController();

      // Adaptive timeout based on device and connection
      let timeout = 30000; // base 30s
      if (deviceInfo.connection === "slow-2g") timeout = 90000;
      else if (deviceInfo.connection === "2g") timeout = 60000;
      else if (deviceInfo.isMobile) timeout = 45000;

      const timer = setTimeout(() => controller.abort(), timeout);

      console.log(
        `🤖 API call ${i + 1}/${RAPIDAPI_KEYS.length} (${
          timeout / 1000
        }s timeout)`
      );

      const response = await fetch(RAPIDAPI_URL, {
        method: "POST",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEYS[i],
          "x-rapidapi-host":
            "gemini-2-5-flash-image-nano-banana1.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          image: imageUrls.slice(0, 1),
          stream: false,
          return: "url_image",
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.status === 429) {
        console.log("⚠️ Rate limited, trying next key");
        continue;
      }

      if (!response.ok) {
        console.log(`❌ API error ${response.status}, trying next key`);
        continue;
      }

      const text = await response.text();

      if (!text || text.trim() === "" || text === "{}") {
        console.log("⚠️ Empty response, trying next key");
        continue;
      }

      console.log("✅ API success");
      perf.end("api");
      return text;
    } catch (error) {
      const msg = error.name === "AbortError" ? "timeout" : error.message;
      console.log(`❌ Key ${i + 1} failed: ${msg}`);
    }
  }

  perf.end("api");
  throw new Error("All API keys exhausted");
}

// CRITICAL FIX 4: Lightweight placeholder generation
function makePlaceholder(title, subtitle = "", type = "info") {
  const colors = {
    info: "#1a1a2e",
    error: "#dc2626",
    warning: "#f59e0b",
  };

  // Mobile-optimized SVG size
  const size = deviceInfo.isMobile ? 240 : 320;

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${colors[type] || colors.info}"/>
    <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${title}</text>
    <text x="50%" y="55%" text-anchor="middle" fill="#ccc" font-size="9">${subtitle}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// CRITICAL FIX 5: Streamlined main functions
export async function textToImage(prompt) {
  if (!prompt?.trim()) {
    return {
      url: makePlaceholder("No Prompt", "Enter text to generate"),
      generated: false,
    };
  }

  try {
    console.log("🎨 Generating image...");
    const result = await callAPI(`Create: ${prompt.trim()}`);

    // Parse response
    try {
      const parsed = JSON.parse(result);
      const url = parsed.url || parsed.image_url || parsed.image;
      if (url) return { url, generated: true };
    } catch {
      if (result.startsWith("http")) {
        return { url: result.trim(), generated: true };
      }
    }

    return {
      url: makePlaceholder("Generated", prompt.slice(0, 25)),
      generated: false,
    };
  } catch (error) {
    console.error("Text generation failed:", error);
    return {
      url: makePlaceholder("Failed", error.message.slice(0, 30), "error"),
      generated: false,
    };
  }
}

export async function imageToImage(file, prompt = "") {
  if (!file) {
    return {
      url: makePlaceholder("No Image", "Select an image file"),
      generated: false,
    };
  }

  try {
    let imageUrl;

    // Handle different input types
    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      console.log("🔄 Processing image...");

      // CRITICAL: Show progress immediately on mobile
      if (deviceInfo.isMobile && typeof window !== "undefined") {
        document.body.style.cursor = "wait";
      }

      try {
        const compressed = await compressImage(file);
        imageUrl = await uploadImage(compressed);
      } catch (uploadError) {
        console.error("Processing failed:", uploadError);

        if (deviceInfo.isMobile && typeof window !== "undefined") {
          document.body.style.cursor = "default";
        }

        return {
          url: makePlaceholder(
            "Upload Failed",
            uploadError.message.slice(0, 25),
            "error"
          ),
          generated: false,
        };
      }
    } else {
      return {
        url: makePlaceholder("Invalid Input", "Use image file or URL"),
        generated: false,
      };
    }

    console.log("🤖 Transforming with AI...");
    const result = await callAPI(`Transform: ${prompt || "enhance"}`, [
      imageUrl,
    ]);

    // Reset cursor on mobile
    if (deviceInfo.isMobile && typeof window !== "undefined") {
      document.body.style.cursor = "default";
    }

    // Parse result
    try {
      const parsed = JSON.parse(result);
      const url = parsed.url || parsed.image_url || parsed.image;
      if (url) return { url, generated: true };
    } catch {
      if (result.startsWith("http")) {
        return { url: result.trim(), generated: true };
      }
    }

    return {
      url: makePlaceholder("Transformed", prompt.slice(0, 20) || "Enhanced"),
      generated: false,
    };
  } catch (error) {
    console.error("Transformation failed:", error);

    if (deviceInfo.isMobile && typeof window !== "undefined") {
      document.body.style.cursor = "default";
    }

    return {
      url: makePlaceholder("Failed", error.message.slice(0, 25), "error"),
      generated: false,
    };
  }
}

// Simplified helper functions
export async function removeBackground(file) {
  console.log("🎭 Removing background...");
  return imageToImage(file, "remove background, transparent");
}

export async function generateHeadshot(file, prompt = "") {
  console.log("👤 Creating headshot...");
  return imageToImage(file, `professional headshot ${prompt}`.trim());
}

export function getFriendlyErrorMessage(error = "") {
  const msg = String(error).toLowerCase();

  if (msg.includes("timeout")) return "Connection timeout";
  if (msg.includes("large") || msg.includes("size")) return "File too large";
  if (msg.includes("rate") || msg.includes("quota")) return "Rate limited";
  if (msg.includes("network")) return "Network error";
  if (msg.includes("invalid")) return "Invalid file";

  return "Something went wrong";
}

// Missing functions that were in the original version
export async function improvePrompt(userPrompt) {
  try {
    const result = await callAPI(`Improve this prompt: ${userPrompt}`);
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
    const result = await callAPI(
      `List 8 creative prompts for: ${
        topic || "art"
      }. Return only the prompts, one per line, without numbers or bullets.`
    );

    let raw = result;
    try {
      const parsed = JSON.parse(result);
      if (parsed.message) {
        raw = parsed.message;
      } else if (parsed.text) {
        raw = parsed.text;
      } else if (parsed.response) {
        raw = parsed.response;
      } else if (parsed.prompts) {
        raw = parsed.prompts;
      } else {
        raw = result;
      }
    } catch {
      raw = result;
    }

    const lines = raw
      .split(/\n+/)
      .map((l) => l.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 8);

    if (lines.length >= 3) {
      console.log(`✅ Generated ${lines.length} prompt ideas`);
      return lines;
    }
  } catch (e) {
    console.warn("Suggest prompts failed:", e);
  }

  const fallbackPrompts = [
    "Cyberpunk street with neon lights",
    "Mountain cabin at sunset",
    "Geometric patterns in pastels",
    "Dew drops on petals",
    "Futuristic city skyline",
    "Cozy library with warm light",
    "Abstract digital patterns",
    "Zen garden with leaves",
  ];

  console.log("📝 Using fallback prompt ideas");
  return fallbackPrompts;
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

// CRITICAL FIX 6: Mobile debugging that actually works
export function enableMobileDebug() {
  if (!deviceInfo.isMobile) return;

  const debug = document.createElement("div");
  debug.id = "debug";
  debug.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 120px;
    background: rgba(0,0,0,0.9);
    color: #0f0;
    font: 10px monospace;
    padding: 8px;
    overflow-y: auto;
    z-index: 99999;
    display: none;
    border-top: 1px solid #0f0;
  `;

  document.body.appendChild(debug);

  // Show/hide with double tap on bottom of screen
  let lastTap = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    const timeDiff = now - lastTap;
    const y = e.changedTouches[0].clientY;

    if (timeDiff < 300 && timeDiff > 0 && y > window.innerHeight - 100) {
      debug.style.display = debug.style.display === "none" ? "block" : "none";
    }

    lastTap = now;
  });

  // Override console
  const log = console.log;
  console.log = (...args) => {
    log.apply(console, args);
    debug.innerHTML =
      `${new Date().toLocaleTimeString()}: ${args.join(" ")}<br>` +
      debug.innerHTML;
    if (debug.children.length > 30) debug.lastChild.remove();
  };

  console.log("🔍 Debug enabled - double tap bottom to toggle");
}

// Initialize mobile debugging
if (typeof window !== "undefined") {
  enableMobileDebug();
}
