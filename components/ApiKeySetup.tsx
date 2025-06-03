
'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, ChevronDown, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ApiKeySetupProps {
  onApiKeySet?: (apiKey: string) => void;
  onSubmit?: (apiKey: string) => Promise<void>;
  onClearApiKey?: () => void;
  apiKey?: string | null;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet, onSubmit, onClearApiKey, apiKey: savedApiKey }) => {
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  useEffect(() => {
    setIsButtonEnabled(newApiKey.trim().length > 0);
  }, [newApiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newApiKey.trim()) {
      if (onSubmit) {
        await onSubmit(newApiKey.trim());
        setNewApiKey('');
        setIsEditing(false);
        setIsExpanded(false);
      } else if (onApiKeySet) {
        onApiKeySet(newApiKey.trim());
        setNewApiKey('');
        setIsEditing(false);
        setIsExpanded(false);
      }
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(prev => !prev);
  };

  const copyApiKey = async () => {
    if (savedApiKey) {
      await navigator.clipboard.writeText(savedApiKey);
    }
  };

  return (
    <Card className="mb-6" id="api-key-section">
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex justify-between items-start">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => savedApiKey && setIsExpanded(prev => !prev)}
          >
            <KeyRound className="h-4 w-4" />
            <div>
              <div className="font-semibold tracking-tight text-lg flex items-center">
                API Key
                {savedApiKey && (
                  <ChevronDown 
                    className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </div>
          </div>
          <a 
            href="https://api.market" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors flex items-center"
          >
            <span>Get an API Key</span>
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>

      {!savedApiKey ? (
        <div className="p-6 pt-0">
          <div className="text-sm text-muted-foreground mb-2">
            Your API key is securely stored in your browser
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="pr-10 font-mono"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={toggleShowApiKey}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button type="submit" disabled={!isButtonEnabled}>
              Save
            </Button>
          </form>
        </div>
      ) : isExpanded && (
        <>
          <div className="p-6 pt-0">
            <div className="text-sm text-muted-foreground mb-2">
              Your API key is securely stored in your browser
            </div>
            
            {!isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={savedApiKey}
                  className="font-mono bg-background"
                  readOnly
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyApiKey}
                  className="h-10 w-10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="pr-10 font-mono"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={toggleShowApiKey}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button type="submit" disabled={!isButtonEnabled}>
                  Save
                </Button>
              </form>
            )}
          </div>

          {!isEditing && (
            <div className="items-center p-6 flex justify-between pt-2 border-t">
              <Button 
                variant="outline"
                onClick={onClearApiKey}
              >
                Clear API Key
              </Button>
              <Button 
                onClick={() => {
                  setIsEditing(true);
                  setIsExpanded(false);
                }}
                className="button-primary"
              >
                Update Key
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
