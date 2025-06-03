'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Play, Loader2, Download, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiRequestDialog } from './ApiRequestDialog';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoRequestData {
  prompt: string;
  loraUrl?: string | null;
  frames?: number;
  resolution?: string;
  model?: string;
  sampleSteps?: number;
  sampleGuideScale?: number;
  negativePrompt?: string;
  loraStrengthModel?: number;
  loraStrengthClip?: number;
  aspectRatio?: string;
  sampleShift?: number;
  imageUrl?: string;
}

interface VideoGeneratorProps {
  onClearFile?: () => void;
  imageUrl?: string;
  onGenerate: (params: VideoRequestData) => void;
  isGenerating: boolean;
  progress?: number;
  error?: string;
  videoUrl?: string;
  disabled?: boolean;
}

const LORA_OPTIONS = [
  {
    value: 'none',
    label: 'None',
    description: 'No LoRA applied – uses the base model output',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/360_epoch20.safetensors',
    label: '360 Effect',
    description: 'Creates a 360-degree panoramic spin',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/aging_30_epochs.safetensors',
    label: 'Aging Effect',
    description: 'Adds age progression',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/baby_epoch_50.safetensors',
    label: 'Baby Style',
    description: 'Applies childlike features',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/wan-1.3b-cfgdistill-video-4.0-00001000_comfy.safetensors',
    label: 'Base I2V LoRA',
    description: 'Applies base image-to-video transformations',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/bride50.safetensors',
    label: 'Bride Transformation',
    description: 'Transforms appearance with bridal aesthetics',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/cakeify_16_epochs.safetensors',
    label: 'Cake Style',
    description: 'Adds dessert-themed visuals',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/crushit_epoch20.safetensors',
    label: 'Crushing Effect',
    description: 'Simulates a crushing or squashing visual',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/decay_50_epochs.safetensors',
    label: 'Decay Effect',
    description: 'Adds aging or decay-like appearance',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/deflate_epoch20.safetensors',
    label: 'Deflate Animation',
    description: 'Applies deflation-like visual behavior',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/flying_effect.safetensors',
    label: 'Flying Effect',
    description: 'Simulates the motion of flying',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/flying_effect(Wan2.1 I2V LoRA).safetensors',
    label: 'Flying Effect (Wan2.1)',
    description: 'Enhanced flying animation using Wan2.1',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/gun_epoch20.safetensors',
    label: 'Gun Effect',
    description: 'Adds gun-related animations or context',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/inflate_20_epochs.safetensors',
    label: 'Inflate Animation',
    description: 'Applies inflation or expansion animation',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/jungle_50_epochs.safetensors',
    label: 'Jungle Environment',
    description: 'Adds lush green jungle-themed backgrounds',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/sc1-f1_l4ndsc4p3.safetensors',
    label: 'Landscape Effect',
    description: 'Applies scenic natural landscapes',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/mona_lisa_35_epochs.safetensors',
    label: 'Mona Lisa Style',
    description: 'Adds stylistic elements of the Mona Lisa',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/muscles_epoch18.safetensors',
    label: 'Muscle Enhancement',
    description: 'Enhances muscle tone and definition',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/painting_50_epochs.safetensors',
    label: 'Painting Style',
    description: 'Applies traditional painting style effects',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/samurai_50_epochs.safetensors',
    label: 'Samurai Transformation',
    description: 'Transforms into samurai-themed visuals',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/squish_18.safetensors',
    label: 'Squish Animation',
    description: 'Applies a squashing animation',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/vip_50_epochs.safetensors',
    label: 'VIP Styling',
    description: 'Gives luxurious, high-status appearance',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/warrior_45_epochs.safetensors',
    label: 'Warrior Transformation',
    description: 'Transforms subject into warrior aesthetics',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/remade_westworld_35.safetensors',
    label: 'Westworld Style',
    description: 'Inspired by the Westworld series style',
  },
  {
    value: 'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/zen_50_epochs.safetensors',
    label: 'Zen Style',
    description: 'Applies a calm, minimalist zen aesthetic',
  },
  {
    value: 'https://huggingface.co/motimalu/wan-flat-color-v2/resolve/main/wan_flat_color_v2.safetensors',
    label: 'Wan Flat Color v2',
    description: 'Simplified flat-color effect with v2 improvements',
  },
  {
    value: 'https://huggingface.co/motimalu/wan-anime-style/resolve/main/wan_anime_style_v1.safetensors',
    label: 'Wan Anime v1',
    description: 'Anime-style transformation (v1)',
  },
  {
    value: 'https://huggingface.co/motimalu/wan-watercolor/resolve/main/wan_watercolor_v1.safetensors',
    label: 'Wan Watercolor v1',
    description: 'Watercolor painting aesthetic',
  },
  {
    value: 'https://huggingface.co/motimalu/wan-pixel-art/resolve/main/wan_pixel_art_v1.safetensors',
    label: 'Wan Pixel Art v1',
    description: 'Pixel art stylization',
  },
];


export function VideoGenerator({
  onGenerate,
  isGenerating,
  progress,
  error,
  videoUrl,
  onClearFile,
  imageUrl,
}: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedLoraUrl, setSelectedLoraUrl] = useState<string>(LORA_OPTIONS[0].value);
  const [customLoraUrl, setCustomLoraUrl] = useState('');
  const [activeTab, setActiveTab] = useState('preset');
  const [model, setModel] = useState('14b');
  const [resolution, setResolution] = useState('480p');
  const [frames, setFrames] = useState(33);
  const [sampleSteps, setSampleSteps] = useState(20);
  const [guideScale, setGuideScale] = useState(5.0);
  const [negativePrompt, setNegativePrompt] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      videoRef.current.play().catch(console.error);
    }
  }, [videoUrl]);

  const handleReset = () => {
    setPrompt('');
    setSelectedLoraUrl(LORA_OPTIONS[0].value);
    setModel('1.3b');
    setResolution('480p');
    setFrames(33);
    setSampleSteps(20);
    setGuideScale(5.0);
    setNegativePrompt('');
    if (onClearFile) {
      onClearFile();
    }
  };

  const handleGenerate = () => {
    if (prompt.trim()) {
      // Handle LoRA URL selection
      const loraUrl = selectedLoraUrl === 'none' || !selectedLoraUrl ? null : selectedLoraUrl;
      console.log('[VideoGenerator] Selected LoRA URL:', loraUrl);
      
      onGenerate({
        prompt,
        loraUrl,
        frames,
        resolution,
        model,
        sampleSteps,
        sampleGuideScale: guideScale,
        negativePrompt,
        loraStrengthModel: 1,
        loraStrengthClip: 1,
        aspectRatio: 'auto',
        sampleShift: 8,
        imageUrl
      });
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Generate Video</h3>
        <p className="text-sm ">
          Describe the motion or transformation you want to see
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="prompt">Video Prompt *</Label>
          <Textarea
            id="prompt"
            placeholder="e.g. A cat dancing in the rain"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>LoRA Style</Label>
            <HoverCard>
              <HoverCardTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent>
                Choose from preset LoRA styles or provide a custom LoRA URL
              </HoverCardContent>
            </HoverCard>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">Preset LoRA</TabsTrigger>
              <TabsTrigger value="custom">Custom LoRA URL</TabsTrigger>
            </TabsList>
            <TabsContent value="preset" className="mt-4">
              <div className="space-y-2">
                <Select
                  value={selectedLoraUrl}
                  onValueChange={(value) => {
                    setSelectedLoraUrl(value);
                    setCustomLoraUrl('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a LoRA style" />
                  </SelectTrigger>
                  <SelectContent>
                    {LORA_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLoraUrl && (
                  <p className="text-sm text-muted-foreground">
                    {LORA_OPTIONS.find(o => o.value === selectedLoraUrl)?.description}
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="custom" className="mt-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="Enter custom LoRA URL"
                  value={customLoraUrl}
                  onChange={(e) => {
                    setCustomLoraUrl(e.target.value);
                    setSelectedLoraUrl(e.target.value);
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a valid URL to a .safetensors file
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.3b">1.3b (Fast)</SelectItem>
                <SelectItem value="14b">14b (High Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Frame Count</Label>
          <Select value={String(frames)} onValueChange={(v) => setFrames(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Select frame count" /></SelectTrigger>
            <SelectContent>
              {[
                { frames: 17, duration: '~1 sec' },
                { frames: 33, duration: '~2 sec' },
                { frames: 49, duration: '~3 sec' },
                { frames: 65, duration: '~4 sec' },
                { frames: 81, duration: '~5 sec' },
              ].map((option) => (
                <SelectItem key={option.frames} value={String(option.frames)}>
                  {`${option.frames} frames (${option.duration} at 16fps)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Sample Steps</Label>
            <input
              type="range"
              min={1}
              max={60}
              value={sampleSteps}
              onChange={(e) => setSampleSteps(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">{sampleSteps}</p>
          </div>

          <div>
            <Label>Guide Scale</Label>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={guideScale}
              onChange={(e) => setGuideScale(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">{guideScale}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full relative"
            size="lg"
            variant="default"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Generate Video
              </>
            )}
          </Button>

          <div className="flex justify-center gap-2">
            <ApiRequestDialog
              requestData={{
                prompt,
                loraUrl: selectedLoraUrl === 'none' ? null : selectedLoraUrl,
                model,
                resolution,
                frames,
                sampleSteps,
                sampleGuideScale: guideScale,
                negativePrompt,
                imageUrl,
                loraStrengthModel: 1,
                loraStrengthClip: 1,
                aspectRatio: 'auto',
                sampleShift: 8
              } as VideoRequestData}
            />
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Reset Form
            </Button>
          </div>
        </div>

      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">Error: {error}</p>
        </div>
      )}

      {videoUrl && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-md font-medium mb-2">Generated Video</h4>
          </div>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              controls
              className="w-full h-auto"
              style={{ maxHeight: '400px' }}
            />
          </div>
          <Button
            onClick={async () => {
              if (videoUrl) {
                try {
                  const response = await fetch(videoUrl);
                  if (!response.ok) throw new Error('Failed to download video');
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'generated-video.mp4';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Download failed:', error);
                  toast.error('Failed to download video');
                }
              }
            }}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Video
          </Button>
        </div>
      )}
    </Card>
  );
}