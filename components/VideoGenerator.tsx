'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Play, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoGeneratorProps {
  onGenerate: (params: {
    prompt: string;
    loraUrl?: string | null;
    frames?: number;
    resolution?: string;
    model?: string;
    sampleSteps?: number;
    sampleGuideScale?: number;
    negativePrompt?: string;
  }) => void;
  isGenerating: boolean;
  progress?: number;
  error?: string;
  videoUrl?: string;
}

const LORA_OPTIONS = [
  {
    value:
      'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/360_epoch20.safetensors',
    label: '360 Effect',
    description: 'Creates a 360-degree panoramic spin',
  },
  {
    value:
      'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/aging_30_epochs.safetensors',
    label: 'Aging Effect',
    description: 'Adds age progression',
  },
  {
    value:
      'https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/baby_epoch_50.safetensors',
    label: 'Baby Style',
    description: 'Childlike features',
  },
];

export function VideoGenerator({
  onGenerate,
  isGenerating,
  progress = 0,
  error,
  videoUrl,
}: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedLoraUrl, setSelectedLoraUrl] = useState<string>(LORA_OPTIONS[0].value);
  const [model, setModel] = useState('1.3b');
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

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate({
        prompt,
        loraUrl: selectedLoraUrl,
        frames,
        resolution,
        model,
        sampleSteps,
        sampleGuideScale: guideScale,
        negativePrompt,
      });
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Video</h3>
        <p className="text-sm text-gray-600">
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

        <div>
          <Label>LoRA Effect *</Label>
          <Select value={selectedLoraUrl} onValueChange={setSelectedLoraUrl} disabled={isGenerating}>
            <SelectTrigger>
              <SelectValue>
                {LORA_OPTIONS.find((lora) => lora.value === selectedLoraUrl)?.label || 'Select a LoRA'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LORA_OPTIONS.map((lora) => (
                <SelectItem key={lora.value} value={lora.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{lora.label}</span>
                    {/* <span className="text-xs text-gray-500">{lora.description}</span> */}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[17, 33, 49, 65, 81].map((f) => (
                <SelectItem key={f} value={String(f)}>{f} frames</SelectItem>
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

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || !selectedLoraUrl || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">Error: {error}</p>
        </div>
      )}

      {videoUrl && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-md font-medium text-gray-900 mb-2">Generated Video</h4>
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