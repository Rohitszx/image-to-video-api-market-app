import { useState } from 'react';
import { MagicAPIService } from '@/lib/api/magic-api';

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export interface UseImageUploadProps {
  apiKey: string;
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: Error) => void;
}

export function useImageUpload({ apiKey, onSuccess, onError }: UseImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  const clearSelectedFile = () => {
    console.log('[ImageUpload] Clearing selected file and preview URL');
    if (previewUrl) {
      console.log('[ImageUpload] Revoking object URL:', previewUrl);
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleFileSelect = async (file: File | null) => {
    console.log('[ImageUpload] Handling file selection:', file?.name || 'null');
    clearSelectedFile();
    
    if (!file) {
      console.log('[ImageUpload] No file selected, returning');
      return;
    }
    
    if (!isImageFile(file)) {
      console.log('[ImageUpload] Invalid file type:', file.type);
      onError?.(new Error('Please select a valid image file'));
      return;
    }
    
    console.log('[ImageUpload] Creating preview URL for file:', file.name);
    const objectUrl = URL.createObjectURL(file);
    console.log('[ImageUpload] Preview URL created:', objectUrl);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    
    // Automatically upload the file
    console.log('[ImageUpload] Starting automatic upload...');
    setIsUploading(true);
    setUploadError(null);
    
    try {
      if (!apiKey) {
        throw new Error('API key is required');
      }
      const magicApi = new MagicAPIService(apiKey);
      const imageUrl = await magicApi.uploadImage(file);
      console.log('[ImageUpload] Automatic upload successful:', imageUrl);
      onSuccess?.(imageUrl);
    } catch (error) {
      console.error('[ImageUpload] Automatic upload failed:', error);
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      setUploadError(uploadError);
      onError?.(uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    selectedFile,
    previewUrl,
    isUploading,
    uploadError,
    handleFileSelect,
    clearSelectedFile,
  };
}
