import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/common';
import { AnnotationExample, AnnotationExampleCreate, AnnotationExampleUpdate } from '@/types';

interface ExampleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AnnotationExampleCreate | AnnotationExampleUpdate) => Promise<void>;
  existingExample?: AnnotationExample;
}

export function ExampleForm({
  isOpen,
  onClose,
  onSubmit,
  existingExample,
}: ExampleFormProps) {
  const [title, setTitle] = useState('');
  const [contentJson, setContentJson] = useState('{}');
  const [responseJson, setResponseJson] = useState('{}');
  const [explanation, setExplanation] = useState('');
  const [isPositive, setIsPositive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isEditing = !!existingExample;

  useEffect(() => {
    if (existingExample) {
      setTitle(existingExample.title);
      setContentJson(JSON.stringify(existingExample.content, null, 2));
      setResponseJson(JSON.stringify(existingExample.example_response, null, 2));
      setExplanation(existingExample.explanation || '');
      setIsPositive(existingExample.is_positive);
    } else {
      resetForm();
    }
  }, [existingExample, isOpen]);

  const resetForm = () => {
    setTitle('');
    setContentJson('{\n  "text": "Example content here"\n}');
    setResponseJson('{\n  "value": 5\n}');
    setExplanation('');
    setIsPositive(true);
    setJsonError(null);
  };

  const validateJson = (json: string): boolean => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON
    if (!validateJson(contentJson)) {
      setJsonError('Content JSON is invalid');
      return;
    }
    if (!validateJson(responseJson)) {
      setJsonError('Response JSON is invalid');
      return;
    }

    setJsonError(null);
    setIsLoading(true);

    try {
      const data = {
        title,
        content: JSON.parse(contentJson),
        example_response: JSON.parse(responseJson),
        explanation: explanation || undefined,
        is_positive: isPositive,
      };

      await onSubmit(data);
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Example' : 'Add Example'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="example-form" isLoading={isLoading}>
            {isEditing ? 'Update' : 'Add'} Example
          </Button>
        </>
      }
    >
      <form id="example-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Example title"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Example Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={isPositive}
                onChange={() => setIsPositive(true)}
                className="h-4 w-4 text-green-600"
              />
              <span className="text-sm text-green-700">Good Example</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!isPositive}
                onChange={() => setIsPositive(false)}
                className="h-4 w-4 text-red-600"
              />
              <span className="text-sm text-red-700">Bad Example</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content (JSON)
          </label>
          <textarea
            value={contentJson}
            onChange={(e) => setContentJson(e.target.value)}
            className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            rows={6}
            placeholder='{"field": "value"}'
          />
          <p className="text-xs text-gray-500 mt-1">
            JSON object representing the example data item
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Response (JSON)
          </label>
          <textarea
            value={responseJson}
            onChange={(e) => setResponseJson(e.target.value)}
            className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            rows={4}
            placeholder='{"value": 5}'
          />
          <p className="text-xs text-gray-500 mt-1">
            JSON object representing the expected rating response
          </p>
        </div>

        {jsonError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {jsonError}
          </div>
        )}

        <Textarea
          label="Explanation (optional)"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain why this is a good/bad example..."
          rows={3}
        />
      </form>
    </Modal>
  );
}
