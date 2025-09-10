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
    `${text}, with rich details, soft golden light, and a cinematic atmosphere.`;

  const [userPrompt, setUserPrompt] = useState("");
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [status, setStatus] = useState("idle");

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
        setStatus("writing");
        await typeTextAsync(defaultPrompt, setUserPrompt, defaultSpeed);
        if (cancelledRef.current) break;

        await sleep(900);

        setStatus("improving");
        const improved = makeImproved(defaultPrompt);
        setImprovedPrompt("");
        await typeTextAsync(improved, setImprovedPrompt, improvedSpeed);
        if (cancelledRef.current) break;

        setStatus("done");
        await sleep(3000);

        setUserPrompt("");
        setImprovedPrompt("");
        setStatus("idle");
        await sleep(800);
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
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-600">
            <HiOutlinePencilAlt className="w-4 h-4 text-yellow-500  animate-pulse" />
            Writing prompt…
          </div>
        );
      case "improving":
        return (
          <div className="flex items-center gap-1 font-semibold text-sm text-gray-600">
            <HiOutlineSparkles className="w-4 h-4 text-yellow-500 animate-spin" />
            Improving prompt…
          </div>
        );
      case "done":
        return (
          <div className="flex items-center gap-1 font-semibold text-sm text-gray-600">
            <HiCheckCircle className="w-4 h-4 text-yellow-500" />
            Improved
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section
      className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50"
      id="prompt-helper"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Section */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold mb-4">
              <span>Prompt Helper</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 text-gray-900">
              Stuck on what to write? We help you craft the prompt.
            </h2>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
              Our built-in Prompt Helper can rewrite your idea into a detailed,
              high-quality prompt and suggest fresh ideas you can add with a
              tap.
            </p>
            <ul className="space-y-2 text-gray-800 text-sm sm:text-base">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="mt-1 inline-block w-2 h-2 rounded-full bg-yellow-400" />
                Improve prompt into vivid, production-ready wording
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="mt-1 inline-block w-2 h-2 rounded-full bg-yellow-400" />
                Get 8 short ideas tailored to your topic
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="mt-1 inline-block w-2 h-2 rounded-full bg-yellow-400" />
                One-click chips to insert ideas into your prompt
              </li>
            </ul>
          </div>

          {/* Right Section */}
          <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="text-left">
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
                Describe your image
              </label>
              <textarea
                value={improvedPrompt || userPrompt}
                readOnly
                placeholder="e.g., Cozy cabin by a lake at golden hour"
                className="w-full rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 text-gray-700 text-sm sm:text-base min-h-[100px] sm:min-h-[120px] resize-none outline-none border-yellow-500 transition-all whitespace-pre-wrap"
              />
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto sm:overflow-visible">
              {chips.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(c)}
                  className="cursor-pointer rounded-full border border-gray-300 px-3 py-1 text-xs sm:text-sm bg-gray-50 hover:bg-yellow-100 transition"
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
                className="inline-flex items-center rounded-lg sm:rounded-xl border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm opacity-50 cursor-not-allowed"
              >
                Improve prompt
              </button>
              <button
                disabled
                className="inline-flex items-center rounded-lg sm:rounded-xl border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm opacity-50 cursor-not-allowed"
              >
                Suggest ideas
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
