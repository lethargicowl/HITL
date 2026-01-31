import { useState } from 'react';
import { Button, Badge, Card, CardBody, EmptyState, ConfirmDialog } from '@/components/common';
import { ExampleForm } from './ExampleForm';
import { AnnotationExample, AnnotationExampleCreate, AnnotationExampleUpdate } from '@/types';

interface ExampleListProps {
  examples: AnnotationExample[];
  onAdd: (data: AnnotationExampleCreate) => Promise<void>;
  onUpdate: (exampleId: string, data: AnnotationExampleUpdate) => Promise<void>;
  onDelete: (exampleId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ExampleList({
  examples,
  onAdd,
  onUpdate,
  onDelete,
}: ExampleListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<AnnotationExample | undefined>();
  const [deleteExampleId, setDeleteExampleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedExamples = [...examples].sort((a, b) => a.order - b.order);

  const handleAddExample = async (data: AnnotationExampleCreate | AnnotationExampleUpdate) => {
    await onAdd(data as AnnotationExampleCreate);
  };

  const handleUpdateExample = async (data: AnnotationExampleCreate | AnnotationExampleUpdate) => {
    if (editingExample) {
      await onUpdate(editingExample.id, data as AnnotationExampleUpdate);
    }
  };

  const handleDeleteExample = async () => {
    if (!deleteExampleId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteExampleId);
      setDeleteExampleId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditForm = (example: AnnotationExample) => {
    setEditingExample(example);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExample(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Annotation Examples ({examples.length})</h3>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          Add Example
        </Button>
      </div>

      {sortedExamples.length === 0 ? (
        <EmptyState
          title="No examples yet"
          description="Add annotation examples to help raters understand how to evaluate items correctly."
          action={
            <Button onClick={() => setIsFormOpen(true)}>Add First Example</Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sortedExamples.map((example) => (
            <Card
              key={example.id}
              className={`border-l-4 ${example.is_positive ? 'border-l-green-500' : 'border-l-red-500'}`}
            >
              <CardBody className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={example.is_positive ? 'success' : 'danger'} size="sm">
                      {example.is_positive ? 'Good' : 'Bad'}
                    </Badge>
                    <span className="font-medium text-gray-900">{example.title}</span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(example)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteExampleId(example.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {example.explanation && (
                  <p className="text-sm text-gray-600 mt-2">{example.explanation}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ExampleForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingExample ? handleUpdateExample : handleAddExample}
        existingExample={editingExample}
      />

      <ConfirmDialog
        isOpen={deleteExampleId !== null}
        onClose={() => setDeleteExampleId(null)}
        onConfirm={handleDeleteExample}
        title="Delete Example"
        message="Are you sure you want to delete this example? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
