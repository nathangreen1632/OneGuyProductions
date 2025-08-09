import React from 'react';
import type { Project } from '../types/project.types';

interface ProjectCardWithIframeViewProps {
  project: Project;
}

export default function ProjectCardWithIframeView({ project }: Readonly<ProjectCardWithIframeViewProps>): React.ReactElement {
  return (
    <div className="rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] flex flex-col">
      <div className="w-full aspect-[1/1] rounded-2xl overflow-hidden">
        <iframe
          src={project.url}
          title={project.name}
          className="w-full h-full"
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
      <div className="p-4 flex flex-col justify-between flex-grow">
        <h4 className="text-lg font-bold text-[var(--theme-accent)] mb-1">
          {project.name}
        </h4>
        <p className="text-sm text-[var(--theme-text)]/80 mb-3">
          {project.description}
        </p>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit mx-auto text-sm px-3 py-1 bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] rounded-lg text-center transition-colors duration-150"
        >
          Demo Live
        </a>
      </div>
    </div>
  );
}
