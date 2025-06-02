'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  isUploading: boolean;
  error: Error | null;
  onSelectFile: (file: File | null) => Promise<void>;
  onClearFile: () => void;
}

export function ImageUploader({
  selectedFile,
  previewUrl,
  isUploading,
  error,
  onSelectFile,
  onClearFile
}: ImageUploaderProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await onSelectFile(acceptedFiles[0]);
    }
  }, [onSelectFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          hover:border-blue-500 hover:bg-blue-50
          transition-all duration-200
          flex flex-col items-center justify-center
          min-h-[200px]
        `}
      >
        <input {...getInputProps()} disabled={isUploading} />

        {previewUrl ? (
          <div className="relative w-full h-full min-h-[200px]">
            {/* Preview image */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />

            {/* Clear button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {isDragActive ? (
                "Drop the image here ..."
              ) : isUploading ? (
                "Uploading..."
              ) : (
                "Drag 'n' drop an image here, or click to select one"
              )}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error.message}
        </div>
      )}
    </div>
  );
}
