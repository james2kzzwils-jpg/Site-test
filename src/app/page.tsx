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

function SectionSpacer() {
  return <div className="h-24 lg:h-40" aria-hidden="true" />;
}

export default function Home() {
  return (
    <LanguageProvider>
      <SmoothScroll>
        <Navigation />
        <main className="bg-[#0a0a0a]">
          <Hero />
          <SectionSpacer />
          <Works />
          <SectionSpacer />
          <Services />
          <SectionSpacer />
          <Shop />
          <SectionSpacer />
          <About />
          <SectionSpacer />
          <Contact />
          <SectionSpacer />
          <Footer />
        </main>
      </SmoothScroll>
    </LanguageProvider>
  );
}
