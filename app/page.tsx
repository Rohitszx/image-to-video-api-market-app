'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/container';
import { PageHeaderClient } from '@/components/PageHeaderClient';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useApiKey } from '@/hooks/use-api-key';
import { useHistory, HistoryItem } from '@/hooks/use-history';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useVideoGeneration } from '@/hooks/use-video-generation';
import { ImageUploader } from '@/components/ImageUploader';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoGenerator } from '@/components/VideoGenerator';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ApiKeySetup } from '@/components/ApiKeySetup';

export default function Home() {
  const { apiKey, validateApiKey, clearApiKey } = useApiKey();
  const { history, addHistoryItem, updateHistoryItem, clearHistory } = useHistory();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const { selectedFile, previewUrl, isUploading, uploadError, handleFileSelect, clearSelectedFile } = useImageUpload({
    apiKey,
    onSuccess: (imageUrl: string) => {
      console.log('[Page] Image uploaded successfully:', imageUrl);
      setUploadedImageUrl(imageUrl);
      toast.success('Image uploaded successfully!');
    },
    onError: (error: Error) => {
      console.error('[Page] Image upload failed:', error);
      setUploadedImageUrl(null);
      toast.error(`Upload failed: ${error.message}`);
    }
  });

  const {
    generateVideo,
    isGenerating,
    progress,
    videoUrl,
    error: videoError,
    reset: resetVideoGeneration
  } = useVideoGeneration({
    apiKey,
    onSuccess: (url: string) => {
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, {
          videoUrl: url,
          status: 'succeeded'
        });
      }
      toast.success('Video generated successfully!');
    },
    onError: (error: Error) => {
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, {
          status: 'failed'
        });
      }
      toast.error(`Video generation failed: ${error.message}`);
    },
    onProgress: (currentProgress: number) => {
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, {
          status: 'processing'
        });
      }
    }
  });



  const handleApiKeySet = async (key: string) => {
    if (!key.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    const isValid = await validateApiKey(key);
    if (isValid) {
      toast.success('API key saved successfully!');
    } else {
      toast.error('Invalid API key');
    }
  };

  const handleGenerate = async (params: { prompt: string; loraUrl?: string | null; frames?: number }) => {
    if (!uploadedImageUrl) {
      console.log('[Page] No uploaded image URL available');
      toast.error('Please upload an image first');
      return;
    }

    console.log('[Page] Starting video generation with image:', uploadedImageUrl);
    const historyId = addHistoryItem({
      imageUrl: uploadedImageUrl,
      prompt: params.prompt,
      status: 'pending'
    });
    
    setCurrentHistoryId(historyId);
    
    generateVideo({
      ...params,
      imageUrl: uploadedImageUrl,
    });
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    handleFileSelect(null);
    resetVideoGeneration();
    setCurrentHistoryId(item.id);
    
    if (item.videoUrl) {
      setSelectedVideoUrl(item.videoUrl);
      setTimeout(() => {
        const videoElement = document.getElementById('video-section');
        if (videoElement) {
          videoElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {!apiKey ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <ApiKeySetup onSubmit={handleApiKeySet} />
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <PageHeaderClient onClearApiKey={clearApiKey} />
          
          <div className={`mt-8 ${isDesktop ? 'grid grid-cols-3 gap-6' : 'space-y-6'}`}>
            <div className={`${isDesktop ? 'col-span-2' : ''} space-y-6`}>
              <ImageUploader
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                isUploading={isUploading}
                onSelectFile={handleFileSelect}
                onClearFile={clearSelectedFile}
                error={uploadError}
              />
              
              {previewUrl && (
                <VideoGenerator
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  progress={progress}
                  error={videoError?.message}
                  videoUrl={videoUrl || undefined}
                />
              )}
              
              <div id="video-section">
                {(videoUrl || selectedVideoUrl) && (
                  <VideoPlayer videoUrl={selectedVideoUrl || videoUrl!} />
                )}
              </div>
            </div>
            
            <div>
              <HistoryPanel 
                history={history} 
                onItemClick={handleHistoryItemClick}
                onClearHistory={clearHistory}
                onPlayVideo={(videoUrl) => {
                  setSelectedVideoUrl(videoUrl);
                  // Scroll to video section
                  setTimeout(() => {
                    const videoElement = document.getElementById('video-section');
                    if (videoElement) {
                      videoElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

