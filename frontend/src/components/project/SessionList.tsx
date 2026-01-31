import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Badge, ProgressBar, EmptyState } from '@/components/common';
import { SessionListItem } from '@/types';

interface SessionListProps {
  sessions: SessionListItem[];
  isRequester?: boolean;
  onDelete?: (sessionId: string) => void;
  onExport?: (sessionId: string, format: 'xlsx' | 'csv') => void;
  onPreview?: (sessionId: string) => void;
}

export function SessionList({ sessions, isRequester = false, onDelete, onExport, onPreview }: SessionListProps) {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        title="No datasets uploaded"
        description={isRequester ? 'Upload a CSV or Excel file to get started.' : undefined}
      />
    );
  }

  const handleRate = (sessionId: string) => {
    navigate(`/sessions/${sessionId}/rate`);
  };

  const handleDelete = (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      onDelete?.(sessionId);
    }
  };

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const progress = session.row_count > 0 ? (session.rated_count / session.row_count) * 100 : 0;
        const isComplete = progress === 100;

        return (
          <Card key={session.id}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900 truncate">{session.name}</h4>
                    {isComplete && <Badge variant="success">Complete</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {session.filename} &middot; {session.row_count} items
                  </p>
                  <div className="mt-2 max-w-md">
                    <ProgressBar
                      value={session.rated_count}
                      max={session.row_count}
                      size="sm"
                      color={isComplete ? 'success' : 'primary'}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!isRequester && (
                    <Button size="sm" onClick={() => handleRate(session.id)}>
                      {session.rated_count > 0 ? 'Continue' : 'Start Rating'}
                    </Button>
                  )}

                  {isRequester && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPreview?.(session.id)}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onExport?.(session.id, 'xlsx')}
                      >
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(session.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
