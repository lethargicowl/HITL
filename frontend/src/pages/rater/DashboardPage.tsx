import { useProjects } from '@/hooks';
import { ProjectList } from '@/components/project';

export function RaterDashboardPage() {
  const { data: projects, isLoading } = useProjects();

  const totalProjects = projects?.length || 0;
  const totalItems = projects?.reduce((sum, p) => sum + p.total_rows, 0) || 0;
  const totalRated = projects?.reduce((sum, p) => sum + p.rated_rows, 0) || 0;
  const pendingItems = totalItems - totalRated;

  return (
    <div className="space-y-8">
      {/* Header with stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500 via-accent-600 to-primary-700 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Assigned Projects</h1>
              <p className="text-accent-100 mt-0.5">Projects you've been assigned to rate</p>
            </div>
          </div>

          {/* Stats */}
          {totalProjects > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{totalProjects}</div>
                <div className="text-accent-100 text-sm">Projects</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{totalItems}</div>
                <div className="text-accent-100 text-sm">Total Items</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{totalRated}</div>
                <div className="text-accent-100 text-sm">Completed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{pendingItems}</div>
                <div className="text-accent-100 text-sm">Remaining</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project list */}
      <ProjectList
        projects={projects}
        isLoading={isLoading}
        isRequester={false}
        emptyMessage="No projects assigned yet"
      />
    </div>
  );
}
