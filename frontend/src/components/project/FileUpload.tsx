import React, { useState, useRef } from 'react';
import { Modal, Button, Input } from '@/components/common';
import { formatFileSize } from '@/utils/contentDetection';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, sessionName?: string) => Promise<void>;
}

export function FileUpload({ isOpen, onClose, onUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    return validTypes.includes(file.type) || validExtensions.includes(extension);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    try {
      await onUpload(file, sessionName || undefined);
      setFile(null);
      setSessionName('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSessionName('');
    onClose();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Dataset"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            form="upload-form"
            isLoading={isLoading}
            disabled={!file}
            variant="gradient"
            className="flex-1"
          >
            {isLoading ? 'Uploading...' : 'Upload Dataset'}
          </Button>
        </div>
      }
    >
      <form id="upload-form" onSubmit={handleSubmit} className="space-y-5">
        <div
          className={`
            relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer
            transition-all duration-300
            ${dragActive
              ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 scale-[1.02]'
              : file
                ? 'border-success-300 bg-success-50/50'
                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid-gray-100/50 bg-[size:16px_16px] pointer-events-none" />

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-success-100 to-success-200 flex items-center justify-center shadow-soft">
                <svg
                  className="w-8 h-8 text-success-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-soft max-w-xs mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700">
                      {getFileExtension(file.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-sm text-success-600 mt-3 font-medium">
                Ready to upload
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className={`
                w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                transition-all duration-300
                ${dragActive
                  ? 'bg-gradient-to-br from-primary-500 to-accent-500 scale-110'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }
              `}>
                <svg
                  className={`w-8 h-8 transition-colors ${dragActive ? 'text-white' : 'text-gray-500'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <p className="font-semibold text-gray-900">
                {dragActive ? 'Drop your file here' : 'Drop your file here, or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports CSV, XLS, XLSX files
              </p>

              {/* Format badges */}
              <div className="flex justify-center gap-2 mt-4">
                {['CSV', 'XLS', 'XLSX'].map((format) => (
                  <span
                    key={format}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
                  >
                    .{format.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Input
          label="Dataset Name"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Leave empty to use filename"
          helperText="This name will be displayed in the project's dataset list"
        />
      </form>
    </Modal>
  );
}
