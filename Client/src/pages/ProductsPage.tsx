import React from 'react';
import ProjectGrid from '../components/ProjectGrid';

export default function ProductsPage(): React.ReactElement {
  return (
    <div className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
      <ProjectGrid />
    </div>
  );
}
