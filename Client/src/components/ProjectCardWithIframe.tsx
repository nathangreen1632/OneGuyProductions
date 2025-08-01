import React from "react";
import type { Project } from '../types/project';

interface Props {
  project: Project;
}

export default function ProjectCardWithIframe({ project }: Readonly<Props>): React.ReactElement {
  return (
    <div className="rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] flex flex-col">
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
        <h4 className="text-lg font-bold text-[var(--theme-border-red)] mb-1">
          {project.name}
        </h4>
        <p className="text-sm text-[var(--theme-text)] mb-3">{project.description}</p>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit mx-auto text-sm px-3 py-1 bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-black hover:text-white rounded-lg text-center"
        >
          Demo Live
        </a>
      </div>
    </div>
  );
}
