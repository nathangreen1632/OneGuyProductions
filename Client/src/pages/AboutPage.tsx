import React from "react";
import AboutSectionView from '../jsx/aboutSectionView';

export default function AboutPage(): React.ReactElement {
  return (
    <main className="bg-[var(--theme-bg)] min-h-screen text-[var(--theme-text)]">
      <AboutSectionView />
    </main>
  );
}
