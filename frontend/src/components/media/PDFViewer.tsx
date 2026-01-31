import { useState } from 'react';
import { Button } from '@/components/common';

interface PDFViewerProps {
  url: string;
  className?: string;
}

export function PDFViewer({ url, className = '' }: PDFViewerProps) {
  const [showEmbed, setShowEmbed] = useState(true);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">PDF Document</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowEmbed(!showEmbed)}
          >
            {showEmbed ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(url, '_blank')}
          >
            Open in New Tab
          </Button>
        </div>
      </div>

      {showEmbed && (
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={url}
            className="w-full h-[600px]"
            title="PDF Viewer"
          />
        </div>
      )}
    </div>
  );
}
