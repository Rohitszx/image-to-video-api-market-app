import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MagicAPIService, VideoGenerationParams, VideoGenerationResponse } from '@/lib/api/magic-api';
import { toast } from 'sonner';

export interface UseVideoGenerationProps {
  apiKey: string;
  onSuccess?: (url: string, response?: VideoGenerationResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export const useVideoGeneration = ({ apiKey, onSuccess, onProgress, onError }: UseVideoGenerationProps) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoDetails, setVideoDetails] = useState<VideoGenerationResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const magicApiRef = useRef<MagicAPIService | null>(null);

  const getMagicApi = () => {
    if (!apiKey?.trim()) throw new Error('API key is required');
    if (!magicApiRef.current) magicApiRef.current = new MagicAPIService(apiKey);
    return magicApiRef.current;
  };

  const mutation = useMutation({
    mutationFn: async (params: VideoGenerationParams) => {
      setIsGenerating(true);
      setError(null);
      setProgress(0);
      const api = getMagicApi();
      
      const generatedJobId = await api.generateVideo(params);
      setJobId(generatedJobId);
      const response = await api.pollVideoStatus(
        generatedJobId,
        15 * 60 * 1000,
        (currentProgress: number ) => {
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
          } else if (status === 'COMPLETED' || status === 'SUCCEEDED') {
            toast.success('Video generated successfully!');
          }
        }
      );
      // Get video URL from either output array or direct video_url
      const videoUrl = response.output?.video_url || (response.output?.output?.[0]);
      if (videoUrl) {
        setVideoUrl(videoUrl);
        setProgress(100);
        setIsGenerating(false);
        onSuccess?.(videoUrl, response);
        return response;
      }
      throw new Error('Failed to generate video');
    },
    onError: (error) => {
      console.error('[VideoGeneration] Error during video generation:', error);
      const finalError = error instanceof Error ? error : new Error('Failed to generate video');
      setError(finalError);
      onError?.(finalError);
      toast.error('Failed to generate video');
      setProgress(0);
      mutation.reset();
      setIsGenerating(false);
    },
  });

  const checkStatus = async (existingJobId: string | null) => {
    if (!existingJobId) return;
    
    try {
      setIsGenerating(true);
      const api = getMagicApi();
      setJobId(existingJobId);
      
      const response = await api.pollVideoStatus(
        existingJobId,
        15 * 60 * 1000,
        (progress) => {

          setProgress(progress);
        },
        (status) => {
          console.log('[VideoGeneration] Status:', status);
          if (status === 'IN_QUEUE') {
            toast.info('Video generation queued...');
          } else if (status === 'IN_PROGRESS') {
            toast.info('Generating video...');
          } else if (status === 'COMPLETED' || status === 'SUCCEEDED') {
            toast.success('Video generated successfully!');
          }
        }
      );

      setVideoDetails(response);
      
      // Get video URL from either output array or direct video_url
      const videoUrl = response.output?.video_url || (response.output?.output?.[0]);
      if (videoUrl) {
        setVideoUrl(videoUrl);
        onSuccess?.(videoUrl, response);
        setProgress(100);
        setIsGenerating(false);
      } else {
        throw new Error('No video URL in response');
      }
    } catch (error) {
      console.error('[VideoGeneration] Error during video generation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError?.(new Error(errorMessage));
      throw error;
    }
  };

  const generateVideo = async (params: VideoGenerationParams) => {
    if (!params.imageUrl) {
      throw new Error('Image URL is required');
    }

    try {
      await mutation.mutateAsync(params);
    } catch (error) {
      console.error('[VideoGeneration] Error during video generation:', error);
      throw error;
    }
  };

  return {
    generateVideo,
    checkStatus,
    isGenerating: mutation.isPending || isGenerating,
    progress,
    videoUrl,
    error: error || mutation.error,
    reset: () => {
      mutation.reset();
      setIsGenerating(false);
      setProgress(0);
      setError(null);
      setVideoUrl(null);
      setVideoDetails(null);
      setJobId(null);
    }
  };
}
