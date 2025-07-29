import ProjectCardWithIframe from './ProjectCardWithIframe';
import type { Project } from '../types/project';

const projects: Project[] = [
  {
    name: 'LeaseClarityPRO',
    description: 'AI-powered lease analyzer that flags legal concerns and summarizes your lease.',
    url: 'https://www.leaseclaritypro.com',
  },
  {
    name: 'CVitaePRO',
    description: 'ATS-optimized resume and cover letter builder with smart markdown and PDF export.',
    url: 'https://www.cvitaepro.com',
  },
  {
    name: 'CareerGistPRO',
    description: 'Job search engine with AI summaries, analytics, favorites, and social sharing.',
    url: 'https://www.careergistpro.com',
  },
  {
    name: 'PyDataPRO',
    description: 'Career analytics engine with resume-based suggestions and learning resources.',
    url: 'https://www.pydatapro.com',
  },
];

export default function ProjectGrid() {
  return (
    <section className="py-28 px-6 sm:px-10 max-w-[90rem] mx-auto">
      <h2 className="text-5xl font-extrabold text-center text-[var(--theme-accent)] mb-16 tracking-tight">
        Live Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        {projects.map((project) => (
          <ProjectCardWithIframe key={project.name} project={project} />
        ))}
      </div>
    </section>
  );
}
