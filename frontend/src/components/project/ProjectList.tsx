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
      <div className="flex flex-col items-center justify-center py-16">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading projects...</p>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
        }
        title={emptyMessage}
        description={isRequester ? "Create your first project to get started with collecting ratings" : "You'll see projects here once you're assigned to rate them"}
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
