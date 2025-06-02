import { useLocalStorage } from './use-local-storage';
import { useState, useEffect } from 'react';
import { MagicAPIService } from '@/lib/api/magic-api';

export function useApiKey() {
  const [apiKey, setApiKey] = useLocalStorage<string>('magic-api-key', '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!apiKey);
  
  useEffect(() => {
    setHasApiKey(!!apiKey && apiKey.trim() !== '');
  }, [apiKey]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      if (!key || key.trim() === '') {
        throw new Error('API key is required');
      }
      
      setApiKey(key);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate API key';
      setValidationError(errorMessage);
      return false;
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    setValidationError(null);
  };

  return {
    apiKey,
    hasApiKey,
    isValidating,
    validationError,
    validateApiKey,
    clearApiKey,
    setApiKey
  };
}