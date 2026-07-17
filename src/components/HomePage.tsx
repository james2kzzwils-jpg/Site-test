'use client';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import TrustStrip from '@/components/TrustStrip';
import Works from '@/components/Works';
import Services from '@/components/Services';
import Shop from '@/components/Shop';
import About from '@/components/About';
import Faq from '@/components/Faq';
import Contact from '@/components/Contact';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import ScrollToTop from '@/components/ScrollToTop';
import Footer from '@/components/Footer';
import Marquee from '@/components/Marquee';
import { useLanguage } from '@/i18n/LanguageContext';
import { SHOW_SHOP } from '@/lib/features';

export default function HomePage() {
  const { locale, t } = useLanguage();
  const marqueeItems =
    locale === 'ru'
      ? [
          'Авторская CGI / Motion Lab',
          'Premium CGI',
          'Product Visuals',
          'Procedural Motion',
          'Houdini-Driven Workflows',
          'Remote Worldwide',
        ]
      : [
          'Founder-Led Creative Lab',
          'Premium CGI',
          'Product Visuals',
          'Procedural Motion',
          'Houdini-Driven Workflows',
          'Remote Worldwide',
        ];

  return (
    <>
      <Navigation />
      <main className="bg-[var(--background)]">
        <Hero />

        <div className="border-y border-[var(--hairline)] py-5 font-mono text-[12px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <Marquee items={marqueeItems} />
        </div>

        <TrustStrip />

        <Works />
        <Services />
        {SHOW_SHOP && <Shop />}
        <About />
        <ScheduleCalendar />
        <Faq />
        <Contact />
        <Footer />
      </main>
      <ScrollToTop />
    </>
  );
}
