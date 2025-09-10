import React from "react";

export default function ContactPage() {
  const [status, setStatus] = React.useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = React.useState("");

  const ENDPOINT = `https://formspree.io/f/xdklbaoo`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setErrorMessage(
          json?.errors?.[0]?.message ||
            "Something went wrong. Please try again."
        );
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err?.message || "Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-gray-900">
            Contact us
          </h1>
          <p className="text-base sm:text-xl text-gray-700 leading-relaxed">
            We would love to hear from you. Send us a message and we’ll respond
            shortly.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 space-y-6"
        >
          <input
            type="text"
            name="_gotcha"
            className="hidden"
            aria-hidden="true"
          />

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-lg sm:rounded-xl bg-white border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-yellow-400 transition"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg sm:rounded-xl bg-white border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-yellow-400 transition"
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              name="message"
              required
              rows={5}
              className="w-full rounded-lg sm:rounded-xl bg-white border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-yellow-400 transition resize-y"
              placeholder="Tell us a bit about what you need..."
            />
          </div>

          {status === "success" ? (
            <div className="rounded-lg sm:rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm sm:text-base">
              Thanks! Your message has been sent.
            </div>
          ) : null}
          {status === "error" ? (
            <div className="rounded-lg sm:rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm sm:text-base">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center rounded-lg sm:rounded-2xl bg-yellow-400 text-black font-bold px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg hover:bg-yellow-300 transition disabled:opacity-60"
            >
              {status === "submitting" ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
