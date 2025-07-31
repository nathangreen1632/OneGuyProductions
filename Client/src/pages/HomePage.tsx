import React from 'react';
import HeroSection from '../components/HeroSection';
import Philosophy from '../components/Philosophy.tsx';

export default function HomePage(): React.ReactElement {
  return (
    <div className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen flex flex-col">
      <main className="flex-grow">
        <Philosophy />
        <HeroSection />
      </main>
    </div>
  );
}
