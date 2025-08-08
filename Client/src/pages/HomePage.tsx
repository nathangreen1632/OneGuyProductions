import React from 'react';
import HeroSectionView from '../jsx/heroSectionView.tsx';
import PhilosophyView from '../jsx/philosophyView.tsx';

export default function HomePage(): React.ReactElement {
  return (
    <main className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen flex flex-col">
      <div className="flex-grow">
        <HeroSectionView />
        <PhilosophyView />
      </div>
    </main>
  );
}
