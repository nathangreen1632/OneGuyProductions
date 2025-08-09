import React from 'react';
import type { Project } from '../types/project.types';
import ProjectCardWithIframeView from '../jsx/projectCardWithIframeView';

interface Props {
  project: Project;
}

export default function ProjectCardWithIframe({ project }: Readonly<Props>): React.ReactElement {
  return <ProjectCardWithIframeView project={project} />;
}
