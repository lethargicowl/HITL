import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useSessionRows, useCreateRating, useExamples } from '@/hooks';
import { useToast } from '@/contexts/ToastContext';
import { useNavigationShortcuts, useSaveShortcut } from '@/hooks/useKeyboardShortcuts';
import {
  Button,
  Card,
  CardBody,
  Spinner,
  ProgressBar,
  Tabs,
  Badge,
  Textarea,
  Modal,
} from '@/components/common';
import { RowContent } from '@/components/media';
import { EvaluationForm, MultiQuestionForm } from '@/components/evaluation';
import { ExamplesPanel } from '@/components/examples';
import { getErrorMessage } from '@/api';
import {
  FilterType,
  EvaluationResponse,
  MultiQuestionResponse,
  EvaluationType,
  EvaluationConfig,
} from '@/types';

export function RatingPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<EvaluationResponse | MultiQuestionResponse | null>(null);
  const [comment, setComment] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const perPage = 10;

  const { data: session, isLoading: sessionLoading } = useSession(sessionId!);
  const { data: rowsData, isLoading: rowsLoading, refetch: refetchRows } = useSessionRows(
    sessionId!,
    page,
    perPage,
    filter
  );
  const createRating = useCreateRating(sessionId!);

  const projectId = session?.project?.id;
  const { data: examples } = useExamples(projectId || '');

  const currentRow = rowsData?.items?.[currentIndex];
  const totalInView = rowsData?.total ?? 0;
  const ratedCount = rowsData?.rated_count ?? 0;

  // Determine evaluation mode
  const useMultiQuestions = session?.project?.use_multi_questions ?? false;
  const evaluationType = (session?.project?.evaluation_type ?? 'rating') as EvaluationType;
  const evaluationConfig = (session?.project?.evaluation_config ?? { min: 1, max: 5 }) as EvaluationConfig;
  // Map the session questions to include required fields for EvaluationQuestion
  const questions = (session?.project?.questions ?? []).map((q) => ({
    ...q,
    question_type: q.question_type as EvaluationType,
    config: q.config as EvaluationConfig,
    conditional: q.conditional as { question: string; equals: string | number | boolean } | undefined,
    project_id: session?.project_id ?? '',
    created_at: '',
  }));

  // Load existing rating when row changes
  useEffect(() => {
    if (currentRow?.my_rating) {
      setResponse(currentRow.my_rating.response as EvaluationResponse | MultiQuestionResponse | null);
      setComment(currentRow.my_rating.comment || '');
      setHasUnsavedChanges(false);
    } else {
      setResponse(null);
      setComment('');
      setHasUnsavedChanges(false);
    }
    startTimeRef.current = Date.now();
  }, [currentRow?.id]);

  const handleResponseChange = (newResponse: EvaluationResponse | MultiQuestionResponse) => {
    setResponse(newResponse);
    setHasUnsavedChanges(true);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    setHasUnsavedChanges(true);
  };

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (page > 1) {
      setPage(page - 1);
      setCurrentIndex(perPage - 1);
    }
  }, [currentIndex, page]);

  const goToNext = useCallback(() => {
    if (rowsData && currentIndex < rowsData.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (rowsData && page < rowsData.total_pages) {
      setPage(page + 1);
      setCurrentIndex(0);
    }
  }, [currentIndex, rowsData, page]);

  const saveRating = useCallback(async (moveNext: boolean = false) => {
    if (!currentRow || !response) return;

    const timeSpent = Date.now() - startTimeRef.current;

    try {
      await createRating.mutateAsync({
        data_row_id: currentRow.id,
        session_id: sessionId!,
        response,
        comment: comment || undefined,
        time_spent_ms: timeSpent,
      });

      setHasUnsavedChanges(false);
      addToast('Rating saved', 'success');

      // Check if all items are now rated
      const newRatedCount = currentRow.my_rating ? ratedCount : ratedCount + 1;
      if (session && newRatedCount >= session.row_count) {
        setShowCompletionModal(true);
      } else if (moveNext) {
        goToNext();
      } else {
        refetchRows();
      }
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  }, [currentRow, response, comment, sessionId, createRating, addToast, refetchRows, ratedCount, session, goToNext]);

  const handleSkip = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowSkipConfirm(true);
    } else {
      goToNext();
    }
  }, [hasUnsavedChanges, goToNext]);

  const confirmSkip = useCallback(() => {
    setShowSkipConfirm(false);
    setResponse(null);
    setComment('');
    setHasUnsavedChanges(false);
    goToNext();
  }, [goToNext]);

  // Keyboard shortcuts
  useNavigationShortcuts(goToPrevious, goToNext, !hasUnsavedChanges);
  useSaveShortcut(() => saveRating(true), hasUnsavedChanges);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1);
    setCurrentIndex(0);
  }, [filter]);

  if (sessionLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Session not found</h2>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/rater/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const globalIndex = (page - 1) * perPage + currentIndex + 1;
  const progress = session.row_count > 0 ? (ratedCount / session.row_count) * 100 : 0;

  const filterTabs = [
    { id: 'all' as FilterType, label: 'All', count: session.row_count },
    { id: 'unrated' as FilterType, label: 'Unrated', count: session.row_count - ratedCount },
    { id: 'rated' as FilterType, label: 'Rated', count: ratedCount },
  ];

  return (
    <div className={`transition-all duration-300 ${isExamplesOpen ? 'mr-96' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/projects/${session.project_id}/rate`)}
          className="text-gray-500 hover:text-primary-600 mb-4 inline-flex items-center group transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{session.name}</h1>
              <p className="text-sm text-gray-500">{session.project.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-gray-500">{ratedCount} / {session.row_count} rated</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExamplesOpen(!isExamplesOpen)}
              className="hidden sm:flex"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Examples
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={ratedCount}
            max={session.row_count}
            showPercentage={false}
            color={progress === 100 ? 'success' : 'gradient'}
            size="sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={filterTabs}
          activeTab={filter}
          onChange={(id) => setFilter(id as FilterType)}
        />
      </div>

      {/* Instructions Panel */}
      {session.project.instructions && (
        <Card className="mb-6 overflow-hidden">
          <CardBody className="p-0">
            <button
              onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Rating Instructions</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isInstructionsOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isInstructionsOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="pt-4 prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {session.project.instructions}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Main Content */}
      {rowsLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !currentRow ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items to show</h3>
            <p className="text-gray-500">
              {filter === 'unrated' ? 'All items have been rated!' : 'No items match the current filter.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Card */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Item Content</h3>
                <Badge>#{currentRow.row_index + 1}</Badge>
              </div>
              <RowContent content={currentRow.content} columns={session.columns} />

              {/* Other Raters */}
              {currentRow.ratings.filter((r) => r.id !== currentRow.my_rating?.id).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Other Ratings</h4>
                  <div className="space-y-3">
                    {currentRow.ratings
                      .filter((r) => r.id !== currentRow.my_rating?.id)
                      .map((rating) => (
                        <div key={rating.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{rating.rater_username}</span>
                            <span className="text-sm text-gray-600">
                              {formatRatingResponse(rating.response)}
                            </span>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              "{rating.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Rating Card */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Your Rating</h3>
                {hasUnsavedChanges && (
                  <Badge variant="warning">Unsaved changes</Badge>
                )}
              </div>

              <div className="space-y-6">
                {useMultiQuestions ? (
                  <MultiQuestionForm
                    questions={questions}
                    value={response as MultiQuestionResponse | null}
                    onChange={handleResponseChange}
                  />
                ) : (
                  <EvaluationForm
                    evaluationType={evaluationType}
                    config={evaluationConfig}
                    value={response as EvaluationResponse | null}
                    onChange={handleResponseChange}
                  />
                )}

                <Textarea
                  label="Comment (optional)"
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="Add any notes or comments..."
                  rows={3}
                />

                {/* Navigation and Save */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={goToPrevious}
                      disabled={page === 1 && currentIndex === 0}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500 px-2">
                      {globalIndex} of {totalInView}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={goToNext}
                      disabled={!rowsData || (page === rowsData.total_pages && currentIndex === rowsData.items.length - 1)}
                    >
                      Next
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={handleSkip}
                      disabled={!rowsData || (page === rowsData.total_pages && currentIndex === rowsData.items.length - 1)}
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={() => saveRating(true)}
                      disabled={!response}
                      isLoading={createRating.isPending}
                    >
                      Save & Next
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Keyboard: Arrow keys to navigate, Ctrl+Enter to save
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Examples Panel */}
      <ExamplesPanel
        examples={examples || []}
        isOpen={isExamplesOpen}
        onToggle={() => setIsExamplesOpen(!isExamplesOpen)}
      />

      {/* Skip Confirmation Modal */}
      <Modal
        isOpen={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        title="Skip Item?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You have unsaved changes. Are you sure you want to skip this item without saving?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSkipConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmSkip}>
              Skip Without Saving
            </Button>
          </div>
        </div>
      </Modal>

      {/* Completion Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="All Done!"
      >
        <div className="space-y-6 text-center py-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-success-500/20 rounded-full blur-xl" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Congratulations!
            </h3>
            <p className="text-gray-500 mt-2">
              You have rated all <span className="font-semibold text-gray-700">{session?.row_count}</span> items in this session.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCompletionModal(false)}>
              Review Ratings
            </Button>
            <Button variant="gradient" onClick={() => navigate(`/projects/${session?.project_id}/rate`)}>
              Back to Sessions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function formatRatingResponse(response: unknown): string {
  if (!response) return 'No response';

  if (typeof response === 'object') {
    if ('value' in response) {
      return String((response as { value: unknown }).value);
    }
    if ('selected' in response) {
      return (response as { selected: string[] }).selected.join(', ');
    }
    if ('winner' in response) {
      return `Winner: ${(response as { winner: string }).winner}`;
    }
    if ('text' in response) {
      const text = (response as { text: string }).text;
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
  }

  return JSON.stringify(response);
}
