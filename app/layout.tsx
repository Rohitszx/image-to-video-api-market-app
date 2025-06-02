import '../styles/globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import client components with SSR disabled to prevent hydration errors
const ThemeProvider = dynamic(() => import('../components/theme-provider').then(mod => mod.ThemeProvider), {
  ssr: false
});

const QueryProvider = dynamic(() => import('../components/query-provider').then(mod => mod.QueryProvider), {
  ssr: false
});

const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), {
  ssr: false
});

const SonnerToaster = dynamic(() => import('@/components/ui/sonner').then(mod => mod.Toaster), {
  ssr: false
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Image to Video Generator | MagicAPI',
  description: 'Transform your images into dynamic videos using AI. Upload an image, describe the motion you want, and watch the magic happen!',
  keywords: ['image to video', 'AI video generation', 'MagicAPI', 'motion generation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <QueryProvider>
            {children}
            <SonnerToaster />
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
