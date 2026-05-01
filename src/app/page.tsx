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

function SectionDivider() {
  return (
    <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <SmoothScroll>
        <Navigation />
        <main className="bg-[#0a0a0a]">
          <Hero />
          <SectionDivider />
          <Works />
          <SectionDivider />
          <Services />
          <SectionDivider />
          <Shop />
          <SectionDivider />
          <About />
          <SectionDivider />
          <Contact />
          <Footer />
        </main>
      </SmoothScroll>
    </LanguageProvider>
  );
}
