import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MagicAPIService, VideoGenerationParams, VideoGenerationResponse } from '@/lib/api/magic-api';
import { toast } from 'sonner';

export interface UseVideoGenerationProps {
  apiKey: string;
  onSuccess?: (videoUrl: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function useVideoGeneration({ apiKey, onSuccess, onError, onProgress }: UseVideoGenerationProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoGenerationResponse | null>(null);
  const magicApiRef = useRef<MagicAPIService | null>(null);
  // Initialize MagicAPI instance only when needed
  const getMagicApi = () => {
    if (!apiKey?.trim()) throw new Error('API key is required');
    if (!magicApiRef.current) magicApiRef.current = new MagicAPIService(apiKey);
    return magicApiRef.current;
  };

  const generateMutation = useMutation({
    mutationFn: async (params: VideoGenerationParams) => {
      console.log('[VideoGeneration] Starting video generation with params:', params);
      const api = getMagicApi();
      console.log('[VideoGeneration] Initiating video generation...');
      const generatedJobId = await api.generateVideo(params);
      console.log('[VideoGeneration] Got job ID:', generatedJobId);
      setJobId(generatedJobId);
      
      console.log('[VideoGeneration] Starting status polling for job:', generatedJobId);
      const response = await api.pollVideoStatus(
        generatedJobId,
        15 * 60 * 1000,
        (currentProgress: number ) => {
          console.log('[VideoGeneration] Progress update:', currentProgress);
          if (currentProgress > progress) {
            setProgress(currentProgress);
            onProgress?.(currentProgress);
          }
        },
        (status) => {
          console.log('[VideoGeneration] Status:', status);
          if (status === 'IN_QUEUE') {
            toast.info('Video generation queued...');
          } else if (status === 'IN_PROGRESS') {
            toast.info('Generating video...');
          }
        }
      );
      console.log('[VideoGeneration] Video generated successfully:', response);
      setVideoDetails(response);
      if (response.output?.video_url) {
        setVideoUrl(response.output.video_url);
        return response.output.video_url;
      }
      throw new Error('Failed to generate video');
    },
    onSuccess: (url) => {
      onSuccess?.(url);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const checkStatus = async (existingJobId: string) => {
    if (!existingJobId || videoUrl) return;  
    
    try {
      const api = getMagicApi();
      setJobId(existingJobId);
      
      const response = await api.pollVideoStatus(
        existingJobId,
        15 * 60 * 1000,
        (progress) => {
          console.log('[VideoGeneration] Progress:', progress);
          setProgress(progress);
        },
        (status) => {
          console.log('[VideoGeneration] Status:', status);
          if (status === 'IN_QUEUE') {
            toast.info('Video generation queued...');
          } else if (status === 'IN_PROGRESS') {
            toast.info('Generating video...');
          }
        }
      );
      console.log('[VideoGeneration] Video generated successfully:', response);
      setVideoDetails(response);
      if (response.output?.video_url) {
        setVideoUrl(response.output.video_url);
        onSuccess?.(response.output.video_url);
      }
    } catch (error) {
      console.error('[VideoGeneration] Error during video generation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError?.(new Error(errorMessage));
      throw error;
    }
  };

  return {
    generateVideo: generateMutation.mutate,
    checkStatus,
    isGenerating: generateMutation.isPending,
    jobId,
    progress,
    videoUrl,
    error: generateMutation.error,
    reset: () => {
      setJobId(null);
      setProgress(0);
      setVideoUrl(null);
    },
  };
}
