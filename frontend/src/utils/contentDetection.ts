import { DetectedMedia } from '@/types';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'webm'];
const PDF_EXTENSIONS = ['pdf'];

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /(?:vimeo\.com\/)(\d+)/;

export function detectMediaType(value: string): DetectedMedia | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  // Check for internal media reference
  if (trimmed.startsWith('media://')) {
    const mediaId = trimmed.replace('media://', '');
    return {
      type: 'image', // Will be determined by actual file type
      url: `/api/media/${mediaId}`,
      originalValue: trimmed,
    };
  }

  // Check for base64 data URL
  if (trimmed.startsWith('data:')) {
    const mimeMatch = trimmed.match(/^data:([^;]+)/);
    if (mimeMatch) {
      const mime = mimeMatch[1];
      if (mime.startsWith('image/')) {
        return { type: 'image', url: trimmed, originalValue: trimmed };
      }
      if (mime.startsWith('video/')) {
        return { type: 'video', url: trimmed, originalValue: trimmed };
      }
      if (mime.startsWith('audio/')) {
        return { type: 'audio', url: trimmed, originalValue: trimmed };
      }
    }
    return null;
  }

  // Check for URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Check for YouTube
    const youtubeMatch = trimmed.match(YOUTUBE_REGEX);
    if (youtubeMatch) {
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        originalValue: trimmed,
      };
    }

    // Check for Vimeo
    const vimeoMatch = trimmed.match(VIMEO_REGEX);
    if (vimeoMatch) {
      return {
        type: 'vimeo',
        url: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        originalValue: trimmed,
      };
    }

    // Check file extension
    const extension = getFileExtension(trimmed);
    if (extension) {
      if (IMAGE_EXTENSIONS.includes(extension)) {
        return { type: 'image', url: trimmed, originalValue: trimmed };
      }
      if (VIDEO_EXTENSIONS.includes(extension)) {
        return { type: 'video', url: trimmed, originalValue: trimmed };
      }
      if (AUDIO_EXTENSIONS.includes(extension)) {
        return { type: 'audio', url: trimmed, originalValue: trimmed };
      }
      if (PDF_EXTENSIONS.includes(extension)) {
        return { type: 'pdf', url: trimmed, originalValue: trimmed };
      }
    }

    // Generic link
    return { type: 'link', url: trimmed, originalValue: trimmed };
  }

  // Plain text
  return null;
}

function getFileExtension(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot !== -1) {
      return pathname.substring(lastDot + 1).toLowerCase();
    }
  } catch {
    // Invalid URL
  }
  return null;
}

export function parseRowContent(content: Record<string, unknown>): {
  key: string;
  value: unknown;
  media: DetectedMedia | null;
}[] {
  return Object.entries(content).map(([key, value]) => {
    const stringValue = typeof value === 'string' ? value : String(value ?? '');
    return {
      key,
      value,
      media: detectMediaType(stringValue),
    };
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
