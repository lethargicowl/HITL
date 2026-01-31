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

  const evaluationTypeLabel = {
    rating: 'Star Rating',
    binary: 'Binary Choice',
    multi_label: 'Multi-Label',
    multi_criteria: 'Multi-Criteria',
    pairwise: 'Pairwise',
    text: 'Text',
  }[project.evaluation_type] || project.evaluation_type;

  return (
    <Card hoverable onClick={handleClick}>
      <CardBody>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{project.name}</h3>
          <Badge variant={project.use_multi_questions ? 'primary' : 'default'}>
            {project.use_multi_questions ? 'Multi-Q' : evaluationTypeLabel}
          </Badge>
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}

        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{project.session_count} dataset(s)</span>
            <span>{project.total_rows} items</span>
          </div>

          {project.total_rows > 0 && (
            <ProgressBar
              value={project.rated_rows}
              max={project.total_rows}
              size="sm"
              color={progress === 100 ? 'success' : 'primary'}
            />
          )}
        </div>
      </CardBody>
    </Card>
  );
}
