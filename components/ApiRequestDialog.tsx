'use client';

import React from 'react';
import { Code, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

interface ApiRequestDialogProps {
  requestData: {
    prompt: string;
    loraUrl: string;
    model: string;
    resolution: string;
    frames: number;
    sampleSteps: number;
    guideScale: number;
    negativePrompt: string;
    imageUrl?: string;
    loraStrengthModel: number;
    loraStrengthClip: number;
    aspectRatio: string;
    sampleShift: number;
  };
}

export function ApiRequestDialog({ requestData }: ApiRequestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const jsonPayload = {
    input: {
      model: requestData.model,
      frames: requestData.frames,
      prompt: requestData.prompt,
      image_url: requestData.imageUrl || '',
      lora_url: requestData.loraUrl,
      lora_strength_model: requestData.loraStrengthModel,
      lora_strength_clip: requestData.loraStrengthClip,
      aspect_ratio: requestData.aspectRatio,
      sample_shift: requestData.sampleShift,
      resolution: requestData.resolution,
      sample_steps: requestData.sampleSteps,
      negative_prompt: requestData.negativePrompt || '',
      sample_guide_scale: requestData.guideScale
    }
  };

  const curlRequest = `curl -X 'POST' \
  'https://prod.api.market/api/v1/magicapi/wan-text-to-image/text-to-video/run' \
  -H 'accept: application/json' \
  -H 'x-magicapi-key: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '${JSON.stringify(jsonPayload, null, 2)}'`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "Copied to clipboard!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Code className="mr-2 h-4 w-4" />
          View API Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>API Request</DialogTitle>
          <p className="text-sm text-muted-foreground">The cURL command and JSON payload that will be sent to the API</p>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">cURL Command</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(curlRequest)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="text-sm whitespace-pre-wrap rounded-md border p-4 bg-background">
                {curlRequest}
              </pre>
            </div>

            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">JSON Payload</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(jsonPayload, null, 2))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="text-sm whitespace-pre-wrap rounded-md border p-4 bg-background">
                {JSON.stringify(jsonPayload, null, 2)}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
