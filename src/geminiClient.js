// Minimal Gemini client wrapper. Replace with official SDK if desired.
// Expects env var: REACT_APP_GEMINI_API_KEY

const API_KEY = "AIzaSyCK3_EjIpgEJ5QXwT0tkyFGfEZvixYLBM8";

export async function generateImageFromText(prompt) {
  if (!API_KEY) {
    throw new Error("Missing REACT_APP_GEMINI_API_KEY");
  }
  // Placeholder: simulate an async image generation returning a data URL
  // Swap this with Google AI Studio Images API once ready.
  await new Promise((r) => setTimeout(r, 1200));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='black'/><text x='50' y='300' fill='yellow' font-size='28' font-family='monospace'>${
    prompt?.slice(0, 42) || "Generated"
  }...</text></svg>`;
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}


