export default function ProjectsPreview() {
  return (
    <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto text-center">
      <h3 className="text-2xl sm:text-3xl font-semibold mb-6 text-[var(--theme-accent)]">
        The One Guy Philosophy
      </h3>
      <div className="rounded-lg overflow-hidden shadow-[0_4px_14px_0_var(--theme-shadow)] border border-[var(--theme-border-red)]">
        <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[650px] 2xl:h-[700px]">
          <img
            src="/images/brand-story.png"
            alt="One Guy Productions - Story"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 sm:p-6 bg-[var(--theme-base)] text-left sm:text-center">
          <p className="text-[var(--theme-text)] text-base sm:text-lg mb-2">
            One Guy Productions is built on one idea: that a single person, with the right tools and relentless drive, can build software that competes with entire teams.
          </p>
          <p className="text-[var(--theme-text)] text-sm sm:text-base">
            Every line of code, every layout, every pixel — crafted with care and clarity.
          </p>
        </div>
      </div>
    </section>
  );
}
