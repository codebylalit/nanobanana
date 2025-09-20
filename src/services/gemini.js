// ImgBB-only Gemini API service (mobile optimized)
const RAPIDAPI_URL =
  "https://gemini-2-5-flash-image-nano-banana1.p.rapidapi.com/api/gemini";

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

// ImgBB API keys - get from https://api.imgbb.com/
const IMGBB_KEYS = [
  "976c43da17048b8595498ac1ba0fa639",
  // Add more keys for higher rate limits
];

const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Mobile-optimized image compression
async function compressForMobile(file) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // More aggressive compression for mobile
      const maxSize = isMobile() ? 1024 : 1600;
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

      // Higher compression for mobile
      const quality = isMobile() ? 0.8 : 0.9;
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });
          console.log(
            `Compressed: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(
              compressedFile.size /
              1024 /
              1024
            ).toFixed(1)}MB`
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

// ImgBB upload with correct endpoint and expiration
async function uploadToImgBB(file) {
  let lastError;

  for (const apiKey of IMGBB_KEYS) {
    if (!apiKey || apiKey.startsWith("YOUR_")) {
      continue;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      // Use expiration for temporary images (600 seconds = 10 minutes)
      const expiration = 3600; // 1 hour - adjust as needed
      const uploadUrl = `https://api.imgbb.com/1/upload?expiration=${expiration}&key=${apiKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for mobile

      console.log(
        `Uploading to ImgBB (${(file.size / 1024 / 1024).toFixed(1)}MB)...`
      );

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`ImgBB HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.success && result.data?.url) {
        console.log(`ImgBB upload successful: ${result.data.url}`);
        return result.data.url;
      }

      if (result.error) {
        throw new Error(
          `ImgBB API error: ${result.error.message || result.error}`
        );
      }

      throw new Error("ImgBB returned no URL");
    } catch (error) {
      const errorMsg = error.message;
      console.warn(`ImgBB key ${apiKey.slice(0, 6)}... failed: ${errorMsg}`);
      lastError = errorMsg;

      // If rate limited or quota exceeded, try next key
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("rate") ||
        errorMsg.includes("quota")
      ) {
        console.log("Rate limit hit, trying next key...");
        continue;
      }

      // If timeout or network error, try next key
      if (
        error.name === "AbortError" ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("network")
      ) {
        console.log("Network issue, trying next key...");
        continue;
      }
    }
  }

  throw new Error(`ImgBB upload failed: ${lastError}`);
}

// Main upload function
async function uploadImage(file) {
  try {
    // Step 1: Compress image
    const compressedFile = await compressForMobile(file);

    // Step 2: Upload to ImgBB only
    return await uploadToImgBB(compressedFile);
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

// Streamlined API call
async function callGeminiAPI(prompt, imageUrls = []) {
  let lastError;

  for (const key of RAPIDAPI_KEYS) {
    try {
      const controller = new AbortController();
      const timeout = isMobile() ? 45000 : 60000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const payload = {
        prompt: prompt.slice(0, 400),
        image: imageUrls.slice(0, 1),
        stream: false,
        return: "url_image",
      };

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

      if (
        !responseText ||
        responseText.trim() === "" ||
        responseText === "{}"
      ) {
        console.warn("Empty response, trying next key...");
        lastError = "Empty response";
        continue;
      }

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
      const errorMsg =
        err.name === "AbortError" ? "Request timeout" : err.message;
      console.warn(`Key failed: ${errorMsg}`);
      lastError = errorMsg;
    }
  }

  throw new Error(`All API keys failed: ${lastError}`);
}

// Simple placeholder creation
function createPlaceholder(label, subtitle, type = "info") {
  const colors = {
    info: ["#1a1a2e", "#16213e"],
    error: ["#dc2626", "#991b1b"],
    warning: ["#f59e0b", "#d97706"],
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
    <text x='50%' y='45%' text-anchor='middle' fill='#FACC15' font-size='16' font-family='system-ui' font-weight='bold'>${label}</text>
    <text x='50%' y='55%' text-anchor='middle' fill='#ddd' font-size='10' font-family='system-ui'>${subtitle}</text>
    <text x='50%' y='65%' text-anchor='middle' fill='#888' font-size='8' font-family='system-ui'>Gemini AI</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Main functions
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
      url: createPlaceholder("Generated Image", prompt.slice(0, 40)),
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

    if (typeof file === "string" && file.startsWith("http")) {
      imageUrl = file;
    } else if (file instanceof File) {
      try {
        console.log("Uploading to ImgBB...");
        imageUrl = await uploadImage(file);
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);

        // Provide specific error based on failure type
        if (
          uploadError.message.includes("rate") ||
          uploadError.message.includes("quota")
        ) {
          return {
            url: createPlaceholder(
              "Rate Limit Hit",
              "Please try again in a few minutes",
              "warning"
            ),
            generated: false,
          };
        }

        if (
          uploadError.message.includes("timeout") ||
          uploadError.message.includes("network")
        ) {
          return {
            url: createPlaceholder(
              "Network Error",
              "Check connection and try again",
              "error"
            ),
            generated: false,
          };
        }

        return {
          url: createPlaceholder(
            "Upload Failed",
            "Could not upload image",
            "error"
          ),
          generated: false,
        };
      }
    } else {
      throw new Error("Invalid image input");
    }

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
        prompt?.slice(0, 30) || "Style applied"
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

  if (msg.includes("rate") || msg.includes("quota")) {
    return "Rate limit hit - try again in a few minutes";
  }
  if (msg.includes("timeout") || msg.includes("network")) {
    return "Connection issue - check network and retry";
  }
  if (msg.includes("upload") || msg.includes("imgbb")) {
    return "Upload failed - try again";
  }
  if (msg.includes("não continha uma imagem") || msg.includes("no image")) {
    return "Could not generate image - try different prompt";
  }
  if (msg.includes("processing failed")) {
    return "Could not process image - try different file";
  }

  return "Something went wrong - please try again";
}

// Check if ImgBB is configured
export function isImgBBConfigured() {
  return IMGBB_KEYS.some((key) => key && !key.startsWith("YOUR_"));
}

export function getImgBBStatus() {
  const configured = isImgBBConfigured();
  return {
    configured,
    message: configured
      ? "ImgBB configured and ready"
      : "Add your ImgBB API key to IMGBB_KEYS array",
    setupUrl: "https://api.imgbb.com/",
  };
}
