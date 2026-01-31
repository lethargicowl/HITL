import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useProjectSessions } from '@/hooks';
import { Button, Spinner, Badge, ProgressBar } from '@/components/common';
import { SessionList } from '@/components/project';

export function ProjectSessionsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: sessions, isLoading: sessionsLoading } = useProjectSessions(projectId!);

  if (projectLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/rater/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const totalProgress = project.total_rows > 0
    ? Math.round((project.rated_rows / project.total_rows) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/rater/dashboard')}
          className="text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant={project.use_multi_questions ? 'primary' : 'default'}>
                {project.use_multi_questions ? 'Multi-Question' : project.evaluation_type}
              </Badge>
            </div>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{totalProgress}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={project.rated_rows}
            max={project.total_rows}
            color={totalProgress === 100 ? 'success' : 'primary'}
          />
        </div>
      </div>

      {/* Instructions */}
      {project.instructions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
          <p className="text-blue-800 text-sm whitespace-pre-wrap">{project.instructions}</p>
        </div>
      )}

      {/* Sessions */}
      <h2 className="text-lg font-semibold mb-4">Datasets to Rate</h2>

      {sessionsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <SessionList sessions={sessions || []} isRequester={false} />
      )}
    </div>
  );
}
