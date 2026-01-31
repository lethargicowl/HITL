import { useState } from 'react';
import { Button, Badge, Card, CardBody, EmptyState, ConfirmDialog } from '@/components/common';
import { QuestionForm } from './QuestionForm';
import { EvaluationQuestion, EvaluationQuestionCreate, EvaluationQuestionUpdate } from '@/types';

interface QuestionListProps {
  questions: EvaluationQuestion[];
  onAdd: (data: EvaluationQuestionCreate) => Promise<void>;
  onUpdate: (questionId: string, data: EvaluationQuestionUpdate) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  onReorder: (questionIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

const questionTemplates: Record<string, EvaluationQuestionCreate[]> = {
  quality: [
    { key: 'overall_quality', label: 'Overall Quality', question_type: 'rating', config: { min: 1, max: 5, labels: { '1': 'Poor', '5': 'Excellent' } }, required: true },
    { key: 'is_helpful', label: 'Is this helpful?', question_type: 'binary', config: { options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }, required: true },
  ],
  safety: [
    { key: 'is_safe', label: 'Is this content safe?', question_type: 'binary', config: { options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }, required: true },
    { key: 'safety_issues', label: 'Safety Issues (if any)', question_type: 'multi_label', config: { options: [{ value: 'violence', label: 'Violence' }, { value: 'hate', label: 'Hate Speech' }, { value: 'adult', label: 'Adult Content' }, { value: 'other', label: 'Other' }], min_select: 0 }, required: false, conditional: { question: 'is_safe', equals: 'no' } },
  ],
  feedback: [
    { key: 'rating', label: 'Rating', question_type: 'rating', config: { min: 1, max: 5 }, required: true },
    { key: 'feedback', label: 'Additional Feedback', question_type: 'text', config: { placeholder: 'Enter your feedback...', multiline: true }, required: false },
  ],
};

export function QuestionList({
  questions,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: QuestionListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<EvaluationQuestion | undefined>();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  const handleAddQuestion = async (data: EvaluationQuestionCreate | EvaluationQuestionUpdate) => {
    await onAdd(data as EvaluationQuestionCreate);
  };

  const handleUpdateQuestion = async (data: EvaluationQuestionCreate | EvaluationQuestionUpdate) => {
    if (editingQuestion) {
      await onUpdate(editingQuestion.id, data as EvaluationQuestionUpdate);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteQuestionId);
      setDeleteQuestionId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyTemplate = async (templateKey: string) => {
    const template = questionTemplates[templateKey];
    if (!template) return;

    for (const q of template) {
      await onAdd(q);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...sortedQuestions];
    const [removed] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, removed);

    // Update order and trigger reorder
    const newIds = newQuestions.map((q) => q.id);
    onReorder(newIds);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const openEditForm = (question: EvaluationQuestion) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingQuestion(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Questions ({questions.length})</h3>
        <div className="flex gap-2">
          <div className="relative group">
            <Button variant="secondary" size="sm">
              Templates
            </Button>
            <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="py-1">
                <button
                  onClick={() => handleApplyTemplate('quality')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Quality Assessment
                </button>
                <button
                  onClick={() => handleApplyTemplate('safety')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Safety Review
                </button>
                <button
                  onClick={() => handleApplyTemplate('feedback')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Feedback Form
                </button>
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            Add Question
          </Button>
        </div>
      </div>

      {sortedQuestions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Add questions to create a multi-question evaluation form, or use a template to get started."
          action={
            <Button onClick={() => setIsFormOpen(true)}>Add First Question</Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sortedQuestions.map((question, index) => (
            <Card
              key={question.id}
              className={`cursor-move ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <CardBody className="p-3">
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3"
                >
                  <div className="text-gray-400 cursor-move">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{question.label}</span>
                      <Badge size="sm">{question.question_type}</Badge>
                      {question.required && <Badge size="sm" variant="warning">Required</Badge>}
                      {question.conditional && <Badge size="sm" variant="primary">Conditional</Badge>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Key: {question.key}
                      {question.description && ` • ${question.description}`}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteQuestionId(question.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <QuestionForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
        existingQuestion={editingQuestion}
        existingQuestions={sortedQuestions}
      />

      <ConfirmDialog
        isOpen={deleteQuestionId !== null}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
