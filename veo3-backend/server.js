import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fetch from "node-fetch";
import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Validate environment variables
const PROJECT_ID = "nanobanana0";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL_ID = "veo-3.0-generate-001";

if (!PROJECT_ID) {
  console.error("❌ GOOGLE_CLOUD_PROJECT_ID environment variable is required");
  process.exit(1);
}

// Initialize Google Auth
let auth;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use service account key file
    auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    // Use service account key from environment variable
    const serviceAccountKey = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    );
    auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  } else {
    // Use default credentials (for local development with gcloud auth)
    auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  console.log("✅ Google Auth initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Google Auth:", error.message);
  process.exit(1);
}

// Helper function to convert image file to base64
function fileToBase64(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64String = fileBuffer.toString("base64");
    const mimeType =
      path.extname(filePath).toLowerCase() === ".png"
        ? "image/png"
        : "image/jpeg";
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error.message}`);
  }
}

// Helper function to validate image URL
function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);
    const validProtocols = ["http:", "https:"];
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    return (
      validProtocols.includes(urlObj.protocol) &&
      validExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext))
    );
  } catch {
    return false;
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    projectId: PROJECT_ID,
    location: LOCATION,
  });
});

// Main video generation endpoint
app.post("/api/generate-video", upload.single("image"), async (req, res) => {
  try {
    console.log("🎬 Video generation request received");

    const { prompt, imageUrl } = req.body;
    const uploadedFile = req.file;

    // Validate required fields
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required and cannot be empty",
      });
    }

    let imageData = null;

    // Handle image input (either uploaded file or URL)
    if (uploadedFile) {
      console.log("📁 Processing uploaded image file");
      try {
        const base64Image = fileToBase64(uploadedFile.path);
        imageData = {
          inlineData: {
            mimeType: uploadedFile.mimetype,
            data: base64Image.split(",")[1], // Remove data:image/...;base64, prefix
          },
        };

        // Clean up uploaded file
        fs.unlinkSync(uploadedFile.path);
      } catch (error) {
        return res.status(400).json({
          error: `Failed to process uploaded image: ${error.message}`,
        });
      }
    } else if (imageUrl) {
      console.log("🔗 Processing image URL");
      if (!isValidImageUrl(imageUrl)) {
        return res.status(400).json({
          error:
            "Invalid image URL. Must be a valid HTTP/HTTPS URL with image extension",
        });
      }
      imageData = {
        imageUri: imageUrl,
      };
    } else {
      return res.status(400).json({
        error: "Either image file or imageUrl is required",
      });
    }

    // Get access token
    console.log("🔑 Getting Google Cloud access token");
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    if (!token.token) {
      throw new Error("Failed to obtain access token");
    }

    // Prepare request payload for Veo 3 API
    const requestPayload = {
      instances: [
        {
          prompt: prompt.trim(),
          ...imageData,
        },
      ],
      parameters: {
        outputMimeType: "video/mp4",
        // Add other parameters as needed
        // duration: "5s", // if supported
        // resolution: "720p" // if supported
      },
    };

    console.log("🚀 Calling Google Veo 3 API");
    console.log(
      "📍 Endpoint:",
      `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predict`
    );

    // Call Google Veo 3 API
    const response = await fetch(
      `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predict`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      }
    );

    console.log("📊 API Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);

      let errorMessage = `Google Veo 3 API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use default error message if parsing fails
      }

      return res.status(response.status).json({
        error: errorMessage,
        details: errorText,
      });
    }

    const data = await response.json();
    console.log("✅ Video generation successful");
    console.log("📋 Response structure:", Object.keys(data));

    // Return the response from Google Veo 3 API
    res.json({
      success: true,
      data: data,
      // Extract video URL if available in the response
      videoUrl:
        data.predictions?.[0]?.videoUri ||
        data.predictions?.[0]?.videoUrl ||
        null,
      prompt: prompt.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Video generation error:", error);

    // Clean up uploaded file if it exists and there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded file:", cleanupError);
      }
    }

    res.status(500).json({
      error: "Internal server error during video generation",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("🚨 Unhandled error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 20MB.",
      });
    }
  }

  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Veo 3 Backend Server Started");
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Project ID: ${PROJECT_ID}`);
  console.log(`🌍 Location: ${LOCATION}`);
  console.log(`🤖 Model: ${MODEL_ID}`);
  console.log("📋 Available endpoints:");
  console.log("  - GET  /health");
  console.log("  - POST /api/generate-video");
});
