import HeroSection from '../components/HeroSection';
import ProjectsPreview from '../components/ProjectsPreview';

export default function HomePage() {
  return (
    <div className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen flex flex-col">
      <main className="flex-grow">
        <ProjectsPreview />
        <HeroSection />
      </main>
    </div>
  );
}
