export interface MediaFile {
  id: string;
  project_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
}

export interface MediaUploadResponse {
  files: MediaFile[];
  message: string;
}

export type MediaType = 'image' | 'video' | 'audio' | 'pdf' | 'youtube' | 'vimeo' | 'link' | 'text';

export interface DetectedMedia {
  type: MediaType;
  url: string;
  originalValue: string;
}
