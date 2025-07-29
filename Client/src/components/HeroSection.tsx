export default function HeroSection() {
  return (
    <section className="text-center py-8 px-4">
      <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--theme-accent)]">
        One Guy. Infinite Possibilities.
      </h2>
      <p className="text-lg text-[var(--theme-text)] mb-8">
        Custom Websites. Bold Design. Built Fast.
      </p>
      <a
        href="/order"
        className="inline-block px-6 py-3 bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-black hover:text-white rounded transition focus:ring-2 focus:ring-[var(--theme-focus)]"
      >
        Get Started →
      </a>
    </section>
  );
}
