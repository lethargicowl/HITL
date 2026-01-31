import { useState } from 'react';
import { useProjects, useCreateProject } from '@/hooks';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/common';
import { ProjectList, CreateProjectModal } from '@/components/project';
import { getErrorMessage } from '@/api';
import { ProjectCreate } from '@/types';

export function RequesterDashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const { addToast } = useToast();

  const handleCreateProject = async (data: ProjectCreate) => {
    try {
      await createProject.mutateAsync(data);
      addToast('Project created successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const totalProjects = projects?.length || 0;
  const totalItems = projects?.reduce((sum, p) => sum + p.total_rows, 0) || 0;
  const totalRated = projects?.reduce((sum, p) => sum + p.rated_rows, 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header with stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Projects</h1>
              <p className="text-primary-100 mt-1">Create and manage your rating projects</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Button>
          </div>

          {/* Stats */}
          {totalProjects > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{totalProjects}</div>
                <div className="text-primary-200 text-sm">Projects</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{totalItems}</div>
                <div className="text-primary-200 text-sm">Total Items</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">
                  {totalItems > 0 ? Math.round((totalRated / totalItems) * 100) : 0}%
                </div>
                <div className="text-primary-200 text-sm">Completed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project list */}
      <ProjectList
        projects={projects}
        isLoading={isLoading}
        isRequester={true}
        emptyMessage="No projects yet"
        emptyAction={
          <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create your first project
          </Button>
        }
      />

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
