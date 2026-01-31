import { DetectedMedia } from '@/types';
import { ImageViewer } from './ImageViewer';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';
import { YouTubeEmbed } from './YouTubeEmbed';
import { VimeoEmbed } from './VimeoEmbed';
import { PDFViewer } from './PDFViewer';

interface MediaRendererProps {
  media: DetectedMedia;
  className?: string;
}

export function MediaRenderer({ media, className = '' }: MediaRendererProps) {
  switch (media.type) {
    case 'image':
      return <ImageViewer src={media.url} className={className} />;

    case 'video':
      return <VideoPlayer src={media.url} className={className} />;

    case 'audio':
      return <AudioPlayer src={media.url} className={className} />;

    case 'youtube':
      return <YouTubeEmbed url={media.url} className={className} />;

    case 'vimeo':
      return <VimeoEmbed url={media.url} className={className} />;

    case 'pdf':
      return <PDFViewer url={media.url} className={className} />;

    case 'link':
      return (
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-primary-600 hover:text-primary-700 underline break-all ${className}`}
        >
          {media.originalValue}
        </a>
      );

    default:
      return <span className={className}>{media.originalValue}</span>;
  }
}
