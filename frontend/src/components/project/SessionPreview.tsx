import { useState } from 'react';
import { Modal, Button, Spinner, Badge } from '@/components/common';
import { RowContent } from '@/components/media';
import { useSessionRows } from '@/hooks';
import { DataRow } from '@/types';

interface SessionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
  columns: string[];
}

export function SessionPreview({
  isOpen,
  onClose,
  sessionId,
  sessionName,
  columns,
}: SessionPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: rowsData, isLoading } = useSessionRows(sessionId, page, perPage, 'all');

  const currentRow: DataRow | undefined = rowsData?.items?.[currentIndex];
  const totalItems = rowsData?.total ?? 0;
  const globalIndex = (page - 1) * perPage + currentIndex + 1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (page > 1) {
      setPage(page - 1);
      setCurrentIndex(perPage - 1);
    }
  };

  const goToNext = () => {
    if (rowsData && currentIndex < rowsData.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (rowsData && page < rowsData.total_pages) {
      setPage(page + 1);
      setCurrentIndex(0);
    }
  };

  const canGoPrevious = page > 1 || currentIndex > 0;
  const canGoNext = rowsData && (page < rowsData.total_pages || currentIndex < rowsData.items.length - 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${sessionName}`} size="xl">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !currentRow ? (
          <div className="text-center py-12 text-gray-500">
            No items to preview
          </div>
        ) : (
          <>
            {/* Navigation Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Button>
                <span className="text-sm text-gray-500 px-2">
                  Item {globalIndex} of {totalItems}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToNext}
                  disabled={!canGoNext}
                >
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
              <Badge>Row #{currentRow.row_index + 1}</Badge>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              <RowContent content={currentRow.content} columns={columns} />
            </div>

            {/* Existing Ratings Summary */}
            {currentRow.ratings.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Ratings ({currentRow.ratings.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentRow.ratings.map((rating) => (
                    <Badge key={rating.id} variant="default">
                      {rating.rater_username}: {formatResponse(rating.response)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatResponse(response: unknown): string {
  if (!response) return 'No response';

  if (typeof response === 'object') {
    if ('value' in response) {
      return String((response as { value: unknown }).value);
    }
    if ('selected' in response) {
      const selected = (response as { selected: string[] }).selected;
      return selected.length > 2 ? `${selected.length} selected` : selected.join(', ');
    }
    if ('winner' in response) {
      return (response as { winner: string }).winner;
    }
    if ('text' in response) {
      const text = (response as { text: string }).text;
      return text.length > 20 ? text.substring(0, 20) + '...' : text;
    }
  }

  return String(response);
}
