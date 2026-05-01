'use client';

import { LanguageProvider } from '@/i18n/LanguageContext';
import SmoothScroll from '@/components/SmoothScroll';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Works from '@/components/Works';
import Services from '@/components/Services';
import Shop from '@/components/Shop';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <LanguageProvider>
      <SmoothScroll>
        <Navigation />
        <main className="bg-[#0a0a0a]">
          <Hero />
          <div className="mx-auto max-w-7xl">
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
          </div>
          <Works />
          <div className="mx-auto max-w-7xl">
            <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
          <Services />
          <div className="mx-auto max-w-7xl">
            <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
          <Shop />
          <div className="mx-auto max-w-7xl">
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          </div>
          <About />
          <div className="mx-auto max-w-7xl">
            <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
          <Contact />
          <Footer />
        </main>
      </SmoothScroll>
    </LanguageProvider>
  );
}
