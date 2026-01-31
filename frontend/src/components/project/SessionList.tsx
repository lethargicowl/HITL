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
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        }
        title="No datasets uploaded"
        description={isRequester ? 'Upload a CSV or Excel file to get started.' : 'Datasets will appear here once uploaded.'}
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
    <div className="space-y-3">
      {sessions.map((session) => {
        const progress = session.row_count > 0 ? (session.rated_count / session.row_count) * 100 : 0;
        const isComplete = progress === 100;

        return (
          <Card key={session.id} className="group hover:shadow-soft-lg transition-shadow duration-300">
            <CardBody className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`
                    w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isComplete
                      ? 'bg-success-100'
                      : 'bg-gray-100 group-hover:bg-primary-100'
                    }
                    transition-colors duration-300
                  `}>
                    {isComplete ? (
                      <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900 truncate">{session.name}</h4>
                      {isComplete && <Badge variant="success" dot size="sm">Complete</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {session.filename} · {session.row_count} items
                    </p>
                    <div className="mt-3 max-w-sm">
                      <ProgressBar
                        value={session.rated_count}
                        max={session.row_count}
                        size="sm"
                        color={isComplete ? 'success' : 'gradient'}
                        showPercentage={false}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {session.rated_count} / {session.row_count} rated ({Math.round(progress)}%)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isRequester && (
                    <Button
                      size="sm"
                      variant={session.rated_count > 0 ? 'primary' : 'gradient'}
                      onClick={() => handleRate(session.id)}
                    >
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
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onExport?.(session.id, 'xlsx')}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(session.id)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
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
