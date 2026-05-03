'use client';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Works from '@/components/Works';
import Services from '@/components/Services';
import Shop from '@/components/Shop';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import Marquee from '@/components/Marquee';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();
  const marqueeItems = [
    t.brand.name,
    t.brand.roles[0],
    t.brand.roles[1],
    t.brand.roles[2],
    'Houdini · Blender · Nuke',
    '2025',
  ];

  return (
    <>
      <Navigation />
      <main className="bg-[var(--background)]">
        <Hero />

        <div className="border-y border-[var(--hairline)] py-5 font-mono text-[12px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <Marquee items={marqueeItems} />
        </div>

        <Works />
        <Services />
        <Shop />
        <About />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
