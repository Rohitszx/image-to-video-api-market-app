
'use client';

import React, { useState, useEffect } from 'react';
import { History, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { HistoryItem as HistoryItemType } from '@/hooks/use-history';

// Re-export the HistoryItem type with status mapping for compatibility
export interface HistoryItem extends Omit<HistoryItemType, 'status'> {
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  imageFile?: File;
}

interface HistoryPanelProps {
  history: HistoryItemType[];
  onClearHistory: () => void;
  onItemClick?: (item: HistoryItemType) => void;
  onPlayVideo?: (videoUrl: string) => void;
  collapsed?: boolean;
}

const HistoryItemImage: React.FC<{ item: HistoryItemType }> = ({ item }) => {
  // Just use the imageUrl directly since we don't have imageFile in HistoryItemType
  const [imageUrl] = useState<string | undefined>(item.imageUrl);

  
  if (!imageUrl) {
    return (
      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
        <History className="h-6 w-6 text-gray-400" />
      </div>
    );
  }
  
  return (
    <img
      src={imageUrl}
      alt="Thumbnail"
      className="w-16 h-16 object-cover rounded"
    />
  );
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onClearHistory,
  onItemClick,
  onPlayVideo,
  collapsed = false
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className={`p-6 ${collapsed ? 'max-h-[300px] overflow-hidden' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-medium">History</h3>
        </div>
        {history.length > 0 && (
          <Button onClick={onClearHistory} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No videos generated yet</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <HistoryItemImage item={item} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.prompt}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(item.timestamp)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'succeeded'
                          ? 'bg-green-100 text-green-600'
                          : item.status === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {item.status === 'succeeded' ? 'completed' : item.status}
                    </span>
                    {item.videoUrl && (
                      <Button
                        onClick={() => {
                          if (onItemClick) onItemClick(item);
                          if (onPlayVideo && item.videoUrl) onPlayVideo(item.videoUrl);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};
