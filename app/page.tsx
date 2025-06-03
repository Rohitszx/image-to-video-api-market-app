'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeaderClient } from '@/components/PageHeaderClient';
import { 
  TabsContent,
  TabsList,
  TabsTrigger,
  Tabs, 
} from '@/components/ui/tabs';
import { History, Sparkles, Trash2, X } from 'lucide-react';
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
  const { history, addHistoryItem, updateHistoryItem, removeHistoryItem, clearHistory } = useHistory();
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
    
    // Switch to generator tab to show preview
    const tabsList = document.querySelector('[role="tablist"]');
    const generatorTab = tabsList?.querySelector('[data-state="inactive"][value="generator"]');
    if (generatorTab) {
      (generatorTab as HTMLElement).click();
    }

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
    
    // Scroll to video preview after a short delay to ensure components are updated
    setTimeout(() => {
      const videoPreview = document.querySelector('.video-preview-section');
      if (videoPreview) {
        videoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
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
        
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
          <div className="lg:col-span-5 order-1">
            <Tabs defaultValue="generator" className="w-full">
              <TabsList className="mb-4 w-full justify-start rounded-lg p-1 overflow-x-auto">
                <TabsTrigger value="generator" className="flex items-center gap-2 rounded-md whitespace-nowrap">
                  <Sparkles className="h-4 w-4" />
                  <span>Generator</span>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex items-center gap-2 rounded-md whitespace-nowrap">
                  <History className="h-4 w-4" />
                  <span>Gallery & Player</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generator" className="mt-6">
                <div className="space-y-6">
                  <ImageUploader
                    selectedFile={selectedFile}
                    previewUrl={previewUrl}
                    isUploading={isUploading}
                    onSelectFile={handleFileSelect}
                    onClearFile={clearSelectedFile}
                    error={uploadError}
                  />
                  
                  <div className="video-preview-section">
                  <VideoGenerator
                    onGenerate={handleGenerateVideo}
                    isGenerating={isGenerating}
                    progress={progress}
                    error={!apiKey ? 'Please enter your API key to generate videos' : videoError?.message}
                    videoUrl={videoUrl || selectedVideoUrl || undefined}
                    imageUrl={uploadedImageUrl || undefined}
                    disabled={!apiKey}
                  />
                </div>
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                {history.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.map((item) => (
                        <Card key={item.id} className="p-4">
                          {item.videoUrl && <VideoPlayer videoUrl={item.videoUrl} />}
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground truncate">{item.prompt}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No generated videos yet. Create your first video in the Generator tab!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
            <Card className="p-4 sticky top-4">
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Generations</h3>
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all generations?')) {
                          clearHistory();
                          setSelectedVideoUrl(null);
                          setCurrentHistoryId(null);
                          toast.success('History cleared');
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg transition-colors ${currentHistoryId === item.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div 
                            className="flex-grow cursor-pointer"
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            <p className="text-sm truncate">{item.prompt}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this generation?')) {
                                if (currentHistoryId === item.id) {
                                  setSelectedVideoUrl(null);
                                  setCurrentHistoryId(null);
                                }
                                removeHistoryItem(item.id);
                                toast.success('Generation deleted');
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No generations yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
