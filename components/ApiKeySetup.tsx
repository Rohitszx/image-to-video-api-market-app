
'use client';

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ApiKeySetupProps {
  onApiKeySet?: (apiKey: string) => void;
  onSubmit?: (apiKey: string) => Promise<void>;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet, onSubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  useEffect(() => {
    setIsButtonEnabled(apiKey.trim().length > 0);
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      if (onSubmit) {
        await onSubmit(apiKey.trim());
      } else if (onApiKeySet) {
        onApiKeySet(apiKey.trim());
      }
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(prev => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Key className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Image to Video Generator
          </h1>
          <p className="text-gray-600">
            Enter your MagicAPI key to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative mt-1">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your MagicAPI key"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={toggleShowApiKey}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isButtonEnabled}
          >
            Get Started
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your API key is stored locally and never sent to our servers
          </p>
        </div>
      </Card>
    </div>
  );
};
