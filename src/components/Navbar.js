import { HiOutlineBanana } from "react-icons/hi2";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur bg-black/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a
          href="/"
          className="text-xl font-bold tracking-tight flex items-center"
        >
          <div className="text-xl mb-4">🍌</div>
          NANO BANANA
        </a>
        <div className="hidden sm:flex items-center gap-4">
          <a href="#gallery" className="text-sm text-white/80 hover:text-white">
            Gallery
          </a>
          <a href="/pricing" className="text-sm text-white/80 hover:text-white">
            Pricing
          </a>
          <a
            href="/text-to-image"
            className="inline-flex items-center rounded-md bg-yellow-400 text-black font-medium px-3 py-2 hover:bg-yellow-300 transition"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}
