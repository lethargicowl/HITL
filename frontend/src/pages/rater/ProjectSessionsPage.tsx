import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useProjectSessions } from '@/hooks';
import { Button, SkeletonDashboardHeader, SkeletonSessionCard } from '@/components/common';
import { SessionList } from '@/components/project';

export function ProjectSessionsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: sessions, isLoading: sessionsLoading } = useProjectSessions(projectId!);

  if (projectLoading) {
    return (
      <div className="space-y-8">
        <SkeletonDashboardHeader />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonSessionCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
        <p className="text-gray-500 mt-1 mb-6">This project may have been deleted or you don't have access.</p>
        <Button variant="gradient" onClick={() => navigate('/rater/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const totalProgress = project.total_rows > 0
    ? Math.round((project.rated_rows / project.total_rows) * 100)
    : 0;
  const isComplete = totalProgress >= 100;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/rater/dashboard')}
        className="text-gray-500 hover:text-primary-600 inline-flex items-center group transition-colors"
      >
        <svg className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>

      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                ${isComplete ? 'bg-success-500/20' : 'bg-white/10'}
                backdrop-blur-sm
              `}>
                {isComplete ? (
                  <svg className="w-7 h-7 text-success-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-primary-100 mt-1 max-w-xl">{project.description}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold">{totalProgress}%</div>
              <div className="text-primary-200 text-sm">
                {project.rated_rows} / {project.total_rows} items rated
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-success-400' : 'bg-white'
                }`}
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">{sessions?.length || 0}</div>
              <div className="text-primary-200 text-sm">Datasets</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">{project.rated_rows}</div>
              <div className="text-primary-200 text-sm">Completed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">{project.total_rows - project.rated_rows}</div>
              <div className="text-primary-200 text-sm">Remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {project.instructions && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-primary-50/50 border-b border-primary-100/50">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Instructions</h3>
          </div>
          <div className="p-5">
            <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{project.instructions}</p>
          </div>
        </div>
      )}

      {/* Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datasets to Rate</h2>

        {sessionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonSessionCard key={i} />
            ))}
          </div>
        ) : (
          <SessionList sessions={sessions || []} isRequester={false} />
        )}
      </div>
    </div>
  );
}
