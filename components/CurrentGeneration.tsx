import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Code, Download, Share, AlertTriangle } from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';

interface CurrentGenerationProps {
  videoUrl: string;
  onViewRequest: () => void;
}

export function CurrentGeneration({ videoUrl, onViewRequest }: CurrentGenerationProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold tracking-tight text-lg flex items-center">
              Current Generation
            </div>
            <div className="text-sm text-muted-foreground">Your video is ready!</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewRequest}
              className="inline-flex items-center"
            >
              <Code className="mr-2 h-4 w-4" />
              View Request
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-md bg-black">
            <VideoPlayer videoUrl={videoUrl} />
          </div>
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <div className="text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Video Expiration</AlertTitle>
            </div>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <p className="text-xs">
                This video URL will expire after 24 hours. Please download it now to keep it.{' '}
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-2">
        <a
          href={videoUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 flex-1 bg-primary hover:bg-primary/90 text-white button-primary"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Video
        </a>
        <Button variant="outline" className="h-10">
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
