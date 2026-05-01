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
          <Works />
          <Services />
          <Shop />
          <About />
          <Contact />
          <Footer />
        </main>
      </SmoothScroll>
    </LanguageProvider>
  );
}
