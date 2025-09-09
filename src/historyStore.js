const HISTORY_KEY = "nb_history_v1";
const MAX_HISTORY_ITEMS = 50; // Reduced from 200 to prevent quota issues
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit

// Helper function to estimate storage size
function estimateStorageSize(data) {
  return new Blob([JSON.stringify(data)]).size;
}

// Helper function to clean up old items
function cleanupOldItems(items) {
  // Sort by timestamp (newest first) and keep only recent items
  const withTime = items
    .filter((item) => item.ts != null || item.timestamp != null)
    .map((item) => ({
      ...item,
      // Normalize to numeric ms for sorting
      _ts:
        typeof item.ts === "number"
          ? item.ts
          : item.ts
          ? Number(item.ts)
          : item.timestamp
          ? Date.parse(item.timestamp)
          : 0,
    }));

  const sortedItems = withTime
    .sort((a, b) => (b._ts || 0) - (a._ts || 0))
    .slice(0, MAX_HISTORY_ITEMS)
    .map(({ _ts, ...rest }) => rest);

  return sortedItems;
}

// Helper function to compress item data
function compressItem(item) {
  // Keep URL so Previous Images can render. Keep ts for sorting and display.
  return {
    id: item.id,
    type: item.type,
    prompt: item.prompt?.substring(0, 500),
    url: item.url,
    ts:
      typeof item.ts === "number"
        ? item.ts
        : item.ts
        ? Number(item.ts)
        : Date.now(),
  };
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];

    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.warn("Failed to load history:", e);
    return [];
  }
}

export function saveHistory(items) {
  try {
    // Clean up and compress items
    const cleanedItems = cleanupOldItems(items);
    const compressedItems = cleanedItems.map(compressItem);

    // Check if data is too large
    const dataSize = estimateStorageSize(compressedItems);
    if (dataSize > MAX_STORAGE_SIZE) {
      // Further reduce items if still too large
      const reducedItems = compressedItems.slice(
        0,
        Math.floor(MAX_HISTORY_ITEMS * 0.5)
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(reducedItems));
      console.warn(
        "History data was too large, reduced to",
        reducedItems.length,
        "items"
      );
    } else {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(compressedItems));
    }
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      console.warn("Storage quota exceeded, clearing old history");
      // Clear all history and try to save a minimal set
      try {
        localStorage.removeItem(HISTORY_KEY);
        const minimalItems = items.slice(0, 10).map(compressItem);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(minimalItems));
      } catch (e2) {
        console.error("Failed to save even minimal history:", e2);
      }
    } else {
      console.error("Failed to save history:", e);
    }
  }
}

export function addHistoryItem(item) {
  try {
    const currentHistory = loadHistory();
    const newItem = {
      ...item,
      timestamp: item.timestamp || new Date().toISOString(),
      id: item.id || Date.now().toString(),
    };

    const next = [newItem, ...currentHistory];
    saveHistory(next);
  } catch (e) {
    console.error("Failed to add history item:", e);
  }
}

// New function to clear all history
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    console.log("History cleared successfully");
  } catch (e) {
    console.error("Failed to clear history:", e);
  }
}

// New function to get storage usage info
export function getStorageInfo() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const size = raw ? new Blob([raw]).size : 0;
    return {
      size,
      sizeFormatted: `${(size / 1024).toFixed(1)} KB`,
      itemCount: raw ? JSON.parse(raw).length : 0,
      maxSize: MAX_STORAGE_SIZE,
      maxItems: MAX_HISTORY_ITEMS,
    };
  } catch (e) {
    return {
      size: 0,
      sizeFormatted: "0 KB",
      itemCount: 0,
      maxSize: MAX_STORAGE_SIZE,
      maxItems: MAX_HISTORY_ITEMS,
    };
  }
}
