import React from "react";

export default function HeroSection(): React.ReactElement {
  return (
    <section className="text-center py-8 px-4 bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--theme-accent)]">
        One Guy. Infinite Possibilities.
      </h2>
      <p className="text-lg mb-8 text-[var(--theme-text)]/80">
        Custom Websites. Bold Design. Built Fast.
      </p>
      <div className="flex justify-center gap-4 flex-wrap">
        <a
          href="/contact"
          className="inline-block px-6 py-3 bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] rounded transition focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]"
        >
          Contact Me
        </a>
        <a
          href="/order"
          className="inline-block px-6 py-3 bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] rounded transition focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]"
        >
          Get Started
        </a>
      </div>
    </section>
  );
}
