import React, { useEffect, useRef, useState } from "react";
import {
  HiOutlinePencilAlt,
  HiOutlineSparkles,
  HiCheckCircle,
} from "react-icons/hi";

export default function PromptHelperAutoDemo() {
  const chips = [
    "Cinematic lighting",
    "Macro dew drop",
    "Isometric city",
    "Studio portrait",
    "Watercolor style",
    "Neon cyberpunk",
  ];

  const defaultPrompt = "A cozy cabin by a lake at golden hour";
  const makeImproved = (text) =>
    `🎨 Improved: ${text}, with rich details, soft golden light, and a cinematic atmosphere.`;

  const [userPrompt, setUserPrompt] = useState("");
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [status, setStatus] = useState("idle"); // idle | writing | improving | done

  const cancelledRef = useRef(false);
  const timeoutIdsRef = useRef([]);

  const sleep = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      timeoutIdsRef.current.push(id);
    });

  const cancelAll = () => {
    cancelledRef.current = true;
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  const typeTextAsync = async (text, setter, baseSpeed = 100) => {
    setter("");
    for (let i = 0; i < text.length; i++) {
      if (cancelledRef.current) break;
      setter(text.slice(0, i + 1));
      let delay = baseSpeed;
      if (text[i] === " " || [",", ".", "!", "?", ";", ":"].includes(text[i])) {
        delay = Math.round(baseSpeed * 1.6);
      }
      await sleep(delay);
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    timeoutIdsRef.current = [];

    let isMounted = true;

    const runDemo = async () => {
      const defaultSpeed = 100;
      const improvedSpeed = 60;

      while (!cancelledRef.current && isMounted) {
        // Typing default
        setStatus("writing");
        await typeTextAsync(defaultPrompt, setUserPrompt, defaultSpeed);
        if (cancelledRef.current) break;

        await sleep(900);

        // Typing improved
        setStatus("improving");
        const improved = makeImproved(defaultPrompt);
        setImprovedPrompt("");
        await typeTextAsync(improved, setImprovedPrompt, improvedSpeed);
        if (cancelledRef.current) break;

        setStatus("done");
        await sleep(3200);

        // Clear all
        setUserPrompt("");
        setImprovedPrompt("");
        setStatus("idle");
        await sleep(700);
      }
    };

    runDemo();

    return () => {
      isMounted = false;
      cancelAll();
    };
  }, []);

  const handleChipClick = (chip) => {
    setUserPrompt((prev) => (prev ? prev + ", " + chip : chip));
  };

  const renderStatus = () => {
    switch (status) {
      case "writing":
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <HiOutlinePencilAlt className="w-4 h-4 text-yellow-500 animate-pulse" />
            Writing prompt…
          </div>
        );
      case "improving":
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <HiOutlineSparkles className="w-4 h-4 text-purple-500 animate-spin" />
            Improving prompt…
          </div>
        );
      case "done":
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <HiCheckCircle className="w-4 h-4" />
            Improved
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section
      className="py-16 sm:py-20 lg:py-24 xl:py-32 bg-gradient-to-b from-white to-gray-50"
      id="prompt-helper"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Section */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4">
              <span>Prompt Helper (Demo)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Stuck on what to write? Watch how prompts improve automatically.
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-6">
              Demo mode: the helper types a sample prompt, improves it, then
              repeats.
            </p>
          </div>

          {/* Right Section */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
            <div className="text-left">
              <label className="block text-gray-900 font-semibold mb-2">
                Describe your image
              </label>

              <textarea
                value={improvedPrompt || userPrompt}
                readOnly
                placeholder="e.g., Cozy cabin by a lake at golden hour"
                className="w-full rounded-2xl border border-gray-300 bg-white p-4 text-gray-700 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all whitespace-pre-wrap"
              />
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(c)}
                  className="cursor-pointer rounded-full border border-gray-300 px-3 py-1.5 text-sm bg-gray-50 hover:bg-yellow-100 transition"
                  type="button"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Disabled buttons */}
            <div className="flex gap-3">
              <button
                disabled
                className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 font-semibold text-sm opacity-50 cursor-not-allowed"
              >
                Improve prompt
              </button>
              <button
                disabled
                className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 font-semibold text-sm opacity-50 cursor-not-allowed"
              >
                Clear
              </button>
            </div>

            {/* Status */}
            {renderStatus()}
          </div>
        </div>
      </div>
    </section>
  );
}
