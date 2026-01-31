import { useProjects } from '@/hooks';
import { ProjectList } from '@/components/project';

export function RaterDashboardPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Projects</h1>
        <p className="text-gray-600 mt-1">Projects you've been assigned to rate</p>
      </div>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        isRequester={false}
        emptyMessage="No projects assigned yet"
      />
    </div>
  );
}
