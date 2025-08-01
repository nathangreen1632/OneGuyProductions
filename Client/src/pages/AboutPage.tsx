import React from "react";
import AboutSection from '../components/AboutSection';

export default function AboutPage(): React.ReactElement {
  return (
    <div className="bg-[var(--theme-bg)] min-h-screen text-[var(--theme-text)]">
      <AboutSection />
    </div>
  );
}
