import { useState } from 'react';
import { Modal, Button, Badge, ConfirmDialog } from '@/components/common';
import { UserBasic } from '@/types';

interface RaterAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  availableRaters: UserBasic[];
  assignedRaters: UserBasic[];
  onAssign: (raterIds: string[]) => Promise<void>;
  onRemove: (raterId: string) => Promise<void>;
  isLoading?: boolean;
}

export function RaterAssignment({
  isOpen,
  onClose,
  availableRaters,
  assignedRaters,
  onAssign,
  onRemove,
  isLoading = false,
}: RaterAssignmentProps) {
  const [selectedRaters, setSelectedRaters] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [removeRaterId, setRemoveRaterId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const assignedIds = new Set(assignedRaters.map((r) => r.id));
  const unassignedRaters = availableRaters.filter((r) => !assignedIds.has(r.id));

  const handleToggleRater = (raterId: string) => {
    const newSelected = new Set(selectedRaters);
    if (newSelected.has(raterId)) {
      newSelected.delete(raterId);
    } else {
      newSelected.add(raterId);
    }
    setSelectedRaters(newSelected);
  };

  const handleAssign = async () => {
    if (selectedRaters.size === 0) return;

    setIsAssigning(true);
    try {
      await onAssign(Array.from(selectedRaters));
      setSelectedRaters(new Set());
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async () => {
    if (!removeRaterId) return;
    setIsRemoving(true);
    try {
      await onRemove(removeRaterId);
      setRemoveRaterId(null);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Raters"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Assigned Raters */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Assigned Raters ({assignedRaters.length})
          </h3>
          {assignedRaters.length === 0 ? (
            <p className="text-sm text-gray-500">No raters assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedRaters.map((rater) => (
                <Badge key={rater.id} variant="primary" size="md" className="pr-1">
                  {rater.username}
                  <button
                    onClick={() => setRemoveRaterId(rater.id)}
                    className="ml-2 hover:bg-primary-200 rounded-full p-0.5"
                    disabled={isLoading || isRemoving}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Available Raters */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Available Raters ({unassignedRaters.length})
          </h3>
          {unassignedRaters.length === 0 ? (
            <p className="text-sm text-gray-500">No more raters available to assign.</p>
          ) : (
            <>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {unassignedRaters.map((rater) => (
                  <label
                    key={rater.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRaters.has(rater.id)}
                      onChange={() => handleToggleRater(rater.id)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-900">{rater.username}</span>
                  </label>
                ))}
              </div>

              {selectedRaters.size > 0 && (
                <Button
                  onClick={handleAssign}
                  isLoading={isAssigning}
                  className="mt-3"
                  size="sm"
                >
                  Assign {selectedRaters.size} Rater{selectedRaters.size > 1 ? 's' : ''}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={removeRaterId !== null}
        onClose={() => setRemoveRaterId(null)}
        onConfirm={handleRemove}
        title="Remove Rater"
        message="Are you sure you want to remove this rater from the project? They will no longer be able to rate items in this project."
        confirmLabel="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </Modal>
  );
}
