'use client';

import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Container component for consistent page layout
 */
export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div 
      className={cn(
        "container mx-auto px-4 py-8 max-w-7xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
