import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Badge, ProgressBar } from '@/components/common';
import { ProjectListItem } from '@/types';

interface ProjectCardProps {
  project: ProjectListItem;
  isRequester?: boolean;
}

export function ProjectCard({ project, isRequester = false }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isRequester) {
      navigate(`/requester/projects/${project.id}`);
    } else {
      navigate(`/projects/${project.id}/rate`);
    }
  };

  const progress = project.total_rows > 0 ? (project.rated_rows / project.total_rows) * 100 : 0;
  const isComplete = progress >= 100;

  return (
    <Card hoverable onClick={handleClick} className="group">
      <CardBody className="p-5">
        {/* Header with icon and badge */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${isComplete
              ? 'bg-success-100'
              : 'bg-gradient-to-br from-primary-100 to-accent-100'
            }
            group-hover:scale-105 transition-transform duration-300
          `}>
            {isComplete ? (
              <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span>{project.session_count} dataset{project.session_count !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span>{project.total_rows} item{project.total_rows !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Progress bar */}
        {project.total_rows > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <ProgressBar
              value={project.rated_rows}
              max={project.total_rows}
              size="sm"
              color={isComplete ? 'success' : 'gradient'}
              showPercentage={true}
            />
          </div>
        )}

        {/* Empty state for new projects */}
        {project.total_rows === 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Badge variant="warning" dot size="sm">No data yet</Badge>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
