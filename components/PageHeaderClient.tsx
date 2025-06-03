'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function PageHeaderClient() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      style={{ height: '56px' }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            MagicAPI Video Generator
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
