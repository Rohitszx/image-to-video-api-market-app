'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { PageHeaderClient } from '@/components/PageHeaderClient';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useApiKey } from '@/hooks/use-api-key';
import { useHistory, HistoryItem, VideoGenerationOutput } from '@/hooks/use-history';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useVideoGeneration } from '@/hooks/use-video-generation';
import { ImageUploader } from '@/components/ImageUploader';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoGenerator } from '@/components/VideoGenerator';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { MagicAPIService } from '@/lib/api/magic-api';

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
    },
  });

  const { generateVideo, videoUrl, progress, error: videoError, isGenerating, reset: resetVideoGeneration, checkStatus: checkVideoStatus } = useVideoGeneration({
    apiKey,
    onSuccess: (url: string, response?: VideoGenerationOutput) => {
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, {
          videoUrl: url,
          status: 'succeeded',
          videoGeneration: response
        });
        setSelectedVideoUrl(url);
      }
      toast.success('Video generated successfully!');
    },
    onProgress: (currentProgress: number) => {
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, {
          status: 'processing'
        });
      }
    },
    onError: (error: Error) => {
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, {
          status: 'failed'
        });
      }
      toast.error(`Video generation failed: ${error.message}`);
    },
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

  const handleGenerateVideo = async (params: { prompt: string; loraUrl?: string | null; frames?: number }) => {
    if (!uploadedImageUrl) {
      toast.error('Please upload an image first');
      return;
    }

    try {
      // Create history item when starting video generation
      const historyId = addHistoryItem({
        imageUrl: uploadedImageUrl,
        status: 'pending',
        prompt: params.prompt,
        uploadedAt: new Date().toISOString()
      });
      setCurrentHistoryId(historyId);

      await generateVideo({
        imageUrl: uploadedImageUrl,
        prompt: params.prompt,
        loraUrl: params.loraUrl,
        frames: params.frames
      });
      
      toast.success('Video generation started!');
    } catch (error) {
      console.error('[Page] Video generation failed:', error);
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, { status: 'failed' });
      }
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }  
  };

  // Check status of pending videos on load
  useEffect(() => {
    if (!apiKey) return;
    
    const checkPendingVideos = async () => {
      const pendingItems = history.filter(
        item => item.status === 'pending' || item.status === 'processing'
      );
      
      for (const item of pendingItems) {
        try {
          const api = new MagicAPIService(apiKey);
          const response = await api.getVideoStatus(item.id);
          
          if (['SUCCEEDED', 'COMPLETED'].includes(response.status)) {
            const videoUrl = response.output?.video_url || response.output?.output?.[0];
            if (videoUrl) {
              updateHistoryItem(item.id, {
                status: 'succeeded',
                videoUrl,
                videoGeneration: response
              });
              
              // If this is the current item, update the UI
              if (item.id === currentHistoryId) {
                setSelectedVideoUrl(videoUrl);
              }
            }
          } else if (response.status === 'FAILED') {
            updateHistoryItem(item.id, { 
              status: 'failed',
              videoGeneration: response
            });
          } else if (['IN_QUEUE', 'IN_PROGRESS'].includes(response.status)) {
            updateHistoryItem(item.id, {
              status: 'processing',
              videoGeneration: response
            });
          }
        } catch (error) {
          console.error(`[Page] Error checking status for item ${item.id}:`, error);
          updateHistoryItem(item.id, { status: 'failed' });
        }
      }
    };
    
    // Check immediately and then every 10 seconds
    checkPendingVideos();
    const interval = setInterval(checkPendingVideos, 10000);
    
    return () => clearInterval(interval);
  }, [apiKey, history, currentHistoryId]);

  const handleHistoryItemClick = async (item: HistoryItem) => {
    handleFileSelect(null);
    resetVideoGeneration();
    setCurrentHistoryId(item.id);
    setUploadedImageUrl(item.imageUrl);
    
    if (item.status === 'pending' || item.status === 'processing') {
      try {
        const api = new MagicAPIService(apiKey);
        const response = await api.getVideoStatus(item.id);
        
        if (['SUCCEEDED', 'COMPLETED'].includes(response.status)) {
          const videoUrl = response.output?.video_url || response.output?.output?.[0];
          if (videoUrl) {
            updateHistoryItem(item.id, {
              status: 'succeeded',
              videoUrl,
              videoGeneration: response
            });
            setSelectedVideoUrl(videoUrl);
          }
        } else if (response.status === 'FAILED') {
          updateHistoryItem(item.id, { 
            status: 'failed',
            videoGeneration: response
          });
        } else if (['IN_QUEUE', 'IN_PROGRESS'].includes(response.status)) {
          updateHistoryItem(item.id, {
            status: 'processing',
            videoGeneration: response
          });
        }
      } catch (error) {
        console.error('[Page] Error checking video status:', error);
        updateHistoryItem(item.id, { status: 'failed' });
      }
    } else if (item.status === 'succeeded' && item.videoUrl) {
      setSelectedVideoUrl(item.videoUrl);
    }
    
    // Scroll to video section if we have a video URL
    if (item.videoUrl || (item.status === 'succeeded' && item.videoUrl)) {
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
      
        <PageHeaderClient />
        <div className="container mx-auto p-4 pt-[72px]">
        <ApiKeySetup 
          onSubmit={handleApiKeySet}
          onClearApiKey={clearApiKey}
          apiKey={apiKey}
        />
        
        <div className={`${isDesktop ? 'grid grid-cols-3 gap-6' : 'space-y-6'}`}>
          <div className={`${isDesktop ? 'col-span-2' : ''} space-y-6`}>
            <ImageUploader
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              isUploading={isUploading}
              onSelectFile={handleFileSelect}
              onClearFile={clearSelectedFile}
              error={uploadError}
            />
            
            <VideoGenerator
              onGenerate={handleGenerateVideo}
              isGenerating={isGenerating}
              progress={progress}
              error={!apiKey ? 'Please enter your API key to generate videos' : videoError?.message}
              videoUrl={videoUrl || undefined}
              disabled={!apiKey}
            />
            
            <div id="video-section">
              {(videoUrl || selectedVideoUrl) && (
                <Card className="p-6 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Video</h3>
                  </div>
                  <VideoPlayer videoUrl={selectedVideoUrl || videoUrl!} />
                </Card>
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
    </main>
  );
}

