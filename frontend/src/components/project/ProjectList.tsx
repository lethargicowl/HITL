import React from 'react';
import { ProjectCard } from './ProjectCard';
import { EmptyState, Spinner } from '@/components/common';
import { ProjectListItem } from '@/types';

interface ProjectListProps {
  projects: ProjectListItem[] | undefined;
  isLoading: boolean;
  isRequester?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

export function ProjectList({
  projects,
  isLoading,
  isRequester = false,
  emptyMessage = 'No projects found',
  emptyAction,
}: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        title={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} isRequester={isRequester} />
      ))}
    </div>
  );
}
