// Nano Banana AI Service - Google Gemini Image Models (CORRECTED)
const GEMINI_API_URL = "https://gemini-proxy.namdevlalit914.workers.dev";
const IMGBB_KEYS = ["976c43da17048b8595498ac1ba0fa639"];

// Real Gemini image generation models
const NANO_BANANA_MODELS = [
  { 
    name: "gemini-3-pro-image-preview", // Best quality
    displayName: "Nano Banana Pro",
    bestFor: "text-to-image"
  },
  { 
    name: "gemini-2.5-flash-image", // Faster
    displayName: "Nano Banana Flash",
    bestFor: "image-to-image"
  },
  { 
    name: "gemini-exp-1206", // Text fallback
    displayName: "Gemini Exp",
    bestFor: "fallback"
  }
];

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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
  }
};

// Enhanced Gemini API call with proper image generation config
async function callNanoBananaAPI({ 
  prompt, 
  imageUrls = [], 
  userApiKey, 
  preferredModelIndex = null,
  isTextToImage = false 
}) {
  const trimmedPrompt = (prompt || "").slice(0, isMobile() ? 350 : 400);
  const images = Array.isArray(imageUrls) ? imageUrls.slice(0, 1) : [];

  if (!userApiKey || typeof userApiKey !== "string" || !userApiKey.trim()) {
    throw new Error("Missing Gemini API key. Please add your key in the Profile page.");
  }

  // Smart model selection
  let modelIndex;
  if (preferredModelIndex !== null) {
    modelIndex = preferredModelIndex;
  } else if (isTextToImage) {
    modelIndex = 0; // Use Pro for text-to-image
  } else if (images.length > 0) {
    modelIndex = 1; // Use Flash for image-to-image
  } else {
    modelIndex = 0;
  }

  const currentModel = NANO_BANANA_MODELS[modelIndex];
  console.log(`🍌 Using ${currentModel.displayName} (${currentModel.name})`);

  perfLogger.start(`${currentModel.displayName} API Call`);

  const controller = new AbortController();
  const timeout = isMobile() ? 45000 : 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let imageData = null;
    
    // Load image if provided (for image-to-image)
    if (images.length > 0 && images[0]) {
      try {
        console.log("📥 Fetching image from URL:", images[0]);
        const response = await fetch(images[0]);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
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

    // Build request body with proper image generation config
    const isImageModel = currentModel.name.includes('image');
    
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
      }],
      generationConfig: isImageModel ? {
        responseModalities: ["IMAGE"], // Critical for image generation
        imageConfig: {
          image_size: "1K" // 1024x1024
        }
      } : {}
    };

    console.log(`Sending request to ${currentModel.displayName}...`);
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": userApiKey.trim(),
        "x-model-name": currentModel.name,
      },
      body: JSON.stringify(contents),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => `HTTP ${response.status}`);
      
      // Try next model if this one failed
      if (modelIndex < NANO_BANANA_MODELS.length - 1) {
        console.warn(`⚠️ ${currentModel.displayName} failed, trying next model...`);
        return callNanoBananaAPI({ 
          prompt, 
          imageUrls, 
          userApiKey, 
          preferredModelIndex: modelIndex + 1,
          isTextToImage 
        });
      }
      
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const responseJson = await response.json();
    console.log(`✅ ${currentModel.displayName} response:`, responseJson);

    // Parse response for image data
    if (responseJson.candidates?.[0]?.content?.parts) {
      const parts = responseJson.candidates[0].content.parts;
      
      for (const part of parts) {
        // Check for inline image data (base64)
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || "image/png";
          perfLogger.end(`${currentModel.displayName} API Call`);
          return { 
            imageDataUrl: `data:${mimeType};base64,${part.inlineData.data}`,
            generated: true,
            model: currentModel.displayName
          };
        }
        
        // Check for text responses (shouldn't happen with IMAGE modality)
        if (part.text) {
          const text = part.text.trim();
          console.warn(`⚠️ Got text response: "${text.slice(0, 100)}..."`);
          
          // Try next model if we got text instead of image
          if (modelIndex < NANO_BANANA_MODELS.length - 1) {
            console.warn(`Trying next model...`);
            perfLogger.end(`${currentModel.displayName} API Call`);
            return callNanoBananaAPI({ 
              prompt, 
              imageUrls, 
              userApiKey, 
              preferredModelIndex: modelIndex + 1,
              isTextToImage 
            });
          }
        }
      }
    }

    // If we get here, no valid image was returned
    if (modelIndex < NANO_BANANA_MODELS.length - 1) {
      console.warn(`⚠️ ${currentModel.displayName} returned unexpected format, trying next model...`);
      perfLogger.end(`${currentModel.displayName} API Call`);
      return callNanoBananaAPI({ 
        prompt, 
        imageUrls, 
        userApiKey, 
        preferredModelIndex: modelIndex + 1,
        isTextToImage 
      });
    }

    throw new Error(`${currentModel.displayName} did not return valid image data`);
  } catch (error) {
    perfLogger.end(`${currentModel.displayName} API Call`);
    
    // If error and we have more models, try next one
    if (modelIndex < NANO_BANANA_MODELS.length - 1 && !error.message.includes("API key")) {
      console.warn(`⚠️ ${currentModel.displayName} error: ${error.message}`);
      console.warn(`Trying next model...`);
      return callNanoBananaAPI({ 
        prompt, 
        imageUrls, 
        userApiKey, 
        preferredModelIndex: modelIndex + 1,
        isTextToImage 
      });
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Text to Image - Using Gemini image generation models
export async function textToImage(prompt, userApiKey) {
  if (!prompt?.trim()) {
    throw new Error("Prompt is required");
  }

  perfLogger.start("Text to Image");

  try {
    console.log("🍌 Text-to-image: Using Nano Banana Pro");
    
    const result = await callNanoBananaAPI({
      prompt: `Generate a high-quality, detailed image: ${prompt.trim()}`,
      imageUrls: [],
      userApiKey,
      isTextToImage: true
    });

    console.log('Generation result:', result);

    if (result && typeof result === 'object' && result.imageDataUrl) {
      perfLogger.end("Text to Image");
      return { 
        url: result.imageDataUrl, 
        generated: true, 
        model: result.model || 'Nano Banana'
      };
    }

    throw new Error('No valid image returned');

  } catch (error) {
    console.error("❌ Text to Image failed:", error);
    perfLogger.end("Text to Image");
    throw error;
  }
}

// Image to Image - Using Gemini Flash for editing
export async function imageToImage(file, prompt, userApiKey) {
  if (!file) {
    throw new Error("Image is required");
  }

  perfLogger.start("Image to Image");

  try {
    let imageUrl;

    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      // Upload image to ImgBB first
      const compressedFile = await compressForMobile(file);
      imageUrl = await uploadToImgBB(compressedFile);
    } else {
      throw new Error("Invalid image input");
    }

    console.log("🍌 Image-to-image: Using Nano Banana Flash");

    const result = await callNanoBananaAPI({
      prompt: `Transform this image: ${prompt || "enhance and improve"}`,
      imageUrls: [imageUrl],
      userApiKey,
      isTextToImage: false
    });

    if (result && typeof result === 'object' && result.imageDataUrl) {
      perfLogger.end("Image to Image");
      return { 
        url: result.imageDataUrl, 
        generated: true, 
        model: result.model || 'Nano Banana'
      };
    }

    throw new Error('No valid image returned');

  } catch (error) {
    console.error("❌ Image to Image failed:", error);
    perfLogger.end("Image to Image");
    throw error;
  }
}

// Image compression helper
async function compressForMobile(file) {
  perfLogger.start("Image Compression");

  return new Promise((resolve, reject) => {
    const maxFileSize = isMobile() ? 15 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      reject(new Error(`File too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`));
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      try {
        const maxSize = isMobile() ? 1024 : 1200;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
            });
            perfLogger.end("Image Compression");
            resolve(compressedFile);
          },
          "image/jpeg",
          0.85
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Invalid image file"));
    img.src = URL.createObjectURL(file);
  });
}

// ImgBB upload helper
export async function uploadToImgBB(file, retryCount = 0) {
  perfLogger.start("ImgBB Upload");
  const maxRetries = 3;

  try {
    const apiKey = IMGBB_KEYS[retryCount % IMGBB_KEYS.length];
    const formData = new FormData();
    formData.append("image", file);

    const uploadUrl = `https://api.imgbb.com/1/upload?expiration=3600&key=${apiKey}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return uploadToImgBB(file, retryCount + 1);
      }
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data?.url) {
      perfLogger.end("ImgBB Upload");
      return result.data.url;
    }

    throw new Error("Upload failed");
  } catch (error) {
    perfLogger.end("ImgBB Upload");
    throw error;
  }
}

export async function generateHeadshot(file, prompt, userApiKey) {
  const enhancedPrompt = `Create a professional headshot: ${prompt || 'professional lighting, business appropriate'}`;
  return imageToImage(file, enhancedPrompt, userApiKey);
}

export async function removeBackground(file, userApiKey) {
  const prompt = `Remove the background completely and make it transparent.`;
  return imageToImage(file, prompt, userApiKey);
}

export async function editImageAdjustments(file, options, userApiKey) {
  const adjustments = [];
  if (options.brightness) adjustments.push(`brightness adjusted to ${options.brightness}%`);
  if (options.contrast) adjustments.push(`contrast set to ${options.contrast}%`);
  if (options.saturation) adjustments.push(`saturation at ${options.saturation}%`);
  if (options.temperature) adjustments.push(`color temperature ${options.temperature}%`);
  
  const prompt = `Apply these precise adjustments: ${adjustments.join(', ')}. Keep the original composition and subjects unchanged, only modify the specified properties. The result should look natural and professional.`;
  return imageToImage(file, prompt, userApiKey);
}

export async function improvePrompt(userPrompt, userApiKey) {
  try {
    if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
      return userPrompt || "";
    }

    const result = await callNanoBananaAPI({
      prompt: `Rewrite this into a detailed image generation prompt. Be specific, descriptive, and creative. Return ONLY the improved prompt, nothing else: "${userPrompt.trim()}"`,
      imageUrls: [],
      userApiKey,
      preferredModelIndex: 2, // Use experimental model for text tasks
      isTextToImage: false
    });

    if (!result || typeof result !== "string") {
      return userPrompt;
    }

    let cleaned = result.trim();
    
    // Remove common AI prefixes
    const prefixes = [
      "Here's an improved prompt:", "Improved prompt:", "Rewritten prompt:",
      "Here's the rewritten prompt:", "Better prompt:", "Enhanced prompt:",
      "Here's a better version:", "Try this:"
    ];

    for (const prefix of prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.substring(prefix.length).trim();
        break;
      }
    }

    // Remove surrounding quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    return cleaned || userPrompt;
  } catch (e) {
    console.error("improvePrompt error:", e);
    return userPrompt;
  }
}

export function getFriendlyErrorMessage(raw = "") {
  const msg = String(raw || "").toLowerCase();

  if (msg.includes("rate") || msg.includes("quota")) {
    return isMobile() ? "Rate limit. Wait 60 seconds." : "Rate limit - wait a few minutes";
  }
  if (msg.includes("timeout") || msg.includes("network") || msg.includes("abort")) {
    return isMobile() ? "Slow connection. Try smaller image." : "Connection timeout";
  }
  if (msg.includes("api key") || msg.includes("authentication") || msg.includes("missing gemini")) {
    return "Invalid API key. Check your settings.";
  }
  if (msg.includes("upload") || msg.includes("imgbb")) {
    return "Upload failed - try smaller image";
  }
  if (msg.includes("too large") || msg.includes("file size")) {
    return isMobile() ? "Image too large. Max 15MB." : "Image too large";
  }
  if (msg.includes("model") || msg.includes("not found")) {
    return "Model unavailable. Check API access.";
  }

  return isMobile() ? "Try smaller image" : "Try again";
}

export async function suggestPromptIdeas(topic, userApiKey) {
  try {
    const result = await callNanoBananaAPI({
      prompt: `Generate 8 creative, diverse image generation prompts about: ${topic || "various art styles"}. Return only the prompts, one per line, no numbering.`,
      imageUrls: [],
      userApiKey,
      preferredModelIndex: 2,
      isTextToImage: false
    });

    let raw = result;
    if (typeof result === "string" && /^[[{]/.test(result.trim())) {
      try {
        const parsed = JSON.parse(result);
        raw = parsed.text || parsed.response || result;
      } catch (e) {
        raw = result;
      }
    }

    if (typeof raw !== "string") {
      raw = String(raw);
    }

    const lines = raw
      .split(/\n+/)
      .map((l) => l.replace(/^\s*[-*\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 8);

    if (lines.length) return lines;
  } catch (e) {
    console.warn("Suggest prompts failed:", e);
  }

  return [
    "Cyberpunk city with neon lights and rain",
    "Mountain cabin at golden hour sunset",
    "Abstract geometric patterns in pastel colors",
    "Macro photography of morning dew on flowers",
    "Futuristic space station orbiting a planet",
    "Cozy bookstore cafe with warm lighting"
  ];
}

export function enableMobileDebugging() {
  if (isMobile()) {
    const debugDiv = document.createElement("div");
    debugDiv.id = "mobile-debug";
    debugDiv.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; max-height: 250px; 
      overflow-y: auto; background: rgba(0,0,0,0.95); color: #00ff00; 
      font-family: monospace; font-size: 10px; padding: 8px; 
      z-index: 9999; display: none; border-bottom: 2px solid #00ff00;
    `;
    document.body.appendChild(debugDiv);

    let tapCount = 0;
    document.addEventListener("touchend", () => {
      tapCount++;
      if (tapCount === 3) {
        debugDiv.style.display = debugDiv.style.display === "none" ? "block" : "none";
        tapCount = 0;
      }
      setTimeout(() => (tapCount = 0), 500);
    });

    const originalLog = console.log;
    console.log = (...args) => {
      originalLog.apply(console, args);
      const message = args.join(" ");
      debugDiv.innerHTML = `${new Date().toLocaleTimeString()}: ${message}<br>` + debugDiv.innerHTML;
      if (debugDiv.children.length > 50) {
        debugDiv.removeChild(debugDiv.lastChild);
      }
    };

    console.log("🍌 Nano Banana debugging enabled - triple tap to toggle");
  }
}