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
  ConfirmDialog,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
    try {
      await deleteProject.mutateAsync(projectId!);
      addToast('Project deleted', 'success');
      navigate('/requester/dashboard');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setIsDeleteDialogOpen(false);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/requester/dashboard')}
          className="text-gray-500 hover:text-primary-600 mb-4 inline-flex items-center group transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold"
                label="Project Name"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Project description"
                rows={2}
                label="Description"
              />
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} isLoading={updateProject.isPending}>
                  Save Changes
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  {project.description && (
                    <p className="text-gray-500 mt-1">{project.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                      <span>{project.total_rows} items</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{project.rated_rows} rated</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span>{project.session_count} dataset(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={startEditing}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 p-1.5 inline-flex">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      </div>

      {/* Tab Content */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="gradient" onClick={() => setIsUploadOpen(true)}>
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
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-gray-500">Loading datasets...</p>
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

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? All datasets, ratings, and settings will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Project"
        variant="danger"
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}
