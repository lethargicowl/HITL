import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/common';
import { ProjectCreate } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectCreate) => Promise<void>;
}

export function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit({
        name,
        description: description || undefined,
        use_multi_questions: true, // Always use questions-based approach
      });
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            isLoading={isLoading}
            disabled={!name.trim()}
          >
            Create Project
          </Button>
        </>
      }
    >
      <form id="create-project-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Image Quality Review"
          autoFocus
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will raters be evaluating?"
          rows={3}
        />

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>After creating the project, you'll be able to:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Add evaluation questions (ratings, yes/no, text, etc.)</li>
            <li>Upload datasets for rating</li>
            <li>Assign raters to the project</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
}
