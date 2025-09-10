import React from "react";

export default function PromptHelper() {
  const chips = [
    "Cinematic lighting",
    "Macro dew drop",
    "Isometric city",
    "Studio portrait",
    "Watercolor style",
    "Neon cyberpunk",
  ];
  return (
    <section
      className="py-16 sm:py-20 lg:py-24 xl:py-32 bg-gradient-to-b from-white to-gray-50"
      id="prompt-helper"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4">
              <span>Prompt Helper</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Stuck on what to write? We help you craft the prompt.
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-6">
              Our built‑in Prompt Helper can rewrite your idea into a detailed,
              high‑quality prompt and suggest fresh ideas you can add with a
              tap.
            </p>
            <ul className="space-y-2 text-gray-800">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-2 h-2 rounded-full bg-yellow-400" />
                Improve prompt into vivid, production‑ready wording
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-2 h-2 rounded-full bg-yellow-400" />
                Get 8 short ideas tailored to your topic
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-2 h-2 rounded-full bg-yellow-400" />
                One‑click chips to insert ideas into your prompt
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="text-left">
              <label className="block text-gray-900 font-semibold mb-2">
                Describe your image
              </label>
              <div className="rounded-2xl border border-gray-300 bg-white p-4 text-gray-500">
                e.g., Cozy cabin by a lake at golden hour
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full border border-gray-300 px-3 py-1.5 text-sm bg-gray-50"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 font-semibold text-sm hover:bg-gray-50">
                Improve prompt
              </button>
              <button className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 font-semibold text-sm hover:bg-gray-50">
                Suggest ideas
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
