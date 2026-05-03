'use client';

import { type ReactNode } from 'react';
import { LanguageProvider } from '@/i18n/LanguageContext';
import SmoothScroll from '@/components/SmoothScroll';
import Cursor from '@/components/Cursor';
import Loader from '@/components/Loader';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <Loader />
      <Cursor />
      <SmoothScroll>{children}</SmoothScroll>
    </LanguageProvider>
  );
}
