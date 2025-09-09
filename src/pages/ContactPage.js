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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Contact us
          </h1>
          <p className="text-xl text-white/80 leading-relaxed">
            We would love to hear from you. Send us a message and we’ll respond
            shortly.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 sm:p-10 space-y-6"
        >
          <input
            type="text"
            name="_gotcha"
            className="hidden"
            aria-hidden="true"
          />

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-yellow-400 transition"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-yellow-400 transition"
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Message
            </label>
            <textarea
              name="message"
              required
              rows={6}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-yellow-400 transition resize-y"
              placeholder="Tell us a bit about what you need..."
            />
          </div>

          {status === "success" ? (
            <div className="rounded-xl border border-green-400/30 bg-green-400/10 text-green-200 px-4 py-3">
              Thanks! Your message has been sent.
            </div>
          ) : null}
          {status === "error" ? (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 text-red-200 px-4 py-3">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center rounded-2xl bg-yellow-400 text-black font-bold px-8 py-4 text-lg hover:bg-yellow-300 transition disabled:opacity-60"
            >
              {status === "submitting" ? "Sending..." : "Send message"}
            </button>
          </div>

          <p className="text-center text-white/50 text-sm">
            Set your form ID via REACT_APP_FORMSPREE_ID or replace "yourid" in
            the code.
          </p>
        </form>
      </div>
    </div>
  );
}
