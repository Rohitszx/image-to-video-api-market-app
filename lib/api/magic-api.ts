export interface UploadResponse {
  url: string;
}

export interface VideoGenerationParams {
  prompt: string;
  imageUrl: string;
  loraUrl?: string | null;
  frames?: number;
  negativePrompt?: string;
  loraStrengthClip?: number;
  loraStrengthModel?: number;
  aspectRatio?: string;
  resolution?: string;
  sampleGuideScale?: number;
  sampleSteps?: number;
  seed?: number | null;
  sampleShift?: number;
  fastMode?: 'Fast' | 'Balanced' | 'Quality';
}

export interface VideoGenerationResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'COMPLETED';
  progress?: number;
  error?: string;
  delayTime?: number;
  executionTime?: number;
  output?: {
    completed_at?: string;
    created_at?: string | null;
    started_at?: string;
    status: string;
    video_url?: string;
    output?: string[];
    metrics?: {
      predict_time: number;
    };
    input?: {
      prompt: string;
      model: string;
      frames: number;
      resolution: string;
      aspect_ratio: string;
      lora_url?: string;
      negative_prompt?: string;
      sample_steps?: number;
      sample_guide_scale?: number;
      fast_mode?: 'Fast' | 'Balanced' | 'Quality';
    };
  };
}

export class MagicApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.name = 'MagicApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class MagicAPIService {
  private debug = true;
  private apiKey: string;
  private imageUploadBaseUrl = 'https://api.magicapi.dev/api/v1/magicapi/image-upload';
  private videoGenerationBaseUrl = 'https://prod.api.market/api/v1/magicapi/wan-text-to-image';

  private defaultVideoParams = {
    model: '1.3b',
    frames: 33,
    sample_steps: 20,
    sample_guide_scale: 5.0,
    aspect_ratio: 'auto',
    resolution: '480p',
    lora_strength_model: 1.0,
    lora_strength_clip: 1.0,
    sample_shift: 8,
    fast_mode: 'Balanced' as const,
  };

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('API key is required');
    this.apiKey = apiKey;
  }

  private log(message: string, data?: any) {
    if (this.debug) console.log(`[MagicAPI] ${message}`, data);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.clone().json().catch(() => response.text());
    if (!response.ok) {
      throw new MagicApiError(response.status, 'API Error', data);
    }
    return data as T;
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('filename', file);

    const res = await fetch(`${this.imageUploadBaseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-magicapi-key': this.apiKey },
      body: formData,
    });
    const data = await this.handleResponse<UploadResponse>(res);
    console.log('API Response - Upload Image:', JSON.stringify(data, null, 2));
    return data.url;
  }

  async generateVideo(params: VideoGenerationParams): Promise<string> {
    const bodyData = {
      input: {
        ...this.defaultVideoParams,
        prompt: params.prompt,
        image_url: params.imageUrl,
        ...(params.loraUrl && params.loraUrl !== 'none' ? { lora_url: params.loraUrl } : {}),
        frames: params.frames || this.defaultVideoParams.frames,
        negative_prompt: params.negativePrompt || '',
        lora_strength_clip: params.loraStrengthClip || this.defaultVideoParams.lora_strength_clip,
        lora_strength_model: params.loraStrengthModel || this.defaultVideoParams.lora_strength_model,
        aspect_ratio: params.aspectRatio || this.defaultVideoParams.aspect_ratio,
        resolution: params.resolution || this.defaultVideoParams.resolution,
        sample_steps: params.sampleSteps || this.defaultVideoParams.sample_steps,
        sample_guide_scale: params.sampleGuideScale || this.defaultVideoParams.sample_guide_scale,
        seed: params.seed || null,
        sample_shift: params.sampleShift || this.defaultVideoParams.sample_shift,
        fast_mode: params.fastMode || this.defaultVideoParams.fast_mode,
      },
    };

    console.log('[VideoGeneration] Request payload:', JSON.stringify(bodyData, null, 2));

    try {
      const res = await fetch(`${this.videoGenerationBaseUrl}/image-to-video/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-magicapi-key': this.apiKey,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await this.handleResponse<{ id: string }>(res);
      console.log('[VideoGeneration] Generation response:', JSON.stringify(data, null, 2));
      return data.id;
    } catch (error) {
      console.error('[VideoGeneration] Generation request failed:', error);
      throw error;
    }
  }

  async getVideoStatus(jobId: string): Promise<VideoGenerationResponse> {
    try {
      console.log(`[VideoGeneration] Checking status for job: ${jobId}`);
      const res = await fetch(`${this.videoGenerationBaseUrl}/image-to-video/status/${jobId}`, {
        headers: { 'x-magicapi-key': this.apiKey },
      });

      const status = await this.handleResponse<VideoGenerationResponse>(res);
      console.log('[VideoGeneration] Status response:', JSON.stringify(status, null, 2));
      return status;
    } catch (error) {
      console.error(`[VideoGeneration] Status check failed for job ${jobId}:`, error);
      throw error;
    }
  }

  async pollVideoStatus(
    jobId: string,
    timeout = 15 * 60 * 1000,
    onProgress?: (progress: number) => void,
    onStatusUpdate?: (status: string) => void
  ): Promise<VideoGenerationResponse> {
    const start = Date.now();
    let progress = 0;
    let lastStatusCheck = 0;
    let consecutiveErrors = 0;

    console.log(`[VideoGeneration] Starting status polling for job: ${jobId}`);
    // Initial wait after generation request
    await this.wait(15_000);

    while (Date.now() - start < timeout) {
      try {
        const currentTime = Date.now();
        const timeSinceLastCheck = currentTime - lastStatusCheck;

        // Determine minimum wait time based on progress and previous errors
        const minWaitTime = progress >= 90 ? 8000 : // Near completion
                         progress >= 60 ? 15000 : // Good progress
                         progress >= 30 ? 20000 : // Initial progress
                         30000; // Just started

        // Add extra wait time if we've had errors
        const extraWaitTime = consecutiveErrors * 5000; // 5s extra per error
        const totalWaitTime = Math.min(minWaitTime + extraWaitTime, 45000); // Cap at 45s

        if (timeSinceLastCheck < totalWaitTime) {
          await this.wait(totalWaitTime - timeSinceLastCheck);
          continue;
        }

        const status = await this.getVideoStatus(jobId);
        lastStatusCheck = Date.now();
        consecutiveErrors = 0; // Reset error count on successful request
        onStatusUpdate?.(status.status);

        // Check for completion
        if (status.status === 'COMPLETED' && status.output?.output?.[0]) {
          console.log(`[VideoGeneration] Job ${jobId} completed successfully`);
          return {
            ...status,
            output: { ...status.output, video_url: status.output.output[0] }
          };
        }
        
        if (status.status === 'SUCCEEDED' && status.output?.video_url) {
          console.log(`[VideoGeneration] Job ${jobId} succeeded with video URL`);
          return status;
        }

        if (status.status === 'FAILED') {
          const errorMsg = `Video generation failed: ${status.error || 'Unknown error'}`;
          console.error(`[VideoGeneration] ${errorMsg}`);
          throw new Error(errorMsg);
        }

        if ((status.progress ?? 0) > progress) {
          progress = status.progress!;
          console.log(`[VideoGeneration] Job ${jobId} progress: ${progress}%`);
          onProgress?.(progress);
        }

      } catch (error) {
        console.error(`[VideoGeneration] Error during status polling:`, error);
        consecutiveErrors++;
        // Exponential backoff on errors, capped at 45 seconds
        const errorWaitTime = Math.min(Math.pow(2, consecutiveErrors) * 1000, 45000);
        await this.wait(errorWaitTime);
      }
    }

    const timeoutMsg = `Video generation timed out after ${timeout/1000} seconds`;
    console.error(`[VideoGeneration] ${timeoutMsg}`);
    throw new Error(timeoutMsg);
  }

  private wait(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}
