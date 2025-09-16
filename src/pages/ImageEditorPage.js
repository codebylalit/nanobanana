import React from "react";
import { useCredits } from "../creditsContext";
import { addHistoryItem } from "../historyStore";
import { editImageAdjustments } from "../services/gemini";
import {
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlineAdjustments,
  HiOutlinePencil,
  HiOutlineFilter,
  HiOutlineDocumentText,
  HiOutlineColorSwatch,
} from "react-icons/hi";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
} from "react-icons/hi2";

export default function ImageEditorPage() {
  const { credits, consumeCredits } = useCredits();
  const [file, setFile] = React.useState(null);
  // const [opts, setOpts] = React.useState({ brightness: 0, contrast: 0, saturation: 0 });
  const [img, setImg] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("Filter");
  const [filterType, setFilterType] = React.useState("");
  const [filterIntensity, setFilterIntensity] = React.useState(50);
  const [textContent, setTextContent] = React.useState("");
  const [textPosition, setTextPosition] = React.useState("Center");
  const [fontStyle, setFontStyle] = React.useState("Bold");
  const [backgroundType, setBackgroundType] = React.useState("");
  const [areaToEdit, setAreaToEdit] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [selectedFormat, setSelectedFormat] = React.useState("Original");

  // function change(k, v) {
  //   setOpts((o) => ({ ...o, [k]: v }));
  // }

  // Handle file upload and create preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      // Create preview URL for immediate display
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setImg(null); // Clear any previous edited result
    } else {
      setPreviewUrl(null);
    }
  };

  // Clean up preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Download function (respects selected export format via canvas)
  const downloadImage = async () => {
    if (!img) return;

    const dims = getFormatDimensions(selectedFormat);
    // If Original or no dims, download as-is
    if (!dims) {
      const link = document.createElement("a");
      link.href = img;
      link.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const response = await fetch(img, { mode: "cors" });
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      const targetWidth = dims.width;
      const targetHeight = dims.height;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      // Cover-fit crop to fill target aspect
      const scale = Math.max(
        targetWidth / bitmap.width,
        targetHeight / bitmap.height
      );
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      const dx = (targetWidth - drawWidth) / 2;
      const dy = (targetHeight - drawHeight) / 2;

      ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight);

      canvas.toBlob((outBlob) => {
        if (!outBlob) return;
        const url = URL.createObjectURL(outBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `edited-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (_) {
      const link = document.createElement("a");
      link.href = img;
      link.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get format dimensions
  const getFormatDimensions = (format) => {
    switch (format) {
      case "1:1 Square":
        return { width: 1024, height: 1024 };
      case "4:3 Standard":
        return { width: 1024, height: 768 };
      case "3:2 Classic":
        return { width: 1024, height: 683 };
      case "16:9 Landscape":
        return { width: 1024, height: 576 };
      case "5:3 Widescreen":
        return { width: 1500, height: 900 };
      case "21:9 Ultra Wide":
        return { width: 1024, height: 439 };
      case "9:16 Portrait":
        return { width: 576, height: 1024 };
      case "4:5 Instagram":
        return { width: 819, height: 1024 };
      case "3:4 Portrait":
        return { width: 768, height: 1024 };
      case "2:3 Photo":
        return { width: 683, height: 1024 };
      case "1:2 Tall":
        return { width: 512, height: 1024 };
      case "Facebook Cover":
        return { width: 1200, height: 630 };
      case "Twitter Header":
        return { width: 1500, height: 500 };
      case "LinkedIn Banner":
        return { width: 1128, height: 191 };
      case "YouTube Thumbnail":
        return { width: 1280, height: 720 };
      case "Pinterest Pin":
        return { width: 735, height: 1102 };
      case "Story Format":
        return { width: 1080, height: 1920 };
      case "A4 Print":
        return { width: 1240, height: 1754 };
      case "A5 Print":
        return { width: 874, height: 1240 };
      case "Business Card":
        return { width: 1050, height: 600 };
      case "Banner Ad":
        return { width: 728, height: 90 };
      case "Square Ad":
        return { width: 1080, height: 1080 };
      case "Wide Ad":
        return { width: 1200, height: 628 };
      default:
        return null; // Original - no resizing
    }
  };

  // Generate AI prompt based on selected tool and options
  const generateAIPrompt = () => {
    switch (selectedTab) {
      case "Filter":
        return `Apply ${filterType} filter with ${filterIntensity}% intensity to this image. Make it look professional and visually appealing.`;

      case "Text":
        return `Add text "${textContent}" to this image. Position: ${textPosition}, Style: ${fontStyle}. Make the text clearly visible and well-integrated with the image.`;

      case "Background":
        return `Change the background to ${backgroundType}. Make it look natural and professional. Ensure the subject remains clearly visible and well-lit.`;

      case "Select":
        return `Edit the ${areaToEdit} in this image. ${editDescription}. Make the changes look natural and professional.`;

      default:
        return "Edit this image to make it look better and more professional.";
    }
  };

  async function onApply() {
    const creditCost = selectedTab === "Filter" ? 2 : 3;

    // Validation for different tabs
    if (selectedTab === "Filter" && !filterType.trim()) {
      alert("Please select a filter type.");
      return;
    }
    if (selectedTab === "Text" && !textContent.trim()) {
      alert("Please enter text content to add to the image.");
      return;
    }
    if (
      selectedTab === "Select" &&
      (!areaToEdit.trim() || !editDescription.trim())
    ) {
      alert(
        "Please specify the area to edit and describe what changes you want."
      );
      return;
    }
    if (selectedTab === "Background" && !backgroundType.trim()) {
      alert("Please specify what background you want.");
      return;
    }

    if (credits < creditCost || !file) return;
    setLoading(true);
    try {
      const aiPrompt = generateAIPrompt();
      const formatDimensions = getFormatDimensions(selectedFormat);

      const result = await editImageAdjustments(file, {
        tool: selectedTab,
        prompt: aiPrompt,
        filterType,
        filterIntensity,
        textContent,
        textPosition,
        fontStyle,
        backgroundType,
        areaToEdit,
        editDescription,
        format: selectedFormat,
        dimensions: formatDimensions,
      });
      setImg(result.url);
      if (result.generated) {
        const ok = await consumeCredits(creditCost);
        if (!ok) throw new Error("Credit deduction failed");
        addHistoryItem({
          type: "edit",
          url: result.url,
          options: {
            tool: selectedTab,
            prompt: aiPrompt,
            filterType,
            filterIntensity,
            textContent,
            textPosition,
            fontStyle,
            backgroundType,
            areaToEdit,
            editDescription,
            format: selectedFormat,
          },
          ts: Date.now(),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16 sm:pb-0">
      {/* Header */}
      <div className="mb-4 sm:mb-8 text-center">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          AI Image Editor
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm">
          Professional image editing powered by AI. Select areas, apply filters,
          change backgrounds.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 lg:gap-10">
        {/* RIGHT: Editing Tools */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm flex flex-col">
          {/* Tools Header */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
              Editing Tools
            </h2>
            <HiOutlinePencil className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </div>

          {/* Tool Tabs */}
          <div className="flex space-x-2 sm:space-x-3 mb-3 sm:mb-5 overflow-x-auto no-scrollbar">
            {[
              { name: "Select", icon: HiOutlinePencil },
              { name: "Filter", icon: HiOutlineFilter },
              { name: "Text", icon: HiOutlineDocumentText },
              { name: "Background", icon: HiOutlineColorSwatch },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setSelectedTab(name)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-shrink-0 transition ${
                  selectedTab === name
                    ? "border-gray-800 bg-gray-100 text-gray-900"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {name}
              </button>
            ))}
          </div>

          {/* Tool-specific content */}
          <div className="flex-1 flex flex-col space-y-2 sm:space-y-4">
            {/* Select Tab */}
            {selectedTab === "Select" && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Area to edit
                  </label>
                  <input
                    type="text"
                    value={areaToEdit}
                    onChange={(e) => setAreaToEdit(e.target.value)}
                    placeholder="e.g., person's face, background, car, sky"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Changes
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="e.g., improve lighting, remove blemishes, enhance colors"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  />
                </div>
              </>
            )}

            {/* Filter Tab */}
            {selectedTab === "Filter" && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Filter Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  >
                    <option value="">Select filter...</option>
                    <option value="">Select filter type...</option>{" "}
                    <option value="Vintage">Vintage</option>{" "}
                    <option value="Black & White">Black & White</option>{" "}
                    <option value="Sepia">Sepia</option>{" "}
                    <option value="Dramatic">Dramatic</option>{" "}
                    <option value="Soft">Soft</option>{" "}
                    <option value="Warm">Warm</option>{" "}
                    <option value="Cool">Cool</option>{" "}
                    <option value="High Contrast">High Contrast</option>{" "}
                    <option value="Low Contrast">Low Contrast</option>{" "}
                    <option value="Bright">Bright</option>{" "}
                    <option value="Dark">Dark</option>{" "}
                    <option value="Saturated">Saturated</option>{" "}
                    <option value="Desaturated">Desaturated</option>{" "}
                    <option value="HDR">HDR</option>{" "}
                    <option value="Film">Film</option>{" "}
                    <option value="Polaroid">Polaroid</option>{" "}
                    <option value="Instagram">Instagram</option>{" "}
                    <option value="Professional">Professional</option>{" "}
                    <option value="Artistic">Artistic</option>{" "}
                    <option value="Grunge">Grunge</option>{" "}
                    <option value="Clean">Clean</option>{" "}
                    <option value="Retro">Retro</option>{" "}
                    <option value="Modern">Modern</option>{" "}
                    <option value="Faded">Faded</option>{" "}
                    <option value="Vibrant">Vibrant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Intensity: {filterIntensity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterIntensity}
                    onChange={(e) =>
                      setFilterIntensity(parseInt(e.target.value, 10))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* Text Tab */}
            {selectedTab === "Text" && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Text
                  </label>
                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Enter text to add"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={textPosition}
                      onChange={(e) => setTextPosition(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    >
                      <option>Center</option>
                      <option>Top</option>
                      <option>Bottom</option>
                      <option>Left</option>
                      <option>Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Font
                    </label>
                    <select
                      value={fontStyle}
                      onChange={(e) => setFontStyle(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    >
                      <option>Bold</option>
                      <option>Regular</option>
                      <option>Italic</option>
                      <option>Light</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Background Tab */}
            {selectedTab === "Background" && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Background
                </label>
                <input
                  type="text"
                  value={backgroundType}
                  onChange={(e) => setBackgroundType(e.target.value)}
                  placeholder="e.g., beach sunset, office, nature"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            )}
          </div>

          {/* Apply Button */}
          <button
            onClick={onApply}
            disabled={
              loading || credits < (selectedTab === "Filter" ? 1 : 2) || !file
            }
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 sm:gap-3 rounded-xl font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition ${
              loading || credits < (selectedTab === "Filter" ? 1 : 2) || !file
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-yellow-400 text-black hover:bg-yellow-300 cursor-pointer"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                Applying...
              </>
            ) : (
              <>
                {selectedTab === "Filter" ? (
                  <HiOutlineFilter className="w-5 h-5" />
                ) : selectedTab === "Text" ? (
                  <HiOutlineDocumentText className="w-5 h-5" />
                ) : selectedTab === "Background" ? (
                  <HiOutlineColorSwatch className="w-5 h-5" />
                ) : (
                  <HiOutlineAdjustments className="w-5 h-5" />
                )}
                {selectedTab === "Filter"
                  ? "Apply Filter (1 credits)"
                  : selectedTab === "Text"
                  ? "Add Text (1 credits)"
                  : selectedTab === "Background"
                  ? "Change Background (1 credits)"
                  : "Apply Edit (1 credits)"}
              </>
            )}
          </button>

          {/* Enhance Quality Button (disabled placeholder)
          <button
            disabled
            className="mt-4 w-full inline-flex items-center justify-center gap-2 sm:gap-3 rounded-xl  sm:px-6  sm:py-3  sm:text-base transition  bg-white text-gray-500 font-medium px-6 py-3  cursor-not-allowed border border-gray-300"
          >
            <HiOutlineSparkles className="w-5 h-5" /> Enhance Quality (2
            credits)
          </button> */}

          {/* Credit Warning */}
          {credits < (selectedTab === "Filter" ? 1 : 2) && (
            <div className="mt-4 rounded-xl border border-orange-300 bg-orange-50 p-4 text-orange-800 text-sm">
              <div className="flex items-center gap-2">
                <HiOutlineExclamation className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-semibold">Insufficient credits</div>
                  <div>enhance quality require 2 credits.</div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* LEFT: Image Preview & Export */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
              Image Preview
            </h2>
            <div className="inline-flex items-center gap-1 sm:gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs">
                State 1/1
              </span>
              <button
                className="p-1 sm:p-2 rounded-md hover:bg-gray-100"
                aria-label="Undo"
              >
                <HiOutlineArrowUturnLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </button>
              <button
                className="p-1 sm:p-2 rounded-md hover:bg-gray-100"
                aria-label="Redo"
              >
                <HiOutlineArrowUturnRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Image Display */}
          <div className="flex-1 relative flex items-center justify-center border border-gray-200 rounded-xl overflow-hidden mb-3 sm:mb-4 bg-gray-50">
            {img || previewUrl ? (
              <img
                src={img || previewUrl}
                alt="Preview"
                className="max-h-[280px] sm:max-h-[500px] object-contain mx-auto"
              />
            ) : (
              <p className="text-gray-400 text-xs sm:text-sm text-center">
                Upload and edit image to preview here
              </p>
            )}

            {(img || previewUrl) && (
              <div className="absolute left-2 right-2 bottom-2 sm:left-3 sm:right-3 sm:bottom-3">
                <div className="rounded-lg bg-black/70 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs flex items-center justify-between">
                  <span>{img ? "Edited image" : "Original image"}</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Box */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-3 sm:p-4 text-center hover:border-yellow-400 transition cursor-pointer mb-3 sm:mb-4">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <p className="text-gray-500 text-xs sm:text-sm">
              Drop image here or{" "}
              <span className="font-medium text-yellow-600">
                click to upload
              </span>
            </p>
          </div>

          {/* Export Options */}
          <div className="space-y-2 sm:space-y-4 mt-auto">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Export Format
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  "Original",
                  "1:1 Square",
                  "9:16 Portrait",
                  "16:9 Landscape",
                  {
                    /* "4:3 Widescreen", */
                  },
                ].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedFormat(opt)}
                    className={`border rounded-lg py-1 sm:py-2 text-xs sm:text-sm font-medium transition ${
                      selectedFormat === opt
                        ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 text-gray-600 hover:border-yellow-400 hover:text-yellow-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button */}
            {img && (
              <button
                onClick={downloadImage}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 text-black font-semibold px-3 py-2 text-sm sm:text-base hover:bg-yellow-600 transition"
              >
                <HiOutlineDownload className="w-4 h-4" />
                Download Edited Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
