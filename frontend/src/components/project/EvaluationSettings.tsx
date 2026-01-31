import { useState, useEffect } from 'react';
import { Modal, Button, Textarea } from '@/components/common';
import { ProjectUpdate } from '@/types';

interface EvaluationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectUpdate) => Promise<void>;
  currentInstructions?: string;
}

export function EvaluationSettings({
  isOpen,
  onClose,
  onSubmit,
  currentInstructions,
}: EvaluationSettingsProps) {
  const [instructions, setInstructions] = useState(currentInstructions || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInstructions(currentInstructions || '');
  }, [currentInstructions, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit({
        instructions: instructions || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instructions for Raters"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="settings-form" isLoading={isLoading}>
            Save Instructions
          </Button>
        </>
      }
    >
      <form id="settings-form" onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label="Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter instructions to help raters understand how to evaluate items...

For example:
- What criteria should raters consider?
- What makes a good vs. bad rating?
- Any specific guidelines to follow?"
          rows={10}
        />

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Tips for good instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Be specific about what you're looking for</li>
            <li>Provide examples of edge cases</li>
            <li>Explain the context of the evaluation</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
}
