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
    console.log("Response uploading image",res);
    const data = await this.handleResponse<UploadResponse>(res);
    return data.url;
  }

  async generateVideo(params: VideoGenerationParams): Promise<string> {
    const bodyData = {
      input: {
        ...this.defaultVideoParams,
        prompt: params.prompt,
        image_url: params.imageUrl,
        lora_url: params.loraUrl || null,
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

    const res = await fetch(`${this.videoGenerationBaseUrl}/image-to-video/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-magicapi-key': this.apiKey,
      },
      body: JSON.stringify(bodyData),
    });
    console.log("Response generating video",res);
    const data = await this.handleResponse<{ id: string }>(res);
    return data.id;
  }

  async getVideoStatus(jobId: string): Promise<VideoGenerationResponse> {
    const res = await fetch(`${this.videoGenerationBaseUrl}/image-to-video/status/${jobId}`, {
      headers: { 'x-magicapi-key': this.apiKey },
    });

    return this.handleResponse<VideoGenerationResponse>(res);
  }

  async pollVideoStatus(
    jobId: string,
    timeout = 15 * 60 * 1000,
    onProgress?: (progress: number) => void,
    onStatusUpdate?: (status: string) => void
  ): Promise<VideoGenerationResponse> {
    const start = Date.now();
    let progress = 0;

    await this.wait(45_000);

    while (Date.now() - start < timeout) {
      const status = await this.getVideoStatus(jobId);
      console.log('[MagicAPI] Video status:', status);

      onStatusUpdate?.(status.status);

      // Check for completion
      if (status.status === 'COMPLETED' && status.output?.output?.[0]) {
        return {
          ...status,
          output: { ...status.output, video_url: status.output.output[0] }
        };
      }
      
      if (status.status === 'SUCCEEDED' && status.output?.video_url) {
        return status;
      }

      if (status.status === 'FAILED') {
        throw new Error(`Video generation failed: ${status.error || 'Unknown error'}`);
      }

      if ((status.progress ?? 0) > progress) {
        progress = status.progress!;
        onProgress?.(progress);
      }

      const wait = progress >= 90 ? 4000 : progress >= 60 ? 10000 : 15000;
      await this.wait(wait);
    }

    throw new Error('Video generation timed out');
  }

  private wait(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}
