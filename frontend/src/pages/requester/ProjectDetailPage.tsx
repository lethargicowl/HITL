import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useProjectSessions,
  useDeleteSession,
  useUploadFile,
  useRaters,
  useAssignRaters,
  useRemoveRater,
  useExportSession,
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useReorderQuestions,
  useExamples,
  useCreateExample,
  useUpdateExample,
  useDeleteExample,
} from '@/hooks';
import { useToast } from '@/contexts/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Spinner,
  Badge,
  Input,
  Textarea,
} from '@/components/common';
import {
  SessionList,
  SessionPreview,
  FileUpload,
  RaterAssignment,
  QuestionList,
  ExampleList,
  EvaluationSettings,
} from '@/components/project';
import { getErrorMessage } from '@/api';
import {
  EvaluationQuestionCreate,
  EvaluationQuestionUpdate,
  AnnotationExampleCreate,
  AnnotationExampleUpdate,
  ProjectUpdate,
} from '@/types';

export function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('datasets');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRaterModalOpen, setIsRaterModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: sessions, isLoading: sessionsLoading } = useProjectSessions(projectId!);
  const { data: raters } = useRaters();
  const { data: questions } = useQuestions(projectId!);
  const { data: examples } = useExamples(projectId!);

  const updateProject = useUpdateProject(projectId!);
  const deleteProject = useDeleteProject();
  const deleteSession = useDeleteSession();
  const uploadFile = useUploadFile(projectId!);
  const assignRaters = useAssignRaters(projectId!);
  const removeRater = useRemoveRater(projectId!);
  const exportSession = useExportSession();

  // Question mutations
  const createQuestion = useCreateQuestion(projectId!);
  const updateQuestion = useUpdateQuestion(projectId!);
  const deleteQuestion = useDeleteQuestion(projectId!);
  const reorderQuestions = useReorderQuestions(projectId!);

  // Example mutations
  const createExample = useCreateExample(projectId!);
  const updateExample = useUpdateExample(projectId!);
  const deleteExample = useDeleteExample(projectId!);

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
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/requester/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const handleUpload = async (file: File, sessionName?: string) => {
    try {
      await uploadFile.mutateAsync({ file, sessionName });
      addToast('Dataset uploaded successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      addToast('Dataset deleted', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const handleExport = async (sessionId: string, format: 'xlsx' | 'csv') => {
    try {
      const blob = await exportSession.mutateAsync({ sessionId, format });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Export downloaded', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const handleAssignRaters = async (raterIds: string[]) => {
    try {
      await assignRaters.mutateAsync(raterIds);
      addToast('Raters assigned successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleRemoveRater = async (raterId: string) => {
    try {
      await removeRater.mutateAsync(raterId);
      addToast('Rater removed', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteProject.mutateAsync(projectId!);
      addToast('Project deleted', 'success');
      navigate('/requester/dashboard');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateProject.mutateAsync({
        name: editName,
        description: editDescription || undefined,
      });
      addToast('Project updated', 'success');
      setIsEditing(false);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const handleUpdateSettings = async (data: ProjectUpdate) => {
    try {
      await updateProject.mutateAsync(data);
      addToast('Settings updated', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  // Question handlers
  const handleAddQuestion = async (data: EvaluationQuestionCreate) => {
    try {
      await createQuestion.mutateAsync(data);
      addToast('Question added', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleUpdateQuestion = async (questionId: string, data: EvaluationQuestionUpdate) => {
    try {
      await updateQuestion.mutateAsync({ questionId, data });
      addToast('Question updated', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion.mutateAsync(questionId);
      addToast('Question deleted', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleReorderQuestions = async (questionIds: string[]) => {
    try {
      await reorderQuestions.mutateAsync(questionIds);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  // Example handlers
  const handleAddExample = async (data: AnnotationExampleCreate) => {
    try {
      await createExample.mutateAsync(data);
      addToast('Example added', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleUpdateExample = async (exampleId: string, data: AnnotationExampleUpdate) => {
    try {
      await updateExample.mutateAsync({ exampleId, data });
      addToast('Example updated', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleDeleteExample = async (exampleId: string) => {
    try {
      await deleteExample.mutateAsync(exampleId);
      addToast('Example deleted', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const startEditing = () => {
    setEditName(project.name);
    setEditDescription(project.description || '');
    setIsEditing(true);
  };

  const tabs = [
    { id: 'datasets', label: 'Datasets', count: sessions?.length || 0 },
    { id: 'evaluation', label: 'Evaluation' },
    { id: 'examples', label: 'Examples', count: examples?.length || 0 },
    { id: 'raters', label: 'Raters', count: project.assigned_raters?.length || 0 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/requester/dashboard')}
          className="text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>

        <div className="flex justify-between items-start">
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Project description"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} isLoading={updateProject.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <Badge variant={project.use_multi_questions ? 'primary' : 'default'}>
                    {project.use_multi_questions ? 'Multi-Question' : project.evaluation_type}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{project.total_rows} total items</span>
                  <span>{project.rated_rows} rated</span>
                  <span>{project.session_count} dataset(s)</span>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={startEditing}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteProject}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      {activeTab === 'datasets' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsUploadOpen(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Dataset
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <SessionList
              sessions={sessions || []}
              isRequester={true}
              onDelete={handleDeleteSession}
              onExport={handleExport}
              onPreview={(sessionId) => setPreviewSessionId(sessionId)}
            />
          )}
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Instructions for Raters</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(true)}>
                  Edit Instructions
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {project.instructions ? (
                <p className="text-gray-600 whitespace-pre-wrap">{project.instructions}</p>
              ) : (
                <p className="text-gray-400 italic">No instructions added yet. Click "Edit Instructions" to add guidelines for raters.</p>
              )}
            </CardBody>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Evaluation Questions</h3>
              <p className="text-sm text-gray-500 mt-1">
                Define what raters will answer for each item
              </p>
            </CardHeader>
            <CardBody>
              <QuestionList
                questions={questions || []}
                onAdd={handleAddQuestion}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                onReorder={handleReorderQuestions}
              />
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'examples' && (
        <Card>
          <CardBody>
            <ExampleList
              examples={examples || []}
              onAdd={handleAddExample}
              onUpdate={handleUpdateExample}
              onDelete={handleDeleteExample}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'raters' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Assigned Raters</h3>
              <Button size="sm" onClick={() => setIsRaterModalOpen(true)}>
                Manage Raters
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {project.assigned_raters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No raters assigned. Click "Manage Raters" to assign raters to this project.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {project.assigned_raters.map((rater) => (
                  <Badge key={rater.id} variant="primary" size="md">
                    {rater.username}
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Modals */}
      <FileUpload isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUpload={handleUpload} />

      <RaterAssignment
        isOpen={isRaterModalOpen}
        onClose={() => setIsRaterModalOpen(false)}
        availableRaters={raters || []}
        assignedRaters={project.assigned_raters}
        onAssign={handleAssignRaters}
        onRemove={handleRemoveRater}
      />

      <EvaluationSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSubmit={handleUpdateSettings}
        currentInstructions={project.instructions}
      />

      {previewSessionId && (() => {
        const previewSession = sessions?.find(s => s.id === previewSessionId);
        return previewSession ? (
          <SessionPreview
            isOpen={true}
            onClose={() => setPreviewSessionId(null)}
            sessionId={previewSessionId}
            sessionName={previewSession.name}
            columns={previewSession.columns}
          />
        ) : null;
      })()}
    </div>
  );
}
