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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">Create and manage your rating projects</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        isRequester={true}
        emptyMessage="No projects yet"
        emptyAction={
          <Button onClick={() => setIsCreateModalOpen(true)}>Create your first project</Button>
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
