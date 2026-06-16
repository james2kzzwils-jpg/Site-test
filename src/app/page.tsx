import HomePage from '@/components/HomePage';
import JsonLd from '@/components/JsonLd';
import en from '@/i18n/en.json';
import { faqLd, personLd, professionalServiceLd, websiteLd } from '@/lib/seo';

export default function Home() {
  const faq = faqLd(en.faq.items);
  return (
    <>
      <JsonLd data={[personLd(), professionalServiceLd(), websiteLd(), faq]} />
      <HomePage />
    </>
  );
}
