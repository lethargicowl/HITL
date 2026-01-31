import { MediaRenderer } from './MediaRenderer';
import { parseRowContent } from '@/utils/contentDetection';

interface RowContentProps {
  content: Record<string, unknown>;
  columns?: string[];
}

export function RowContent({ content, columns }: RowContentProps) {
  const parsedContent = parseRowContent(content);

  // If columns are specified, order by them
  const orderedContent = columns
    ? columns
        .map((col) => parsedContent.find((c) => c.key === col))
        .filter((c) => c !== undefined)
    : parsedContent;

  return (
    <div className="space-y-4">
      {orderedContent.map((item) => {
        if (!item) return null;

        const { key, value, media } = item;
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        return (
          <div key={key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {key}
            </label>

            {media ? (
              <MediaRenderer media={media} className="max-w-full" />
            ) : (
              <div className="text-gray-900 whitespace-pre-wrap break-words">
                {stringValue}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
