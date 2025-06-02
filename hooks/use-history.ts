import { useLocalStorage } from './use-local-storage';

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  videoUrl?: string;
  prompt: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
}

export function useHistory() {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('video-history', []);
  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };

    setHistory([newItem, ...history]);
    return newItem.id;
  };

  const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
    setHistory(
      history.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removeHistoryItem = (id: string) => {
    setHistory(history.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addHistoryItem,
    updateHistoryItem,
    removeHistoryItem,
    clearHistory,
  };
}
