import React from "react";

export default function Philosophy(): React.ReactElement {
  return (
    <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto text-center">
      <div className="rounded-3xl overflow-hidden shadow-[0_4px_14px_0_var(--theme-shadow)] bg-[var(--theme-base)]">
        <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[650px] 2xl:h-[700px] rounded-2xl overflow-hidden">
          <img
            src="/images/brand-banner.webp"
            alt="One Guy Productions - Story"
            className="w-full h-full object-center overflow-hidden rounded-3xl"
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
